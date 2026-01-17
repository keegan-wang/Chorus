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
git clone https://github.com/your-org/chorus.git
cd chorus

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
# Fill in required values in .env.local

# Start Redis (if using Docker)
docker-compose up -d redis

# Run database migrations
pnpm db:migrate

# Seed initial data
pnpm db:seed

# Start development servers
pnpm dev
```

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
pnpm --filter web dev

# Run only the API
pnpm --filter api dev

# Run Python agents
cd apps/agents && python -m uvicorn app.main:app --reload

# Run linting
pnpm lint

# Run tests
pnpm test
```

## License

Proprietary - All rights reserved.
