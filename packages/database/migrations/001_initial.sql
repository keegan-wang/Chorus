-- =============================================================================
-- CHORUS DATABASE SCHEMA
-- Migration: 001_initial
-- Description: Initial schema with all core tables
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ORGANIZATIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS organizations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    slug            TEXT UNIQUE NOT NULL,
    logo_url        TEXT,
    billing_email   TEXT,
    plan            TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    settings        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

-- =============================================================================
-- USERS (extends Supabase auth.users)
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email           TEXT NOT NULL,
    full_name       TEXT,
    role            TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    avatar_url      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Note: id should match auth.users(id) but we can't create FK due to schema permissions
-- This will be enforced at the application level

CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =============================================================================
-- GUARDRAIL PROFILES
-- =============================================================================
CREATE TABLE IF NOT EXISTS guardrail_profiles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT UNIQUE NOT NULL,
    description     TEXT,
    llm_instructions TEXT NOT NULL,
    config          JSONB NOT NULL DEFAULT '{}',
    is_default      BOOLEAN DEFAULT false,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- AVATARS
-- =============================================================================
CREATE TABLE IF NOT EXISTS avatars (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                TEXT NOT NULL,
    description         TEXT,
    demographic_profile JSONB NOT NULL DEFAULT '{}',
    voice_provider      TEXT DEFAULT 'elevenlabs' CHECK (voice_provider IN ('elevenlabs', 'openai')),
    voice_id            TEXT NOT NULL,
    video_provider      TEXT DEFAULT 'heygen' CHECK (video_provider IN ('heygen', 'd-id')),
    video_avatar_id     TEXT NOT NULL,
    tone_config         JSONB DEFAULT '{}',
    is_active           BOOLEAN DEFAULT true,
    languages           TEXT[] DEFAULT '{en}',
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- STUDIES
-- =============================================================================
CREATE TABLE IF NOT EXISTS studies (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by              UUID REFERENCES users(id),
    title                   TEXT NOT NULL,
    description             TEXT,
    status                  TEXT DEFAULT 'draft' CHECK (status IN (
                                'draft', 'recruiting', 'active', 'paused', 'completed', 'archived'
                            )),
    research_intent         JSONB NOT NULL,
    interview_config        JSONB NOT NULL,
    target_demographics     JSONB DEFAULT '{}',
    target_participant_count INTEGER DEFAULT 20,
    incentive_amount_cents  INTEGER DEFAULT 1000,
    incentive_currency      TEXT DEFAULT 'USD',
    avatar_strategy         TEXT DEFAULT 'demographic_match' CHECK (avatar_strategy IN (
                                'demographic_match', 'random', 'fixed'
                            )),
    guardrail_profile       TEXT DEFAULT 'balanced',
    launched_at             TIMESTAMPTZ,
    completed_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_studies_organization ON studies(organization_id);
CREATE INDEX IF NOT EXISTS idx_studies_status ON studies(status);
CREATE INDEX IF NOT EXISTS idx_studies_created_at ON studies(created_at DESC);

-- =============================================================================
-- PARTICIPANTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS participants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    external_id     TEXT,
    external_source TEXT,
    email           TEXT NOT NULL,
    phone           TEXT,
    first_name      TEXT,
    last_name       TEXT,
    full_name       TEXT GENERATED ALWAYS AS (
                        COALESCE(first_name || ' ' || last_name, first_name, last_name, email)
                    ) STORED,
    age             INTEGER,
    gender          TEXT,
    country         TEXT,
    city            TEXT,
    language        TEXT DEFAULT 'en',
    timezone        TEXT,
    tags            TEXT[] DEFAULT '{}',
    metadata        JSONB DEFAULT '{}',
    total_invites   INTEGER DEFAULT 0,
    total_completed INTEGER DEFAULT 0,
    last_invited_at TIMESTAMPTZ,
    last_completed_at TIMESTAMPTZ,
    status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'opted_out', 'bounced', 'spam')),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, email)
);

CREATE INDEX IF NOT EXISTS idx_participants_organization ON participants(organization_id);
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
CREATE INDEX IF NOT EXISTS idx_participants_tags ON participants USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(status);

