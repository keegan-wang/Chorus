// =============================================================================
// CHORUS SHARED TYPES
// Re-export database types and add API-specific types
// =============================================================================

// Re-export all database types
export * from '@chorus/database';

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

// -----------------------------------------------------------------------------
// Auth
// -----------------------------------------------------------------------------

export interface RegisterRequest {
  email: string;
  password: string;
  organization_name: string;
  full_name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    full_name: string | null;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: string;
  };
}

// -----------------------------------------------------------------------------
// Studies
// -----------------------------------------------------------------------------

export interface CreateStudyRequest {
  title: string;
  description?: string;
  research_intent: {
    goal: string;
    question_seeds: string[];
    study_type: string;
    context?: string;
  };
  interview_config: {
    max_questions: number;
    max_duration_minutes: number;
    language: string;
    allow_early_exit?: boolean;
    show_progress?: boolean;
    intro_message?: string;
  };
  target_demographics?: {
    age?: { min: number; max: number };
    gender?: string[];
    countries?: string[];
    languages?: string[];
    tags?: string[];
    exclude_tags?: string[];
  };
  target_participant_count: number;
  incentive_amount_cents: number;
  incentive_currency?: string;
  avatar_strategy?: 'demographic_match' | 'random' | 'fixed';
  guardrail_profile?: string;
}

export interface UpdateStudyRequest extends Partial<CreateStudyRequest> { }

export interface LaunchStudyRequest {
  participant_ids?: string[];
}

export interface LaunchStudyResponse {
  study_id: string;
  assignments_created: number;
  invitations_queued: number;
}

export interface StudyListResponse {
  studies: StudyWithProgress[];
  total: number;
}

export interface StudyWithProgress {
  id: string;
  title: string;
  description: string | null;
  status: string;
  target_participant_count: number;
  total_assigned: number;
  invites_sent: number;
  interviews_completed: number;
  completion_percentage: number;
  created_at: string;
  launched_at: string | null;
}

// -----------------------------------------------------------------------------
// Participants
// -----------------------------------------------------------------------------

