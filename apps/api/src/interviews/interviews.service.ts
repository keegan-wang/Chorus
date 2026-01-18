import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AgentsService } from '../agents/agents.service';
import { SubmitAnswerDto, SkipQuestionDto } from './dto';

@Injectable()
export class InterviewsService {
  constructor(
    private databaseService: DatabaseService,
    private agentsService: AgentsService,
  ) { }

  async startInterview(sessionId: string) {
    const supabase = this.databaseService.getClient();

    // Get session details
    const { data: session, error } = await supabase
      .from('interview_sessions')
      .select(`
        *,
        study:studies(*),
        participant:participants(*)
      `)
      .eq('id', sessionId)
      .single();

    if (error || !session) {
      throw new NotFoundException('Session not found');
    }

    // Get seed questions for the study
    const { data: seedQuestions } = await supabase
      .from('questions')
      .select('*')
      .eq('study_id', session.study_id)
      .eq('is_seed', true)
      .order('order_index', { ascending: true });

    // Get assigned avatar for this participant
    const { data: assignment } = await supabase
      .from('avatar_assignments')
      .select('avatar:avatars(*)')
      .eq('participant_id', session.participant_id)
      .single();

    // Call Question Agent to get the first question
    const firstQuestion = await this.agentsService.getNextQuestion({
      sessionId,
      studyId: session.study_id,
      seedQuestions: seedQuestions || [],
      conversationHistory: [],
      participantContext: {
        demographics: session.participant.demographics,
        metadata: session.participant.metadata,
      },
    });

    // Update session with first question
    await supabase
      .from('interview_sessions')
      .update({
        status: 'active',
        current_question_id: firstQuestion.id,
        started_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    // Generate avatar video for the question (if avatar assigned)
    let avatarVideoUrl = null;
    const avatar = Array.isArray(assignment.avatar) ? assignment.avatar[0] : assignment.avatar;
    if (avatar) {
      avatarVideoUrl = await this.agentsService.generateAvatarVideo({
        avatarId: avatar.id,
        text: firstQuestion.text,
        voice: avatar.voice_config,
      });
    }

    return {
      question: firstQuestion,
      avatarVideoUrl,
      sessionStatus: 'active',
    };
  }

  async startRealtimeInterview(sessionId: string) {
    const supabase = this.databaseService.getClient();

    // Get session details
    const { data: session, error } = await supabase
      .from('interview_sessions')
      .select(`
        *,
        study:studies(*),
        participant:participants(*)
      `)
      .eq('id', sessionId)
      .single();

    if (error || !session) {
      throw new NotFoundException('Session not found');
    }

    // Update session status to active
    await supabase
      .from('interview_sessions')
      .update({
        status: 'active',
        started_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    return {
      sessionId,
      status: 'active',
      message: 'Realtime interview ready to start',
    };
  }

  async submitAnswer(submitAnswerDto: SubmitAnswerDto) {
    const { sessionId, questionId, answerText, audioUrl } = submitAnswerDto;
    const supabase = this.databaseService.getClient();

    // Get session details
    const { data: session } = await supabase
      .from('interview_sessions')
      .select(`
        *,
        study:studies(*),
        participant:participants(*)
      `)
      .eq('id', sessionId)
      .single();

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // If audio URL provided, transcribe it
    let finalAnswerText = answerText;
    if (audioUrl && !answerText) {
      finalAnswerText = await this.agentsService.transcribeAudio(audioUrl);
    }

    // Get the question
    const { data: question } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single();

    // Create Q&A turn
    const { data: qaTurn } = await supabase
      .from('qa_turns')
      .insert({
        session_id: sessionId,
        question_id: questionId,
        question_text: question?.text || '',
        answer_text: finalAnswerText,
        answer_audio_url: audioUrl,
        turn_index: await this.getNextTurnIndex(sessionId),
      })
      .select()
      .single();

    // Call Quality Agent to score the Q&A pair
    const qualityScore = await this.agentsService.scoreQA({
      questionText: question?.text || '',
      answerText: finalAnswerText || '',
      studyContext: session.study,
    });

    // Save quality label
    await supabase.from('quality_labels').insert({
      session_id: sessionId,
      qa_turn_id: qaTurn.id,
      ...qualityScore,
    });

    // Get conversation history
    const conversationHistory = await this.getConversationHistory(sessionId);

    // Call Question Agent to get next question
    const { data: seedQuestions } = await supabase
      .from('questions')
      .select('*')
      .eq('study_id', session.study_id)
      .eq('is_seed', true);

    const nextQuestion = await this.agentsService.getNextQuestion({
      sessionId,
      studyId: session.study_id,
      seedQuestions: seedQuestions || [],
      conversationHistory,
      participantContext: {
        demographics: session.participant.demographics,
        metadata: session.participant.metadata,
      },
    });

    // Check if interview should end
    const shouldEnd = await this.shouldEndInterview(sessionId, session.study);

    if (shouldEnd || !nextQuestion) {
      await this.completeSession(sessionId);
      return {
        qaTurn,
        nextQuestion: null,
        status: 'completed',
      };
    }

    // Update session with next question
    await supabase
      .from('interview_sessions')
      .update({ current_question_id: nextQuestion.id })
      .eq('id', sessionId);

    // Get avatar assignment and generate video
    const { data: assignment } = await supabase
      .from('avatar_assignments')
      .select('avatar:avatars(*)')
      .eq('participant_id', session.participant_id)
      .single();

    let avatarVideoUrl = null;
    if (assignment?.avatar) {
      const avatar = Array.isArray(assignment.avatar) ? assignment.avatar[0] : assignment.avatar;
      if (avatar) {
        avatarVideoUrl = await this.agentsService.generateAvatarVideo({
          avatarId: avatar.id,
          text: nextQuestion.text,
          voice: avatar.voice_config,
        });
      }
    }

    return {
      qaTurn,
      nextQuestion,
      avatarVideoUrl,
      status: 'active',
    };
  }

  async skipQuestion(skipQuestionDto: SkipQuestionDto) {
    const { sessionId, questionId } = skipQuestionDto;
    const supabase = this.databaseService.getClient();

    // Create Q&A turn with skipped answer
    await supabase.from('qa_turns').insert({
      session_id: sessionId,
      question_id: questionId,
      question_text: '',
      answer_text: '[SKIPPED]',
      turn_index: await this.getNextTurnIndex(sessionId),
    });

    // Get next question using the same flow as submitAnswer
    return this.submitAnswer({
      sessionId,
      questionId,
      answerText: '[SKIPPED]',
    });
  }

  async getSession(sessionId: string) {
    const supabase = this.databaseService.getClient();

    const { data, error } = await supabase
      .from('interview_sessions')
      .select(`
        *,
        study:studies(*),
        participant:participants(*)
      `)
      .eq('id', sessionId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Session not found');
    }

    return data;
  }

  async getQATurns(sessionId: string) {
    const supabase = this.databaseService.getClient();

    const { data, error } = await supabase
      .from('qa_turns')
      .select('*')
      .eq('session_id', sessionId)
      .order('turn_index', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch Q&A turns: ${error.message}`);
    }

    return data || [];
  }

  async completeSession(sessionId: string) {
    const supabase = this.databaseService.getClient();

    // Calculate duration
    const { data: session } = await supabase
      .from('interview_sessions')
      .select('started_at')
      .eq('id', sessionId)
      .single();

    const durationSeconds = session?.started_at
      ? Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000)
      : 0;

    // Update session status
    await supabase
      .from('interview_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        duration_seconds: durationSeconds,
      })
      .eq('id', sessionId);

    // Update participant status
    const { data: sessionData } = await supabase
      .from('interview_sessions')
      .select('participant_id')
      .eq('id', sessionId)
      .single();

    if (sessionData) {
      await supabase
        .from('participants')
        .update({ status: 'completed' })
        .eq('id', sessionData.participant_id);
    }

    // Trigger Summary Agent to generate session summary
    await this.agentsService.generateSessionSummary(sessionId);

    return { message: 'Session completed successfully' };
  }

  private async getNextTurnIndex(sessionId: string): Promise<number> {
    const supabase = this.databaseService.getClient();
    const { count } = await supabase
      .from('qa_turns')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    return (count || 0) + 1;
  }

  private async getConversationHistory(sessionId: string) {
    const qaTurns = await this.getQATurns(sessionId);
    return qaTurns.map((turn) => ({
      question: turn.question_text,
      answer: turn.answer_text || '',
    }));
  }

  private async shouldEndInterview(sessionId: string, study: any): Promise<boolean> {
    const qaTurns = await this.getQATurns(sessionId);
    const maxQuestions = study.interview_config?.max_questions || 10;

    return qaTurns.length >= maxQuestions;
  }
}
