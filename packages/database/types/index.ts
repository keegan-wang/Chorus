// =============================================================================
// CHORUS DATABASE TYPES
// These types mirror the database schema for TypeScript usage
// =============================================================================

// =============================================================================
// ENUMS
// =============================================================================

export type OrganizationPlan = 'free' | 'pro' | 'enterprise';

export type UserRole = 'owner' | 'admin' | 'member';

export type StudyStatus = 'draft' | 'recruiting' | 'active' | 'paused' | 'completed' | 'archived';

export type AvatarStrategy = 'demographic_match' | 'random' | 'fixed';

export type ParticipantStatus = 'active' | 'opted_out' | 'bounced' | 'spam';

export type InviteStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'started'
  | 'completed'
  | 'expired'
  | 'opted_out'
  | 'bounced';

export type PayoutStatus = 'not_eligible' | 'eligible' | 'processing' | 'paid' | 'failed';

export type SessionStatus =
  | 'initialized'
  | 'intro'
  | 'in_progress'
  | 'wrapping_up'
  | 'completed'
  | 'abandoned'
  | 'error';

export type QuestionType = 'seed' | 'follow_up' | 'clarification' | 'pivot' | 'wrap_up';

export type QualityLabel = 'good' | 'neutral' | 'bad';

export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'partial';

export type IntegrationStatus = 'active' | 'expired' | 'revoked' | 'error';

export type ReportStatus = 'generating' | 'completed' | 'failed';

export type VoiceProvider = 'elevenlabs' | 'openai';

export type VideoProvider = 'heygen' | 'd-id';

// =============================================================================
// CORE ENTITIES
// =============================================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  billing_email: string | null;
  plan: OrganizationPlan;
  settings: OrganizationSettings;
  created_at: string;
  updated_at: string;
}

export interface OrganizationSettings {
  default_incentive_cents?: number;
  default_language?: string;
  branding?: {
    primary_color?: string;
    email_footer?: string;
  };
}

