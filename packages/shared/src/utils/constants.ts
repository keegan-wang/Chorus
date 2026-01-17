// =============================================================================
// SHARED CONSTANTS
// =============================================================================

// -----------------------------------------------------------------------------
// Study Types
// -----------------------------------------------------------------------------

export const STUDY_TYPES = [
  { value: 'product_feedback', label: 'Product Feedback', description: 'Get feedback on existing products or features' },
  { value: 'concept_test', label: 'Concept Test', description: 'Validate new ideas or concepts' },
  { value: 'churn_analysis', label: 'Churn Analysis', description: 'Understand why customers leave' },
  { value: 'ux_research', label: 'UX Research', description: 'Evaluate user experience and usability' },
  { value: 'brand_perception', label: 'Brand Perception', description: 'Understand how your brand is perceived' },
  { value: 'competitor_analysis', label: 'Competitor Analysis', description: 'Learn about competitor perceptions' },
  { value: 'custom', label: 'Custom', description: 'Define your own research goals' },
] as const;

// -----------------------------------------------------------------------------
// Guardrail Profiles
// -----------------------------------------------------------------------------

export const GUARDRAIL_PROFILES = [
  { value: 'strict', label: 'Strict', description: 'Tight guardrails, minimal topic deviation' },
  { value: 'balanced', label: 'Balanced', description: 'Standard guardrails, moderate exploration' },
  { value: 'open', label: 'Open', description: 'Loose guardrails, follow conversation flow' },
  { value: 'empathetic', label: 'Empathetic', description: 'Extra empathy for sensitive topics' },
] as const;

// -----------------------------------------------------------------------------
// Avatar Strategies
// -----------------------------------------------------------------------------

export const AVATAR_STRATEGIES = [
  { value: 'demographic_match', label: 'Demographic Match', description: 'Match avatar to participant demographics' },
  { value: 'random', label: 'Random', description: 'Randomly assign avatars' },
  { value: 'fixed', label: 'Fixed', description: 'Use a single avatar for all participants' },
] as const;

// -----------------------------------------------------------------------------
// Interview Configuration Defaults
// -----------------------------------------------------------------------------

export const DEFAULT_INTERVIEW_CONFIG = {
  max_questions: 10,
  max_duration_minutes: 10,
  language: 'en',
  allow_early_exit: true,
  show_progress: true,
} as const;

export const INTERVIEW_CONFIG_LIMITS = {
  max_questions: { min: 3, max: 30 },
  max_duration_minutes: { min: 3, max: 30 },
} as const;

// -----------------------------------------------------------------------------
// Incentive Presets
// -----------------------------------------------------------------------------

export const INCENTIVE_PRESETS = [
  { cents: 500, label: '$5' },
  { cents: 1000, label: '$10' },
  { cents: 1500, label: '$15' },
  { cents: 2000, label: '$20' },
  { cents: 2500, label: '$25' },
  { cents: 5000, label: '$50' },
] as const;

// -----------------------------------------------------------------------------
// Supported Languages
// -----------------------------------------------------------------------------

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
] as const;

// -----------------------------------------------------------------------------
// Countries (ISO 3166-1 alpha-2)
// -----------------------------------------------------------------------------

export const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'IN', name: 'India' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'CN', name: 'China' },
  { code: 'SG', name: 'Singapore' },
] as const;

// -----------------------------------------------------------------------------
// Status Colors
// -----------------------------------------------------------------------------

export const STUDY_STATUS_COLORS = {
  draft: 'gray',
  recruiting: 'blue',
  active: 'green',
  paused: 'yellow',
  completed: 'purple',
  archived: 'gray',
} as const;

export const INVITE_STATUS_COLORS = {
  pending: 'gray',
  sent: 'blue',
  delivered: 'blue',
  opened: 'yellow',
  clicked: 'yellow',
  started: 'orange',
  completed: 'green',
  expired: 'red',
  opted_out: 'red',
  bounced: 'red',
} as const;

export const QUALITY_LABEL_COLORS = {
  good: 'green',
  neutral: 'yellow',
  bad: 'red',
} as const;

// -----------------------------------------------------------------------------
// API Endpoints
// -----------------------------------------------------------------------------

