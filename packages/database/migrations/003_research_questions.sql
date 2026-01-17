-- =============================================================================
-- RESEARCH QUESTIONS (QID Data)
-- Migration: 003_research_questions
-- Description: Stores background data for question generation agents
-- =============================================================================

CREATE TABLE IF NOT EXISTS research_questions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    root_question       TEXT NOT NULL,
    specific_product    TEXT,
    other_questions     JSONB DEFAULT '[]', -- List of related questions
    demographics        JSONB DEFAULT '{}', -- Target demographics
    participant_count   INTEGER,
    selected_dataset    TEXT,
    other_info          TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_research_questions_org ON research_questions(organization_id);

-- Updated_at Trigger
CREATE TRIGGER update_research_questions_updated_at
    BEFORE UPDATE ON research_questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE research_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org research questions"
    ON research_questions FOR SELECT
    USING (organization_id = public.user_organization_id());

CREATE POLICY "Users can create org research questions"
    ON research_questions FOR INSERT
    WITH CHECK (organization_id = public.user_organization_id());

CREATE POLICY "Users can update org research questions"
    ON research_questions FOR UPDATE
    USING (organization_id = public.user_organization_id());

CREATE POLICY "Users can delete org research questions"
    ON research_questions FOR DELETE
    USING (organization_id = public.user_organization_id());
