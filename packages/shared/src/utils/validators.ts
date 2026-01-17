// =============================================================================
// VALIDATION SCHEMAS (using Zod)
// =============================================================================

import { z } from 'zod';

// -----------------------------------------------------------------------------
// Common Schemas
// -----------------------------------------------------------------------------

export const emailSchema = z.string().email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const slugSchema = z
  .string()
  .min(3, 'Slug must be at least 3 characters')
  .max(50, 'Slug must be at most 50 characters')
  .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens');

// -----------------------------------------------------------------------------
// Auth Schemas
// -----------------------------------------------------------------------------

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  organization_name: z.string().min(2, 'Organization name must be at least 2 characters'),
  full_name: z.string().min(2).optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// -----------------------------------------------------------------------------
// Study Schemas
// -----------------------------------------------------------------------------

export const studyTypeSchema = z.enum([
  'product_feedback',
  'concept_test',
  'churn_analysis',
  'ux_research',
  'brand_perception',
  'competitor_analysis',
  'custom',
]);

export const researchIntentSchema = z.object({
  goal: z
    .string()
    .min(20, 'Research goal must be at least 20 characters')
    .max(1000, 'Research goal must be at most 1000 characters'),
  question_seeds: z
    .array(z.string().max(500))
    .min(1, 'At least one question seed is required')
    .max(10, 'At most 10 question seeds allowed'),
  study_type: studyTypeSchema,
  context: z.string().max(2000).optional(),
});

export const interviewConfigSchema = z.object({
  max_questions: z.number().min(3).max(30).default(10),
  max_duration_minutes: z.number().min(3).max(30).default(10),
  language: z.string().default('en'),
  allow_early_exit: z.boolean().default(true),
  show_progress: z.boolean().default(true),
  intro_message: z.string().max(500).optional(),
});

export const targetDemographicsSchema = z.object({
  age: z
    .object({
      min: z.number().min(13).max(100),
      max: z.number().min(13).max(100),
    })
    .optional()
    .refine((data) => !data || data.min <= data.max, {
      message: 'Min age must be less than or equal to max age',
    }),
  gender: z.array(z.string()).optional(),
  countries: z.array(z.string().length(2)).optional(),
  languages: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  exclude_tags: z.array(z.string()).optional(),
});

export const createStudySchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be at most 200 characters'),
  description: z.string().max(2000).optional(),
  research_intent: researchIntentSchema,
  interview_config: interviewConfigSchema,
  target_demographics: targetDemographicsSchema.optional(),
  target_participant_count: z.number().min(1).max(1000).default(20),
  incentive_amount_cents: z.number().min(0).max(100000).default(1000),
  incentive_currency: z.string().length(3).default('USD'),
  avatar_strategy: z.enum(['demographic_match', 'random', 'fixed']).default('demographic_match'),
  guardrail_profile: z.string().default('balanced'),
});

export const updateStudySchema = createStudySchema.partial();

export const launchStudySchema = z.object({
  participant_ids: z.array(z.string().uuid()).optional(),
});

// -----------------------------------------------------------------------------
// Participant Schemas
// -----------------------------------------------------------------------------

export const createParticipantSchema = z.object({
  email: emailSchema,
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  age: z.number().min(13).max(120).optional(),
  gender: z.string().max(50).optional(),
  country: z.string().max(2).optional(),
  city: z.string().max(100).optional(),
  language: z.string().max(10).default('en'),
  timezone: z.string().max(50).optional(),
  tags: z.array(z.string().max(50)).max(50).optional(),
  metadata: z.record(z.any()).optional(),
});

export const updateParticipantSchema = createParticipantSchema.partial().omit({ email: true });

// -----------------------------------------------------------------------------
// Interview Schemas
// -----------------------------------------------------------------------------

export const startInterviewSchema = z.object({
  consent_given: z.boolean().refine((val) => val === true, {
    message: 'Consent must be given to start the interview',
  }),
  device_info: z
    .object({
      user_agent: z.string().optional(),
      device_type: z.string().optional(),
    })
    .optional(),
});

export const submitAnswerSchema = z.object({
  session_id: z.string().uuid(),
  turn_index: z.number().min(0),
  audio_blob: z.string().min(1, 'Audio data is required'),
});

// -----------------------------------------------------------------------------
// CSV Import Validation
// -----------------------------------------------------------------------------

export const csvRowSchema = z.object({
  email: emailSchema,
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  age: z
    .string()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().min(13).max(120).optional())
    .optional(),
  gender: z.string().optional(),
  country: z.string().max(2).optional(),
  language: z.string().max(10).optional(),
  tags: z
    .string()
    .transform((val) => (val ? val.split(',').map((t) => t.trim()) : []))
    .optional(),
  metadata: z
    .string()
    .transform((val) => {
      if (!val) return {};
      try {
        return JSON.parse(val);
      } catch {
        return {};
      }
    })
    .optional(),
});

// -----------------------------------------------------------------------------
// Type exports for Zod schemas
// -----------------------------------------------------------------------------

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateStudyInput = z.infer<typeof createStudySchema>;
export type UpdateStudyInput = z.infer<typeof updateStudySchema>;
export type LaunchStudyInput = z.infer<typeof launchStudySchema>;
export type CreateParticipantInput = z.infer<typeof createParticipantSchema>;
export type UpdateParticipantInput = z.infer<typeof updateParticipantSchema>;
export type StartInterviewInput = z.infer<typeof startInterviewSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
export type CSVRowInput = z.infer<typeof csvRowSchema>;