export const API_ENDPOINTS = {
  // Auth
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',

  // Studies
  STUDIES: '/studies',
  STUDY: (id: string) => `/studies/${id}`,
  STUDY_LAUNCH: (id: string) => `/studies/${id}/launch`,
  STUDY_PAUSE: (id: string) => `/studies/${id}/pause`,
  STUDY_RESUME: (id: string) => `/studies/${id}/resume`,
  STUDY_COMPLETE: (id: string) => `/studies/${id}/complete`,
  STUDY_ASSIGNMENTS: (id: string) => `/studies/${id}/assignments`,
  STUDY_SESSIONS: (id: string) => `/studies/${id}/sessions`,
  STUDY_REPORT: (id: string) => `/studies/${id}/report`,

  // Participants
  PARTICIPANTS: '/participants',
  PARTICIPANT: (id: string) => `/participants/${id}`,
  PARTICIPANTS_IMPORT: '/participants/import',
  PARTICIPANTS_IMPORT_SHOPIFY: '/participants/import/shopify',
  IMPORT_JOB: (id: string) => `/participants/import/${id}`,

  // Interview
  INTERVIEW_VALIDATE: (token: string) => `/interview/${token}`,
  INTERVIEW_START: (token: string) => `/interview/${token}/start`,
  INTERVIEW_ANSWER: (token: string) => `/interview/${token}/answer`,
  INTERVIEW_END: (token: string) => `/interview/${token}/end`,
  INTERVIEW_STATUS: (token: string) => `/interview/${token}/status`,

  // Reports
  REPORTS: '/reports',
  REPORT: (id: string) => `/reports/${id}`,
  REPORT_EXPORT_PDF: (id: string) => `/reports/${id}/export/pdf`,
  REPORT_EXPORT_SLIDES: (id: string) => `/reports/${id}/export/slides`,
  REPORT_EXPORT_DATA: (id: string) => `/reports/${id}/export/data`,

  // Integrations
  INTEGRATIONS: '/integrations',
  INTEGRATION_SHOPIFY_CONNECT: '/integrations/shopify/connect',
  INTEGRATION_SHOPIFY_CALLBACK: '/integrations/shopify/callback',
  INTEGRATION_DISCONNECT: (provider: string) => `/integrations/${provider}`,
  INTEGRATION_SYNC: (provider: string) => `/integrations/${provider}/sync`,

  // Avatars
  AVATARS: '/avatars',
} as const;

// -----------------------------------------------------------------------------
// WebSocket Events
// -----------------------------------------------------------------------------

export const WS_EVENTS = {
  // Interview namespace
  INTERVIEW: {
    QUESTION_READY: 'question:ready',
    TRANSCRIPTION_COMPLETE: 'transcription:complete',
    INTERVIEW_COMPLETE: 'interview:complete',
    ERROR: 'error',
    AUDIO_CHUNK: 'audio:chunk',
    AUDIO_COMPLETE: 'audio:complete',
  },

  // Study dashboard namespace
  STUDY: {
    PROGRESS_UPDATE: 'progress:update',
    INTERVIEW_STARTED: 'interview:started',
    INTERVIEW_COMPLETED: 'interview:completed',
    REPORT_READY: 'report:ready',
  },
} as const;

// -----------------------------------------------------------------------------
// Error Codes
// -----------------------------------------------------------------------------

export const ERROR_CODES = {
  // Auth errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',

  // Study errors
  STUDY_NOT_FOUND: 'STUDY_NOT_FOUND',
  STUDY_NOT_EDITABLE: 'STUDY_NOT_EDITABLE',
  STUDY_ALREADY_LAUNCHED: 'STUDY_ALREADY_LAUNCHED',
  INSUFFICIENT_PARTICIPANTS: 'INSUFFICIENT_PARTICIPANTS',

  // Interview errors
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INTERVIEW_ALREADY_COMPLETED: 'INTERVIEW_ALREADY_COMPLETED',
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  TURN_MISMATCH: 'TURN_MISMATCH',

  // Agent errors
  AGENT_TIMEOUT: 'AGENT_TIMEOUT',
  VIDEO_GENERATION_FAILED: 'VIDEO_GENERATION_FAILED',
  TRANSCRIPTION_FAILED: 'TRANSCRIPTION_FAILED',

  // General errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
} as const;