-- =============================================================================
-- STUDY PARTICIPANT ASSIGNMENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS study_participant_assignments (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_id                    UUID NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
    participant_id              UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    avatar_id                   UUID NOT NULL REFERENCES avatars(id),
    invite_token                TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    invite_status               TEXT DEFAULT 'pending' CHECK (invite_status IN (
                                    'pending', 'sent', 'delivered', 'opened', 'clicked',
                                    'started', 'completed', 'expired', 'opted_out', 'bounced'
                                )),
    invite_channel              TEXT DEFAULT 'email',
    invite_sent_at              TIMESTAMPTZ,
    invite_opened_at            TIMESTAMPTZ,
    invite_clicked_at           TIMESTAMPTZ,
    invite_expires_at           TIMESTAMPTZ,
    selection_score             FLOAT,
    selection_reasoning         TEXT,
    avatar_assignment_reasoning TEXT,
    completed_at                TIMESTAMPTZ,
    payout_status               TEXT DEFAULT 'not_eligible' CHECK (payout_status IN (
                                    'not_eligible', 'eligible', 'processing', 'paid', 'failed'
                                )),
    payout_amount_cents         INTEGER,
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(study_id, participant_id)
);

CREATE INDEX IF NOT EXISTS idx_assignments_study ON study_participant_assignments(study_id);
CREATE INDEX IF NOT EXISTS idx_assignments_participant ON study_participant_assignments(participant_id);
CREATE INDEX IF NOT EXISTS idx_assignments_invite_token ON study_participant_assignments(invite_token);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON study_participant_assignments(invite_status);

-- =============================================================================
-- INTERVIEW SESSIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS interview_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id   UUID NOT NULL REFERENCES study_participant_assignments(id) ON DELETE CASCADE,
    study_id        UUID NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
    participant_id  UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    avatar_id       UUID NOT NULL REFERENCES avatars(id),
    status          TEXT DEFAULT 'initialized' CHECK (status IN (
                        'initialized', 'intro', 'in_progress', 'wrapping_up',
                        'completed', 'abandoned', 'error'
                    )),
    started_at      TIMESTAMPTZ,
    ended_at        TIMESTAMPTZ,
    duration_seconds INTEGER,
    config_snapshot JSONB NOT NULL DEFAULT '{}',
    total_questions INTEGER DEFAULT 0,
    total_tokens_used INTEGER DEFAULT 0,
    user_agent      TEXT,
    device_type     TEXT,
    error_message   TEXT,
    error_details   JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_study ON interview_sessions(study_id);
CREATE INDEX IF NOT EXISTS idx_sessions_participant ON interview_sessions(participant_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON interview_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON interview_sessions(started_at DESC);

-- =============================================================================
-- QA TURNS
-- =============================================================================
CREATE TABLE IF NOT EXISTS qa_turns (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id              UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    turn_index              INTEGER NOT NULL,
    question_text           TEXT NOT NULL,
    question_type           TEXT CHECK (question_type IN (
                                'seed', 'follow_up', 'clarification', 'pivot', 'wrap_up'
                            )),
    question_topic          TEXT,
    answer_transcript       TEXT,
    answer_duration_seconds FLOAT,
    answer_word_count       INTEGER,
    question_generated_at   TIMESTAMPTZ,
    question_delivered_at   TIMESTAMPTZ,
    answer_started_at       TIMESTAMPTZ,
    answer_completed_at     TIMESTAMPTZ,
    agent_model_version     TEXT,
    agent_prompt_tokens     INTEGER,
    agent_completion_tokens INTEGER,
    avatar_video_url        TEXT,
    avatar_audio_url        TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_turns_session ON qa_turns(session_id);
CREATE INDEX IF NOT EXISTS idx_turns_session_index ON qa_turns(session_id, turn_index);

-- =============================================================================
-- QA QUALITY LABELS
-- =============================================================================
CREATE TABLE IF NOT EXISTS qa_quality_labels (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qa_turn_id          UUID NOT NULL REFERENCES qa_turns(id) ON DELETE CASCADE,
    label               TEXT NOT NULL CHECK (label IN ('good', 'neutral', 'bad')),
    scores              JSONB NOT NULL DEFAULT '{}',
    reasoning           TEXT,
    agent_model_version TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(qa_turn_id)
);

CREATE INDEX IF NOT EXISTS idx_quality_qa_turn ON qa_quality_labels(qa_turn_id);
CREATE INDEX IF NOT EXISTS idx_quality_label ON qa_quality_labels(label);

-- =============================================================================
-- INTERVIEW SUMMARIES
-- =============================================================================
CREATE TABLE IF NOT EXISTS interview_summaries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    summary_text        TEXT NOT NULL,
    key_themes          TEXT[] DEFAULT '{}',
    sentiment_overview  JSONB DEFAULT '{}',
    quotes              JSONB DEFAULT '[]',
    persona_flags       TEXT[] DEFAULT '{}',
    agent_model_version TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id)
);