export interface CreateParticipantRequest {
  email: string;
  first_name?: string;
  last_name?: string;
  age?: number;
  gender?: string;
  country?: string;
  city?: string;
  language?: string;
  timezone?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateParticipantRequest extends Partial<CreateParticipantRequest> { }

export interface ImportParticipantsResponse {
  job_id: string;
}

export interface ImportJobStatusResponse {
  id: string;
  status: string;
  total_records: number | null;
  imported_count: number | null;
  skipped_count: number | null;
  error_count: number | null;
  errors: Array<{
    row: number;
    field: string;
    message: string;
    value?: any;
  }>;
}

export interface ParticipantListResponse {
  participants: ParticipantWithHistory[];
  total: number;
}

export interface ParticipantWithHistory {
  id: string;
  email: string;
  full_name: string;
  age: number | null;
  gender: string | null;
  country: string | null;
  language: string;
  tags: string[];
  total_invites: number;
  total_completed: number;
  last_invited_at: string | null;
  status: string;
  created_at: string;
}

// -----------------------------------------------------------------------------
// Interview (Participant-facing)
// -----------------------------------------------------------------------------

export interface InterviewValidationResponse {
  valid: boolean;
  expired?: boolean;
  completed?: boolean;
  study_title?: string;
  avatar?: {
    name: string;
    preview_url?: string;
  };
  estimated_duration?: string;
  incentive_amount?: string;
  consent_required: boolean;
}

export interface StartInterviewRequest {
  consent_given: boolean;
  device_info?: {
    user_agent?: string;
    device_type?: string;
  };
}

export interface StartInterviewResponse {
  session_id: string;
  first_question: QuestionData;
}

export interface QuestionData {
  text: string;
  video_url: string;
  audio_url?: string;
  turn_index: number;
}

export interface SubmitAnswerRequest {
  session_id: string;
  turn_index: number;
  audio_blob: string; // base64 encoded
}

export interface SubmitAnswerResponse {
  transcript: string;
  next_question?: QuestionData;
  is_complete: boolean;
  completion_message?: string;
  payout_info?: {
    amount: string;
    currency: string;
  };
}

// -----------------------------------------------------------------------------
// Reports
// -----------------------------------------------------------------------------

export interface ReportListResponse {
  reports: ReportSummary[];
  total: number;
}

export interface ReportSummary {
  id: string;
  study_id: string;
  study_title: string;
  version: number;
  status: string;
  interviews_included: number | null;
  created_at: string;
}

export interface GenerateReportResponse {
  job_id: string;
}

// -----------------------------------------------------------------------------
// Integrations
// -----------------------------------------------------------------------------

export interface IntegrationListResponse {
  integrations: IntegrationSummary[];
}

export interface IntegrationSummary {
  provider: string;
  status: string;
  config: Record<string, any>;
  last_sync_at: string | null;
  created_at: string;
}

export interface ShopifyConnectRequest {
  shop_domain: string;
}

export interface ShopifyConnectResponse {
  oauth_url: string;
}

export interface SyncIntegrationResponse {
  job_id: string;
}

// -----------------------------------------------------------------------------
// Avatars
// -----------------------------------------------------------------------------

export interface AvatarListResponse {
  avatars: AvatarSummary[];
}

export interface AvatarSummary {
  id: string;
  name: string;
  description: string | null;
  demographic_profile: {
    apparent_age: number;
    gender: string;
    style: string;
  };
  languages: string[];
  is_active: boolean;
}

// =============================================================================
// AGENT API TYPES
// =============================================================================

// -----------------------------------------------------------------------------
// Question Agent
// -----------------------------------------------------------------------------

export interface GenerateQuestionRequest {
  session_id: string;
  research_intent: {
    goal: string;
    question_seeds: string[];
    study_type: string;
    context?: string;
  };
  participant_profile: {
    age?: number;
    gender?: string;
    country?: string;
    language: string;
    tags: string[];
    metadata: Record<string, any>;
  };
  avatar_profile: {
    name: string;
    tone_config: Record<string, any>;
  };
  guardrail_config: {
    llm_instructions: string;
    max_topic_deviation: number;
    max_question_length_chars: number;
  };
  conversation_history: Array<{
    turn_index: number;
    question_text: string;
    answer_transcript: string;
  }>;
  good_patterns?: string[];
  bad_patterns?: string[];
}

export interface GenerateQuestionResponse {
  question_text: string;
  question_type: 'seed' | 'follow_up' | 'clarification' | 'pivot' | 'wrap_up';
  topic: string;
  action: 'continue' | 'end';
  reasoning: string;
  tokens_used: {
    prompt: number;
    completion: number;
  };
}

// -----------------------------------------------------------------------------
// Quality Agent
// -----------------------------------------------------------------------------

export interface ScoreQualityRequest {
  question_text: string;
  answer_transcript: string;
  research_goal: string;
  turn_index: number;
  question_type?: string;
}

export interface ScoreQualityResponse {
  label: 'good' | 'neutral' | 'bad';
  scores: {
    depth: number;
    relevance: number;
    engagement: number;
    clarity: number;
    non_leading: number;
  };
  reasoning: string;
  tokens_used: {
    prompt: number;
    completion: number;
  };
}

// -----------------------------------------------------------------------------
// Avatar Agent
// -----------------------------------------------------------------------------

export interface RenderAvatarRequest {
  question_text: string;
  avatar_id: string;
  voice_id: string;
  video_avatar_id: string;
  tone?: 'warm' | 'neutral' | 'curious' | 'empathetic';
  language?: string;
}

export interface RenderAvatarResponse {
  video_url: string;
  audio_url: string;
  duration_seconds: number;
  job_id?: string;
}

export interface AvatarRenderStatusResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  audio_url?: string;
  error?: string;
}

// -----------------------------------------------------------------------------
// Selection Agent
// -----------------------------------------------------------------------------

