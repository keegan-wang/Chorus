# Chorus

AI-Powered Dynamic Customer Research Platform

> Qualitative depth at quantitative scale.

Chorus enables companies to run fully automated, AI-driven, avatar-based interviews that adapt in real time, learn which questions work, and synthesize results into research-grade reports.

## Features

- **AI Video Avatars** - Realistic video avatars conduct interviews using HeyGen/D-ID
- **Adaptive Questioning** - Questions adapt dynamically based on responses
- **Quality Learning Loop** - System learns which questions yield best insights
- **Demographic-Aware Avatar Selection** - Avatars matched to participants for comfort
- **Automated Reports** - Full research reports generated automatically
- **Multi-Source Data Import** - CSV, JSON, Shopify integration

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, Tailwind CSS |
| Backend API | NestJS (Node.js) |
| Agent Services | FastAPI (Python) |
| Database | Supabase (PostgreSQL) |
| Cache/Queue | Redis (Upstash) |
| LLM | OpenAI GPT-4 |
| TTS | ElevenLabs |
| STT | OpenAI Whisper |
| Video Avatars | HeyGen / D-ID |

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Python >= 3.11
- Docker (optional, for Redis)

### Installation

```bash
# Clone the repository
git clone https://github.com/keegan-wang/Chorus.git
cd Chorus

# Install JavaScript dependencies
pnpm install

# Install Python dependencies for agents
cd apps/agents
pip install -r requirements.txt
cd ../..

# Copy environment variables
cp .env.example .env
# Fill in required values in .env:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_KEY
# - OPENAI_API_KEY
# - HEYGEN_API_KEY (optional)
# - ELEVENLABS_API_KEY (optional)

# Start Redis (if using Docker)
docker-compose up -d

# Run database migrations
cd packages/database
psql $SUPABASE_URL < migrations/001_initial.sql
psql $SUPABASE_URL < migrations/002_views.sql

# Seed initial data
psql $SUPABASE_URL < seed/001_guardrails.sql
psql $SUPABASE_URL < seed/002_avatars.sql
cd ../..

# Start all development servers
pnpm dev
```

This will start:
- Frontend (Next.js) on http://localhost:3000
- Backend API (NestJS) on http://localhost:3001
- Python Agents on http://localhost:8000

### Project Structure

```
chorus/
├── apps/
│   ├── web/          # Next.js frontend
│   ├── api/          # NestJS backend
│   └── agents/       # Python FastAPI agents
├── packages/
│   ├── database/     # Supabase migrations & types
│   ├── shared/       # Shared TypeScript types
│   └── ui/           # Shared UI components
└── docs/             # Documentation
```

## Documentation

- [PRD (Product Requirements Document)](./docs/PRD.md)
- [API Documentation](./docs/API.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## Development

```bash
# Run all services in development mode
pnpm dev

# Run only the frontend
pnpm --filter @chorus/web dev

# Run only the backend API
pnpm --filter @chorus/api dev

# Run Python agents service
cd apps/agents && python main.py

# Run type checking
pnpm --filter @chorus/web typecheck
pnpm --filter @chorus/api build

# Run linting
pnpm --filter @chorus/web lint
pnpm --filter @chorus/api lint

# Build for production
pnpm build
```

## Architecture

### Interview Flow

1. **Participant receives email invitation** with unique token link
2. **Participant opens interview** → Session starts
3. **Avatar Selection Agent** selects demographically-appropriate avatar
4. **Question Agent** generates first question from seed questions
5. **Avatar Agent** generates video of avatar asking the question
6. **Participant responds** via text or voice
7. **Transcription** converts audio to text (if voice response)
8. **Quality Agent** scores the Q&A pair
9. **Question Agent** generates next question based on conversation history
10. **Loop continues** until max questions reached
11. **Summary Agent** generates session summary
12. **Overview Agent** generates study-level report when study completes

### Agent Communication

```
Next.js Frontend → NestJS API → Python Agents
                ↓
            Supabase Database
```

All agents communicate via RESTful HTTP APIs. Real-time updates use WebSockets for interview sessions.

## License

Proprietary - All rights reserved.