CREATE INDEX IF NOT EXISTS idx_summaries_session ON interview_summaries(session_id);

-- =============================================================================
-- STUDY REPORTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS study_reports (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_id                UUID NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
    version                 INTEGER DEFAULT 1,
    status                  TEXT DEFAULT 'generating' CHECK (status IN (
                                'generating', 'completed', 'failed'
                            )),
    report_data             JSONB NOT NULL DEFAULT '{}',
    report_markdown         TEXT,
    report_html             TEXT,
    pdf_url                 TEXT,
    slides_url              TEXT,
    interviews_included     INTEGER,
    agent_model_version     TEXT,
    generation_started_at   TIMESTAMPTZ,
    generation_completed_at TIMESTAMPTZ,
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_study ON study_reports(study_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_study_version ON study_reports(study_id, version);

-- =============================================================================
-- IMPORT JOBS
-- =============================================================================
CREATE TABLE IF NOT EXISTS import_jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    source_type     TEXT NOT NULL,
    source_config   JSONB DEFAULT '{}',
    status          TEXT DEFAULT 'pending' CHECK (status IN (
                        'pending', 'processing', 'completed', 'failed', 'partial'
                    )),
    total_records   INTEGER,
    imported_count  INTEGER,
    skipped_count   INTEGER,
    error_count     INTEGER,
    errors          JSONB DEFAULT '[]',
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_imports_organization ON import_jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_imports_status ON import_jobs(status);

-- =============================================================================
-- PAYOUTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS payouts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    participant_id      UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    assignment_id       UUID REFERENCES study_participant_assignments(id),
    study_id            UUID REFERENCES studies(id),
    amount_cents        INTEGER NOT NULL,
    currency            TEXT DEFAULT 'USD',
    provider            TEXT,
    provider_payout_id  TEXT,
    status              TEXT DEFAULT 'pending' CHECK (status IN (
                            'pending', 'processing', 'completed', 'failed', 'cancelled'
                        )),
    recipient_email     TEXT NOT NULL,
    error_message       TEXT,
    retry_count         INTEGER DEFAULT 0,
    processed_at        TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payouts_organization ON payouts(organization_id);
CREATE INDEX IF NOT EXISTS idx_payouts_participant ON payouts(participant_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);

-- =============================================================================
-- INTEGRATIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS integrations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider        TEXT NOT NULL,
    access_token    TEXT,
    refresh_token   TEXT,
    token_expires_at TIMESTAMPTZ,
    config          JSONB DEFAULT '{}',
    status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'error')),
    last_sync_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_integrations_organization ON integrations(organization_id);

