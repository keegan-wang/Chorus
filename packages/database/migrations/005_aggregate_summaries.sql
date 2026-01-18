-- =============================================================================
-- AGGREGATE SUMMARIES
-- Migration: 005_aggregate_summaries
-- Description: Aggregate summaries across multiple participant responses
-- =============================================================================

-- 1. AGGREGATE SUMMARIES TABLE
CREATE TABLE IF NOT EXISTS research_question_aggregate_summaries (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    research_question_id    UUID NOT NULL REFERENCES research_questions(id) ON DELETE CASCADE,
    statistics              JSONB NOT NULL DEFAULT '[]',
    pros                    JSONB NOT NULL DEFAULT '[]',
    cons                    JSONB NOT NULL DEFAULT '[]',
    total_responses_analyzed INTEGER NOT NULL DEFAULT 0,
    generated_at            TIMESTAMPTZ DEFAULT NOW(),
    wordware_model_version  TEXT,
    raw_response            JSONB,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_aggregate_summaries_question 
    ON research_question_aggregate_summaries(research_question_id);
CREATE INDEX IF NOT EXISTS idx_aggregate_summaries_generated 
    ON research_question_aggregate_summaries(generated_at DESC);

-- RLS
ALTER TABLE research_question_aggregate_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org aggregate summaries"
    ON research_question_aggregate_summaries FOR SELECT
    USING (
        research_question_id IN (
            SELECT id FROM research_questions WHERE organization_id = public.user_organization_id()
        )
    );

CREATE POLICY "Users can manage org aggregate summaries"
    ON research_question_aggregate_summaries FOR ALL
    USING (
        research_question_id IN (
            SELECT id FROM research_questions WHERE organization_id = public.user_organization_id()
        )
    );

-- Trigger for updated_at
CREATE TRIGGER update_aggregate_summaries_updated_at
    BEFORE UPDATE ON research_question_aggregate_summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
