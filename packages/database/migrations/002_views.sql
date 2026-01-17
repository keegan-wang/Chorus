-- =============================================================================
-- CHORUS DATABASE VIEWS
-- Migration: 002_views
-- Description: Useful views for dashboards and analytics
-- =============================================================================

-- =============================================================================
-- STUDY PROGRESS VIEW
-- =============================================================================
CREATE OR REPLACE VIEW study_progress AS
SELECT
    s.id AS study_id,
    s.organization_id,
    s.title,
    s.status,
    s.target_participant_count,
    COUNT(DISTINCT spa.id) AS total_assigned,
    COUNT(DISTINCT CASE WHEN spa.invite_status IN ('sent', 'delivered', 'opened', 'clicked', 'started', 'completed') THEN spa.id END) AS invites_sent,
    COUNT(DISTINCT CASE WHEN spa.invite_status = 'opened' THEN spa.id END) AS invites_opened,
    COUNT(DISTINCT CASE WHEN spa.invite_status IN ('clicked', 'started', 'completed') THEN spa.id END) AS invites_clicked,
    COUNT(DISTINCT CASE WHEN spa.invite_status = 'started' THEN spa.id END) AS interviews_started,
    COUNT(DISTINCT CASE WHEN spa.invite_status = 'completed' THEN spa.id END) AS interviews_completed,
    COUNT(DISTINCT iss.id) FILTER (WHERE iss.status = 'in_progress') AS interviews_in_progress,
    ROUND(
        COUNT(DISTINCT CASE WHEN spa.invite_status = 'completed' THEN spa.id END)::NUMERIC /
        NULLIF(s.target_participant_count, 0) * 100, 1
    ) AS completion_percentage,
    s.created_at,
    s.launched_at
FROM studies s
LEFT JOIN study_participant_assignments spa ON s.id = spa.study_id
LEFT JOIN interview_sessions iss ON spa.id = iss.assignment_id
GROUP BY s.id;

-- =============================================================================
-- STUDY QUESTION QUALITY VIEW
-- =============================================================================
CREATE OR REPLACE VIEW study_question_quality AS
SELECT
    s.id AS study_id,
    s.organization_id,
    s.title,
    COUNT(qql.id) AS total_scored,
    COUNT(CASE WHEN qql.label = 'good' THEN 1 END) AS good_count,
    COUNT(CASE WHEN qql.label = 'neutral' THEN 1 END) AS neutral_count,
    COUNT(CASE WHEN qql.label = 'bad' THEN 1 END) AS bad_count,
    ROUND(COUNT(CASE WHEN qql.label = 'good' THEN 1 END)::NUMERIC / NULLIF(COUNT(qql.id), 0) * 100, 1) AS good_percentage,
    AVG((qql.scores->>'depth')::FLOAT) AS avg_depth,
    AVG((qql.scores->>'relevance')::FLOAT) AS avg_relevance,
    AVG((qql.scores->>'engagement')::FLOAT) AS avg_engagement,
    AVG((qql.scores->>'clarity')::FLOAT) AS avg_clarity,
    AVG((qql.scores->>'non_leading')::FLOAT) AS avg_non_leading
FROM studies s
LEFT JOIN interview_sessions iss ON s.id = iss.study_id
LEFT JOIN qa_turns qt ON iss.id = qt.session_id
LEFT JOIN qa_quality_labels qql ON qt.id = qql.qa_turn_id
GROUP BY s.id;

-- =============================================================================
-- AVATAR PERFORMANCE VIEW
-- =============================================================================
CREATE OR REPLACE VIEW avatar_performance AS
SELECT
    a.id AS avatar_id,
    a.name AS avatar_name,
    COUNT(DISTINCT iss.id) AS total_interviews,
    COUNT(DISTINCT CASE WHEN iss.status = 'completed' THEN iss.id END) AS completed_interviews,
    ROUND(
        COUNT(DISTINCT CASE WHEN iss.status = 'completed' THEN iss.id END)::NUMERIC /
        NULLIF(COUNT(DISTINCT iss.id), 0) * 100, 1
    ) AS completion_rate,
    AVG(iss.duration_seconds) AS avg_duration_seconds,
    AVG(iss.total_questions) AS avg_questions_per_interview,
    AVG((qql.scores->>'depth')::FLOAT) AS avg_depth_score,
    AVG((qql.scores->>'engagement')::FLOAT) AS avg_engagement_score
FROM avatars a
LEFT JOIN interview_sessions iss ON a.id = iss.avatar_id
LEFT JOIN qa_turns qt ON iss.id = qt.session_id
LEFT JOIN qa_quality_labels qql ON qt.id = qql.qa_turn_id
GROUP BY a.id;

