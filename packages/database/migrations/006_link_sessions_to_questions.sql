-- =============================================================================
-- Migration: 006_link_sessions_to_questions
-- Description: Adds research_question_id to interview_sessions to facilitate
--              direct linkage for AI Agents.
-- =============================================================================

ALTER TABLE interview_sessions 
ADD COLUMN IF NOT EXISTS research_question_id UUID REFERENCES research_questions(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_sessions_question ON interview_sessions(research_question_id);
