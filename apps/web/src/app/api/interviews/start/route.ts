
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const AGENT_API_URL = process.env.AGENTS_API_URL || 'http://localhost:8000';

export async function POST(request: Request) {
    try {
        const { sessionId } = await request.json();

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Session ID is required' },
                { status: 400 }
            );
        }

        const supabase = createClient();

        // 1. Fetch the session
        const { data: session, error: sessionError } = await supabase
            .from('interview_sessions')
            .select('*, study:studies(*), participant:participants(*)')
            .eq('id', sessionId)
            .single();

        if (sessionError || !session) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            );
        }

        // 2. Get the research question for this session
        // The session links to a study, which should link to a research_question
        // For now, we'll fetch the first research_question or use a fallback approach
        const { data: researchQuestion } = await supabase
            .from('research_questions')
            .select('*')
            .limit(1)
            .single();

        if (!researchQuestion) {
            return NextResponse.json(
                { error: 'No research questions found' },
                { status: 404 }
            );
        }

        // 3. Get the first question from the Agent
        const agentResponse = await fetch(`${AGENT_API_URL}/api/agents/question`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId,
                studyId: session.study_id,
                participantId: session.participant_id,
                questionId: researchQuestion.id,
                conversationHistory: []
            }),
        });

        if (!agentResponse.ok) {
            const errorText = await agentResponse.text();
            console.error('Agent API error:', errorText);
            return NextResponse.json(
                { error: 'Failed to generate question' },
                { status: 500 }
            );
        }

        const agentData = await agentResponse.json();

        // The agent returns the question text
        // For the first question, it should return the root_question directly

        // Update session to mark as started
        await supabase
            .from('interview_sessions')
            .update({
                status: 'in_progress',
                started_at: new Date().toISOString()
            })
            .eq('id', sessionId);

        return NextResponse.json({
            question: {
                id: agentData.id,
                text: agentData.text,
                type: agentData.type
            },
            avatarVideoUrl: null
        });

    } catch (error) {
        console.error('Error starting interview:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
