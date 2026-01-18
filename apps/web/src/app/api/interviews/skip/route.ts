
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const AGENT_API_URL = process.env.AGENTS_API_URL || 'http://localhost:8000';

export async function POST(request: Request) {
    try {
        const { sessionId, questionId } = await request.json();

        if (!sessionId || !questionId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const supabase = createClient();

        // 1. Fetch Session & Study Info
        const { data: session } = await supabase
            .from('interview_sessions')
            .select('*, study:studies(*)')
            .eq('id', sessionId)
            .single();

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // 2. Get current turn index
        const { count } = await supabase
            .from('qa_turns')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', sessionId);

        const turnIndex = (count || 0) + 1;

        // 3. Save QA Turn with SKIPPED answer
        const { data: qaTurn, error: turnError } = await supabase
            .from('qa_turns')
            .insert({
                session_id: sessionId,
                turn_index: turnIndex,
                question_text: questionId,
                answer_transcript: '[SKIPPED]',
                question_type: 'follow_up',
                answer_completed_at: new Date().toISOString()
            })
            .select()
            .single();

        if (turnError) {
            console.error('Error saving QA turn:', turnError);
            throw turnError;
        }

        // 4. Build Conversation History
        const { data: historyTurns } = await supabase
            .from('qa_turns')
            .select('question_text, answer_transcript')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        const conversationHistory = historyTurns?.map(turn => ({
            question: turn.question_text,
            answer: turn.answer_transcript
        })) || [];

        // 5. Get research question for this session
        const { data: researchQuestion } = await supabase
            .from('research_questions')
            .select('*')
            .limit(1)
            .single();

        if (!researchQuestion) {
            return NextResponse.json({
                qaTurn,
                nextQuestion: null
            });
        }

        // 6. Get Next Question from Agent
        const agentResponse = await fetch(`${AGENT_API_URL}/api/agents/question`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId,
                studyId: session?.study_id,
                participantId: session?.participant_id,
                questionId: researchQuestion.id,
                conversationHistory
            }),
        });

        if (!agentResponse.ok) {
            console.error('Agent failed to generate question');
            await supabase
                .from('interview_sessions')
                .update({
                    status: 'completed',
                    ended_at: new Date().toISOString()
                })
                .eq('id', sessionId);

            return NextResponse.json({
                qaTurn,
                nextQuestion: null
            });
        }

        const agentData = await agentResponse.json();

        // 7. Update session total questions
        await supabase
            .from('interview_sessions')
            .update({ total_questions: turnIndex })
            .eq('id', sessionId);

        return NextResponse.json({
            qaTurn,
            nextQuestion: {
                id: agentData.id,
                text: agentData.text,
                type: agentData.type
            },
            avatarVideoUrl: null
        });

    } catch (error) {
        console.error('Error skipping question:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