-- =============================================================================
-- DATA RETENTION POLICIES
-- =============================================================================
CREATE TABLE IF NOT EXISTS data_retention_policies (
    organization_id             UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
    interview_retention_days    INTEGER DEFAULT 365,
    participant_retention_days  INTEGER DEFAULT 730,
    report_retention_days       INTEGER,
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_avatars_updated_at
    BEFORE UPDATE ON avatars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_studies_updated_at
    BEFORE UPDATE ON studies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participants_updated_at
    BEFORE UPDATE ON participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at
    BEFORE UPDATE ON study_participant_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON interview_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payouts_updated_at
    BEFORE UPDATE ON payouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at
    BEFORE UPDATE ON integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_retention_policies_updated_at
    BEFORE UPDATE ON data_retention_policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_participant_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_quality_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Helper function: Get user's organization
CREATE OR REPLACE FUNCTION auth.user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- Organizations: Users can only see their own org
CREATE POLICY "Users can view own organization"
    ON organizations FOR SELECT
    USING (id = auth.user_organization_id());

CREATE POLICY "Owners can update organization"
    ON organizations FOR UPDATE
    USING (id = auth.user_organization_id());

-- Users: Users can see users in their org
CREATE POLICY "Users can view org members"
    ON users FOR SELECT
    USING (organization_id = auth.user_organization_id());

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (id = auth.uid());

-- Studies: Organization-scoped
CREATE POLICY "Users can view org studies"
    ON studies FOR SELECT
    USING (organization_id = auth.user_organization_id());

CREATE POLICY "Users can create org studies"
    ON studies FOR INSERT
    WITH CHECK (organization_id = auth.user_organization_id());

CREATE POLICY "Users can update org studies"
    ON studies FOR UPDATE
    USING (organization_id = auth.user_organization_id());

CREATE POLICY "Users can delete org studies"
    ON studies FOR DELETE
    USING (organization_id = auth.user_organization_id());

-- Participants: Organization-scoped
CREATE POLICY "Users can view org participants"
    ON participants FOR SELECT
    USING (organization_id = auth.user_organization_id());

CREATE POLICY "Users can create org participants"
    ON participants FOR INSERT
    WITH CHECK (organization_id = auth.user_organization_id());

CREATE POLICY "Users can update org participants"
    ON participants FOR UPDATE
    USING (organization_id = auth.user_organization_id());

CREATE POLICY "Users can delete org participants"
    ON participants FOR DELETE
    USING (organization_id = auth.user_organization_id());

-- Assignments: Via study organization
CREATE POLICY "Users can view org assignments"
    ON study_participant_assignments FOR SELECT
    USING (
        study_id IN (
            SELECT id FROM studies WHERE organization_id = auth.user_organization_id()
        )
    );

CREATE POLICY "Users can manage org assignments"
    ON study_participant_assignments FOR ALL
    USING (
        study_id IN (
            SELECT id FROM studies WHERE organization_id = auth.user_organization_id()
        )
    );

-- Sessions: Via study organization
CREATE POLICY "Users can view org sessions"
    ON interview_sessions FOR SELECT
    USING (
        study_id IN (
            SELECT id FROM studies WHERE organization_id = auth.user_organization_id()
        )
    );

-- QA Turns: Via session
CREATE POLICY "Users can view org qa_turns"
    ON qa_turns FOR SELECT
    USING (
        session_id IN (
            SELECT id FROM interview_sessions WHERE study_id IN (
                SELECT id FROM studies WHERE organization_id = auth.user_organization_id()
            )
        )
    );

-- Quality Labels: Via qa_turn
CREATE POLICY "Users can view org quality_labels"
    ON qa_quality_labels FOR SELECT
    USING (
        qa_turn_id IN (
            SELECT id FROM qa_turns WHERE session_id IN (
                SELECT id FROM interview_sessions WHERE study_id IN (
                    SELECT id FROM studies WHERE organization_id = auth.user_organization_id()
                )
            )
        )
    );

-- Interview Summaries: Via session
CREATE POLICY "Users can view org summaries"
    ON interview_summaries FOR SELECT
    USING (
        session_id IN (
            SELECT id FROM interview_sessions WHERE study_id IN (
                SELECT id FROM studies WHERE organization_id = auth.user_organization_id()
            )
        )
    );

-- Study Reports: Via study
CREATE POLICY "Users can view org reports"
    ON study_reports FOR SELECT
    USING (
        study_id IN (
            SELECT id FROM studies WHERE organization_id = auth.user_organization_id()
        )
    );

-- Import Jobs: Organization-scoped
CREATE POLICY "Users can view org imports"
    ON import_jobs FOR SELECT
    USING (organization_id = auth.user_organization_id());

CREATE POLICY "Users can create org imports"
    ON import_jobs FOR INSERT
    WITH CHECK (organization_id = auth.user_organization_id());

-- Payouts: Organization-scoped
CREATE POLICY "Users can view org payouts"
    ON payouts FOR SELECT
    USING (organization_id = auth.user_organization_id());

-- Integrations: Organization-scoped
CREATE POLICY "Users can view org integrations"
    ON integrations FOR SELECT
    USING (organization_id = auth.user_organization_id());

CREATE POLICY "Users can manage org integrations"
    ON integrations FOR ALL
    USING (organization_id = auth.user_organization_id());

-- =============================================================================
-- PUBLIC ACCESS FOR INTERVIEW PARTICIPANTS
-- =============================================================================

-- Allow public access to assignments by invite token (for interview flow)
CREATE POLICY "Public can view assignment by token"
    ON study_participant_assignments FOR SELECT
    USING (true);  -- Will be filtered by invite_token in application

-- Allow service role to manage sessions (for interview orchestration)
-- This is handled by using service_role key in the backend
