-- =============================================================================
-- SEED: Guardrail Profiles
-- =============================================================================

INSERT INTO guardrail_profiles (name, description, llm_instructions, config, is_default) VALUES
(
    'strict',
    'Tight guardrails with minimal deviation from research goal',
    'You must stay strictly on topic. Only ask questions directly related to the research goal. Do not explore tangents. Keep questions short and focused. If the participant tries to go off-topic, gently redirect them back to the main subject. Avoid any questions that could be perceived as leading or biased.',
    '{
        "max_topic_deviation": 0.2,
        "max_question_length_chars": 200,
        "min_answer_before_followup_seconds": 2,
        "max_clarifications_per_topic": 1,
        "sensitivity_rules": {
            "avoid_topics": ["political_affiliation", "religion", "health_conditions", "income", "legal_issues"],
            "escalate_if": ["self_harm", "harassment", "illegal_activity", "threats"]
        },
        "tone_requirements": {
            "must_be_neutral": true,
            "avoid_leading": true,
            "encourage_elaboration": false
        }
    }',
    false
),
(
    'balanced',
    'Standard guardrails that allow moderate exploration while staying focused',
    'Stay focused on the research goal but you may briefly explore relevant tangents if they could yield useful insights. Always return to the main topic within 1-2 follow-up questions. Use open-ended questions that encourage participants to share their genuine thoughts. Acknowledge their responses before moving on. Avoid leading questions that suggest a particular answer.',
    '{
        "max_topic_deviation": 0.4,
        "max_question_length_chars": 280,
        "min_answer_before_followup_seconds": 3,
        "max_clarifications_per_topic": 2,
        "sensitivity_rules": {
            "avoid_topics": ["political_affiliation", "religion", "health_conditions"],
            "escalate_if": ["self_harm", "harassment", "illegal_activity"]
        },
        "tone_requirements": {
            "must_be_neutral": true,
            "avoid_leading": true,
            "encourage_elaboration": true
        }
    }',
    true
),
(
    'open',
    'Loose guardrails that allow natural conversation flow',
    'Follow the natural flow of conversation. If the participant raises interesting topics, explore them even if not directly related to the research goal - unexpected insights are often the most valuable. Be curious and genuinely interested in their perspective. Use follow-up questions to go deeper when they share something interesting. Feel free to explore emotional and personal aspects if the participant seems comfortable.',
    '{
        "max_topic_deviation": 0.7,
        "max_question_length_chars": 350,
        "min_answer_before_followup_seconds": 4,
        "max_clarifications_per_topic": 3,
        "sensitivity_rules": {
            "avoid_topics": ["political_affiliation"],
            "escalate_if": ["self_harm", "harassment", "illegal_activity"]
        },
        "tone_requirements": {
            "must_be_neutral": false,
            "avoid_leading": true,
            "encourage_elaboration": true
        }
    }',
    false
),
(
    'empathetic',
    'Empathy-focused guardrails for sensitive topics like churn or complaints',
    'Approach this conversation with empathy and understanding. The participant may have had frustrating experiences and needs to feel heard. Start by acknowledging any difficulties they mention before asking follow-up questions. Use phrases like "I understand" and "That sounds frustrating" appropriately. Do not be defensive about the product or company. Your goal is to understand their genuine experience, not to change their mind.',
    '{
        "max_topic_deviation": 0.5,
        "max_question_length_chars": 300,
        "min_answer_before_followup_seconds": 4,
        "max_clarifications_per_topic": 2,
        "sensitivity_rules": {
            "avoid_topics": ["political_affiliation", "religion"],
            "escalate_if": ["self_harm", "harassment", "illegal_activity", "threats"]
        },
        "tone_requirements": {
            "must_be_neutral": false,
            "avoid_leading": true,
            "encourage_elaboration": true,
            "show_empathy": true
        }
    }',
    false
)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    llm_instructions = EXCLUDED.llm_instructions,
    config = EXCLUDED.config;