-- =============================================================================
-- PARTICIPANT INTERVIEW HISTORY VIEW
-- =============================================================================
CREATE OR REPLACE VIEW participant_interview_history AS
SELECT
    p.id AS participant_id,
    p.organization_id,
    p.email,
    p.full_name,
    COUNT(DISTINCT spa.id) AS total_invites,
    COUNT(DISTINCT CASE WHEN spa.invite_status = 'completed' THEN spa.id END) AS total_completed,
    MAX(spa.invite_sent_at) AS last_invited_at,
    MAX(spa.completed_at) AS last_completed_at,
    ARRAY_AGG(DISTINCT s.title) FILTER (WHERE s.title IS NOT NULL) AS study_titles
FROM participants p
LEFT JOIN study_participant_assignments spa ON p.id = spa.participant_id
LEFT JOIN studies s ON spa.study_id = s.id
GROUP BY p.id;

-- =============================================================================
-- GOOD QUESTION PATTERNS MATERIALIZED VIEW
-- =============================================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS good_question_patterns AS
WITH scored_questions AS (
    SELECT
        qt.question_text,
        qt.question_type,
        qt.question_topic,
        qql.label,
        qql.scores,
        qt.answer_word_count,
        s.research_intent->>'study_type' AS study_type,
        s.id AS study_id
    FROM qa_turns qt
    JOIN qa_quality_labels qql ON qt.id = qql.qa_turn_id
    JOIN interview_sessions iss ON qt.session_id = iss.id
    JOIN studies s ON iss.study_id = s.id
    WHERE qql.label = 'good'
      AND (qql.scores->>'depth')::float > 0.7
)
SELECT
    study_type,
    question_type,
    question_topic,
    array_agg(DISTINCT question_text) AS example_questions,
    AVG(answer_word_count) AS avg_answer_length,
    COUNT(*) AS occurrence_count
FROM scored_questions
GROUP BY study_type, question_type, question_topic
HAVING COUNT(*) >= 2
ORDER BY occurrence_count DESC;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_good_patterns_study_type ON good_question_patterns(study_type);

-- =============================================================================
-- BAD QUESTION PATTERNS MATERIALIZED VIEW
-- =============================================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS bad_question_patterns AS
WITH scored_questions AS (
    SELECT
        qt.question_text,
        qt.question_type,
        qql.label,
        qql.scores,
        qql.reasoning,
        s.research_intent->>'study_type' AS study_type
    FROM qa_turns qt
    JOIN qa_quality_labels qql ON qt.id = qql.qa_turn_id
    JOIN interview_sessions iss ON qt.session_id = iss.id
    JOIN studies s ON iss.study_id = s.id
    WHERE qql.label = 'bad'
)
SELECT
    study_type,
    question_type,
    array_agg(DISTINCT question_text) AS example_bad_questions,
    array_agg(DISTINCT reasoning) FILTER (WHERE reasoning IS NOT NULL) AS common_issues,
    COUNT(*) AS occurrence_count
FROM scored_questions
GROUP BY study_type, question_type
HAVING COUNT(*) >= 2
ORDER BY occurrence_count DESC;

-- =============================================================================
-- ORGANIZATION STATS VIEW
-- =============================================================================
CREATE OR REPLACE VIEW organization_stats AS
SELECT
    o.id AS organization_id,
    o.name,
    o.plan,
    COUNT(DISTINCT s.id) AS total_studies,
    COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END) AS active_studies,
    COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END) AS completed_studies,
    COUNT(DISTINCT p.id) AS total_participants,
    COUNT(DISTINCT iss.id) AS total_interviews,
    COUNT(DISTINCT CASE WHEN iss.status = 'completed' THEN iss.id END) AS completed_interviews,
    SUM(pay.amount_cents) FILTER (WHERE pay.status = 'completed') AS total_payouts_cents
FROM organizations o
LEFT JOIN studies s ON o.id = s.organization_id
LEFT JOIN participants p ON o.id = p.organization_id
LEFT JOIN interview_sessions iss ON s.id = iss.study_id
LEFT JOIN payouts pay ON o.id = pay.organization_id
GROUP BY o.id;

-- =============================================================================
-- REFRESH FUNCTION FOR MATERIALIZED VIEWS
-- =============================================================================
CREATE OR REPLACE FUNCTION refresh_pattern_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW good_question_patterns;
    REFRESH MATERIALIZED VIEW bad_question_patterns;
END;
$$ LANGUAGE plpgsql;

-- Note: In production, set up a cron job to call refresh_pattern_views() periodically
-- SELECT cron.schedule('refresh-patterns', '0 */6 * * *', 'SELECT refresh_pattern_views()');
