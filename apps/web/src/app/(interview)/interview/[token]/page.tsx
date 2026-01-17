'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface Session {
  id: string;
  status: string;
  current_question_id: string | null;
  participant: {
    name: string | null;
    email: string;
  };
  study: {
    title: string;
    description: string | null;
    interview_config: {
      allow_skip: boolean;
      require_audio_response: boolean;
    };
  };
}

interface Question {
  id: string;
  text: string;
  order_index: number;
}

interface QATurn {
  id: string;
  question_text: string;
  answer_text: string | null;
  answer_audio_url: string | null;
  created_at: string;
}

export default function InterviewPage() {
  const params = useParams();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [qaTurns, setQaTurns] = useState<QATurn[]>([]);
  const [answer, setAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [avatarVideoUrl, setAvatarVideoUrl] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const token = params.token as string;

  useEffect(() => {
    async function loadSession() {
      const supabase = createClient();

      // Fetch session by token
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select(`
          id,
          status,
          current_question_id,
          participant:participants(name, email),
          study:studies(
            title,
            description,
            interview_config
          )
        `)
        .eq('participant_token', token)
        .single();

      if (sessionError || !sessionData) {
        toast({
          variant: 'destructive',
          title: 'Invalid session',
          description: 'This interview link is not valid or has expired.',
        });
        setIsLoading(false);
        return;
      }

      setSession(sessionData as any);

      if (sessionData.status === 'completed') {
        setIsCompleted(true);
        setIsLoading(false);
        return;
      }

      // Fetch Q&A turns
      const { data: turnsData } = await supabase
        .from('qa_turns')
        .select('*')
        .eq('session_id', sessionData.id)
        .order('created_at', { ascending: true });

      setQaTurns(turnsData || []);

      // If there's a current question, fetch it
      if (sessionData.current_question_id) {
        const { data: questionData } = await supabase
          .from('questions')
          .select('*')
          .eq('id', sessionData.current_question_id)
          .single();

        setCurrentQuestion(questionData);
      } else {
        // Start the interview by getting the first question
        await startInterview(sessionData.id);
      }

      setIsLoading(false);
    }

    loadSession();
  }, [token, toast]);

  async function startInterview(sessionId: string) {
    try {
      // In production, this would call the backend API to start the interview
      // and get the first question from the Question Agent
      const response = await fetch('/api/interviews/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to start interview');
      }

      const data = await response.json();
      setCurrentQuestion(data.question);
      setAvatarVideoUrl(data.avatarVideoUrl);
    } catch (error) {
      console.error('Error starting interview:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to start interview. Using fallback question.',
      });

      // Fallback: load first seed question from database
      const supabase = createClient();
      const { data: questionData } = await supabase
        .from('questions')
        .select('*')
        .eq('study_id', session?.study)
        .eq('is_seed', true)
        .order('order_index', { ascending: true })
        .limit(1)
        .single();

      if (questionData) {
        setCurrentQuestion(questionData);
      }
    }
  }

  async function handleStartRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleSubmitAudioAnswer(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Microphone access denied',
        description: 'Please allow microphone access to record your answer.',
      });
    }
  }

  function handleStopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }

  async function handleSubmitAudioAnswer(audioBlob: Blob) {
    if (!session || !currentQuestion) return;

    setIsSubmitting(true);

    try {
      // Upload audio to storage
      const supabase = createClient();
      const fileName = `${session.id}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('interview-audio')
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('interview-audio')
        .getPublicUrl(fileName);

      // Call API to process audio answer (transcribe with Whisper)
      const response = await fetch('/api/interviews/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          questionId: currentQuestion.id,
          audioUrl: publicUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit answer');
      }

      const data = await response.json();
      await handleNextQuestion(data);
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to submit answer. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmitTextAnswer() {
    if (!session || !currentQuestion || !answer.trim()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/interviews/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          questionId: currentQuestion.id,
          answerText: answer,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit answer');
      }

      const data = await response.json();
      setAnswer('');
      await handleNextQuestion(data);
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to submit answer. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleNextQuestion(data: any) {
    // Add the Q&A turn to the list
    setQaTurns([...qaTurns, data.qaTurn]);

    if (data.nextQuestion) {
      setCurrentQuestion(data.nextQuestion);
      if (data.avatarVideoUrl) {
        setAvatarVideoUrl(data.avatarVideoUrl);
      }
    } else {
      // Interview completed
      setIsCompleted(true);
      toast({
        title: 'Interview completed',
        description: 'Thank you for your participation!',
      });
    }
  }

  async function handleSkipQuestion() {
    if (!session || !currentQuestion) return;

    try {
      const response = await fetch('/api/interviews/skip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          questionId: currentQuestion.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to skip question');
      }

      const data = await response.json();
      await handleNextQuestion(data);
    } catch (error) {
      console.error('Error skipping question:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to skip question.',
      });
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading interview...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Interview Link</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This interview link is not valid or has expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Interview Completed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Thank you for participating in "{session.study.title}". Your responses
              have been recorded.
            </p>
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium">Interview Summary</p>
              <p className="text-sm text-muted-foreground">
                Questions answered: {qaTurns.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">{session.study.title}</h1>
            <p className="text-sm text-muted-foreground">
              Question {qaTurns.length + 1}
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {session.participant.name || session.participant.email}
          </div>
        </div>
      </header>

      {/* Main Interview Area */}
      <main className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="w-full max-w-4xl space-y-8">
          {/* Avatar Video */}
          {avatarVideoUrl && (
            <div className="aspect-video overflow-hidden rounded-lg bg-muted">
              <video
                src={avatarVideoUrl}
                autoPlay
                className="h-full w-full object-cover"
              />
            </div>
          )}

          {/* Current Question */}
          {currentQuestion && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-xl font-medium">{currentQuestion.text}</p>
              </CardContent>
            </Card>
          )}

          {/* Answer Input */}
          <Card>
            <CardContent className="space-y-4 pt-6">
              {session.study.interview_config?.require_audio_response ? (
                <div className="flex flex-col items-center space-y-4">
                  {isRecording ? (
                    <>
                      <div className="flex h-32 w-32 items-center justify-center rounded-full bg-red-100 animate-pulse">
                        <div className="text-4xl">🎙️</div>
                      </div>
                      <p className="text-sm text-muted-foreground">Recording...</p>
                      <Button
                        size="lg"
                        variant="destructive"
                        onClick={handleStopRecording}
                        disabled={isSubmitting}
                      >
                        Stop Recording
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary/10">
                        <div className="text-4xl">🎙️</div>
                      </div>
                      <Button
                        size="lg"
                        onClick={handleStartRecording}
                        disabled={isSubmitting}
                      >
                        Start Recording
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <textarea
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Type your answer here..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <div className="flex justify-between">
                    <div className="flex space-x-2">
                      {session.study.interview_config?.allow_skip && (
                        <Button
                          variant="ghost"
                          onClick={handleSkipQuestion}
                          disabled={isSubmitting}
                        >
                          Skip Question
                        </Button>
                      )}
                    </div>
                    <Button
                      onClick={handleSubmitTextAnswer}
                      disabled={!answer.trim() || isSubmitting}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Progress */}
          <div className="text-center text-sm text-muted-foreground">
            {qaTurns.length} question{qaTurns.length !== 1 ? 's' : ''} answered
          </div>
        </div>
      </main>
    </div>
  );
}