export interface User {
  id: string;
  organization_id: string | null;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// STUDIES
// =============================================================================

export interface Study {
  id: string;
  organization_id: string;
  created_by: string | null;
  title: string;
  description: string | null;
  status: StudyStatus;
  research_intent: ResearchIntent;
  interview_config: InterviewConfig;
  target_demographics: TargetDemographics;
  target_participant_count: number;
  incentive_amount_cents: number;
  incentive_currency: string;
  avatar_strategy: AvatarStrategy;
  guardrail_profile: string;
  launched_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResearchIntent {
  goal: string;
  question_seeds: string[];
  study_type: StudyType;
  context?: string;
}

export type StudyType =
  | 'product_feedback'
  | 'concept_test'
  | 'churn_analysis'
  | 'ux_research'
  | 'brand_perception'
  | 'competitor_analysis'
  | 'custom';

export interface InterviewConfig {
  max_questions: number;
  max_duration_minutes: number;
  language: string;
  allow_early_exit?: boolean;
  show_progress?: boolean;
  intro_message?: string;
}

export interface TargetDemographics {
  age?: { min: number; max: number };
  gender?: string[];
  countries?: string[];
  languages?: string[];
  tags?: string[];
  exclude_tags?: string[];
}

// =============================================================================
// PARTICIPANTS
// =============================================================================

export interface Participant {
  id: string;
  organization_id: string;
  external_id: string | null;
  external_source: string | null;
  email: string;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  age: number | null;
  gender: string | null;
  country: string | null;
  city: string | null;
  language: string;
  timezone: string | null;
  tags: string[];
  metadata: Record<string, any>;
  total_invites: number;
  total_completed: number;
  last_invited_at: string | null;
  last_completed_at: string | null;
  status: ParticipantStatus;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// AVATARS
// =============================================================================

export interface Avatar {
  id: string;
  name: string;
  description: string | null;
  demographic_profile: AvatarDemographicProfile;
  voice_provider: VoiceProvider;
  voice_id: string;
  video_provider: VideoProvider;
  video_avatar_id: string;
  tone_config: AvatarToneConfig;
  is_active: boolean;
  languages: string[];
  created_at: string;
  updated_at: string;
}

export interface AvatarDemographicProfile {
  apparent_age: number;
  gender: 'male' | 'female' | 'non_binary';
  ethnicity?: string;
  style: string;
}

export interface AvatarToneConfig {
  warmth: number;
  formality: number;
  curiosity: number;
  empathy: number;
  energy?: number;
  speaking_pace?: 'slow' | 'slow_moderate' | 'moderate' | 'moderate_fast' | 'fast';
  default_expressions?: string[];
}

// =============================================================================
// ASSIGNMENTS & SESSIONS
// =============================================================================

export interface StudyParticipantAssignment {
  id: string;
  study_id: string;
  participant_id: string;
  avatar_id: string;
  invite_token: string;
  invite_status: InviteStatus;
  invite_channel: string;
  invite_sent_at: string | null;
  invite_opened_at: string | null;
  invite_clicked_at: string | null;
  invite_expires_at: string | null;
  selection_score: number | null;
  selection_reasoning: string | null;
  avatar_assignment_reasoning: string | null;
  completed_at: string | null;
  payout_status: PayoutStatus;
  payout_amount_cents: number | null;
  created_at: string;
  updated_at: string;
}

export interface InterviewSession {
  id: string;
  assignment_id: string;
  study_id: string;
  participant_id: string;
  avatar_id: string;
  status: SessionStatus;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  config_snapshot: InterviewConfig;
  total_questions: number;
  total_tokens_used: number;
  user_agent: string | null;
  device_type: string | null;
  error_message: string | null;
  error_details: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// QA TURNS & QUALITY
// =============================================================================

export interface QATurn {
  id: string;
  session_id: string;
  turn_index: number;
  question_text: string;
  question_type: QuestionType | null;
  question_topic: string | null;
  answer_transcript: string | null;
  answer_duration_seconds: number | null;
  answer_word_count: number | null;
  question_generated_at: string | null;
  question_delivered_at: string | null;
  answer_started_at: string | null;
  answer_completed_at: string | null;
  agent_model_version: string | null;
  agent_prompt_tokens: number | null;
  agent_completion_tokens: number | null;
  avatar_video_url: string | null;
  avatar_audio_url: string | null;
  created_at: string;
}

export interface QAQualityLabel {
  id: string;
  qa_turn_id: string;
  label: QualityLabel;
  scores: QualityScores;
  reasoning: string | null;
  agent_model_version: string | null;
  created_at: string;
}

export interface QualityScores {
  depth: number;
  relevance: number;
  engagement: number;
  clarity: number;
  non_leading: number;
  follow_up_quality?: number;
}

// =============================================================================
// SUMMARIES & REPORTS
// =============================================================================

export interface InterviewSummary {
  id: string;
  session_id: string;
  summary_text: string;
  key_themes: string[];
  sentiment_overview: SentimentOverview;
  quotes: Quote[];
  persona_flags: string[];
  agent_model_version: string | null;
  created_at: string;
}

export interface SentimentOverview {
  overall: 'positive' | 'negative' | 'neutral' | 'mixed';
  confidence: number;
  by_topic?: Record<string, 'positive' | 'negative' | 'neutral'>;
}

export interface Quote {
  text: string;
  theme: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  turn_index: number;
}

export interface StudyReport {
  id: string;
  study_id: string;
  version: number;
  status: ReportStatus;
  report_data: ReportData;
  report_markdown: string | null;
  report_html: string | null;
  pdf_url: string | null;
  slides_url: string | null;
  interviews_included: number | null;
  agent_model_version: string | null;
  generation_started_at: string | null;
  generation_completed_at: string | null;
  created_at: string;
}

export interface ReportData {
  executive_summary: string;
  methodology: ReportMethodology;
  sample_demographics: SampleDemographics;
  key_findings: KeyFinding[];
  theme_analysis: ThemeAnalysis[];
  persona_clusters: PersonaCluster[];
  recommendations: Recommendation[];
  charts?: ReportCharts;
}

export interface ReportMethodology {
  approach: string;
  sample_size: number;
  date_range: string;
  avg_duration_minutes: number;
  completion_rate: number;
}

export interface SampleDemographics {
  age_distribution?: Record<string, number>;
  gender_distribution?: Record<string, number>;
  location_distribution?: Record<string, number>;
}

export interface KeyFinding {
  finding: string;
  confidence: number;
  support_count: number;
  supporting_quotes: Quote[];
}

export interface ThemeAnalysis {
  theme: string;
  frequency: number;
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  description: string;
  quotes: Quote[];
}

export interface PersonaCluster {
  name: string;
  size: number;
  characteristics: string[];
  behaviors: string[];
  quotes: Quote[];
}

export interface Recommendation {
  recommendation: string;
  rationale: string;
  priority: 'high' | 'medium' | 'low';
  related_findings: string[];
}

export interface ReportCharts {
  theme_frequency?: any;
  sentiment_by_topic?: any;
  engagement_metrics?: any;
}

// =============================================================================
// GUARDRAILS
// =============================================================================

export interface GuardrailProfile {
  id: string;
  name: string;
  description: string | null;
  llm_instructions: string;
  config: GuardrailConfig;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export interface GuardrailConfig {
  max_topic_deviation: number;
  max_question_length_chars: number;
  min_answer_before_followup_seconds?: number;
  max_clarifications_per_topic?: number;
  sensitivity_rules?: {
    avoid_topics: string[];
    escalate_if: string[];
  };
  tone_requirements?: {
    must_be_neutral: boolean;
    avoid_leading: boolean;
    encourage_elaboration: boolean;
    show_empathy?: boolean;
  };
}

// =============================================================================
// SUPPORTING ENTITIES
// =============================================================================

export interface ImportJob {
  id: string;
  organization_id: string;
  source_type: string;
  source_config: Record<string, any> | null;
  status: ImportStatus;
  total_records: number | null;
  imported_count: number | null;
  skipped_count: number | null;
  error_count: number | null;
  errors: ImportError[];
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
  value?: any;
}

export interface Payout {
  id: string;
  organization_id: string;
  participant_id: string;
  assignment_id: string | null;
  study_id: string | null;
  amount_cents: number;
  currency: string;
  provider: string | null;
  provider_payout_id: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  recipient_email: string;
  error_message: string | null;
  retry_count: number;
  processed_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Integration {
  id: string;
  organization_id: string;
  provider: string;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  config: Record<string, any>;
  status: IntegrationStatus;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DataRetentionPolicy {
  organization_id: string;
  interview_retention_days: number;
  participant_retention_days: number;
  report_retention_days: number | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// VIEW TYPES
// =============================================================================

export interface StudyProgress {
  study_id: string;
  organization_id: string;
  title: string;
  status: StudyStatus;
  target_participant_count: number;
  total_assigned: number;
  invites_sent: number;
  invites_opened: number;
  invites_clicked: number;
  interviews_started: number;
  interviews_completed: number;
  interviews_in_progress: number;
  completion_percentage: number;
  created_at: string;
  launched_at: string | null;
}

export interface StudyQuestionQuality {
  study_id: string;
  organization_id: string;
  title: string;
  total_scored: number;
  good_count: number;
  neutral_count: number;
  bad_count: number;
  good_percentage: number;
  avg_depth: number;
  avg_relevance: number;
  avg_engagement: number;
  avg_clarity: number;
  avg_non_leading: number;
}

export interface AvatarPerformance {
  avatar_id: string;
  avatar_name: string;
  total_interviews: number;
  completed_interviews: number;
  completion_rate: number;
  avg_duration_seconds: number;
  avg_questions_per_interview: number;
  avg_depth_score: number;
  avg_engagement_score: number;
}
