-- =============================================================================
-- PARTICIPANT SELECTIONS & DASHBOARD
-- Migration: 004_participant_selections
-- Description: Assignments of Participants to Research Questions + Grand View
-- =============================================================================

-- 1. ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS research_question_assignments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    research_question_id UUID NOT NULL REFERENCES research_questions(id) ON DELETE CASCADE,
    participant_id      UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    status              TEXT DEFAULT 'pending' CHECK (status IN (
                            'pending', 'invited', 'in_progress', 'completed', 'excused'
                        )),
    assigned_at         TIMESTAMPTZ DEFAULT NOW(),
    completed_at        TIMESTAMPTZ,
    UNIQUE(research_question_id, participant_id)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_assignments_question ON research_question_assignments(research_question_id);
CREATE INDEX IF NOT EXISTS idx_assignments_participant_fk ON research_question_assignments(participant_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status_fk ON research_question_assignments(status);

-- RLS
ALTER TABLE research_question_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org assignments"
    ON research_question_assignments FOR SELECT
    USING (
        participant_id IN (
            SELECT id FROM participants WHERE organization_id = public.user_organization_id()
        )
    );

CREATE POLICY "Users can manage org assignments"
    ON research_question_assignments FOR ALL
    USING (
        participant_id IN (
            SELECT id FROM participants WHERE organization_id = public.user_organization_id()
        )
    );

-- 2. GRAND TABLE VIEW (Dashboard)
-- Unifies Participant Info, Question Info, and Assignment Status
CREATE OR REPLACE VIEW participant_interviews_dashboard AS
SELECT 
    a.id AS assignment_id,
    p.id AS participant_id,
    p.full_name AS participant_name,
    p.email AS participant_email,
    rq.id AS question_id,
    rq.root_question AS question_root,
    rq.specific_product,
    a.status,
    a.assigned_at,
    a.completed_at,
    p.organization_id
FROM 
    research_question_assignments a
    JOIN participants p ON a.participant_id = p.id
    JOIN research_questions rq ON a.research_question_id = rq.id;

-- Grant access to the view (RLS still applies to underlying tables, but best to be explicit if using views in specific ways)
-- Supabase Views inherit permissions of the underlying tables if setup as security invoker (default in Postgres 15+ usually, but let's be safe)
