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

export async function getMyAssignments(participantId: string) {
    try {
        const { data, error } = await supabase
            .from('research_question_assignments')
            .select(`
        id,
        status,
        assigned_at,
        completed_at,
        research_questions (
          id,
          root_question,
          specific_product,
          demographics
        )
      `)
            .eq('participant_id', participantId)
            .order('assigned_at', { ascending: false });

        if (error) throw error;

        return {
            success: true,
            assignments: data || []
        };
    } catch (error) {
        console.error('[Server Action] Error fetching assignments:', error);
        return {
            success: false,
            assignments: [],
            error
        };
    }
}

export async function startInterview(assignmentId: string, participantId: string) {
    console.log('[Server Action] startInterview called:', { assignmentId, participantId });

    try {
        // Get the assignment details
        const { data: assignment, error: assignmentError } = await supabase
            .from('research_question_assignments')
            .select('*, research_questions(*)')
            .eq('id', assignmentId)
            .single();

        if (assignmentError || !assignment) {
            console.error('[Server Action] Assignment error:', assignmentError);
            throw new Error('Assignment not found');
        }

        console.log('[Server Action] Found assignment:', assignment);

        // Check if session already exists
        const { data: existingSession } = await supabase
            .from('interview_sessions')
            .select('id')
            .eq('participant_id', participantId)
            .eq('assignment_id', assignmentId)
            .maybeSingle();

        if (existingSession) {
            console.log('[Server Action] Returning existing session:', existingSession.id);
            return {
                success: true,
                sessionId: existingSession.id
            };
        }

        console.log('[Server Action] Found assignment:', assignment);

        // Find study by product name
        const productName = assignment.research_questions.specific_product;
        const studyTitle = `${productName} Study`;

        console.log('[Server Action] Looking for study:', studyTitle);

        const { data: studies, error: studyError } = await supabase
            .from('studies')
            .select('id')
            .eq('title', studyTitle)
            .limit(1);

        if (studyError || !studies || studies.length === 0) {
            console.error('[Server Action] Study not found for product:', productName);
            throw new Error(`Study not found for product: ${productName}. Please run create_product_studies.py script.`);
        }

        const studyId = studies[0].id;
        console.log('[Server Action] Found study:', studyId);

        // Get a default avatar
        const { data: avatars } = await supabase
            .from('avatars')
            .select('id')
            .limit(1);

        if (!avatars || avatars.length === 0) {
            throw new Error('No avatars available');
        }

        const avatarId = avatars[0].id;

        console.log('[Server Action] Creating session with:', { studyId, avatarId });

        // Check if study_participant_assignment already exists for this participant and study
        const { data: existingAssignment } = await supabase
            .from('study_participant_assignments')
            .select('id')
            .eq('study_id', studyId)
            .eq('participant_id', participantId)
            .maybeSingle();

        let studyAssignmentId;
        if (existingAssignment) {
            console.log('[Server Action] Using existing study assignment:', existingAssignment.id);
            studyAssignmentId = existingAssignment.id;
        } else {
            // Create a study_participant_assignment (required for interview_sessions FK)
            const { data: studyAssignment, error: studyAssignmentError } = await supabase
                .from('study_participant_assignments')
                .insert({
                    study_id: studyId,
                    participant_id: participantId,
                    avatar_id: avatarId,
                    invite_status: 'started'
                })
                .select('id')
                .single();

            if (studyAssignmentError || !studyAssignment) {
                console.error('[Server Action] Study assignment creation error:', studyAssignmentError);
                throw studyAssignmentError || new Error('Failed to create study assignment');
            }

            console.log('[Server Action] Created new study assignment:', studyAssignment.id);
            studyAssignmentId = studyAssignment.id;
        }

        // Create new session
        const { data: newSession, error: sessionError } = await supabase
            .from('interview_sessions')
            .insert({
                assignment_id: studyAssignmentId,
                study_id: studyId,
                participant_id: participantId,
                avatar_id: avatarId,
                status: 'in_progress',
                started_at: new Date().toISOString()
            })
            .select('id')
            .single();

        if (sessionError) {
            console.error('[Server Action] Session creation error:', sessionError);
            throw sessionError;
        }

        console.log('[Server Action] Created new session:', newSession.id);

        // Update assignment status to in_progress
        await supabase
            .from('research_question_assignments')
            .update({ status: 'in_progress' })
            .eq('id', assignmentId);

        return {
            success: true,
            sessionId: newSession.id
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
        console.error('[Server Action] Error starting interview:', errorMessage);
        console.error('[Server Action] Full error object:', error);
        return {
            success: false,
            error: errorMessage
        };
    }
}

export async function getOrCreateInviteToken(assignmentId: string, participantId: string) {
    try {
        // First, get the research_question_assignment to find the research_question_id
        const { data: assignment, error: assignmentError } = await supabase
            .from('research_question_assignments')
            .select('research_question_id')
            .eq('id', assignmentId)
            .single();

        if (assignmentError || !assignment) {
            throw new Error('Assignment not found');
        }

        // Check if a study_participant_assignment already exists
        // Note: We need to find or create a study that links to this research question
        // For now, we'll look for any existing assignment for this participant
        const { data: existingAssignment } = await supabase
            .from('study_participant_assignments')
            .select('invite_token')
            .eq('participant_id', participantId)
            .limit(1)
            .single();

        if (existingAssignment?.invite_token) {
            return {
                success: true,
                inviteToken: existingAssignment.invite_token
            };
        }

        // If no assignment exists, we need to create one
        // This requires a study_id and avatar_id
        // For now, return an error asking to create the assignment first
        return {
            success: false,
            error: 'No interview session found. Please contact support.'
        };

    } catch (error) {
        console.error('[Server Action] Error getting invite token:', error);
        return {
            success: false,
            error
        };
    }
}