export interface SelectParticipantsRequest {
  study_id: string;
  research_intent: {
    goal: string;
    study_type: string;
    context?: string;
  };
  target_demographics: {
    age?: { min: number; max: number };
    gender?: string[];
    countries?: string[];
    tags?: string[];
  };
  target_count: number;
  candidates: Array<{
    id: string;
    age?: number;
    gender?: string;
    country?: string;
    language: string;
    tags: string[];
    total_invites: number;
    total_completed: number;
    last_invited_at: string | null;
  }>;
  avatars: Array<{
    id: string;
    name: string;
    demographic_profile: Record<string, any>;
    tone_config: Record<string, any>;
  }>;
  avatar_strategy: string;
}

export interface SelectParticipantsResponse {
  selections: Array<{
    participant_id: string;
    score: number;
    reasoning: string;
    assigned_avatar_id: string;
    avatar_reasoning: string;
  }>;
  tokens_used: {
    prompt: number;
    completion: number;
  };
}

// -----------------------------------------------------------------------------
// Summary Agent
// -----------------------------------------------------------------------------

export interface GenerateSummaryRequest {
  session_id: string;
  research_intent: {
    goal: string;
    study_type: string;
  };
  participant_profile: {
    age?: number;
    gender?: string;
    country?: string;
    tags: string[];
  };
  qa_turns: Array<{
    turn_index: number;
    question_text: string;
    question_type: string;
    answer_transcript: string;
    answer_word_count: number;
  }>;
  quality_labels: Array<{
    turn_index: number;
    label: string;
    scores: Record<string, number>;
  }>;
}

export interface GenerateSummaryResponse {
  summary_text: string;
  key_themes: string[];
  sentiment_overview: {
    overall: 'positive' | 'negative' | 'neutral' | 'mixed';
    confidence: number;
    by_topic?: Record<string, string>;
  };
  quotes: Array<{
    text: string;
    theme: string;
    sentiment: string;
    turn_index: number;
  }>;
  persona_flags: string[];
  tokens_used: {
    prompt: number;
    completion: number;
  };
}

// -----------------------------------------------------------------------------
// Overview Agent (Report Generation)
// -----------------------------------------------------------------------------

export interface GenerateReportRequest {
  study_id: string;
  study_title: string;
  research_intent: {
    goal: string;
    study_type: string;
    context?: string;
  };
  interview_summaries: Array<{
    session_id: string;
    participant_profile: Record<string, any>;
    summary_text: string;
    key_themes: string[];
    sentiment_overview: Record<string, any>;
    quotes: Array<Record<string, any>>;
    persona_flags: string[];
  }>;
  demographics_summary: {
    total_interviews: number;
    age_distribution: Record<string, number>;
    gender_distribution: Record<string, number>;
    location_distribution: Record<string, number>;
  };
}

export interface GenerateReportResponse {
  report_data: {
    executive_summary: string;
    methodology: Record<string, any>;
    sample_demographics: Record<string, any>;
    key_findings: Array<Record<string, any>>;
    theme_analysis: Array<Record<string, any>>;
    persona_clusters: Array<Record<string, any>>;
    recommendations: Array<Record<string, any>>;
  };
  report_markdown: string;
  tokens_used: {
    prompt: number;
    completion: number;
  };
}

// -----------------------------------------------------------------------------
// Transcription
// -----------------------------------------------------------------------------

export interface TranscribeResponse {
  transcript: string;
  confidence: number;
  duration_seconds: number;
  language?: string;
}

// =============================================================================
// WEBSOCKET EVENTS
// =============================================================================

export interface WSQuestionReadyEvent {
  video_url: string;
  audio_url?: string;
  text: string;
  turn_index: number;
}

export interface WSTranscriptionCompleteEvent {
  transcript: string;
  turn_index: number;
}

export interface WSInterviewCompleteEvent {
  message: string;
  payout_info?: {
    amount: string;
    currency: string;
  };
}

export interface WSErrorEvent {
  code: string;
  message: string;
}

export interface WSProgressUpdateEvent {
  invites_sent: number;
  clicked: number;
  in_progress: number;
  completed: number;
}

export interface WSInterviewStartedEvent {
  session_id: string;
  participant_name: string;
}

export interface WSInterviewCompletedEvent {
  session_id: string;
  participant_name: string;
  summary_preview?: string;
}

export interface WSReportReadyEvent {
  report_id: string;
}
