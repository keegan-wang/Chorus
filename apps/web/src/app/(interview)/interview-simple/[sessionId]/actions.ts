'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    }
});

export async function getInterviewSession(sessionId: string) {
    try {
        // Fetch session
        const { data: sessionData, error: sessionError } = await supabase
            .from('interview_sessions')
            .select('*')
            .eq('id', sessionId)
            .maybeSingle();

        if (sessionError || !sessionData) {
            console.error('[Server Action] Failed to load session:', sessionError);
            return { success: false, error: 'Session not found' };
        }

        // Fetch participant
        const { data: participant } = await supabase
            .from('participants')
            .select('full_name, email')
            .eq('id', sessionData.participant_id)
            .single();

        // Fetch study via assignment
        const { data: assignment } = await supabase
            .from('study_participant_assignments')
            .select('*, studies(title)')
            .eq('id', sessionData.assignment_id)
            .single();

        // Combine data
        const combinedSession = {
            ...sessionData,
            participant,
            assignment: {
                ...assignment,
                study: assignment?.studies
            }
        };

        return {
            success: true,
            session: combinedSession
        };
    } catch (error) {
        console.error('[Server Action] Error fetching session:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export async function saveQATurn(sessionId: string, questionText: string, answerTranscript: string, turnIndex: number) {
    try {
        const { data, error } = await supabase
            .from('qa_turns')
            .insert({
                session_id: sessionId,
                question_text: questionText,
                answer_transcript: answerTranscript,
                turn_index: turnIndex
            })
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('[Server Action] Error saving QA turn:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

export async function getResearchQuestionsByStudy(studyId: string) {
    try {
        const { data, error } = await supabase
            .from('research_questions')
            .select('*')
            .eq('study_id', studyId);

        if (error) throw error;
        return { success: true, questions: data };
    } catch (error) {
        console.error('[Server Action] Error fetching research questions:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}
