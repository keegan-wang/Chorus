# Chorus: AI-Powered Dynamic Customer Research Platform

## Complete Product Requirements Document v1.0

---

# Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Naming](#2-product-vision--naming)
3. [Users & Personas](#3-users--personas)
4. [User Journeys](#4-user-journeys)
5. [System Architecture](#5-system-architecture)
6. [Database Schema](#6-database-schema)
7. [API Specification](#7-api-specification)
8. [Agent Specifications](#8-agent-specifications)
9. [Interview Flow & State Machine](#9-interview-flow--state-machine)
10. [Avatar System](#10-avatar-system)
11. [Quality & Learning Loop](#11-quality--learning-loop)
12. [Data Integrations](#12-data-integrations)
13. [Report Generation](#13-report-generation)
14. [Security & Privacy](#14-security--privacy)
15. [Analytics & Metrics](#15-analytics--metrics)
16. [Technical Implementation](#16-technical-implementation)
17. [Roadmap](#17-roadmap)

---

# 1. Executive Summary

## 1.1 What is Chorus?

Chorus is an AI-powered customer research platform that conducts fully automated, avatar-led video interviews. The system intelligently selects participants, matches them with demographically-appropriate AI avatars, conducts adaptive interviews with real-time follow-up questions, scores question quality for continuous improvement, and synthesizes results into research-grade reports.

## 1.2 Core Value Proposition

**"Qualitative depth at quantitative scale."**

- Interviews feel human through video avatars
- Questions adapt dynamically based on responses
- No scheduling, no human researchers needed
- Complete reports delivered automatically
- Avatar selection increases comfort and disclosure
- 10x cheaper than traditional market research

## 1.3 Key Differentiators vs. Competitors (e.g., Listen Labs)

| Feature | Chorus | Listen Labs |
|---------|--------|-------------|
| Avatar demographic matching | ✅ Topic & age-aware | ❌ Generic |
| Real-time question quality scoring | ✅ Per Q&A | ❌ None |
| Learning loop for question improvement | ✅ Cross-study | ❌ None |
| Full video avatars | ✅ HeyGen/D-ID | ❌ Text/audio only |
| Configurable guardrails | ✅ Per study | ❌ Fixed |
| Multi-source data import | ✅ CSV/JSON/Shopify+ | Limited |

## 1.4 Technical Decisions (Locked)

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Frontend | Next.js + React | SSR, great DX, Vercel deploy |
| Main Backend | Node.js (NestJS) | Real-time, TypeScript, orchestration |
| Agent Services | Python (FastAPI) | LLM ecosystem, async, ML-friendly |
| Database | Supabase (Postgres) | Auth included, real-time, edge functions |
| LLM Provider | OpenAI GPT-4 | Tool use, reliability, established |
| Avatar | HeyGen/D-ID | Full video generation |
| TTS | ElevenLabs | Natural voices, low latency |
| STT | OpenAI Whisper | Accuracy, cost-effective |
| Storage | Supabase Storage | Integrated, S3-compatible |
| Auth | Supabase Auth | Built-in, OAuth support |

---

# 2. Product Vision & Naming

## 2.1 Name Options

### Primary Recommendation: **Chorus**
- Evokes: Multiple voices coming together, harmony, collective insight
- Domain availability: chorus.ai, usechorus.com, getchorus.ai
- Trademark: Check required

### Alternative Names by Category:

**Insight/Depth Theme:**
| Name | Evokes | Domain Ideas |
|------|--------|--------------|
| Depthframe | Deep insights, framework | depthframe.ai |
| Understory | Hidden layers, discovery | understory.ai |
| Signalwell | Clear signals, source | signalwell.io |
| Verity | Truth, verification | verityloop.ai |
| EchoField | Responses echoing back | echofield.ai |

**Conversation/Avatar Theme:**
| Name | Evokes | Domain Ideas |
|------|--------|--------------|
| PersonaLoop | Personas, feedback loop | personaloop.ai |
| Facet | Multiple angles, facets | facetresearch.ai |
| MirrorMind | Reflection, understanding | mirrormind.ai |
| HaloTalk | Approachable, conversational | halotalk.ai |

**Research/Science Theme:**
| Name | Evokes | Domain Ideas |
|------|--------|--------------|
| Quorum | Group consensus, research | quoruminsight.ai |
| Thesis | Academic rigor, findings | thesisai.com |
| Lattice | Connected insights | latticeresearch.ai |

## 2.2 Brand Positioning

**Tagline Options:**
- "Qualitative depth at quantitative scale"
- "Research conversations that learn"
- "Your customers, finally heard"
- "AI interviews that actually listen"

---

# 3. Users & Personas

## 3.1 Primary User: Company ("Researcher")

### Persona: Product Manager Paula
- **Role:** Senior PM at a B2C SaaS company
- **Goal:** Understand why users aren't converting on the new pricing page
- **Pain Points:**
  - Can't get enough user interviews scheduled
  - Hiring research firms costs $50k+ per study
  - Survey data is shallow, doesn't explain "why"
  - Internal team has bias in how they ask questions
- **Success Metric:** Actionable insights within 1 week, not 6

### Persona: Founder Frank
- **Role:** First-time founder building a consumer app
- **Goal:** Validate product concept before building
- **Pain Points:**
  - No budget for research agencies
  - Friends/family feedback is biased
  - Doesn't know how to conduct proper interviews
- **Success Metric:** 20+ unbiased customer conversations in a week

### Persona: UX Researcher Rita
- **Role:** Lead researcher at an enterprise company
- **Goal:** Run ongoing research programs at scale
- **Pain Points:**
  - Recruiting is the bottleneck
  - Can only do 8-10 interviews per study manually
  - Report writing takes weeks
- **Success Metric:** 50+ interviews per study with instant synthesis

## 3.2 Secondary User: Customer ("Participant")

### Persona: Participant Pat
- **Demographics:** Varies widely by study
- **Goal:** Share opinions, earn incentive
- **Pain Points:**
  - Surveys are boring and feel ignored
  - Scheduling calls is annoying
  - Doesn't trust where data goes
- **Success Metric:** Quick, pleasant experience + fair compensation

---

# 4. User Journeys

## 4.1 Company Journey: Create & Run a Study

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        COMPANY USER JOURNEY                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. SIGN UP / LOGIN                                                          │
│     └── Supabase Auth (email/password or OAuth)                             │
│         └── Create organization profile                                      │
│                                                                              │
│  2. CREATE STUDY                                                             │
│     ├── Enter research question/goal                                         │
│     ├── Select study type (product feedback, concept test, churn, etc.)     │
│     ├── Configure interview settings                                         │
│     │   ├── Max questions (6-20)                                            │
│     │   ├── Max duration (5-20 min)                                         │
│     │   ├── Language                                                         │
│     │   └── Guardrail profile (strict/balanced/open)                        │
│     ├── Set target demographics                                              │
│     │   ├── Age range                                                        │
│     │   ├── Gender                                                           │
│     │   ├── Location                                                         │
│     │   └── Custom tags                                                      │
│     ├── Set participant count target                                         │
│     └── Set incentive amount                                                 │
│                                                                              │
│  3. IMPORT PARTICIPANTS                                                      │
│     ├── Upload CSV/JSON                                                      │
│     ├── Connect Shopify                                                      │
│     └── (Future: Salesforce, HubSpot, Stripe)                               │
│                                                                              │
│  4. REVIEW & LAUNCH                                                          │
│     ├── Preview participant selection                                        │
│     ├── Review avatar assignments                                            │
│     ├── Approve estimated cost                                               │
│     └── Launch study → Emails sent                                          │
│                                                                              │
│  5. MONITOR PROGRESS                                                         │
│     ├── Real-time dashboard                                                  │
│     │   ├── Invites sent / opened / clicked                                 │
│     │   ├── Interviews in progress / completed                              │
│     │   └── Early theme detection                                           │
│     └── Individual interview summaries (as they complete)                   │
│                                                                              │
│  6. RECEIVE REPORT                                                           │
│     ├── Notification when threshold reached                                  │
│     ├── View full research report                                            │
│     │   ├── Executive summary                                               │
│     │   ├── Key findings with quotes                                        │
│     │   ├── Demographic breakdowns                                          │
│     │   ├── Persona clusters                                                │
│     │   └── Recommendations                                                  │
│     └── Export (PDF, slides, raw data)                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 4.2 Participant Journey: Complete an Interview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PARTICIPANT USER JOURNEY                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. RECEIVE INVITATION                                                       │
│     └── Email with:                                                          │
│         ├── Company name & logo                                              │
│         ├── Topic preview                                                    │
│         ├── Time estimate (e.g., "5-8 minutes")                             │
│         ├── Incentive amount                                                 │
│         └── Unique secure link                                               │
│                                                                              │
│  2. CLICK LINK → LANDING PAGE                                               │
│     ├── Welcome screen with avatar preview                                   │
│     ├── Consent form (data usage, recording policy)                         │
│     ├── Mic/camera permission request                                        │
│     └── "Start Interview" button                                            │
│                                                                              │
│  3. INTERVIEW BEGINS                                                         │
│     ├── Avatar introduces self & topic                                       │
│     ├── First question asked (video + audio)                                │
│     └── Participant speaks response                                          │
│                                                                              │
│  4. INTERVIEW LOOP (repeats 6-15x)                                          │
│     ├── Avatar asks follow-up or new question                               │
│     ├── Participant responds verbally                                        │
│     ├── Visual feedback (avatar nods/listens)                               │
│     └── Progress indicator visible                                           │
│                                                                              │
│  5. INTERVIEW ENDS                                                           │
│     ├── Avatar thanks participant                                            │
│     ├── Summary of topics covered                                            │
│     ├── Incentive confirmation                                               │
│     └── Option to provide meta-feedback                                      │
│                                                                              │
│  6. RECEIVE INCENTIVE                                                        │
│     └── Payout via configured method (gift card, PayPal, etc.)              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 4.3 System Journey: Interview Orchestration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     SYSTEM ORCHESTRATION FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CLICK EVENT                                                                 │
│      │                                                                       │
│      ▼                                                                       │
│  ┌─────────────────────────────────────────────┐                            │
│  │  VALIDATE TOKEN                              │                            │
│  │  • Check invite_token exists                 │                            │
│  │  • Check not expired                         │                            │
│  │  • Check not already completed               │                            │
│  └─────────────────────────────────────────────┘                            │
│      │                                                                       │
│      ▼                                                                       │
│  ┌─────────────────────────────────────────────┐                            │
│  │  CREATE INTERVIEW SESSION                    │                            │
│  │  • Generate session_id                       │                            │
│  │  • Snapshot study config                     │                            │
│  │  • Initialize turn_index = 0                 │                            │
│  └─────────────────────────────────────────────┘                            │
│      │                                                                       │
│      ▼                                                                       │
│  ┌─────────────────────────────────────────────┐                            │
│  │  INSTANTIATE QUESTION AGENT                  │                            │
│  │  Context includes:                           │                            │
│  │  • Research intent (goal, seeds)             │                            │
│  │  • Participant profile                       │                            │
│  │  • Avatar profile                            │                            │
│  │  • Guardrail config                          │                            │
│  │  • Good/bad Q patterns from prior studies    │                            │
│  └─────────────────────────────────────────────┘                            │
│      │                                                                       │
│      ▼                                                                       │
│  ╔═════════════════════════════════════════════╗                            │
│  ║         INTERVIEW LOOP                       ║                            │
│  ╠═════════════════════════════════════════════╣                            │
│  ║                                              ║                            │
│  ║  ┌───────────────────────────────────────┐  ║                            │
│  ║  │  1. QUESTION AGENT                     │  ║                            │
│  ║  │     • Generate question                │  ║                            │
│  ║  │     • Or signal END                    │  ║                            │
│  ║  └───────────────────────────────────────┘  ║                            │
│  ║      │                                       ║                            │
│  ║      ▼                                       ║                            │
│  ║  ┌───────────────────────────────────────┐  ║                            │
│  ║  │  2. AVATAR AGENT                       │  ║                            │
│  ║  │     • Convert to avatar speech         │  ║                            │
│  ║  │     • Generate video via HeyGen/D-ID   │  ║                            │
│  ║  │     • Return video URL                 │  ║                            │
│  ║  └───────────────────────────────────────┘  ║                            │
│  ║      │                                       ║                            │
│  ║      ▼                                       ║                            │
│  ║  ┌───────────────────────────────────────┐  ║                            │
│  ║  │  3. PLAY VIDEO + CAPTURE RESPONSE      │  ║                            │
│  ║  │     • Stream video to participant      │  ║                            │
│  ║  │     • Record audio response            │  ║                            │
│  ║  │     • Send to Whisper STT              │  ║                            │
│  ║  └───────────────────────────────────────┘  ║                            │
│  ║      │                                       ║                            │
│  ║      ▼                                       ║                            │
│  ║  ┌───────────────────────────────────────┐  ║                            │
│  ║  │  4. PERSIST QA TURN                    │  ║                            │
│  ║  │     • Save question_text               │  ║                            │
│  ║  │     • Save answer_transcript           │  ║                            │
│  ║  │     • Save metadata                    │  ║                            │
│  ║  └───────────────────────────────────────┘  ║                            │
│  ║      │                                       ║                            │
│  ║      ├──────────────┬───────────────────┐   ║                            │
│  ║      ▼              ▼                   │   ║                            │
│  ║  ┌─────────┐  ┌─────────────────────┐   │   ║                            │
│  ║  │ 5A.     │  │ 5B. QUALITY AGENT   │   │   ║                            │
│  ║  │ NEXT Q  │  │ • Score Q&A         │   │   ║                            │
│  ║  │ AGENT   │  │ • Label good/bad    │   │   ║                            │
│  ║  │ CALL    │  │ • Save to DB        │   │   ║                            │
│  ║  └─────────┘  └─────────────────────┘   │   ║                            │
│  ║      │              │                   │   ║                            │
│  ║      ▼              ▼                   │   ║                            │
│  ║  ┌───────────────────────────────────────┐  ║                            │
│  ║  │  6. CHECK STOP CONDITIONS              │  ║                            │
│  ║  │     • max_questions reached?          │  ║                            │
│  ║  │     • max_duration reached?           │  ║                            │
│  ║  │     • Agent signaled END?             │  ║                            │
│  ║  └───────────────────────────────────────┘  ║                            │
│  ║      │                                       ║                            │
│  ║      ├── NO ──► Loop back to Step 1         ║                            │
│  ║      │                                       ║                            │
│  ║      ▼ YES                                   ║                            │
│  ╚═════════════════════════════════════════════╝                            │
│      │                                                                       │
│      ▼                                                                       │
│  ┌─────────────────────────────────────────────┐                            │
│  │  INTERVIEW SUMMARY AGENT                     │                            │
│  │  • Process all Q&A turns                     │                            │
│  │  • Extract themes, quotes                    │                            │
│  │  • Generate structured summary               │                            │
│  └─────────────────────────────────────────────┘                            │
│      │                                                                       │
│      ▼                                                                       │
│  ┌─────────────────────────────────────────────┐                            │
│  │  TRIGGER PAYOUT                              │                            │
│  │  • Mark eligible                             │                            │
│  │  • Queue payout job                          │                            │
│  └─────────────────────────────────────────────┘                            │
│      │                                                                       │
│      ▼                                                                       │
│  ┌─────────────────────────────────────────────┐                            │
│  │  CHECK STUDY THRESHOLD                       │                            │
│  │  • Enough interviews completed?              │                            │
│  │  • If yes → Trigger Study Overview Agent    │                            │
│  └─────────────────────────────────────────────┘                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 5. System Architecture

## 5.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────────┐              ┌──────────────────┐                    │
│   │  Company Portal  │              │ Participant App  │                    │
│   │  (Next.js)       │              │ (Next.js)        │                    │
│   │                  │              │                  │                    │
│   │  • Dashboard     │              │  • Interview UI  │                    │
│   │  • Study Setup   │              │  • Video Player  │                    │
│   │  • Reports       │              │  • Mic Capture   │                    │
│   └────────┬─────────┘              └────────┬─────────┘                    │
│            │                                  │                              │
└────────────┼──────────────────────────────────┼──────────────────────────────┘
             │                                  │
             ▼                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     Node.js API (NestJS)                             │   │
│   │                                                                      │   │
│   │   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │   │
│   │   │   Auth      │ │   Studies   │ │ Participants│ │  Interviews │  │   │
│   │   │   Module    │ │   Module    │ │   Module    │ │   Module    │  │   │
│   │   └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │   │
│   │                                                                      │   │
│   │   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │   │
│   │   │   Reports   │ │  Webhooks   │ │   Payouts   │ │  Websocket  │  │   │
│   │   │   Module    │ │   Module    │ │   Module    │ │   Gateway   │  │   │
│   │   └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AGENT SERVICES (Python)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     FastAPI Agent Service                            │   │
│   │                                                                      │   │
│   │   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐          │   │
│   │   │   Question    │  │   Quality     │  │   Summary     │          │   │
│   │   │   Agent       │  │   Agent       │  │   Agent       │          │   │
│   │   │               │  │               │  │               │          │   │
│   │   │  /question    │  │  /quality     │  │  /summary     │          │   │
│   │   │  /generate    │  │  /score       │  │  /interview   │          │   │
│   │   └───────────────┘  └───────────────┘  └───────────────┘          │   │
│   │                                                                      │   │
│   │   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐          │   │
│   │   │   Selection   │  │   Overview    │  │   Avatar      │          │   │
│   │   │   Agent       │  │   Agent       │  │   Agent       │          │   │
│   │   │               │  │               │  │               │          │   │
│   │   │  /select      │  │  /report      │  │  /render      │          │   │
│   │   │  /participants│  │  /generate    │  │  /video       │          │   │
│   │   └───────────────┘  └───────────────┘  └───────────────┘          │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│   │   OpenAI    │  │   HeyGen    │  │ ElevenLabs  │  │   Whisper   │       │
│   │   GPT-4     │  │   /D-ID     │  │   TTS       │  │   STT       │       │
│   │             │  │             │  │             │  │             │       │
│   │  LLM calls  │  │ Video gen   │  │  Voice gen  │  │ Transcribe  │       │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                                              │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                        │
│   │  SendGrid   │  │  Shopify    │  │ Tremendous  │                        │
│   │             │  │   API       │  │  (Payouts)  │                        │
│   │   Email     │  │  Import     │  │             │                        │
│   └─────────────┘  └─────────────┘  └─────────────┘                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         SUPABASE                                     │   │
│   │                                                                      │   │
│   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │   │
│   │   │  PostgreSQL │  │   Auth      │  │  Storage    │                │   │
│   │   │             │  │             │  │             │                │   │
│   │   │  All tables │  │  Users/Orgs │  │  Media      │                │   │
│   │   │  + pgvector │  │  Sessions   │  │  Exports    │                │   │
│   │   └─────────────┘  └─────────────┘  └─────────────┘                │   │
│   │                                                                      │   │
│   │   ┌─────────────┐  ┌─────────────┐                                 │   │
│   │   │  Realtime   │  │   Edge      │                                 │   │
│   │   │             │  │  Functions  │                                 │   │
│   │   │  Websocket  │  │             │                                 │   │
│   │   │  updates    │  │  Webhooks   │                                 │   │
│   │   └─────────────┘  └─────────────┘                                 │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                          REDIS                                       │   │
│   │                                                                      │   │
│   │   • Session state (interview context)                               │   │
│   │   • Job queues (BullMQ)                                             │   │
│   │   • Rate limiting                                                    │   │
│   │   • Caching                                                          │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 5.2 Service Communication

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     SERVICE COMMUNICATION PATTERNS                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  SYNCHRONOUS (HTTP/REST)                                                     │
│  ────────────────────────                                                    │
│  • Frontend ←→ Node API                                                      │
│  • Node API ←→ Python Agents                                                │
│  • Python Agents ←→ OpenAI                                                  │
│  • Python Agents ←→ HeyGen/D-ID                                             │
│                                                                              │
│  ASYNCHRONOUS (Queue/Events)                                                 │
│  ───────────────────────────                                                 │
│  • Email sending (BullMQ)                                                    │
│  • Payout processing (BullMQ)                                               │
│  • Report generation (BullMQ)                                               │
│  • Quality scoring (parallel to main flow)                                  │
│                                                                              │
│  REAL-TIME (WebSocket)                                                       │
│  ─────────────────────                                                       │
│  • Interview progress updates                                                │
│  • Study dashboard live stats                                               │
│  • Audio streaming (participant → server)                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 5.3 Monorepo Structure

```
chorus/
├── apps/
│   ├── web/                      # Next.js frontend
│   │   ├── app/
│   │   │   ├── (auth)/           # Auth pages
│   │   │   ├── (dashboard)/      # Company dashboard
│   │   │   ├── (interview)/      # Participant interview UI
│   │   │   └── api/              # Next.js API routes (minimal)
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── styles/
│   │
│   ├── api/                      # NestJS backend
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   ├── studies/
│   │   │   ├── participants/
│   │   │   ├── interviews/
│   │   │   ├── reports/
│   │   │   ├── payouts/
│   │   │   ├── integrations/
│   │   │   │   └── shopify/
│   │   │   └── common/
│   │   └── test/
│   │
│   └── agents/                   # Python FastAPI agents
│       ├── app/
│       │   ├── agents/
│       │   │   ├── question_agent.py
│       │   │   ├── quality_agent.py
│       │   │   ├── summary_agent.py
│       │   │   ├── selection_agent.py
│       │   │   ├── overview_agent.py
│       │   │   └── avatar_agent.py
│       │   ├── services/
│       │   │   ├── openai_service.py
│       │   │   ├── heygen_service.py
│       │   │   ├── elevenlabs_service.py
│       │   │   └── whisper_service.py
│       │   ├── models/
│       │   └── main.py
│       └── tests/
│
├── packages/
│   ├── database/                 # Supabase migrations & types
│   │   ├── migrations/
│   │   ├── seed/
│   │   └── types/
│   │
│   ├── shared/                   # Shared TypeScript types
│   │   ├── types/
│   │   └── utils/
│   │
│   └── ui/                       # Shared UI components
│       └── components/
│
├── docs/
│   ├── PRD.md                    # This document
│   ├── API.md
│   └── DEPLOYMENT.md
│
├── docker-compose.yml
├── turbo.json
├── package.json
└── README.md
```

---

# 6. Database Schema

## 6.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ENTITY RELATIONSHIP DIAGRAM                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐        │
│  │organizations │────────<│    users     │         │   avatars    │        │
│  └──────────────┘         └──────────────┘         └──────────────┘        │
│         │                        │                        │                 │
│         │                        │                        │                 │
│         ▼                        │                        │                 │
│  ┌──────────────┐               │                        │                 │
│  │   studies    │────────────────┘                        │                 │
│  └──────────────┘                                         │                 │
│         │                                                 │                 │
│         │                                                 │                 │
│         ├─────────────────────────────────────────────────┤                 │
│         │                                                 │                 │
│         ▼                                                 │                 │
│  ┌──────────────┐         ┌──────────────┐               │                 │
│  │ participants │────────<│  assignments │>──────────────┘                 │
│  └──────────────┘         └──────────────┘                                 │
│         │                        │                                          │
│         │                        │                                          │
│         │                        ▼                                          │
│         │                 ┌──────────────┐                                  │
│         │                 │   sessions   │                                  │
│         │                 └──────────────┘                                  │
│         │                        │                                          │
│         │                        ▼                                          │
│         │                 ┌──────────────┐         ┌──────────────┐        │
│         │                 │   qa_turns   │────────>│quality_labels│        │
│         │                 └──────────────┘         └──────────────┘        │
│         │                        │                                          │
│         │                        ▼                                          │
│         │                 ┌──────────────┐                                  │
│         │                 │  summaries   │                                  │
│         │                 └──────────────┘                                  │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐        │
│  │   payouts    │         │study_reports │         │ import_jobs  │        │
│  └──────────────┘         └──────────────┘         └──────────────┘        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 6.2 Complete Table Definitions

### Organizations & Users

```sql
-- ============================================================================
-- ORGANIZATIONS
-- ============================================================================
CREATE TABLE organizations (
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

-- Settings JSONB structure:
-- {
--   "default_incentive_cents": 1000,
--   "default_language": "en",
--   "branding": {
--     "primary_color": "#4F46E5",
--     "email_footer": "..."
--   }
-- }

-- ============================================================================
-- USERS (extends Supabase auth.users)
-- ============================================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email           TEXT NOT NULL,
    full_name       TEXT,
    role            TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    avatar_url      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_organization ON users(organization_id);
```

### Studies

```sql
-- ============================================================================
-- STUDIES (Core research study definition)
-- ============================================================================
CREATE TABLE studies (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by          UUID REFERENCES users(id),

    -- Basic info
    title               TEXT NOT NULL,
    description         TEXT,
    status              TEXT DEFAULT 'draft' CHECK (status IN (
                            'draft', 'recruiting', 'active', 'paused', 'completed', 'archived'
                        )),

    -- Research intent (the core research question/goal)
    research_intent     JSONB NOT NULL,

    -- Interview configuration
    interview_config    JSONB NOT NULL,

    -- Target demographics
    target_demographics JSONB DEFAULT '{}',

    -- Participant settings
    target_participant_count INTEGER DEFAULT 20,

    -- Incentive settings
    incentive_amount_cents  INTEGER DEFAULT 1000,
    incentive_currency      TEXT DEFAULT 'USD',

    -- Avatar strategy
    avatar_strategy     TEXT DEFAULT 'demographic_match',

    -- Guardrail profile reference
    guardrail_profile   TEXT DEFAULT 'balanced',

    -- Timestamps
    launched_at         TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Research Intent JSONB structure:
-- {
--   "goal": "Understand why Gen Z users abandon checkout",
--   "question_seeds": [
--     "What goes through your mind when you see our checkout page?",
--     "What would make you more likely to complete a purchase?"
--   ],
--   "study_type": "product_feedback",  -- product_feedback, concept_test, churn, ux, brand
--   "context": "We recently redesigned our checkout flow and conversion dropped 15%"
-- }

-- Interview Config JSONB structure:
-- {
--   "max_questions": 10,
--   "max_duration_minutes": 8,
--   "language": "en",
--   "allow_early_exit": true,
--   "show_progress": true,
--   "intro_message": "Thanks for taking the time to chat with us today!"
-- }

-- Target Demographics JSONB structure:
-- {
--   "age": { "min": 18, "max": 35 },
--   "gender": ["male", "female", "non_binary"],
--   "countries": ["US", "CA", "UK"],
--   "languages": ["en"],
--   "tags": ["active_last_30d", "has_purchased"],
--   "exclude_tags": ["churned", "spam"]
-- }

CREATE INDEX idx_studies_organization ON studies(organization_id);
CREATE INDEX idx_studies_status ON studies(status);
CREATE INDEX idx_studies_created_at ON studies(created_at DESC);
```

### Participants

```sql
-- ============================================================================
-- PARTICIPANTS (Customer/respondent profiles)
-- ============================================================================
CREATE TABLE participants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- External reference (from Shopify, etc.)
    external_id     TEXT,
    external_source TEXT,  -- 'shopify', 'salesforce', 'csv', 'json', 'manual'

    -- Contact info
    email           TEXT NOT NULL,
    phone           TEXT,

    -- Profile
    first_name      TEXT,
    last_name       TEXT,
    full_name       TEXT GENERATED ALWAYS AS (
                        COALESCE(first_name || ' ' || last_name, first_name, last_name, email)
                    ) STORED,

    -- Demographics
    age             INTEGER,
    gender          TEXT,
    country         TEXT,
    city            TEXT,
    language        TEXT DEFAULT 'en',
    timezone        TEXT,

    -- Tagging
    tags            TEXT[] DEFAULT '{}',

    -- Flexible metadata
    metadata        JSONB DEFAULT '{}',

    -- Engagement tracking
    total_invites   INTEGER DEFAULT 0,
    total_completed INTEGER DEFAULT 0,
    last_invited_at TIMESTAMPTZ,
    last_completed_at TIMESTAMPTZ,

    -- Status
    status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'opted_out', 'bounced', 'spam')),

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(organization_id, email)
);

-- Metadata JSONB structure (flexible, source-dependent):
-- {
--   "shopify": {
--     "customer_id": "123456",
--     "total_spent": 459.99,
--     "orders_count": 5,
--     "first_order_date": "2024-01-15"
--   },
--   "custom": {
--     "subscription_tier": "premium",
--     "favorite_category": "electronics"
--   }
-- }

CREATE INDEX idx_participants_organization ON participants(organization_id);
CREATE INDEX idx_participants_email ON participants(email);
CREATE INDEX idx_participants_tags ON participants USING GIN(tags);
CREATE INDEX idx_participants_status ON participants(status);
```

### Avatars

```sql
-- ============================================================================
-- AVATARS (AI interviewer personas)
-- ============================================================================
CREATE TABLE avatars (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    name            TEXT NOT NULL,  -- "Emma", "Jordan", "Alex"
    description     TEXT,           -- "Friendly, curious, mid-20s female"

    -- Demographics (for matching)
    demographic_profile JSONB NOT NULL,

    -- Voice settings
    voice_provider  TEXT DEFAULT 'elevenlabs',  -- 'elevenlabs', 'openai'
    voice_id        TEXT NOT NULL,              -- Provider-specific voice ID

    -- Video settings
    video_provider  TEXT DEFAULT 'heygen',      -- 'heygen', 'd-id'
    video_avatar_id TEXT NOT NULL,              -- Provider-specific avatar ID

    -- Personality/tone configuration
    tone_config     JSONB DEFAULT '{}',

    -- Status
    is_active       BOOLEAN DEFAULT true,

    -- Supported languages
    languages       TEXT[] DEFAULT '{en}',

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Demographic Profile JSONB:
-- {
--   "apparent_age": 24,
--   "gender": "female",
--   "ethnicity": "caucasian",
--   "style": "professional_casual"
-- }

-- Tone Config JSONB:
-- {
--   "warmth": 0.8,
--   "formality": 0.4,
--   "curiosity": 0.9,
--   "empathy": 0.85,
--   "speaking_pace": "moderate",
--   "default_expressions": ["interested", "thoughtful", "encouraging"]
-- }

-- Seed initial avatars
INSERT INTO avatars (name, description, demographic_profile, voice_id, video_avatar_id, tone_config) VALUES
('Emma', 'Warm, curious interviewer in her mid-20s',
 '{"apparent_age": 25, "gender": "female", "style": "friendly_professional"}',
 'EXAVITQu4vr4xnSDxMaL', 'avatar_emma_001',
 '{"warmth": 0.85, "formality": 0.3, "curiosity": 0.9}'),

('Jordan', 'Thoughtful, professional interviewer in his early 30s',
 '{"apparent_age": 32, "gender": "male", "style": "business_casual"}',
 'VR6AewLTigWG4xSOukaG', 'avatar_jordan_001',
 '{"warmth": 0.7, "formality": 0.6, "curiosity": 0.8}'),

('Alex', 'Energetic, relatable interviewer in their early 20s',
 '{"apparent_age": 22, "gender": "non_binary", "style": "casual"}',
 'pNInz6obpgDQGcFmaJgB', 'avatar_alex_001',
 '{"warmth": 0.9, "formality": 0.2, "curiosity": 0.95}');
```

### Study Assignments

```sql
-- ============================================================================
-- STUDY_PARTICIPANT_ASSIGNMENTS (Links participants to studies with avatar)
-- ============================================================================
CREATE TABLE study_participant_assignments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_id        UUID NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
    participant_id  UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    avatar_id       UUID NOT NULL REFERENCES avatars(id),

    -- Invitation
    invite_token    TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    invite_status   TEXT DEFAULT 'pending' CHECK (invite_status IN (
                        'pending', 'sent', 'delivered', 'opened', 'clicked',
                        'started', 'completed', 'expired', 'opted_out', 'bounced'
                    )),
    invite_channel  TEXT DEFAULT 'email',
    invite_sent_at  TIMESTAMPTZ,
    invite_opened_at TIMESTAMPTZ,
    invite_clicked_at TIMESTAMPTZ,
    invite_expires_at TIMESTAMPTZ,

    -- Selection metadata
    selection_score FLOAT,  -- How well they matched the study criteria
    selection_reasoning TEXT,  -- Why this participant was selected

    -- Avatar assignment reasoning
    avatar_assignment_reasoning TEXT,

    -- Completion
    completed_at    TIMESTAMPTZ,

    -- Payout
    payout_status   TEXT DEFAULT 'not_eligible' CHECK (payout_status IN (
                        'not_eligible', 'eligible', 'processing', 'paid', 'failed'
                    )),
    payout_amount_cents INTEGER,

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(study_id, participant_id)
);

CREATE INDEX idx_assignments_study ON study_participant_assignments(study_id);
CREATE INDEX idx_assignments_participant ON study_participant_assignments(participant_id);
CREATE INDEX idx_assignments_invite_token ON study_participant_assignments(invite_token);
CREATE INDEX idx_assignments_status ON study_participant_assignments(invite_status);
```

### Interview Sessions & Turns

```sql
-- ============================================================================
-- INTERVIEW_SESSIONS (Individual interview instances)
-- ============================================================================
CREATE TABLE interview_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id   UUID NOT NULL REFERENCES study_participant_assignments(id) ON DELETE CASCADE,
    study_id        UUID NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
    participant_id  UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    avatar_id       UUID NOT NULL REFERENCES avatars(id),

    -- Session state
    status          TEXT DEFAULT 'initialized' CHECK (status IN (
                        'initialized', 'intro', 'in_progress', 'wrapping_up',
                        'completed', 'abandoned', 'error'
                    )),

    -- Timing
    started_at      TIMESTAMPTZ,
    ended_at        TIMESTAMPTZ,
    duration_seconds INTEGER,

    -- Snapshot of config at interview time
    config_snapshot JSONB NOT NULL,

    -- Interview metadata
    total_questions INTEGER DEFAULT 0,
    total_tokens_used INTEGER DEFAULT 0,

    -- User agent / device info
    user_agent      TEXT,
    device_type     TEXT,  -- 'desktop', 'mobile', 'tablet'

    -- Error tracking
    error_message   TEXT,
    error_details   JSONB,

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_study ON interview_sessions(study_id);
CREATE INDEX idx_sessions_participant ON interview_sessions(participant_id);
CREATE INDEX idx_sessions_status ON interview_sessions(status);
CREATE INDEX idx_sessions_started ON interview_sessions(started_at DESC);

-- ============================================================================
-- QA_TURNS (Individual question-answer pairs)
-- ============================================================================
CREATE TABLE qa_turns (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,

    -- Turn sequence
    turn_index          INTEGER NOT NULL,

    -- Question
    question_text       TEXT NOT NULL,
    question_type       TEXT,  -- 'seed', 'follow_up', 'clarification', 'pivot', 'wrap_up'
    question_topic      TEXT,  -- Extracted topic/theme

    -- Answer
    answer_transcript   TEXT,
    answer_duration_seconds FLOAT,
    answer_word_count   INTEGER,

    -- Timing
    question_generated_at   TIMESTAMPTZ,
    question_delivered_at   TIMESTAMPTZ,
    answer_started_at       TIMESTAMPTZ,
    answer_completed_at     TIMESTAMPTZ,

    -- Agent metadata
    agent_model_version TEXT,
    agent_prompt_tokens INTEGER,
    agent_completion_tokens INTEGER,

    -- Avatar media (URLs to generated content)
    avatar_video_url    TEXT,
    avatar_audio_url    TEXT,

    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_turns_session ON qa_turns(session_id);
CREATE INDEX idx_turns_session_index ON qa_turns(session_id, turn_index);

-- ============================================================================
-- QA_QUALITY_LABELS (Quality scoring for each Q&A pair)
-- ============================================================================
CREATE TABLE qa_quality_labels (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qa_turn_id      UUID NOT NULL REFERENCES qa_turns(id) ON DELETE CASCADE,

    -- Overall label
    label           TEXT NOT NULL CHECK (label IN ('good', 'neutral', 'bad')),

    -- Detailed scores (0.0 to 1.0)
    scores          JSONB NOT NULL,

    -- Reasoning from the quality agent
    reasoning       TEXT,

    -- Agent metadata
    agent_model_version TEXT,

    created_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(qa_turn_id)
);

-- Scores JSONB structure:
-- {
--   "depth": 0.85,           -- Did the answer go beyond surface level?
--   "relevance": 0.92,       -- How relevant to research goal?
--   "engagement": 0.78,      -- Was the participant engaged?
--   "clarity": 0.88,         -- Was the question clear?
--   "non_leading": 0.95,     -- Did the question avoid leading?
--   "follow_up_quality": 0.82  -- Was this a good follow-up to previous?
-- }

CREATE INDEX idx_quality_qa_turn ON qa_quality_labels(qa_turn_id);
CREATE INDEX idx_quality_label ON qa_quality_labels(label);
```

### Summaries & Reports

```sql
-- ============================================================================
-- INTERVIEW_SUMMARIES (Per-interview synthesis)
-- ============================================================================
CREATE TABLE interview_summaries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,

    -- Natural language summary
    summary_text    TEXT NOT NULL,

    -- Structured data
    key_themes      TEXT[] DEFAULT '{}',

    -- Sentiment
    sentiment_overview JSONB,

    -- Notable quotes
    quotes          JSONB DEFAULT '[]',

    -- Persona/behavioral flags
    persona_flags   TEXT[] DEFAULT '{}',

    -- Agent metadata
    agent_model_version TEXT,

    created_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(session_id)
);

-- Sentiment Overview JSONB:
-- {
--   "overall": "mixed",      -- positive, negative, neutral, mixed
--   "confidence": 0.78,
--   "by_topic": {
--     "pricing": "negative",
--     "product_quality": "positive",
--     "support": "neutral"
--   }
-- }

-- Quotes JSONB:
-- [
--   {
--     "text": "I just don't see the value at that price point",
--     "theme": "pricing",
--     "sentiment": "negative",
--     "turn_index": 3
--   }
-- ]

CREATE INDEX idx_summaries_session ON interview_summaries(session_id);

-- ============================================================================
-- STUDY_REPORTS (Full study synthesis)
-- ============================================================================
CREATE TABLE study_reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_id        UUID NOT NULL REFERENCES studies(id) ON DELETE CASCADE,

    -- Report version (allow re-generation)
    version         INTEGER DEFAULT 1,

    -- Status
    status          TEXT DEFAULT 'generating' CHECK (status IN (
                        'generating', 'completed', 'failed'
                    )),

    -- Structured report data
    report_data     JSONB NOT NULL,

    -- Rendered formats
    report_markdown TEXT,
    report_html     TEXT,

    -- File exports
    pdf_url         TEXT,
    slides_url      TEXT,

    -- Metadata
    interviews_included INTEGER,
    agent_model_version TEXT,
    generation_started_at TIMESTAMPTZ,
    generation_completed_at TIMESTAMPTZ,

    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Report Data JSONB structure (comprehensive):
-- {
--   "executive_summary": "...",
--   "methodology": {
--     "approach": "AI-moderated video interviews",
--     "sample_size": 47,
--     "date_range": "2026-01-10 to 2026-01-17",
--     "avg_duration_minutes": 7.2,
--     "completion_rate": 0.89
--   },
--   "sample_demographics": {
--     "age_distribution": {...},
--     "gender_distribution": {...},
--     "location_distribution": {...}
--   },
--   "key_findings": [
--     {
--       "finding": "Price is the #1 barrier to conversion",
--       "confidence": 0.92,
--       "support_count": 34,
--       "supporting_quotes": [...]
--     }
--   ],
--   "theme_analysis": [
--     {
--       "theme": "Price Sensitivity",
--       "frequency": 0.72,
--       "sentiment": "negative",
--       "description": "...",
--       "quotes": [...]
--     }
--   ],
--   "persona_clusters": [
--     {
--       "name": "The Budget-Conscious Browser",
--       "size": 15,
--       "characteristics": [...],
--       "behaviors": [...],
--       "quotes": [...]
--     }
--   ],
--   "recommendations": [
--     {
--       "recommendation": "Consider introducing a lower-tier pricing option",
--       "rationale": "...",
--       "priority": "high",
--       "related_findings": [...]
--     }
--   ],
--   "charts": {
--     "theme_frequency": {...},
--     "sentiment_by_topic": {...},
--     "engagement_metrics": {...}
--   }
-- }

CREATE INDEX idx_reports_study ON study_reports(study_id);
CREATE UNIQUE INDEX idx_reports_study_version ON study_reports(study_id, version);
```

### Supporting Tables

```sql
-- ============================================================================
-- GUARDRAIL_PROFILES (Interview behavior rules)
-- ============================================================================
CREATE TABLE guardrail_profiles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT UNIQUE NOT NULL,
    description     TEXT,

    -- LLM instructions (injected into system prompt)
    llm_instructions TEXT NOT NULL,

    -- Behavioral parameters
    config          JSONB NOT NULL,

    is_default      BOOLEAN DEFAULT false,
    is_active       BOOLEAN DEFAULT true,

    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Config JSONB:
-- {
--   "max_topic_deviation": 0.4,
--   "max_question_length_chars": 280,
--   "min_answer_before_followup_seconds": 3,
--   "max_clarifications_per_topic": 2,
--   "sensitivity_rules": {
--     "avoid_topics": ["political_affiliation", "religion", "health_conditions"],
--     "escalate_if": ["self_harm", "harassment", "illegal_activity"]
--   },
--   "tone_requirements": {
--     "must_be_neutral": true,
--     "avoid_leading": true,
--     "encourage_elaboration": true
--   }
-- }

INSERT INTO guardrail_profiles (name, description, llm_instructions, config, is_default) VALUES
('strict', 'Tight guardrails, minimal deviation',
 'You must stay strictly on topic. Only ask questions directly related to the research goal. Do not explore tangents. Keep questions short and focused.',
 '{"max_topic_deviation": 0.2, "max_question_length_chars": 200}',
 false),

('balanced', 'Standard guardrails, some exploration allowed',
 'Stay focused on the research goal but you may briefly explore relevant tangents if they could yield useful insights. Always return to the main topic.',
 '{"max_topic_deviation": 0.4, "max_question_length_chars": 280}',
 true),

('open', 'Loose guardrails, follow the conversation',
 'Follow the natural flow of conversation. If the participant raises interesting topics, explore them even if not directly related to the research goal.',
 '{"max_topic_deviation": 0.7, "max_question_length_chars": 350}',
 false);

-- ============================================================================
-- IMPORT_JOBS (Track data imports)
-- ============================================================================
CREATE TABLE import_jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Source
    source_type     TEXT NOT NULL,  -- 'csv', 'json', 'shopify', 'salesforce', etc.
    source_config   JSONB,          -- Connection details, file info, etc.

    -- Status
    status          TEXT DEFAULT 'pending' CHECK (status IN (
                        'pending', 'processing', 'completed', 'failed', 'partial'
                    )),

    -- Results
    total_records   INTEGER,
    imported_count  INTEGER,
    skipped_count   INTEGER,
    error_count     INTEGER,

    -- Error details
    errors          JSONB DEFAULT '[]',

    -- Timing
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,

    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_imports_organization ON import_jobs(organization_id);
CREATE INDEX idx_imports_status ON import_jobs(status);

-- ============================================================================
-- PAYOUTS (Incentive payments)
-- ============================================================================
CREATE TABLE payouts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    participant_id  UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    assignment_id   UUID REFERENCES study_participant_assignments(id),
    study_id        UUID REFERENCES studies(id),

    -- Amount
    amount_cents    INTEGER NOT NULL,
    currency        TEXT DEFAULT 'USD',

    -- Provider
    provider        TEXT,  -- 'tremendous', 'paypal', 'manual'
    provider_payout_id TEXT,

    -- Status
    status          TEXT DEFAULT 'pending' CHECK (status IN (
                        'pending', 'processing', 'completed', 'failed', 'cancelled'
                    )),

    -- Recipient info (for the payout)
    recipient_email TEXT NOT NULL,

    -- Error handling
    error_message   TEXT,
    retry_count     INTEGER DEFAULT 0,

    -- Timing
    processed_at    TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payouts_organization ON payouts(organization_id);
CREATE INDEX idx_payouts_participant ON payouts(participant_id);
CREATE INDEX idx_payouts_status ON payouts(status);

-- ============================================================================
-- INTEGRATIONS (OAuth connections)
-- ============================================================================
CREATE TABLE integrations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    provider        TEXT NOT NULL,  -- 'shopify', 'salesforce', 'hubspot', 'stripe'

    -- OAuth tokens (encrypted in practice)
    access_token    TEXT,
    refresh_token   TEXT,
    token_expires_at TIMESTAMPTZ,

    -- Provider-specific config
    config          JSONB DEFAULT '{}',  -- e.g., { "shop_domain": "mystore.myshopify.com" }

    -- Status
    status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'error')),
    last_sync_at    TIMESTAMPTZ,

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(organization_id, provider)
);

CREATE INDEX idx_integrations_organization ON integrations(organization_id);
```

### Views & Materialized Views

```sql
-- ============================================================================
-- USEFUL VIEWS
-- ============================================================================

-- Study progress dashboard view
CREATE VIEW study_progress AS
SELECT
    s.id AS study_id,
    s.title,
    s.status,
    s.target_participant_count,
    COUNT(DISTINCT spa.id) AS total_assigned,
    COUNT(DISTINCT CASE WHEN spa.invite_status = 'sent' THEN spa.id END) AS invites_sent,
    COUNT(DISTINCT CASE WHEN spa.invite_status = 'clicked' THEN spa.id END) AS invites_clicked,
    COUNT(DISTINCT CASE WHEN spa.invite_status = 'completed' THEN spa.id END) AS completed,
    COUNT(DISTINCT iss.id) FILTER (WHERE iss.status = 'in_progress') AS in_progress,
    ROUND(
        COUNT(DISTINCT CASE WHEN spa.invite_status = 'completed' THEN spa.id END)::NUMERIC /
        NULLIF(s.target_participant_count, 0) * 100, 1
    ) AS completion_percentage
FROM studies s
LEFT JOIN study_participant_assignments spa ON s.id = spa.study_id
LEFT JOIN interview_sessions iss ON spa.id = iss.assignment_id
GROUP BY s.id;

-- Question quality aggregation per study
CREATE VIEW study_question_quality AS
SELECT
    s.id AS study_id,
    s.title,
    COUNT(qql.id) AS total_scored,
    COUNT(CASE WHEN qql.label = 'good' THEN 1 END) AS good_count,
    COUNT(CASE WHEN qql.label = 'neutral' THEN 1 END) AS neutral_count,
    COUNT(CASE WHEN qql.label = 'bad' THEN 1 END) AS bad_count,
    AVG((qql.scores->>'depth')::FLOAT) AS avg_depth,
    AVG((qql.scores->>'relevance')::FLOAT) AS avg_relevance,
    AVG((qql.scores->>'engagement')::FLOAT) AS avg_engagement
FROM studies s
JOIN interview_sessions iss ON s.id = iss.study_id
JOIN qa_turns qt ON iss.id = qt.session_id
JOIN qa_quality_labels qql ON qt.id = qql.qa_turn_id
GROUP BY s.id;

-- Good question patterns (for learning loop)
CREATE MATERIALIZED VIEW good_question_patterns AS
SELECT
    s.id AS study_id,
    qt.question_text,
    qt.question_type,
    qql.scores,
    AVG(qt.answer_word_count) AS avg_answer_length,
    COUNT(*) AS occurrence_count
FROM studies s
JOIN interview_sessions iss ON s.id = iss.study_id
JOIN qa_turns qt ON iss.id = qt.session_id
JOIN qa_quality_labels qql ON qt.id = qql.qa_turn_id
WHERE qql.label = 'good'
GROUP BY s.id, qt.question_text, qt.question_type, qql.scores
ORDER BY (qql.scores->>'depth')::FLOAT DESC;

-- Refresh periodically
-- REFRESH MATERIALIZED VIEW good_question_patterns;
```

## 6.3 Row Level Security (RLS) Policies

```sql
-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_participant_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_turns ENABLE ROW LEVEL SECURITY;

-- Helper function: Get user's organization
CREATE OR REPLACE FUNCTION auth.user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- Organizations: Users can only see their own org
CREATE POLICY "Users can view own organization"
ON organizations FOR SELECT
USING (id = auth.user_organization_id());

-- Studies: Users can only see studies in their org
CREATE POLICY "Users can view org studies"
ON studies FOR SELECT
USING (organization_id = auth.user_organization_id());

CREATE POLICY "Users can create org studies"
ON studies FOR INSERT
WITH CHECK (organization_id = auth.user_organization_id());

CREATE POLICY "Users can update org studies"
ON studies FOR UPDATE
USING (organization_id = auth.user_organization_id());

-- Participants: Users can only see participants in their org
CREATE POLICY "Users can view org participants"
ON participants FOR SELECT
USING (organization_id = auth.user_organization_id());

-- Continue for all tables...
```

---

# 7. API Specification

## 7.1 API Overview

The system exposes two API layers:

1. **Node.js API (NestJS)** - Main API for frontend, handles auth, business logic, orchestration
2. **Python Agent API (FastAPI)** - Internal API for LLM agent operations

## 7.2 Node.js API Endpoints

### Authentication

```yaml
# All endpoints require Supabase JWT unless noted

POST /auth/register
  Description: Register new organization and admin user
  Body:
    email: string
    password: string
    organization_name: string
  Response: { user, organization, session }

POST /auth/login
  Description: Login user
  Body:
    email: string
    password: string
  Response: { user, session }

POST /auth/logout
  Description: Logout user
  Response: { success: true }

GET /auth/me
  Description: Get current user and organization
  Response: { user, organization }
```

### Studies

```yaml
GET /studies
  Description: List all studies for organization
  Query:
    status?: draft|recruiting|active|paused|completed|archived
    limit?: number (default 20)
    offset?: number
  Response: { studies: Study[], total: number }

POST /studies
  Description: Create new study
  Body:
    title: string
    description?: string
    research_intent: {
      goal: string
      question_seeds: string[]
      study_type: string
      context?: string
    }
    interview_config: {
      max_questions: number
      max_duration_minutes: number
      language: string
    }
    target_demographics?: object
    target_participant_count: number
    incentive_amount_cents: number
    avatar_strategy?: string
    guardrail_profile?: string
  Response: { study: Study }

GET /studies/:id
  Description: Get study details
  Response: { study: Study, progress: StudyProgress }

PATCH /studies/:id
  Description: Update study (only if draft)
  Body: Partial<StudyCreateBody>
  Response: { study: Study }

POST /studies/:id/launch
  Description: Launch study (send invitations)
  Body:
    participant_ids?: string[]  # Optional subset
  Response: {
    study: Study,
    assignments_created: number,
    invitations_queued: number
  }

POST /studies/:id/pause
  Description: Pause active study
  Response: { study: Study }

POST /studies/:id/resume
  Description: Resume paused study
  Response: { study: Study }

POST /studies/:id/complete
  Description: Mark study complete and trigger report
  Response: { study: Study, report_job_id: string }

GET /studies/:id/assignments
  Description: List participant assignments for study
  Query:
    status?: string
    limit?: number
    offset?: number
  Response: { assignments: Assignment[], total: number }

GET /studies/:id/sessions
  Description: List interview sessions for study
  Query:
    status?: string
    limit?: number
    offset?: number
  Response: { sessions: Session[], total: number }

GET /studies/:id/report
  Description: Get study report
  Query:
    version?: number
  Response: { report: StudyReport }

POST /studies/:id/report/regenerate
  Description: Regenerate study report
  Response: { job_id: string }
```

### Participants

```yaml
GET /participants
  Description: List all participants for organization
  Query:
    search?: string
    tags?: string[]
    status?: string
    limit?: number
    offset?: number
  Response: { participants: Participant[], total: number }

POST /participants
  Description: Create single participant
  Body:
    email: string
    first_name?: string
    last_name?: string
    age?: number
    gender?: string
    country?: string
    language?: string
    tags?: string[]
    metadata?: object
  Response: { participant: Participant }

POST /participants/import
  Description: Import participants from file
  Body: FormData with file
  Query:
    source: csv|json
  Response: { job_id: string }

POST /participants/import/shopify
  Description: Sync participants from Shopify
  Body:
    filters?: {
      created_after?: string
      has_orders?: boolean
      tags?: string[]
    }
  Response: { job_id: string }

GET /participants/import/:jobId
  Description: Get import job status
  Response: { job: ImportJob }

GET /participants/:id
  Description: Get participant details
  Response: { participant: Participant }

PATCH /participants/:id
  Description: Update participant
  Body: Partial<ParticipantCreateBody>
  Response: { participant: Participant }

DELETE /participants/:id
  Description: Delete participant (GDPR)
  Response: { success: true }

GET /participants/:id/history
  Description: Get participant interview history
  Response: { sessions: Session[] }
```

### Interviews (Participant-facing)

```yaml
# These endpoints are PUBLIC (no auth) but require valid invite token

GET /interview/:token
  Description: Validate invite and get interview setup info
  Response: {
    valid: boolean,
    study_title: string,
    avatar: { name, preview_url },
    estimated_duration: string,
    incentive_amount: string,
    consent_required: boolean
  }

POST /interview/:token/start
  Description: Start interview session
  Body:
    consent_given: boolean
    device_info?: object
  Response: {
    session_id: string,
    first_question: {
      text: string,
      video_url: string,
      audio_url: string
    }
  }

POST /interview/:token/answer
  Description: Submit answer and get next question
  Body:
    session_id: string
    turn_index: number
    audio_blob: binary  # or base64
  Response: {
    transcript: string,
    next_question?: {
      text: string,
      video_url: string,
      audio_url: string,
      turn_index: number
    },
    is_complete: boolean,
    completion_message?: string
  }

POST /interview/:token/end
  Description: End interview early
  Body:
    session_id: string
    reason?: string
  Response: { success: true }

GET /interview/:token/status
  Description: Get current interview status (for reconnection)
  Response: {
    session_id?: string,
    status: string,
    current_turn?: number
  }
```

### Reports

```yaml
GET /reports
  Description: List all reports for organization
  Query:
    study_id?: string
    limit?: number
  Response: { reports: Report[] }

GET /reports/:id
  Description: Get report details
  Response: { report: Report }

GET /reports/:id/export/pdf
  Description: Export report as PDF
  Response: binary (PDF file)

GET /reports/:id/export/slides
  Description: Export report as slides
  Response: binary (PPTX file)

GET /reports/:id/export/data
  Description: Export raw data (CSV)
  Response: binary (ZIP file)
```

### Integrations

```yaml
GET /integrations
  Description: List connected integrations
  Response: { integrations: Integration[] }

POST /integrations/shopify/connect
  Description: Initiate Shopify OAuth
  Body:
    shop_domain: string
  Response: { oauth_url: string }

GET /integrations/shopify/callback
  Description: Shopify OAuth callback
  Query:
    code: string
    shop: string
    state: string
  Response: redirect to dashboard

DELETE /integrations/:provider
  Description: Disconnect integration
  Response: { success: true }

POST /integrations/:provider/sync
  Description: Trigger manual sync
  Response: { job_id: string }
```

### Webhooks (Internal)

```yaml
POST /webhooks/sendgrid
  Description: Email delivery events
  Body: SendGrid webhook payload

POST /webhooks/heygen
  Description: Video generation complete
  Body: HeyGen webhook payload

POST /webhooks/stripe
  Description: Payment events
  Body: Stripe webhook payload
```

## 7.3 Python Agent API Endpoints

All agent endpoints are internal (called by Node.js API).

```yaml
# ============================================================================
# QUESTION AGENT
# ============================================================================

POST /agents/question/generate
  Description: Generate next interview question
  Body:
    session_id: string
    research_intent: ResearchIntent
    participant_profile: ParticipantProfile
    avatar_profile: AvatarProfile
    guardrail_config: GuardrailConfig
    conversation_history: QATurn[]
    good_patterns?: string[]
    bad_patterns?: string[]
  Response: {
    question_text: string,
    question_type: seed|follow_up|clarification|pivot|wrap_up,
    topic: string,
    action: continue|end,
    reasoning: string,
    tokens_used: { prompt: number, completion: number }
  }

# ============================================================================
# QUALITY AGENT
# ============================================================================

POST /agents/quality/score
  Description: Score a Q&A pair
  Body:
    question_text: string
    answer_transcript: string
    research_goal: string
    turn_index: number
    question_type: string
  Response: {
    label: good|neutral|bad,
    scores: {
      depth: number,
      relevance: number,
      engagement: number,
      clarity: number,
      non_leading: number
    },
    reasoning: string,
    tokens_used: { prompt: number, completion: number }
  }

# ============================================================================
# AVATAR AGENT
# ============================================================================

POST /agents/avatar/render
  Description: Generate avatar video for question
  Body:
    question_text: string
    avatar_id: string
    tone: warm|neutral|curious|empathetic
    language: string
  Response: {
    video_url: string,
    audio_url: string,
    duration_seconds: number
  }

POST /agents/avatar/render/status/:jobId
  Description: Check video generation status
  Response: {
    status: pending|processing|completed|failed,
    video_url?: string,
    audio_url?: string
  }

# ============================================================================
# SELECTION AGENT
# ============================================================================

POST /agents/selection/select
  Description: Select and rank participants for study
  Body:
    study_id: string
    research_intent: ResearchIntent
    target_demographics: Demographics
    target_count: number
    candidates: ParticipantProfile[]
    avatars: Avatar[]
    avatar_strategy: string
  Response: {
    selections: [{
      participant_id: string,
      score: number,
      reasoning: string,
      assigned_avatar_id: string,
      avatar_reasoning: string
    }],
    tokens_used: { prompt: number, completion: number }
  }

# ============================================================================
# SUMMARY AGENT
# ============================================================================

POST /agents/summary/interview
  Description: Generate interview summary
  Body:
    session_id: string
    research_intent: ResearchIntent
    participant_profile: ParticipantProfile
    qa_turns: QATurn[]
    quality_labels: QualityLabel[]
  Response: {
    summary_text: string,
    key_themes: string[],
    sentiment_overview: SentimentOverview,
    quotes: Quote[],
    persona_flags: string[],
    tokens_used: { prompt: number, completion: number }
  }

# ============================================================================
# OVERVIEW AGENT
# ============================================================================

POST /agents/overview/report
  Description: Generate full study report
  Body:
    study_id: string
    research_intent: ResearchIntent
    interview_summaries: InterviewSummary[]
    all_qa_turns: QATurn[]
    all_quality_labels: QualityLabel[]
    demographics_summary: DemographicsSummary
  Response: {
    report_data: ReportData,
    report_markdown: string,
    tokens_used: { prompt: number, completion: number }
  }

# ============================================================================
# TRANSCRIPTION
# ============================================================================

POST /agents/transcribe
  Description: Transcribe audio to text
  Body: FormData with audio file
  Query:
    language?: string
  Response: {
    transcript: string,
    confidence: number,
    duration_seconds: number
  }
```

## 7.4 WebSocket Events

```yaml
# Interview Progress (participant UI)
namespace: /interview

Events (server → client):
  question:ready
    data: { video_url, audio_url, text, turn_index }

  transcription:complete
    data: { transcript }

  interview:complete
    data: { message, payout_info }

  error
    data: { code, message }

Events (client → server):
  audio:chunk
    data: { chunk: binary, turn_index: number }

  audio:complete
    data: { turn_index: number }

# Study Dashboard (company UI)
namespace: /studies/:studyId

Events (server → client):
  progress:update
    data: {
      invites_sent: number,
      clicked: number,
      in_progress: number,
      completed: number
    }

  interview:started
    data: { session_id, participant_name }

  interview:completed
    data: { session_id, participant_name, summary_preview }

  report:ready
    data: { report_id }
```

## 7.5 Shared Type Definitions

```typescript
// packages/shared/types/index.ts

// ============================================================================
// CORE ENTITIES
// ============================================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  plan: 'free' | 'pro' | 'enterprise';
  settings: OrganizationSettings;
  created_at: string;
}

export interface User {
  id: string;
  organization_id: string;
  email: string;
  full_name?: string;
  role: 'owner' | 'admin' | 'member';
  avatar_url?: string;
}

export interface Study {
  id: string;
  organization_id: string;
  title: string;
  description?: string;
  status: StudyStatus;
  research_intent: ResearchIntent;
  interview_config: InterviewConfig;
  target_demographics: TargetDemographics;
  target_participant_count: number;
  incentive_amount_cents: number;
  incentive_currency: string;
  avatar_strategy: AvatarStrategy;
  guardrail_profile: string;
  launched_at?: string;
  completed_at?: string;
  created_at: string;
}

export type StudyStatus =
  | 'draft'
  | 'recruiting'
  | 'active'
  | 'paused'
  | 'completed'
  | 'archived';

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
  allow_early_exit: boolean;
  show_progress: boolean;
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

export type AvatarStrategy =
  | 'demographic_match'
  | 'random'
  | 'fixed';

// ============================================================================
// PARTICIPANTS
// ============================================================================

export interface Participant {
  id: string;
  organization_id: string;
  external_id?: string;
  external_source?: string;
  email: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  full_name: string;
  age?: number;
  gender?: string;
  country?: string;
  city?: string;
  language: string;
  timezone?: string;
  tags: string[];
  metadata: Record<string, any>;
  total_invites: number;
  total_completed: number;
  status: 'active' | 'opted_out' | 'bounced' | 'spam';
  created_at: string;
}

export interface ParticipantProfile {
  id: string;
  age?: number;
  gender?: string;
  country?: string;
  language: string;
  tags: string[];
  metadata: Record<string, any>;
}

// ============================================================================
// AVATARS
// ============================================================================

export interface Avatar {
  id: string;
  name: string;
  description?: string;
  demographic_profile: AvatarDemographicProfile;
  voice_provider: 'elevenlabs' | 'openai';
  voice_id: string;
  video_provider: 'heygen' | 'd-id';
  video_avatar_id: string;
  tone_config: AvatarToneConfig;
  languages: string[];
  is_active: boolean;
}

export interface AvatarDemographicProfile {
  apparent_age: number;
  gender: string;
  ethnicity?: string;
  style: string;
}

export interface AvatarToneConfig {
  warmth: number;       // 0-1
  formality: number;    // 0-1
  curiosity: number;    // 0-1
  empathy: number;      // 0-1
  speaking_pace: 'slow' | 'moderate' | 'fast';
  default_expressions: string[];
}

// ============================================================================
// ASSIGNMENTS & SESSIONS
// ============================================================================

export interface StudyAssignment {
  id: string;
  study_id: string;
  participant_id: string;
  avatar_id: string;
  invite_token: string;
  invite_status: InviteStatus;
  invite_channel: string;
  invite_sent_at?: string;
  invite_clicked_at?: string;
  selection_score?: number;
  selection_reasoning?: string;
  avatar_assignment_reasoning?: string;
  completed_at?: string;
  payout_status: PayoutStatus;
  payout_amount_cents?: number;
}

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

export type PayoutStatus =
  | 'not_eligible'
  | 'eligible'
  | 'processing'
  | 'paid'
  | 'failed';

export interface InterviewSession {
  id: string;
  assignment_id: string;
  study_id: string;
  participant_id: string;
  avatar_id: string;
  status: SessionStatus;
  started_at?: string;
  ended_at?: string;
  duration_seconds?: number;
  config_snapshot: InterviewConfig;
  total_questions: number;
  total_tokens_used: number;
  device_type?: string;
  error_message?: string;
}

export type SessionStatus =
  | 'initialized'
  | 'intro'
  | 'in_progress'
  | 'wrapping_up'
  | 'completed'
  | 'abandoned'
  | 'error';

// ============================================================================
// Q&A TURNS
// ============================================================================

export interface QATurn {
  id: string;
  session_id: string;
  turn_index: number;
  question_text: string;
  question_type: QuestionType;
  question_topic?: string;
  answer_transcript?: string;
  answer_duration_seconds?: number;
  answer_word_count?: number;
  question_generated_at?: string;
  question_delivered_at?: string;
  answer_started_at?: string;
  answer_completed_at?: string;
  avatar_video_url?: string;
  avatar_audio_url?: string;
}

export type QuestionType =
  | 'seed'
  | 'follow_up'
  | 'clarification'
  | 'pivot'
  | 'wrap_up';

export interface QualityLabel {
  id: string;
  qa_turn_id: string;
  label: 'good' | 'neutral' | 'bad';
  scores: QualityScores;
  reasoning?: string;
}

export interface QualityScores {
  depth: number;           // 0-1: Did the answer go beyond surface level?
  relevance: number;       // 0-1: How relevant to research goal?
  engagement: number;      // 0-1: Was the participant engaged?
  clarity: number;         // 0-1: Was the question clear?
  non_leading: number;     // 0-1: Did the question avoid leading?
  follow_up_quality?: number; // 0-1: Was this a good follow-up?
}

// ============================================================================
// SUMMARIES & REPORTS
// ============================================================================

export interface InterviewSummary {
  id: string;
  session_id: string;
  summary_text: string;
  key_themes: string[];
  sentiment_overview: SentimentOverview;
  quotes: Quote[];
  persona_flags: string[];
}

export interface SentimentOverview {
  overall: 'positive' | 'negative' | 'neutral' | 'mixed';
  confidence: number;
  by_topic: Record<string, 'positive' | 'negative' | 'neutral'>;
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
  status: 'generating' | 'completed' | 'failed';
  report_data: ReportData;
  report_markdown?: string;
  report_html?: string;
  pdf_url?: string;
  slides_url?: string;
  interviews_included: number;
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
  charts: ReportCharts;
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

// ============================================================================
// GUARDRAILS
// ============================================================================

export interface GuardrailProfile {
  id: string;
  name: string;
  description?: string;
  llm_instructions: string;
  config: GuardrailConfig;
}

export interface GuardrailConfig {
  max_topic_deviation: number;
  max_question_length_chars: number;
  min_answer_before_followup_seconds: number;
  max_clarifications_per_topic: number;
  sensitivity_rules: {
    avoid_topics: string[];
    escalate_if: string[];
  };
  tone_requirements: {
    must_be_neutral: boolean;
    avoid_leading: boolean;
    encourage_elaboration: boolean;
  };
}
```

---

# 8. Agent Specifications

This section details the exact prompts, inputs, and outputs for each LLM agent.

## 8.1 Question Agent

The Question Agent is the core of the interview experience. It generates contextually appropriate questions based on the research goal, conversation history, and participant profile.

### System Prompt Template

```text
You are an expert qualitative research interviewer conducting a user research interview. Your role is to ask thoughtful, open-ended questions that help understand the participant's genuine thoughts, feelings, and experiences.

## Research Context
Goal: {{research_intent.goal}}
Study Type: {{research_intent.study_type}}
{{#if research_intent.context}}
Additional Context: {{research_intent.context}}
{{/if}}

## Participant Profile
- Age: {{participant.age}}
- Gender: {{participant.gender}}
- Location: {{participant.country}}
{{#if participant.metadata}}
- Additional Info: {{participant.metadata | json}}
{{/if}}

## Interview Guidelines

### DO:
- Ask open-ended questions that encourage elaboration
- Use follow-up questions to explore interesting responses deeper
- Stay curious and genuinely interested
- Acknowledge what the participant says before moving on
- Keep questions conversational and natural
- Explore "why" and "how" behind their answers
- Use the participant's own words when following up

### DON'T:
- Ask leading questions that suggest a "right" answer
- Ask yes/no questions (rephrase to be open-ended)
- Stack multiple questions together
- Make assumptions about what they mean
- Rush to the next topic before fully exploring
- Use jargon or technical language unless they do
- Ask about: {{guardrail.sensitivity_rules.avoid_topics | join(", ")}}

### Guardrail Level: {{guardrail_profile}}
{{guardrail.llm_instructions}}

## Question Seeds (starting points)
{{#each research_intent.question_seeds}}
- {{this}}
{{/each}}

## Good Question Patterns (from prior interviews)
{{#each good_patterns}}
- {{this}}
{{/each}}

## Bad Question Patterns (avoid these)
{{#each bad_patterns}}
- {{this}}
{{/each}}

## Your Task
Based on the conversation so far, generate the next question. Consider:
1. Have we sufficiently explored the current topic?
2. Should we follow up or move to a new area?
3. What would yield the most valuable insight for the research goal?

If you believe we have gathered enough insights (typically after {{interview_config.max_questions}} questions or when responses become repetitive), respond with action: "end".

Respond in JSON format:
{
  "question_text": "Your question here",
  "question_type": "seed|follow_up|clarification|pivot|wrap_up",
  "topic": "The topic/theme being explored",
  "action": "continue|end",
  "reasoning": "Brief explanation of why you chose this question"
}
```

### User Prompt Template (per turn)

```text
## Conversation History

{{#each conversation_history}}
**Turn {{turn_index}}**
Q: {{question_text}}
A: {{answer_transcript}}
{{#if quality_label}}
(Quality: {{quality_label.label}}, Depth: {{quality_label.scores.depth}})
{{/if}}

{{/each}}

---

Current turn: {{current_turn_index}} of max {{interview_config.max_questions}}
Time elapsed: {{elapsed_minutes}} of max {{interview_config.max_duration_minutes}} minutes

Generate the next question:
```

### Output Schema

```typescript
interface QuestionAgentOutput {
  question_text: string;     // The actual question to ask
  question_type: QuestionType;
  topic: string;             // Theme being explored
  action: 'continue' | 'end';
  reasoning: string;         // Why this question was chosen
}
```

### Implementation Notes

```python
# apps/agents/app/agents/question_agent.py

from openai import OpenAI
from pydantic import BaseModel
from typing import Literal

class QuestionOutput(BaseModel):
    question_text: str
    question_type: Literal["seed", "follow_up", "clarification", "pivot", "wrap_up"]
    topic: str
    action: Literal["continue", "end"]
    reasoning: str

class QuestionAgent:
    def __init__(self):
        self.client = OpenAI()
        self.model = "gpt-4-turbo-preview"

    async def generate(
        self,
        research_intent: dict,
        participant_profile: dict,
        conversation_history: list,
        guardrail_config: dict,
        good_patterns: list[str] = [],
        bad_patterns: list[str] = [],
        current_turn: int = 0,
        max_questions: int = 10,
        elapsed_minutes: float = 0,
        max_duration: int = 8
    ) -> QuestionOutput:

        system_prompt = self._build_system_prompt(
            research_intent,
            participant_profile,
            guardrail_config,
            good_patterns,
            bad_patterns,
            max_questions
        )

        user_prompt = self._build_user_prompt(
            conversation_history,
            current_turn,
            max_questions,
            elapsed_minutes,
            max_duration
        )

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.7,  # Some creativity but not too random
            max_tokens=500
        )

        return QuestionOutput.model_validate_json(
            response.choices[0].message.content
        )
```

## 8.2 Quality Agent

The Quality Agent evaluates each Q&A pair to enable the learning loop.

### System Prompt

```text
You are an expert at evaluating qualitative research interviews. Your job is to assess the quality of a question-answer exchange.

## Evaluation Criteria

### Depth (0.0-1.0)
How deeply did the answer explore the topic?
- 0.0-0.3: Surface level, one-word or very brief
- 0.4-0.6: Moderate detail, some explanation
- 0.7-0.9: Rich detail, multiple aspects covered
- 0.9-1.0: Exceptional depth, unexpected insights

### Relevance (0.0-1.0)
How relevant is this Q&A to the research goal?
- 0.0-0.3: Off-topic, not useful for research
- 0.4-0.6: Tangentially related
- 0.7-0.9: Directly addresses research goal
- 0.9-1.0: Core insight for the research

### Engagement (0.0-1.0)
How engaged did the participant seem?
- 0.0-0.3: Disengaged, minimal effort
- 0.4-0.6: Cooperative but not enthusiastic
- 0.7-0.9: Engaged, thoughtful responses
- 0.9-1.0: Highly engaged, volunteering extra info

### Clarity (0.0-1.0)
How clear and well-formed was the question?
- 0.0-0.3: Confusing, poorly worded
- 0.4-0.6: Understandable but could be clearer
- 0.7-0.9: Clear and easy to understand
- 0.9-1.0: Exceptionally clear, well-structured

### Non-Leading (0.0-1.0)
Did the question avoid leading the participant?
- 0.0-0.3: Clearly leading or biased
- 0.4-0.6: Slightly suggestive
- 0.7-0.9: Neutral and open
- 0.9-1.0: Perfectly neutral, encourages honest response

## Overall Label
- "good": Average score >= 0.7 AND no individual score < 0.4
- "bad": Average score < 0.5 OR any score < 0.3
- "neutral": Everything else

Respond in JSON:
{
  "label": "good|neutral|bad",
  "scores": {
    "depth": 0.0-1.0,
    "relevance": 0.0-1.0,
    "engagement": 0.0-1.0,
    "clarity": 0.0-1.0,
    "non_leading": 0.0-1.0
  },
  "reasoning": "1-2 sentence explanation"
}
```

### User Prompt

```text
## Research Goal
{{research_goal}}

## Question (Turn {{turn_index}}, Type: {{question_type}})
{{question_text}}

## Answer
{{answer_transcript}}

## Context
Word count: {{word_count}}
Answer duration: {{duration_seconds}} seconds

Evaluate this Q&A exchange:
```

## 8.3 Selection Agent

Selects and ranks participants, and assigns avatars.

### System Prompt

```text
You are an expert at participant recruitment for qualitative research studies. Your task is to:
1. Score and rank candidate participants based on how well they match the study criteria
2. Assign the most appropriate avatar to each selected participant

## Study Details
Goal: {{research_intent.goal}}
Type: {{research_intent.study_type}}
Context: {{research_intent.context}}

## Target Demographics
{{target_demographics | json}}

## Target Count
Select the top {{target_count}} participants.

## Avatar Assignment Strategy: {{avatar_strategy}}

### Strategy: "demographic_match"
Match avatars based on:
- Topic sensitivity: For personal/emotional topics, consider opposite gender to increase disclosure
- Age proximity: Within 10 years is ideal
- Cultural alignment: Similar background when relevant
- Comfort optimization: Choose avatar most likely to make participant comfortable

### Available Avatars
{{#each avatars}}
- {{name}} ({{demographic_profile.gender}}, apparent age {{demographic_profile.apparent_age}}): {{description}}
{{/each}}

## Scoring Criteria
- Demographic match (40%): How well do they match target demographics?
- Recency (20%): When were they last invited? (Avoid over-sampling)
- Engagement history (20%): Past completion rates
- Profile completeness (20%): Do we have enough data on them?

Respond with a JSON array of selections, ordered by score (highest first):
{
  "selections": [
    {
      "participant_id": "uuid",
      "score": 0.0-1.0,
      "reasoning": "Why selected",
      "assigned_avatar_id": "uuid",
      "avatar_reasoning": "Why this avatar"
    }
  ]
}
```

## 8.4 Summary Agent (Interview-Level)

Synthesizes a single interview into structured insights.

### System Prompt

```text
You are an expert qualitative researcher analyzing an interview transcript. Create a comprehensive summary that captures the key insights.

## Research Context
Goal: {{research_intent.goal}}
Study Type: {{research_intent.study_type}}

## Participant Profile
- Age: {{participant.age}}, Gender: {{participant.gender}}
- Location: {{participant.country}}
{{#if participant.metadata}}
- Context: {{participant.metadata | json}}
{{/if}}

## Your Task
Analyze the interview and produce:

1. **Summary Text** (2-3 paragraphs)
   - What were the participant's main perspectives?
   - What stood out as most important?
   - How does this relate to the research goal?

2. **Key Themes** (3-7 themes)
   - Single words or short phrases
   - What topics dominated the conversation?

3. **Sentiment Overview**
   - Overall sentiment: positive/negative/neutral/mixed
   - Breakdown by topic

4. **Golden Quotes** (3-10)
   - Direct quotes that capture key insights
   - Tag each with theme and sentiment

5. **Persona Flags**
   - Behavioral or attitudinal tags
   - E.g., "price_sensitive", "early_adopter", "skeptical", "enthusiastic"

Respond in JSON:
{
  "summary_text": "...",
  "key_themes": ["theme1", "theme2", ...],
  "sentiment_overview": {
    "overall": "positive|negative|neutral|mixed",
    "confidence": 0.0-1.0,
    "by_topic": {"topic1": "positive", ...}
  },
  "quotes": [
    {"text": "...", "theme": "...", "sentiment": "...", "turn_index": N}
  ],
  "persona_flags": ["flag1", "flag2", ...]
}
```

## 8.5 Overview Agent (Study-Level Report)

Generates the complete research report from all interviews.

### System Prompt

```text
You are a senior research consultant preparing a comprehensive research report. You have access to all interview summaries and raw transcripts from a qualitative study.

## Study Details
Title: {{study.title}}
Goal: {{research_intent.goal}}
Type: {{research_intent.study_type}}
Total Interviews: {{total_interviews}}
Date Range: {{date_range}}

## Your Task
Create a full research report with:

### 1. Executive Summary (1-2 paragraphs)
- What were the main findings?
- What should the client do based on this?

### 2. Methodology
- Study approach
- Sample size and demographics
- Interview duration statistics
- Any limitations

### 3. Sample Demographics
- Age distribution
- Gender breakdown
- Location breakdown
- Other relevant segments

### 4. Key Findings (5-10)
Each finding should include:
- Clear statement of the finding
- Confidence level (based on how many participants mentioned it)
- Supporting quotes

### 5. Theme Analysis
For each major theme:
- Description of the theme
- Frequency (% of participants who mentioned it)
- Sentiment associated with the theme
- Key quotes

### 6. Persona Clusters
Group participants into 3-5 personas:
- Persona name (creative but descriptive)
- Size (number of participants)
- Key characteristics
- Behaviors
- Representative quotes

### 7. Recommendations
Actionable suggestions based on findings:
- What should the company do?
- Priority level
- Rationale

Format: Return a complete JSON object matching the ReportData schema.
```

---

# 9. Interview Flow & State Machine

## 9.1 Interview Session State Machine

```
                                    ┌─────────────────┐
                                    │   initialized   │
                                    │                 │
                                    │  Token valid,   │
                                    │  session created│
                                    └────────┬────────┘
                                             │
                                    Participant clicks
                                    "Start Interview"
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │     intro       │
                                    │                 │
                                    │  Avatar intro   │
                                    │  plays          │
                                    └────────┬────────┘
                                             │
                                    Intro complete,
                                    first Q generated
                                             │
                                             ▼
                              ┌──────────────────────────────┐
                              │                              │
                              │        in_progress           │
                              │                              │
                              │  Main interview loop:        │
                              │  Q → A → Score → Next Q      │
                              │                              │
                              └──────────────┬───────────────┘
                                             │
              ┌──────────────────────────────┼──────────────────────────────┐
              │                              │                              │
    Agent signals END           Max questions reached          Participant exits
    (sufficient depth)          OR max time reached                 early
              │                              │                              │
              ▼                              ▼                              ▼
     ┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
     │   wrapping_up   │           │   wrapping_up   │           │   abandoned     │
     │                 │           │                 │           │                 │
     │  Wrap-up Q      │           │  Wrap-up Q      │           │  Partial data   │
     │  plays          │           │  plays          │           │  saved          │
     └────────┬────────┘           └────────┬────────┘           └─────────────────┘
              │                              │
              └──────────────┬───────────────┘
                             │
                    Wrap-up complete
                             │
                             ▼
                    ┌─────────────────┐
                    │    completed    │
                    │                 │
                    │  Summary gen    │
                    │  Payout queued  │
                    └─────────────────┘

                    Error at any point
                             │
                             ▼
                    ┌─────────────────┐
                    │     error       │
                    │                 │
                    │  Error logged   │
                    │  Support ticket │
                    └─────────────────┘
```

## 9.2 Turn-Level Flow Detail

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SINGLE TURN FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  INPUT: Previous Q&A pairs, research context, participant profile            │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  STEP 1: Question Generation (Question Agent)                        │    │
│  │                                                                      │    │
│  │  POST /agents/question/generate                                      │    │
│  │  ├── Input: context + history                                        │    │
│  │  ├── Processing: ~1-2 seconds                                        │    │
│  │  └── Output: { question_text, type, topic, action }                 │    │
│  │                                                                      │    │
│  │  IF action == "end" → Jump to WRAP UP                               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                              │                                               │
│                              ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  STEP 2: Avatar Rendering (Avatar Agent / HeyGen)                    │    │
│  │                                                                      │    │
│  │  POST /agents/avatar/render                                          │    │
│  │  ├── Input: question_text, avatar_id, tone                          │    │
│  │  ├── Processing: ~3-8 seconds (async, poll for completion)          │    │
│  │  └── Output: { video_url, audio_url, duration }                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                              │                                               │
│                              ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  STEP 3: Video Delivery & Playback                                   │    │
│  │                                                                      │    │
│  │  WebSocket: question:ready → Client                                  │    │
│  │  ├── Client plays video                                              │    │
│  │  ├── Duration: depends on question length                           │    │
│  │  └── UI shows avatar speaking                                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                              │                                               │
│                              ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  STEP 4: Audio Capture                                               │    │
│  │                                                                      │    │
│  │  Client records participant response                                 │    │
│  │  ├── Start: After video ends                                         │    │
│  │  ├── Duration: Until silence detected or manual stop                │    │
│  │  ├── Stream: WebSocket audio:chunk events                           │    │
│  │  └── End: audio:complete event                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                              │                                               │
│                              ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  STEP 5: Transcription (Whisper)                                     │    │
│  │                                                                      │    │
│  │  POST /agents/transcribe                                             │    │
│  │  ├── Input: audio blob                                               │    │
│  │  ├── Processing: ~1-3 seconds                                        │    │
│  │  └── Output: { transcript, confidence, duration }                   │    │
│  │                                                                      │    │
│  │  WebSocket: transcription:complete → Client                         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                              │                                               │
│                              ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  STEP 6: Persist Q&A Turn                                            │    │
│  │                                                                      │    │
│  │  INSERT INTO qa_turns (...)                                          │    │
│  │  ├── question_text, question_type, topic                            │    │
│  │  ├── answer_transcript, duration, word_count                        │    │
│  │  └── timestamps, agent metadata                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                              │                                               │
│                    ┌─────────┴─────────┐                                    │
│                    │                   │                                    │
│                    ▼                   ▼                                    │
│  ┌──────────────────────┐  ┌──────────────────────┐                        │
│  │  STEP 7A (Parallel)  │  │  STEP 7B (Parallel)  │                        │
│  │  Quality Scoring     │  │  Next Q Generation   │                        │
│  │                      │  │                      │                        │
│  │  POST /quality/score │  │  (If not at limit)   │                        │
│  │  └── Async, non-     │  │  Prep next turn      │                        │
│  │      blocking        │  │                      │                        │
│  └──────────────────────┘  └──────────────────────┘                        │
│                    │                   │                                    │
│                    └─────────┬─────────┘                                    │
│                              │                                               │
│                              ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  STEP 8: Check Continue Conditions                                   │    │
│  │                                                                      │    │
│  │  IF turn_index >= max_questions → WRAP UP                           │    │
│  │  IF elapsed_time >= max_duration → WRAP UP                          │    │
│  │  IF agent.action == "end" → WRAP UP                                 │    │
│  │  ELSE → Loop back to STEP 1                                         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  OUTPUT: Q&A turn persisted, quality scored, ready for next turn            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 9.3 Timing Budget per Turn

```
┌─────────────────────────────────────────────────────────────────┐
│                    TURN TIMING BUDGET                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Target: < 15 seconds from question ready to next question      │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Question generation         │    1.5s   │ ████          │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ Avatar video generation     │    5.0s   │ ████████████  │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ Video playback              │   ~8.0s   │ (variable)    │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ Participant response        │  ~15.0s   │ (variable)    │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ Transcription               │    2.0s   │ ██████        │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ Quality scoring (parallel)  │    1.5s   │ (background)  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Optimization strategies:                                        │
│  • Pre-generate next question while participant responds        │
│  • Cache avatar videos for common questions                     │
│  • Stream transcription as audio arrives                        │
│  • Use WebSocket for instant updates                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 9.4 Error Handling & Recovery

```yaml
Error Scenarios:

1. Question Agent Timeout (>5s):
   Action: Retry once with shorter prompt
   Fallback: Use next seed question
   User Experience: Brief "thinking" animation

2. Avatar Generation Failure:
   Action: Retry with different avatar settings
   Fallback: Audio-only with static image
   User Experience: "We're experiencing a brief delay..."

3. Transcription Failure:
   Action: Retry with enhanced audio
   Fallback: Ask participant to repeat
   User Experience: "Could you repeat that? I want to make sure I heard you correctly."

4. Network Disconnection:
   Action: Auto-reconnect within 30s
   State: Preserve session state in Redis
   User Experience: "Reconnecting..." + resume from last turn

5. Participant Abandonment:
   Detection: No activity for 2 minutes
   Action: Send gentle prompt, then mark abandoned after 5 min
   Data: Save partial transcript

6. Browser Tab Close:
   Detection: beforeunload event
   Action: Mark session as "interrupted"
   Recovery: Allow resume within 24 hours via same link
```

---

# 10. Avatar System

## 10.1 Avatar Architecture Overview

The avatar system creates a human-like video presence for interviews. It consists of:

1. **Avatar Catalog** - Pre-defined avatar personas with voice and visual profiles
2. **Selection Engine** - Matches avatars to participants based on demographics and topic
3. **Rendering Pipeline** - Generates video content using HeyGen/D-ID

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AVATAR PIPELINE                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐                │
│   │  Question   │ ───► │   Avatar    │ ───► │   Video     │                │
│   │   Text      │      │  Selection  │      │  Provider   │                │
│   └─────────────┘      └─────────────┘      └─────────────┘                │
│         │                    │                    │                         │
│         ▼                    ▼                    ▼                         │
│   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐                │
│   │   Tone      │      │   Voice     │      │  Rendering  │                │
│   │  Analysis   │      │  Selection  │      │   Queue     │                │
│   └─────────────┘      └─────────────┘      └─────────────┘                │
│         │                    │                    │                         │
│         └────────────────────┼────────────────────┘                         │
│                              │                                               │
│                              ▼                                               │
│                    ┌─────────────────┐                                      │
│                    │   HeyGen / D-ID │                                      │
│                    │                 │                                      │
│                    │  • Video URL    │                                      │
│                    │  • Audio URL    │                                      │
│                    │  • Duration     │                                      │
│                    └─────────────────┘                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 10.2 Avatar Catalog Design

### Initial Avatar Set (MVP)

| ID | Name | Gender | Age | Style | Best For |
|----|------|--------|-----|-------|----------|
| 1 | Emma | Female | 25 | Friendly professional | General, younger males |
| 2 | Jordan | Male | 32 | Business casual | General, younger females |
| 3 | Alex | Non-binary | 22 | Casual, approachable | Gen Z, sensitive topics |
| 4 | Sarah | Female | 45 | Warm, maternal | Older demographics |
| 5 | Marcus | Male | 38 | Professional | B2B, enterprise |
| 6 | Mei | Female | 28 | Modern, tech-savvy | Tech products, APAC |

### Avatar Profile Schema

```typescript
interface AvatarProfile {
  id: string;
  name: string;

  // Visual appearance
  demographic: {
    apparent_age: number;
    gender: 'male' | 'female' | 'non_binary';
    ethnicity?: string;
    style: 'casual' | 'professional' | 'business_casual' | 'friendly';
  };

  // Voice configuration
  voice: {
    provider: 'elevenlabs' | 'openai';
    voice_id: string;
    settings: {
      stability: number;       // 0-1, how consistent
      similarity_boost: number; // 0-1, how close to original
      style: number;           // 0-1, expressiveness
      speaking_rate: number;   // 0.5-2.0
    };
  };

  // Video configuration
  video: {
    provider: 'heygen' | 'd-id';
    avatar_id: string;
    default_background: string;
    idle_animation: string;
  };

  // Behavioral configuration
  personality: {
    warmth: number;     // 0-1
    formality: number;  // 0-1
    curiosity: number;  // 0-1
    empathy: number;    // 0-1
    energy: number;     // 0-1
  };

  // Matching preferences
  matching: {
    preferred_topics: string[];
    preferred_demographics: {
      participant_age_range?: [number, number];
      participant_genders?: string[];
    };
    avoid_topics: string[];
  };

  // Supported languages
  languages: string[];
}
```

## 10.3 Avatar Assignment Algorithm

```python
# apps/agents/app/services/avatar_selection.py

from dataclasses import dataclass
from typing import List
import random

@dataclass
class AvatarScore:
    avatar_id: str
    score: float
    reasoning: List[str]

def select_avatar(
    participant: 'ParticipantProfile',
    avatars: List['Avatar'],
    research_intent: 'ResearchIntent',
    strategy: str = "demographic_match"
) -> AvatarScore:
    """
    Select the best avatar for a participant based on the strategy.

    Strategies:
    - demographic_match: Optimize for comfort and disclosure
    - random: Random selection (for A/B testing)
    - fixed: Use a specific avatar (for consistency)
    """

    if strategy == "random":
        avatar = random.choice(avatars)
        return AvatarScore(avatar.id, 1.0, ["Random selection"])

    if strategy == "fixed":
        return AvatarScore(avatars[0].id, 1.0, ["Fixed avatar"])

    # Demographic match strategy
    scores = []

    for avatar in avatars:
        score = 0.0
        reasons = []

        # 1. Age proximity (20% weight)
        if participant.age and avatar.demographic.apparent_age:
            age_diff = abs(participant.age - avatar.demographic.apparent_age)
            age_score = max(0, 1 - (age_diff / 20))  # 0-20 year range
            score += age_score * 0.20
            reasons.append(f"Age proximity: {age_score:.2f}")

        # 2. Gender dynamics (30% weight)
        gender_score = calculate_gender_score(
            participant.gender,
            avatar.demographic.gender,
            research_intent.study_type,
            research_intent.goal
        )
        score += gender_score * 0.30
        reasons.append(f"Gender match: {gender_score:.2f}")

        # 3. Topic appropriateness (25% weight)
        topic_score = calculate_topic_score(
            avatar.matching.preferred_topics,
            avatar.matching.avoid_topics,
            research_intent
        )
        score += topic_score * 0.25
        reasons.append(f"Topic fit: {topic_score:.2f}")

        # 4. Language match (15% weight)
        lang_score = 1.0 if participant.language in avatar.languages else 0.3
        score += lang_score * 0.15
        reasons.append(f"Language: {lang_score:.2f}")

        # 5. Personality fit for study type (10% weight)
        personality_score = calculate_personality_fit(
            avatar.personality,
            research_intent.study_type
        )
        score += personality_score * 0.10
        reasons.append(f"Personality fit: {personality_score:.2f}")

        scores.append(AvatarScore(avatar.id, score, reasons))

    # Return highest scoring avatar
    return max(scores, key=lambda x: x.score)


def calculate_gender_score(
    participant_gender: str,
    avatar_gender: str,
    study_type: str,
    goal: str
) -> float:
    """
    Calculate gender matching score based on topic sensitivity.

    Research shows:
    - For emotional/personal topics: opposite gender often increases disclosure
    - For professional topics: same gender may increase comfort
    - For sensitive topics: match based on topic nature
    """

    emotional_topics = ['dating', 'relationships', 'personal', 'feelings', 'emotions']
    sensitive_topics = ['health', 'finance', 'family', 'trauma']

    goal_lower = goal.lower()

    # Check if emotional topic (opposite gender preferred)
    if any(topic in goal_lower for topic in emotional_topics):
        if participant_gender != avatar_gender:
            return 0.9  # Opposite gender bonus
        return 0.5

    # Check if sensitive topic (same gender often preferred)
    if any(topic in goal_lower for topic in sensitive_topics):
        if participant_gender == avatar_gender:
            return 0.8
        return 0.6

    # Default: slight preference for similar
    if participant_gender == avatar_gender:
        return 0.7
    return 0.6


def calculate_topic_score(
    preferred_topics: List[str],
    avoid_topics: List[str],
    research_intent: 'ResearchIntent'
) -> float:
    """Calculate how well avatar fits the study topic."""
    goal_lower = research_intent.goal.lower()

    # Penalty for avoided topics
    for topic in avoid_topics:
        if topic.lower() in goal_lower:
            return 0.2

    # Bonus for preferred topics
    for topic in preferred_topics:
        if topic.lower() in goal_lower:
            return 0.9

    return 0.6  # Neutral


def calculate_personality_fit(
    personality: dict,
    study_type: str
) -> float:
    """Match avatar personality to study type."""
    fits = {
        'product_feedback': {'curiosity': 0.4, 'warmth': 0.3, 'energy': 0.3},
        'concept_test': {'curiosity': 0.5, 'warmth': 0.2, 'empathy': 0.3},
        'churn_analysis': {'empathy': 0.5, 'warmth': 0.3, 'curiosity': 0.2},
        'ux_research': {'curiosity': 0.4, 'empathy': 0.4, 'warmth': 0.2},
        'brand_perception': {'warmth': 0.4, 'curiosity': 0.3, 'formality': 0.3},
    }

    weights = fits.get(study_type, {'warmth': 0.33, 'curiosity': 0.33, 'empathy': 0.34})
    score = sum(personality.get(k, 0.5) * v for k, v in weights.items())
    return score
```

## 10.4 Video Generation Pipeline

### HeyGen Integration

```python
# apps/agents/app/services/heygen_service.py

import httpx
import asyncio
from typing import Optional

class HeyGenService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.heygen.com/v2"

    async def generate_video(
        self,
        avatar_id: str,
        script: str,
        voice_id: str,
        background: str = "#FFFFFF",
        dimensions: tuple = (720, 1280)
    ) -> dict:
        """Generate avatar video from script."""

        payload = {
            "video_inputs": [{
                "character": {
                    "type": "avatar",
                    "avatar_id": avatar_id,
                    "avatar_style": "normal"
                },
                "voice": {
                    "type": "text",
                    "voice_id": voice_id,
                    "input_text": script
                },
                "background": {
                    "type": "color",
                    "value": background
                }
            }],
            "dimension": {
                "width": dimensions[0],
                "height": dimensions[1]
            }
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/video/generate",
                headers={
                    "X-Api-Key": self.api_key,
                    "Content-Type": "application/json"
                },
                json=payload,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()

    async def get_video_status(self, video_id: str) -> dict:
        """Poll for video generation status."""

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/video_status.get",
                headers={"X-Api-Key": self.api_key},
                params={"video_id": video_id}
            )
            response.raise_for_status()
            return response.json()

    async def wait_for_video(
        self,
        video_id: str,
        timeout: int = 120,
        poll_interval: int = 2
    ) -> dict:
        """Wait for video generation to complete."""

        start = asyncio.get_event_loop().time()
        while True:
            status = await self.get_video_status(video_id)

            if status["data"]["status"] == "completed":
                return {
                    "video_url": status["data"]["video_url"],
                    "duration": status["data"]["duration"],
                    "status": "completed"
                }

            if status["data"]["status"] == "failed":
                raise Exception(f"Video generation failed: {status}")

            if asyncio.get_event_loop().time() - start > timeout:
                raise TimeoutError("Video generation timed out")

            await asyncio.sleep(poll_interval)
```

### Video Caching Strategy

```yaml
Caching Approach:

1. Pre-generation for common phrases:
   - "Thanks for sharing that"
   - "Tell me more about..."
   - "That's interesting, can you elaborate?"
   - Pre-generate these for each avatar at setup

2. Real-time generation for unique questions:
   - Most questions are unique
   - Target <5s generation time
   - Queue management for burst traffic

3. Storage:
   - Supabase Storage for video files
   - CDN for fast delivery
   - TTL: 24 hours (interviews are one-time)

4. Fallback chain:
   - Primary: HeyGen video
   - Fallback 1: ElevenLabs audio + static image
   - Fallback 2: OpenAI TTS + static image
```

---

# 11. Quality & Learning Loop

## 11.1 Quality System Architecture

The quality system is what makes Chorus improve over time. Every Q&A pair is scored, and these scores feed back into question generation.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      QUALITY LEARNING LOOP                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                           ┌─────────────────┐                               │
│                           │   New Q&A Pair  │                               │
│                           └────────┬────────┘                               │
│                                    │                                         │
│                                    ▼                                         │
│                           ┌─────────────────┐                               │
│                           │  Quality Agent  │                               │
│                           │                 │                               │
│                           │  Scores:        │                               │
│                           │  • Depth        │                               │
│                           │  • Relevance    │                               │
│                           │  • Engagement   │                               │
│                           │  • Clarity      │                               │
│                           │  • Non-leading  │                               │
│                           └────────┬────────┘                               │
│                                    │                                         │
│                    ┌───────────────┼───────────────┐                        │
│                    │               │               │                        │
│                    ▼               ▼               ▼                        │
│            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                 │
│            │  qa_turns   │ │  quality_   │ │   Pattern   │                 │
│            │   (raw)     │ │   labels    │ │   Extractor │                 │
│            └─────────────┘ └─────────────┘ └──────┬──────┘                 │
│                                                   │                         │
│                                                   ▼                         │
│                                          ┌─────────────────┐                │
│                                          │ Good/Bad Pattern│                │
│                                          │    Database     │                │
│                                          │                 │                │
│                                          │ • Question      │                │
│                                          │   templates     │                │
│                                          │ • Topic combos  │                │
│                                          │ • Follow-up     │                │
│                                          │   strategies    │                │
│                                          └────────┬────────┘                │
│                                                   │                         │
│                                                   ▼                         │
│            ┌─────────────────────────────────────────────────────┐         │
│            │                 QUESTION AGENT                       │         │
│            │                                                      │         │
│            │  System prompt now includes:                         │         │
│            │  • Top 10 good question patterns                    │         │
│            │  • Top 5 bad question anti-patterns                 │         │
│            │  • Topic-specific recommendations                    │         │
│            └─────────────────────────────────────────────────────┘         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 11.2 Quality Scoring Details

### Scoring Dimensions

| Dimension | Description | Scoring Criteria |
|-----------|-------------|------------------|
| **Depth** | How deeply did the answer explore the topic? | 0.0-0.3: Surface level, one-word<br>0.4-0.6: Moderate detail<br>0.7-0.9: Rich detail<br>0.9-1.0: Exceptional |
| **Relevance** | How relevant to the research goal? | 0.0-0.3: Off-topic<br>0.4-0.6: Tangential<br>0.7-0.9: Directly addresses goal<br>0.9-1.0: Core insight |
| **Engagement** | How engaged did the participant seem? | 0.0-0.3: Disengaged<br>0.4-0.6: Cooperative<br>0.7-0.9: Engaged<br>0.9-1.0: Highly engaged |
| **Clarity** | How clear was the question? | 0.0-0.3: Confusing<br>0.4-0.6: Understandable<br>0.7-0.9: Clear<br>0.9-1.0: Exceptionally clear |
| **Non-Leading** | Did the question avoid bias? | 0.0-0.3: Clearly leading<br>0.4-0.6: Slightly suggestive<br>0.7-0.9: Neutral<br>0.9-1.0: Perfectly neutral |

### Label Assignment Logic

```python
def assign_label(scores: dict) -> str:
    """
    Assign overall label based on scores.

    Rules:
    - "good": avg >= 0.7 AND no score < 0.4
    - "bad": avg < 0.5 OR any score < 0.3
    - "neutral": everything else
    """
    values = list(scores.values())
    avg = sum(values) / len(values)
    min_score = min(values)

    if avg >= 0.7 and min_score >= 0.4:
        return "good"
    elif avg < 0.5 or min_score < 0.3:
        return "bad"
    else:
        return "neutral"
```

## 11.3 Pattern Extraction

```python
# apps/agents/app/services/pattern_extractor.py

from collections import defaultdict
from typing import List, Dict

class PatternExtractor:
    """
    Extracts patterns from scored Q&A pairs to improve future questions.
    """

    def extract_good_patterns(
        self,
        qa_turns: List['QATurn'],
        quality_labels: List['QualityLabel'],
        min_score: float = 0.7
    ) -> List[Dict]:
        """Identify patterns in high-scoring questions."""

        good_patterns = []

        for turn, label in zip(qa_turns, quality_labels):
            if label.label != 'good':
                continue

            avg_score = sum(label.scores.values()) / len(label.scores)
            if avg_score < min_score:
                continue

            pattern = {
                "question_text": turn.question_text,
                "question_type": turn.question_type,
                "topic": turn.question_topic,
                "scores": label.scores,
                "answer_length": turn.answer_word_count,
                "starts_with": self._extract_opener(turn.question_text),
                "question_structure": self._classify_structure(turn.question_text),
            }

            good_patterns.append(pattern)

        return good_patterns

    def extract_bad_patterns(
        self,
        qa_turns: List['QATurn'],
        quality_labels: List['QualityLabel']
    ) -> List[Dict]:
        """Identify patterns in low-scoring questions to avoid."""

        bad_patterns = []

        for turn, label in zip(qa_turns, quality_labels):
            if label.label != 'bad':
                continue

            pattern = {
                "question_text": turn.question_text,
                "question_type": turn.question_type,
                "reason": label.reasoning,
                "low_scores": {k: v for k, v in label.scores.items() if v < 0.5},
                "issues": self._identify_issues(turn.question_text, label),
            }

            bad_patterns.append(pattern)

        return bad_patterns

    def _extract_opener(self, question: str) -> str:
        """Extract the opening phrase pattern."""
        words = question.split()[:3]
        return " ".join(words).lower()

    def _classify_structure(self, question: str) -> str:
        """Classify the question structure."""
        q_lower = question.lower()

        if q_lower.startswith(("what", "how", "why")):
            return "open_ended"
        if q_lower.startswith(("can you", "could you", "would you")):
            return "polite_request"
        if q_lower.startswith(("tell me", "describe", "explain")):
            return "elaboration_request"
        return "other"

    def _identify_issues(self, question: str, label: 'QualityLabel') -> List[str]:
        """Identify specific issues with a bad question."""
        issues = []

        if label.scores.get("non_leading", 1.0) < 0.5:
            issues.append("leading_question")
        if label.scores.get("clarity", 1.0) < 0.5:
            issues.append("unclear")
        if label.scores.get("relevance", 1.0) < 0.5:
            issues.append("off_topic")
        if "?" not in question:
            issues.append("missing_question_mark")
        if len(question.split()) > 50:
            issues.append("too_long")

        return issues
```

## 11.4 Cross-Study Learning

```sql
-- Materialized view for cross-study pattern aggregation

CREATE MATERIALIZED VIEW global_question_patterns AS
WITH scored_questions AS (
    SELECT
        qt.question_text,
        qt.question_type,
        qt.question_topic,
        qql.label,
        qql.scores,
        qt.answer_word_count,
        s.research_intent->>'study_type' AS study_type
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
HAVING COUNT(*) >= 3
ORDER BY occurrence_count DESC;
```

## 11.5 Quality Dashboard Metrics

```yaml
Quality Metrics (per study):

1. Question Quality Distribution:
   - % Good questions
   - % Neutral questions
   - % Bad questions
   - Trend over time

2. Score Breakdowns:
   - Average depth score
   - Average relevance score
   - Average engagement score
   - Average clarity score
   - Average non-leading score

3. Answer Metrics:
   - Average answer length (words)
   - Average answer duration (seconds)
   - Answer length by question type

4. Learning Effectiveness:
   - Quality improvement over study duration
   - Pattern adoption rate
```

---

# 12. Data Integrations

## 12.1 Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        INTEGRATION ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      Integration Service                             │   │
│   │                                                                      │   │
│   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │   │
│   │   │   OAuth     │  │   Sync      │  │   Import    │                │   │
│   │   │   Manager   │  │   Scheduler │  │   Processor │                │   │
│   │   └─────────────┘  └─────────────┘  └─────────────┘                │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│         │                    │                    │                         │
│         ▼                    ▼                    ▼                         │
│   ┌───────────┐        ┌───────────┐        ┌───────────┐                  │
│   │  Shopify  │        │ Salesforce│        │  HubSpot  │  (Future)        │
│   │  Adapter  │        │  Adapter  │        │  Adapter  │                  │
│   └───────────┘        └───────────┘        └───────────┘                  │
│         │                    │                    │                         │
│         └────────────────────┼────────────────────┘                         │
│                              │                                               │
│                              ▼                                               │
│                    ┌─────────────────┐                                      │
│                    │  Participant    │                                      │
│                    │  Normalizer     │                                      │
│                    │                 │                                      │
│                    │  All sources →  │                                      │
│                    │  Standard format│                                      │
│                    └─────────────────┘                                      │
│                              │                                               │
│                              ▼                                               │
│                    ┌─────────────────┐                                      │
│                    │   participants  │                                      │
│                    │     table       │                                      │
│                    └─────────────────┘                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 12.2 CSV/JSON Import

### CSV Format Specification

```csv
email,first_name,last_name,age,gender,country,language,tags,metadata
john@example.com,John,Doe,28,male,US,en,"active,high_value","{""ltv"": 250}"
jane@example.com,Jane,Smith,35,female,UK,en,"churned","{""last_order"": ""2025-06-15""}"
```

### JSON Format Specification

```json
{
  "participants": [
    {
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "age": 28,
      "gender": "male",
      "country": "US",
      "language": "en",
      "tags": ["active", "high_value"],
      "metadata": {
        "ltv": 250,
        "signup_date": "2024-01-15"
      }
    }
  ]
}
```

### Import Processing

```typescript
// apps/api/src/participants/import.service.ts

interface ImportResult {
  total_records: number;
  imported_count: number;
  skipped_count: number;
  errors: ImportError[];
}

interface ImportError {
  row: number;
  field: string;
  message: string;
  value: any;
}

async function processCSVImport(
  file: Buffer,
  organizationId: string
): Promise<ImportResult> {
  const records = parseCSV(file);
  const result: ImportResult = {
    total_records: records.length,
    imported_count: 0,
    skipped_count: 0,
    errors: [],
  };

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    // Validate required fields
    if (!record.email || !isValidEmail(record.email)) {
      result.errors.push({
        row: i + 1,
        field: 'email',
        message: 'Invalid or missing email',
        value: record.email,
      });
      result.skipped_count++;
      continue;
    }

    // Check for duplicates
    const existing = await findParticipantByEmail(
      organizationId,
      record.email
    );

    if (existing) {
      // Update existing
      await updateParticipant(existing.id, normalizeRecord(record));
    } else {
      // Create new
      await createParticipant({
        organization_id: organizationId,
        ...normalizeRecord(record),
      });
    }

    result.imported_count++;
  }

  return result;
}

function normalizeRecord(record: any): NormalizedParticipant {
  return {
    email: record.email.toLowerCase().trim(),
    first_name: record.first_name?.trim() || null,
    last_name: record.last_name?.trim() || null,
    age: parseInt(record.age) || null,
    gender: normalizeGender(record.gender),
    country: record.country?.toUpperCase() || null,
    language: record.language?.toLowerCase() || 'en',
    tags: parseTags(record.tags),
    metadata: parseMetadata(record.metadata),
  };
}
```

## 12.3 Shopify Integration

### OAuth Flow

```typescript
// apps/api/src/integrations/shopify/shopify.service.ts

const SHOPIFY_SCOPES = [
  'read_customers',
  'read_orders',
].join(',');

async function initiateOAuth(
  organizationId: string,
  shopDomain: string
): Promise<string> {
  const state = generateSecureState(organizationId);

  // Store state for validation
  await redis.set(`shopify_oauth:${state}`, organizationId, 'EX', 600);

  const authUrl = new URL(`https://${shopDomain}/admin/oauth/authorize`);
  authUrl.searchParams.set('client_id', SHOPIFY_CLIENT_ID);
  authUrl.searchParams.set('scope', SHOPIFY_SCOPES);
  authUrl.searchParams.set('redirect_uri', SHOPIFY_REDIRECT_URI);
  authUrl.searchParams.set('state', state);

  return authUrl.toString();
}

async function handleCallback(
  code: string,
  shop: string,
  state: string
): Promise<Integration> {
  // Validate state
  const organizationId = await redis.get(`shopify_oauth:${state}`);
  if (!organizationId) {
    throw new Error('Invalid OAuth state');
  }

  // Exchange code for access token
  const tokenResponse = await fetch(
    `https://${shop}/admin/oauth/access_token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: SHOPIFY_CLIENT_ID,
        client_secret: SHOPIFY_CLIENT_SECRET,
        code,
      }),
    }
  );

  const { access_token } = await tokenResponse.json();

  // Store integration
  return await createIntegration({
    organization_id: organizationId,
    provider: 'shopify',
    access_token: encrypt(access_token),
    config: { shop_domain: shop },
    status: 'active',
  });
}
```

### Customer Sync

```typescript
interface ShopifyCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  created_at: string;
  orders_count: number;
  total_spent: string;
  tags: string;
  default_address?: {
    country_code: string;
    city: string;
  };
}

async function syncCustomers(
  integration: Integration,
  filters?: CustomerFilters
): Promise<SyncResult> {
  const shopify = new ShopifyClient(
    integration.config.shop_domain,
    decrypt(integration.access_token)
  );

  let cursor = null;
  let totalSynced = 0;

  do {
    const response = await shopify.customers.list({
      limit: 250,
      page_info: cursor,
      ...buildFilters(filters),
    });

    for (const customer of response.customers) {
      await upsertParticipant({
        organization_id: integration.organization_id,
        external_id: customer.id.toString(),
        external_source: 'shopify',
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
        phone: customer.phone,
        country: customer.default_address?.country_code,
        city: customer.default_address?.city,
        tags: customer.tags.split(',').map(t => t.trim()),
        metadata: {
          shopify: {
            customer_id: customer.id,
            orders_count: customer.orders_count,
            total_spent: parseFloat(customer.total_spent),
            created_at: customer.created_at,
          },
        },
      });

      totalSynced++;
    }

    cursor = response.page_info?.next;
  } while (cursor);

  // Update last sync time
  await updateIntegration(integration.id, {
    last_sync_at: new Date(),
  });

  return { total_synced: totalSynced };
}
```

## 12.4 Future Integrations Roadmap

| Integration | Priority | Use Case | Complexity |
|-------------|----------|----------|------------|
| Salesforce | High | Enterprise CRM | High |
| HubSpot | High | Marketing + CRM | Medium |
| Stripe | Medium | Payment/subscription data | Low |
| Intercom | Medium | Support tickets context | Medium |
| Segment | Low | CDP integration | Medium |
| Mixpanel | Low | Behavioral data | Medium |

---

# 13. Report Generation

## 13.1 Report Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          STUDY REPORT STRUCTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. EXECUTIVE SUMMARY (1-2 paragraphs)                                      │
│     └── What did we learn? What should you do?                              │
│                                                                              │
│  2. METHODOLOGY                                                              │
│     ├── Approach: AI-moderated video interviews                             │
│     ├── Sample size: N interviews                                           │
│     ├── Date range: Start - End                                             │
│     ├── Average duration: X minutes                                         │
│     ├── Average questions per interview: X                                  │
│     └── Completion rate: X%                                                 │
│                                                                              │
│  3. SAMPLE DEMOGRAPHICS                                                      │
│     ├── Age distribution chart                                               │
│     ├── Gender breakdown                                                     │
│     ├── Geographic distribution                                              │
│     └── Other relevant segments                                              │
│                                                                              │
│  4. KEY FINDINGS (ranked by confidence/frequency)                           │
│     └── For each finding:                                                   │
│         ├── Statement                                                        │
│         ├── Confidence score                                                 │
│         ├── Support count (N participants mentioned)                        │
│         └── Supporting quotes                                                │
│                                                                              │
│  5. THEME ANALYSIS                                                           │
│     └── For each theme:                                                      │
│         ├── Theme name                                                       │
│         ├── Frequency (% of participants)                                   │
│         ├── Sentiment breakdown                                              │
│         ├── Description                                                      │
│         └── Representative quotes                                            │
│                                                                              │
│  6. PERSONA CLUSTERS                                                         │
│     └── For each persona (3-5):                                             │
│         ├── Persona name (creative)                                          │
│         ├── Size (N participants)                                           │
│         ├── Key characteristics                                              │
│         ├── Behaviors                                                        │
│         └── Representative quotes                                            │
│                                                                              │
│  7. RECOMMENDATIONS                                                          │
│     └── For each recommendation:                                            │
│         ├── Recommendation statement                                         │
│         ├── Rationale                                                        │
│         ├── Priority (high/medium/low)                                      │
│         └── Related findings                                                 │
│                                                                              │
│  8. APPENDIX                                                                 │
│     ├── Full quote bank                                                      │
│     ├── Individual interview summaries                                       │
│     └── Raw metrics                                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 13.2 Report Generation Pipeline

```python
# apps/agents/app/services/report_generator.py

class ReportGenerator:
    """
    Generates comprehensive study reports from interview data.
    """

    def __init__(self, openai_client):
        self.client = openai_client

    async def generate_report(
        self,
        study: Study,
        sessions: List[InterviewSession],
        summaries: List[InterviewSummary],
        qa_turns: List[QATurn],
        quality_labels: List[QualityLabel]
    ) -> StudyReport:

        # Step 1: Aggregate data
        aggregated = self._aggregate_data(sessions, summaries, qa_turns)

        # Step 2: Generate each section
        executive_summary = await self._generate_executive_summary(
            study.research_intent,
            aggregated
        )

        methodology = self._generate_methodology(study, sessions)

        demographics = self._calculate_demographics(sessions)

        key_findings = await self._extract_key_findings(
            study.research_intent,
            summaries,
            qa_turns
        )

        themes = await self._analyze_themes(summaries)

        personas = await self._cluster_personas(summaries, sessions)

        recommendations = await self._generate_recommendations(
            study.research_intent,
            key_findings,
            themes
        )

        # Step 3: Compile report
        report_data = {
            "executive_summary": executive_summary,
            "methodology": methodology,
            "sample_demographics": demographics,
            "key_findings": key_findings,
            "theme_analysis": themes,
            "persona_clusters": personas,
            "recommendations": recommendations,
            "charts": self._generate_chart_data(aggregated),
        }

        # Step 4: Generate markdown
        report_markdown = self._render_markdown(report_data)

        return StudyReport(
            study_id=study.id,
            report_data=report_data,
            report_markdown=report_markdown,
            interviews_included=len(sessions),
            status='completed'
        )

    async def _generate_executive_summary(
        self,
        research_intent: ResearchIntent,
        aggregated: dict
    ) -> str:
        """Generate executive summary using LLM."""

        prompt = f"""
        Based on the following research study data, write a concise executive summary
        (2-3 paragraphs) that:
        1. Answers the research question
        2. Highlights the most important findings
        3. Provides a clear recommendation

        Research Goal: {research_intent.goal}

        Key Statistics:
        - Total interviews: {aggregated['total_interviews']}
        - Most common themes: {aggregated['top_themes']}
        - Overall sentiment: {aggregated['overall_sentiment']}

        Top Quotes:
        {aggregated['top_quotes']}
        """

        response = await self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "You are a senior research consultant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )

        return response.choices[0].message.content

    async def _cluster_personas(
        self,
        summaries: List[InterviewSummary],
        sessions: List[InterviewSession]
    ) -> List[PersonaCluster]:
        """Cluster participants into personas using LLM."""

        # Prepare persona flags and summaries
        participant_data = [
            {
                "id": s.session_id,
                "flags": s.persona_flags,
                "themes": s.key_themes,
                "sentiment": s.sentiment_overview.overall,
                "summary": s.summary_text[:500]
            }
            for s in summaries
        ]

        prompt = f"""
        Analyze these {len(participant_data)} interview participants and group them
        into 3-5 distinct personas. Each persona should:
        - Have a memorable, descriptive name
        - Represent a meaningful segment
        - Include shared characteristics and behaviors

        Participant Data:
        {json.dumps(participant_data, indent=2)}

        Return JSON array of personas.
        """

        response = await self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "You are a user research expert."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.7
        )

        return json.loads(response.choices[0].message.content)["personas"]
```

## 13.3 Export Formats

### PDF Export

```typescript
// Using react-pdf or puppeteer for PDF generation

async function exportToPDF(report: StudyReport): Promise<Buffer> {
  const html = renderReportToHTML(report);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);

  const pdf = await page.pdf({
    format: 'A4',
    margin: { top: '1in', bottom: '1in', left: '0.75in', right: '0.75in' },
    printBackground: true,
  });

  await browser.close();
  return pdf;
}
```

### PowerPoint Export

```typescript
// Using pptxgenjs for slide generation

async function exportToSlides(report: StudyReport): Promise<Buffer> {
  const pptx = new PptxGenJS();

  // Title slide
  const titleSlide = pptx.addSlide();
  titleSlide.addText(report.study.title, {
    x: 0.5, y: 2, w: 9, h: 1,
    fontSize: 36, bold: true, align: 'center'
  });

  // Executive summary slide
  const summarySlide = pptx.addSlide();
  summarySlide.addText('Executive Summary', { ... });
  summarySlide.addText(report.report_data.executive_summary, { ... });

  // Key findings slides
  for (const finding of report.report_data.key_findings) {
    const slide = pptx.addSlide();
    // ... add finding content
  }

  // Persona slides
  // ... etc

  return await pptx.write({ outputType: 'nodebuffer' });
}
```

---

# 14. Security & Privacy

## 14.1 Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYERS                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  NETWORK LAYER                                                               │
│  ├── HTTPS everywhere (TLS 1.3)                                             │
│  ├── DDoS protection (Cloudflare/Vercel)                                    │
│  ├── WAF rules                                                               │
│  └── Rate limiting                                                           │
│                                                                              │
│  APPLICATION LAYER                                                           │
│  ├── Supabase Auth (JWT tokens)                                             │
│  ├── Row Level Security (RLS)                                               │
│  ├── Input validation (Zod schemas)                                         │
│  ├── CORS configuration                                                      │
│  └── CSRF protection                                                         │
│                                                                              │
│  DATA LAYER                                                                  │
│  ├── Encryption at rest (Supabase managed)                                  │
│  ├── Encryption in transit                                                   │
│  ├── Field-level encryption for tokens                                      │
│  └── Audit logging                                                           │
│                                                                              │
│  ACCESS CONTROL                                                              │
│  ├── Organization-scoped access                                              │
│  ├── Role-based permissions                                                  │
│  ├── Invite token expiration                                                 │
│  └── Session management                                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 14.2 Data Privacy

### GDPR Compliance

```yaml
GDPR Requirements:

1. Consent:
   - Clear consent before interview starts
   - Explain data usage
   - Allow opt-out at any time

2. Right to Access:
   - Participants can request their data
   - Export all data associated with email

3. Right to Erasure:
   - Delete all participant data on request
   - Cascade delete through related tables
   - Remove from any exports/backups

4. Data Minimization:
   - Only collect necessary data
   - Transcript-only storage (no audio/video retention)
   - Anonymization options for reports

5. Data Portability:
   - Export data in standard formats (JSON, CSV)
```

### Data Retention Policy

```sql
-- Configurable retention per organization

CREATE TABLE data_retention_policies (
    organization_id UUID PRIMARY KEY REFERENCES organizations(id),
    interview_retention_days INTEGER DEFAULT 365,
    participant_retention_days INTEGER DEFAULT 730,
    report_retention_days INTEGER DEFAULT NULL,  -- NULL = indefinite
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automated cleanup job (runs daily)
-- DELETE interviews older than retention period
-- DELETE participant data if no recent activity
```

### Anonymization

```typescript
interface AnonymizationConfig {
  remove_pii: boolean;          // Remove names, emails
  generalize_demographics: boolean;  // Age ranges instead of exact
  redact_quotes: boolean;       // Remove identifying info from quotes
}

function anonymizeReport(
  report: StudyReport,
  config: AnonymizationConfig
): StudyReport {
  if (config.remove_pii) {
    // Replace participant names with "Participant 1", "Participant 2", etc.
    // Remove any email addresses
  }

  if (config.generalize_demographics) {
    // Convert age 27 → "25-34"
    // Convert city → region
  }

  if (config.redact_quotes) {
    // Use NER to identify and redact names, places, companies
  }

  return report;
}
```

## 14.3 API Security

```typescript
// Rate limiting configuration

const rateLimits = {
  // Public endpoints (interview links)
  interview: {
    window: '1m',
    max: 30,  // 30 requests per minute per IP
  },

  // Authenticated API
  api: {
    window: '1m',
    max: 100,  // 100 requests per minute per user
  },

  // Heavy operations
  import: {
    window: '1h',
    max: 10,  // 10 imports per hour per org
  },

  // Report generation
  report: {
    window: '1h',
    max: 5,  // 5 reports per hour per org
  },
};

// Input validation example
const createStudySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  research_intent: z.object({
    goal: z.string().min(10).max(1000),
    question_seeds: z.array(z.string().max(500)).min(1).max(10),
    study_type: z.enum([
      'product_feedback',
      'concept_test',
      'churn_analysis',
      'ux_research',
      'brand_perception',
      'custom'
    ]),
  }),
  // ... etc
});
```

---

# 15. Analytics & Metrics

## 15.1 Product Metrics

### North Star Metric

**"Insight Quality Score per Study"**

A composite score measuring:
- Question quality distribution (% good)
- Answer depth (average depth score)
- Research goal coverage (themes matching intent)
- Actionability (recommendations generated)

```typescript
function calculateInsightQualityScore(study: StudyWithData): number {
  const weights = {
    questionQuality: 0.25,
    answerDepth: 0.25,
    goalCoverage: 0.25,
    actionability: 0.25,
  };

  const questionQuality = study.qualityLabels
    .filter(l => l.label === 'good').length / study.qualityLabels.length;

  const answerDepth = average(
    study.qualityLabels.map(l => l.scores.depth)
  );

  const goalCoverage = calculateGoalCoverage(
    study.researchIntent,
    study.report.theme_analysis
  );

  const actionability = study.report.recommendations.length >= 3 ? 1.0 :
    study.report.recommendations.length / 3;

  return (
    questionQuality * weights.questionQuality +
    answerDepth * weights.answerDepth +
    goalCoverage * weights.goalCoverage +
    actionability * weights.actionability
  );
}
```

### Supporting Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| Completion Rate | % of started interviews completed | > 85% |
| Time to Insight | Hours from study launch to report | < 48h |
| Avg Follow-up Depth | Questions before topic change | > 2.5 |
| Participant Satisfaction | Post-interview rating | > 4.2/5 |
| Cost per Interview | Total cost / completed interviews | < $5 |

## 15.2 Operational Metrics

```yaml
System Health:

1. Availability:
   - API uptime target: 99.9%
   - Interview success rate: > 95%

2. Latency:
   - Question generation p95: < 2s
   - Avatar video generation p95: < 8s
   - Transcription p95: < 3s
   - Total turn latency p95: < 15s

3. Cost Tracking:
   - LLM tokens per interview
   - Video generation cost per interview
   - Storage cost per study
   - Total cost per completed interview

4. Quality:
   - Error rate per interview
   - Retry rate per turn
   - Fallback activation rate
```

## 15.3 Analytics Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ANALYTICS DASHBOARD                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    OVERVIEW (Last 30 Days)                           │   │
│  │                                                                      │   │
│  │   Studies Created     Interviews Completed     Avg Completion Rate   │   │
│  │        12                    247                    87.3%            │   │
│  │                                                                      │   │
│  │   Insight Score       Avg Interview Time        Cost per Interview   │   │
│  │       0.78                  6.8 min                  $3.42           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    INTERVIEW FUNNEL                                  │   │
│  │                                                                      │   │
│  │   Invited   →   Opened   →   Clicked   →   Started   →   Completed  │   │
│  │     500          412          287          263           230        │   │
│  │    100%         82.4%        57.4%        52.6%         46.0%       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    QUALITY TRENDS                                    │   │
│  │                                                                      │   │
│  │   Question Quality Over Time                                         │   │
│  │   ████████████████████████████████████████████████ 76% Good         │   │
│  │   ██████████████████ 18% Neutral                                    │   │
│  │   ██████ 6% Bad                                                     │   │
│  │                                                                      │   │
│  │   Trend: +5% improvement from last month                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    AVATAR PERFORMANCE                                │   │
│  │                                                                      │   │
│  │   Avatar      Interviews    Completion    Avg Depth    Satisfaction │   │
│  │   Emma            89          91.0%         0.74          4.5       │   │
│  │   Jordan          67          85.1%         0.71          4.3       │   │
│  │   Alex            52          88.5%         0.76          4.6       │   │
│  │   Sarah           39          89.7%         0.72          4.4       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 15.4 Event Tracking

```typescript
// Analytics events to track

const analyticsEvents = {
  // Study lifecycle
  'study.created': { study_id, study_type, target_count },
  'study.launched': { study_id, participant_count },
  'study.completed': { study_id, interview_count, duration_days },

  // Interview lifecycle
  'interview.invited': { study_id, participant_id, channel },
  'interview.started': { session_id, avatar_id },
  'interview.completed': { session_id, duration, question_count },
  'interview.abandoned': { session_id, turn_index, reason },

  // Turn events
  'turn.question_generated': { session_id, turn, latency_ms },
  'turn.video_generated': { session_id, turn, latency_ms },
  'turn.answer_transcribed': { session_id, turn, word_count },
  'turn.quality_scored': { session_id, turn, label, scores },

  // Report events
  'report.generated': { study_id, interview_count, generation_time_ms },
  'report.exported': { study_id, format },

  // Errors
  'error.video_generation': { session_id, error_type },
  'error.transcription': { session_id, error_type },
  'error.agent_timeout': { session_id, agent_type },
};
```

---

# 16. Technical Implementation

## 16.1 Technology Stack Summary

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Frontend** | Next.js 14 + React 18 | SSR, App Router, great DX |
| **Styling** | Tailwind CSS + shadcn/ui | Rapid development, consistency |
| **State** | Zustand + React Query | Simple global state, server state caching |
| **Backend API** | NestJS (Node.js) | TypeScript, modular, real-time support |
| **Agent Services** | FastAPI (Python) | LLM ecosystem, async, ML-friendly |
| **Database** | Supabase (PostgreSQL) | Auth, RLS, real-time, storage included |
| **Cache/Queue** | Redis (Upstash) | Session state, job queues, rate limiting |
| **LLM** | OpenAI GPT-4 | Best reasoning, tool use, reliability |
| **TTS** | ElevenLabs | Natural voices, low latency, many options |
| **STT** | OpenAI Whisper | Accuracy, cost-effective, multilingual |
| **Avatar Video** | HeyGen / D-ID | Full video generation, realistic avatars |
| **Email** | SendGrid / Resend | Deliverability, templates, webhooks |
| **Payouts** | Tremendous | Gift cards, global support, API-first |
| **Hosting** | Vercel (frontend) | Edge, fast deploys, preview URLs |
| **Hosting** | Railway/Render (backend) | Easy deploys, auto-scaling |
| **Monitoring** | Sentry + Posthog | Error tracking, product analytics |

## 16.2 Development Environment Setup

```bash
# Prerequisites
node >= 20.0.0
python >= 3.11
pnpm >= 8.0.0

# Clone and setup
git clone https://github.com/your-org/chorus.git
cd chorus

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local
# Fill in required values:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_KEY
# - OPENAI_API_KEY
# - HEYGEN_API_KEY
# - ELEVENLABS_API_KEY
# - SENDGRID_API_KEY

# Setup Python agents
cd apps/agents
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run database migrations
pnpm db:migrate

# Seed initial data (avatars, guardrail profiles)
pnpm db:seed

# Start development servers
pnpm dev  # Starts all services concurrently
```

## 16.3 Project Structure Detail

```
chorus/
├── apps/
│   ├── web/                          # Next.js frontend
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── signup/page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── studies/
│   │   │   │   │   ├── page.tsx           # Studies list
│   │   │   │   │   ├── new/page.tsx       # Create study
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx       # Study detail
│   │   │   │   │       ├── report/page.tsx
│   │   │   │   │       └── settings/page.tsx
│   │   │   │   ├── participants/
│   │   │   │   │   ├── page.tsx           # Participants list
│   │   │   │   │   └── import/page.tsx    # Import wizard
│   │   │   │   ├── integrations/page.tsx
│   │   │   │   ├── settings/page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── (interview)/
│   │   │   │   └── i/[token]/
│   │   │   │       ├── page.tsx           # Interview landing
│   │   │   │       └── session/page.tsx   # Active interview
│   │   │   ├── api/                       # API routes (minimal)
│   │   │   │   └── webhooks/
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/                        # shadcn components
│   │   │   ├── studies/
│   │   │   │   ├── StudyCard.tsx
│   │   │   │   ├── StudyForm.tsx
│   │   │   │   ├── StudyProgress.tsx
│   │   │   │   └── ReportViewer.tsx
│   │   │   ├── interview/
│   │   │   │   ├── InterviewPlayer.tsx
│   │   │   │   ├── AvatarVideo.tsx
│   │   │   │   ├── AudioRecorder.tsx
│   │   │   │   └── ProgressIndicator.tsx
│   │   │   └── shared/
│   │   ├── hooks/
│   │   │   ├── useStudy.ts
│   │   │   ├── useInterview.ts
│   │   │   └── useAudioRecorder.ts
│   │   ├── lib/
│   │   │   ├── supabase/
│   │   │   │   ├── client.ts
│   │   │   │   └── server.ts
│   │   │   ├── api.ts                     # API client
│   │   │   └── utils.ts
│   │   └── styles/
│   │       └── globals.css
│   │
│   ├── api/                              # NestJS backend
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── auth/
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── guards/
│   │   │   │   │   └── jwt.guard.ts
│   │   │   │   └── decorators/
│   │   │   │       └── user.decorator.ts
│   │   │   ├── studies/
│   │   │   │   ├── studies.module.ts
│   │   │   │   ├── studies.controller.ts
│   │   │   │   ├── studies.service.ts
│   │   │   │   └── dto/
│   │   │   │       ├── create-study.dto.ts
│   │   │   │       └── update-study.dto.ts
│   │   │   ├── participants/
│   │   │   │   ├── participants.module.ts
│   │   │   │   ├── participants.controller.ts
│   │   │   │   ├── participants.service.ts
│   │   │   │   └── import/
│   │   │   │       ├── csv.processor.ts
│   │   │   │       └── json.processor.ts
│   │   │   ├── interviews/
│   │   │   │   ├── interviews.module.ts
│   │   │   │   ├── interviews.controller.ts
│   │   │   │   ├── interviews.service.ts
│   │   │   │   ├── interviews.gateway.ts    # WebSocket
│   │   │   │   └── orchestrator/
│   │   │   │       ├── interview-orchestrator.ts
│   │   │   │       └── turn-handler.ts
│   │   │   ├── agents/
│   │   │   │   ├── agents.module.ts
│   │   │   │   └── agents.client.ts         # HTTP client to Python
│   │   │   ├── integrations/
│   │   │   │   ├── integrations.module.ts
│   │   │   │   └── shopify/
│   │   │   │       ├── shopify.service.ts
│   │   │   │       └── shopify.controller.ts
│   │   │   ├── reports/
│   │   │   │   ├── reports.module.ts
│   │   │   │   ├── reports.service.ts
│   │   │   │   └── export/
│   │   │   │       ├── pdf.exporter.ts
│   │   │   │       └── slides.exporter.ts
│   │   │   ├── payouts/
│   │   │   │   ├── payouts.module.ts
│   │   │   │   ├── payouts.service.ts
│   │   │   │   └── tremendous.client.ts
│   │   │   └── common/
│   │   │       ├── filters/
│   │   │       ├── interceptors/
│   │   │       └── pipes/
│   │   └── test/
│   │
│   └── agents/                           # Python FastAPI
│       ├── app/
│       │   ├── main.py
│       │   ├── config.py
│       │   ├── agents/
│       │   │   ├── __init__.py
│       │   │   ├── base_agent.py
│       │   │   ├── question_agent.py
│       │   │   ├── quality_agent.py
│       │   │   ├── summary_agent.py
│       │   │   ├── selection_agent.py
│       │   │   └── overview_agent.py
│       │   ├── services/
│       │   │   ├── __init__.py
│       │   │   ├── openai_service.py
│       │   │   ├── heygen_service.py
│       │   │   ├── elevenlabs_service.py
│       │   │   └── whisper_service.py
│       │   ├── models/
│       │   │   ├── __init__.py
│       │   │   ├── study.py
│       │   │   ├── participant.py
│       │   │   └── interview.py
│       │   └── routers/
│       │       ├── __init__.py
│       │       ├── question.py
│       │       ├── quality.py
│       │       ├── avatar.py
│       │       └── transcribe.py
│       ├── tests/
│       ├── requirements.txt
│       └── Dockerfile
│
├── packages/
│   ├── database/
│   │   ├── migrations/
│   │   │   ├── 001_initial.sql
│   │   │   ├── 002_avatars.sql
│   │   │   └── 003_guardrails.sql
│   │   ├── seed/
│   │   │   ├── avatars.sql
│   │   │   └── guardrails.sql
│   │   └── types/
│   │       └── database.types.ts          # Generated Supabase types
│   │
│   ├── shared/
│   │   ├── types/
│   │   │   ├── index.ts
│   │   │   ├── study.ts
│   │   │   ├── participant.ts
│   │   │   ├── interview.ts
│   │   │   └── report.ts
│   │   └── utils/
│   │       ├── validators.ts
│   │       └── formatters.ts
│   │
│   └── ui/
│       └── components/
│           ├── Button.tsx
│           ├── Input.tsx
│           └── Card.tsx
│
├── docs/
│   ├── PRD.md                            # This document
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── CONTRIBUTING.md
│
├── docker-compose.yml
├── turbo.json
├── package.json
├── pnpm-workspace.yaml
├── .env.example
└── README.md
```

## 16.4 Key Implementation Patterns

### Interview Orchestrator

```typescript
// apps/api/src/interviews/orchestrator/interview-orchestrator.ts

@Injectable()
export class InterviewOrchestrator {
  constructor(
    private readonly agentsClient: AgentsClient,
    private readonly heygenService: HeyGenService,
    private readonly supabase: SupabaseService,
    private readonly redis: RedisService,
  ) {}

  async initializeSession(
    assignment: StudyAssignment,
    study: Study,
    participant: Participant,
    avatar: Avatar,
  ): Promise<InterviewSession> {
    // 1. Create session record
    const session = await this.supabase.from('interview_sessions').insert({
      assignment_id: assignment.id,
      study_id: study.id,
      participant_id: participant.id,
      avatar_id: avatar.id,
      status: 'initialized',
      config_snapshot: study.interview_config,
    }).select().single();

    // 2. Initialize context in Redis for fast access
    await this.redis.hset(`session:${session.id}`, {
      research_intent: JSON.stringify(study.research_intent),
      participant_profile: JSON.stringify(this.buildProfile(participant)),
      avatar_profile: JSON.stringify(avatar),
      guardrail_config: JSON.stringify(
        await this.getGuardrailConfig(study.guardrail_profile)
      ),
      conversation_history: '[]',
      current_turn: '0',
    });

    return session;
  }

  async processNextTurn(sessionId: string): Promise<TurnResult> {
    // 1. Get context from Redis
    const context = await this.redis.hgetall(`session:${sessionId}`);

    // 2. Check stop conditions
    const turnIndex = parseInt(context.current_turn);
    const config = JSON.parse(context.config_snapshot || '{}');

    if (turnIndex >= config.max_questions) {
      return this.wrapUp(sessionId);
    }

    // 3. Generate question
    const questionResult = await this.agentsClient.generateQuestion({
      session_id: sessionId,
      research_intent: JSON.parse(context.research_intent),
      participant_profile: JSON.parse(context.participant_profile),
      avatar_profile: JSON.parse(context.avatar_profile),
      guardrail_config: JSON.parse(context.guardrail_config),
      conversation_history: JSON.parse(context.conversation_history),
      good_patterns: await this.getGoodPatterns(context.study_id),
      bad_patterns: await this.getBadPatterns(context.study_id),
    });

    if (questionResult.action === 'end') {
      return this.wrapUp(sessionId);
    }

    // 4. Generate avatar video
    const videoResult = await this.heygenService.generateAndWait(
      JSON.parse(context.avatar_profile),
      questionResult.question_text,
    );

    // 5. Return turn data
    return {
      turn_index: turnIndex,
      question: {
        text: questionResult.question_text,
        type: questionResult.question_type,
        video_url: videoResult.video_url,
        audio_url: videoResult.audio_url,
      },
      is_complete: false,
    };
  }

  async submitAnswer(
    sessionId: string,
    turnIndex: number,
    audioBlob: Buffer,
  ): Promise<void> {
    // 1. Transcribe audio
    const transcript = await this.agentsClient.transcribe(audioBlob);

    // 2. Get current context
    const context = await this.redis.hgetall(`session:${sessionId}`);
    const history = JSON.parse(context.conversation_history);

    // 3. Add to history
    history.push({
      turn_index: turnIndex,
      question_text: context.pending_question,
      answer_transcript: transcript.text,
    });

    // 4. Persist to database
    const qaTurn = await this.supabase.from('qa_turns').insert({
      session_id: sessionId,
      turn_index: turnIndex,
      question_text: context.pending_question,
      question_type: context.pending_question_type,
      answer_transcript: transcript.text,
      answer_duration_seconds: transcript.duration,
      answer_word_count: transcript.text.split(/\s+/).length,
    }).select().single();

    // 5. Score quality (async, don't wait)
    this.scoreQualityAsync(qaTurn);

    // 6. Update Redis
    await this.redis.hset(`session:${sessionId}`, {
      conversation_history: JSON.stringify(history),
      current_turn: (turnIndex + 1).toString(),
    });
  }

  private async scoreQualityAsync(qaTurn: QATurn): Promise<void> {
    try {
      const qualityResult = await this.agentsClient.scoreQuality({
        question_text: qaTurn.question_text,
        answer_transcript: qaTurn.answer_transcript,
        research_goal: qaTurn.research_goal,
        turn_index: qaTurn.turn_index,
      });

      await this.supabase.from('qa_quality_labels').insert({
        qa_turn_id: qaTurn.id,
        label: qualityResult.label,
        scores: qualityResult.scores,
        reasoning: qualityResult.reasoning,
      });
    } catch (error) {
      // Log but don't fail the interview
      console.error('Quality scoring failed:', error);
    }
  }
}
```

### WebSocket Gateway

```typescript
// apps/api/src/interviews/interviews.gateway.ts

@WebSocketGateway({
  namespace: '/interview',
  cors: { origin: process.env.FRONTEND_URL },
})
export class InterviewsGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly orchestrator: InterviewOrchestrator,
  ) {}

  @SubscribeMessage('start')
  async handleStart(
    @MessageBody() data: { token: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const session = await this.orchestrator.startSession(data.token);
    client.join(`session:${session.id}`);

    // Send first question
    const turn = await this.orchestrator.processNextTurn(session.id);
    client.emit('question:ready', turn);
  }

  @SubscribeMessage('audio:complete')
  async handleAudioComplete(
    @MessageBody() data: { session_id: string; turn_index: number; audio: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const audioBuffer = Buffer.from(data.audio, 'base64');

    // Process answer
    await this.orchestrator.submitAnswer(
      data.session_id,
      data.turn_index,
      audioBuffer,
    );

    // Generate next turn
    const turn = await this.orchestrator.processNextTurn(data.session_id);

    if (turn.is_complete) {
      client.emit('interview:complete', {
        message: 'Thank you for your time!',
        payout_info: turn.payout_info,
      });
    } else {
      client.emit('question:ready', turn);
    }
  }
}
```

---

# 17. Roadmap

## 17.1 Phase Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ROADMAP                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PHASE 0: Foundation (Weeks 1-2)                                            │
│  ───────────────────────────────                                            │
│  ☐ Project setup (monorepo, CI/CD)                                          │
│  ☐ Supabase setup (DB, Auth, Storage)                                       │
│  ☐ Basic Next.js app with auth                                              │
│  ☐ Basic NestJS API structure                                               │
│  ☐ Python FastAPI agents scaffold                                           │
│                                                                              │
│  PHASE 1: Core Loop (Weeks 3-6)                                             │
│  ─────────────────────────────                                               │
│  ☐ Study CRUD                                                                │
│  ☐ Participant import (CSV/JSON)                                            │
│  ☐ Question Agent (basic)                                                    │
│  ☐ Avatar integration (HeyGen)                                              │
│  ☐ Interview session (full loop)                                            │
│  ☐ Basic quality scoring                                                     │
│                                                                              │
│  PHASE 2: Polish (Weeks 7-10)                                               │
│  ──────────────────────────                                                  │
│  ☐ Multi-avatar support                                                      │
│  ☐ Avatar selection algorithm                                               │
│  ☐ Interview summary generation                                              │
│  ☐ Study-level reports                                                       │
│  ☐ Shopify integration                                                       │
│  ☐ Dashboard polish                                                          │
│                                                                              │
│  PHASE 3: Launch Prep (Weeks 11-12)                                         │
│  ───────────────────────────────                                             │
│  ☐ Quality learning loop                                                     │
│  ☐ Payout integration                                                        │
│  ☐ Error handling & recovery                                                │
│  ☐ Performance optimization                                                  │
│  ☐ Security audit                                                            │
│  ☐ Documentation                                                             │
│                                                                              │
│  MVP LAUNCH 🚀                                                               │
│                                                                              │
│  POST-MVP (Months 4-6)                                                       │
│  ─────────────────────                                                       │
│  ☐ More integrations (Salesforce, HubSpot)                                  │
│  ☐ Advanced report exports (PDF, slides)                                    │
│  ☐ A/B testing framework                                                     │
│  ☐ Multi-language support                                                    │
│  ☐ Enterprise features (SSO, audit logs)                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 17.2 Detailed Sprint Plan

### Phase 0: Foundation (Weeks 1-2)

**Week 1: Project Setup**
- [ ] Initialize monorepo with Turborepo
- [ ] Set up Next.js 14 app with App Router
- [ ] Configure Tailwind + shadcn/ui
- [ ] Set up NestJS backend
- [ ] Set up FastAPI agents service
- [ ] Configure Docker Compose for local dev
- [ ] Set up GitHub Actions CI

**Week 2: Infrastructure**
- [ ] Create Supabase project
- [ ] Run initial migrations
- [ ] Configure Supabase Auth
- [ ] Set up Redis (Upstash)
- [ ] Configure environment variables
- [ ] Basic auth flow (signup/login)
- [ ] Organization creation

### Phase 1: Core Loop (Weeks 3-6)

**Week 3: Study Management**
- [ ] Studies list page
- [ ] Create study form
- [ ] Study detail page
- [ ] Research intent configuration
- [ ] Interview config (questions, duration)
- [ ] Target demographics selector

**Week 4: Participants**
- [ ] Participants list page
- [ ] CSV import wizard
- [ ] JSON import support
- [ ] Participant detail view
- [ ] Basic filtering/search
- [ ] Tag management

**Week 5: Interview Core**
- [ ] Question Agent implementation
- [ ] HeyGen integration
- [ ] ElevenLabs TTS integration
- [ ] Whisper transcription
- [ ] Interview landing page
- [ ] Consent flow

**Week 6: Interview Loop**
- [ ] WebSocket gateway
- [ ] Interview orchestrator
- [ ] Audio recording in browser
- [ ] Video playback
- [ ] Turn-by-turn flow
- [ ] Session persistence
- [ ] Basic completion handling

### Phase 2: Polish (Weeks 7-10)

**Week 7: Avatar System**
- [ ] Avatar catalog (seed data)
- [ ] Avatar selection algorithm
- [ ] Selection Agent
- [ ] Demographic matching
- [ ] Avatar preview in dashboard

**Week 8: Quality & Summaries**
- [ ] Quality Agent implementation
- [ ] Score storage and display
- [ ] Interview Summary Agent
- [ ] Per-interview summary view
- [ ] Pattern extraction (basic)

**Week 9: Reports**
- [ ] Overview Agent implementation
- [ ] Study report generation
- [ ] Report viewer component
- [ ] Quote highlighting
- [ ] Theme visualization
- [ ] Persona clusters

**Week 10: Integrations**
- [ ] Shopify OAuth flow
- [ ] Shopify customer sync
- [ ] Integration settings page
- [ ] Sync status display
- [ ] Import from Shopify UI

### Phase 3: Launch Prep (Weeks 11-12)

**Week 11: Quality & Reliability**
- [ ] Learning loop (patterns → Question Agent)
- [ ] Error handling throughout
- [ ] Retry logic
- [ ] Fallback chains (video → audio → text)
- [ ] Session recovery
- [ ] Performance monitoring

**Week 12: Launch Ready**
- [ ] Payout integration (Tremendous)
- [ ] Email templates (invitation, completion)
- [ ] Security review
- [ ] Rate limiting
- [ ] Documentation
- [ ] Landing page
- [ ] Beta testing

## 17.3 Success Criteria for MVP

| Criteria | Target |
|----------|--------|
| Study creation works end-to-end | ✓ |
| CSV import working | ✓ |
| Shopify integration working | ✓ |
| Full interview loop (Q→A→Q) | ✓ |
| Avatar video plays smoothly | ✓ |
| Transcription accuracy | > 90% |
| Interview completion rate | > 80% |
| Report generated successfully | ✓ |
| Time from study launch to report | < 72h |
| System uptime | > 99% |
| No critical security issues | ✓ |

## 17.4 Future Vision (V2+)

```yaml
Short Term (3-6 months post-MVP):
  - Salesforce + HubSpot integrations
  - PDF/PowerPoint export
  - Multi-language support (5+ languages)
  - Mobile-optimized interview experience
  - A/B testing for question strategies
  - Custom avatar personas per organization

Medium Term (6-12 months):
  - Real-time streaming avatars
  - Emotion detection from voice
  - Sentiment analysis during interview
  - Adaptive pacing based on participant
  - Longitudinal studies (same participant over time)
  - Team collaboration features
  - API for programmatic access

Long Term (12+ months):
  - On-premise deployment option
  - Custom LLM fine-tuning per org
  - Voice cloning for brand consistency
  - AR/VR interview experiences
  - Marketplace for research templates
  - Benchmarking across industries
```

---

# Appendix A: Environment Variables

```bash
# .env.example

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Redis (Upstash)
REDIS_URL=redis://xxx

# OpenAI
OPENAI_API_KEY=sk-xxx

# HeyGen
HEYGEN_API_KEY=xxx

# ElevenLabs
ELEVENLABS_API_KEY=xxx

# Shopify (OAuth)
SHOPIFY_CLIENT_ID=xxx
SHOPIFY_CLIENT_SECRET=xxx

# SendGrid
SENDGRID_API_KEY=xxx

# Tremendous (Payouts)
TREMENDOUS_API_KEY=xxx

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
API_URL=http://localhost:4000
AGENTS_URL=http://localhost:8000

# Sentry (optional)
SENTRY_DSN=xxx
```

---

# Appendix B: Glossary

| Term | Definition |
|------|------------|
| **Study** | A research project with a specific goal, targeting specific participants |
| **QID** | Study identifier (legacy term from whiteboard) |
| **Participant** | A customer/respondent who may be invited to interviews |
| **Assignment** | Links a participant to a study with an avatar |
| **Session** | A single interview instance |
| **Turn** | One question-answer exchange |
| **Avatar** | AI interviewer persona with voice and video |
| **Research Intent** | The goal and context for a study |
| **Guardrail** | Rules controlling interview behavior |
| **Quality Label** | Good/neutral/bad scoring of a Q&A pair |

---

*Document Version: 1.0*
*Last Updated: January 2026*
*Author: AI Product Assistant*
