# Chorus Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 20.0.0 ([Download](https://nodejs.org/))
- **pnpm** >= 9.0.0 (`npm install -g pnpm`)
- **Python** >= 3.11 ([Download](https://python.org/))
- **Docker** (optional, for local Redis) ([Download](https://docker.com/))
- **PostgreSQL** (via Supabase) or local installation

## Step 1: Clone the Repository

```bash
git clone https://github.com/keegan-wang/Chorus.git
cd Chorus
```

## Step 2: Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Fill in the following required variables:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-your-openai-key

# Frontend & Backend URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001
AGENTS_API_URL=http://localhost:8000

# Optional: Avatar Services
HEYGEN_API_KEY=your-heygen-key
ELEVENLABS_API_KEY=your-elevenlabs-key

# Optional: Redis (use Upstash for production)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### Getting API Keys

1. **Supabase**: Create a project at [supabase.com](https://supabase.com)
2. **OpenAI**: Get API key at [platform.openai.com](https://platform.openai.com)
3. **HeyGen** (optional): Sign up at [heygen.com](https://heygen.com)
4. **ElevenLabs** (optional): Sign up at [elevenlabs.io](https://elevenlabs.io)

## Step 3: Install Dependencies

### Install JavaScript/TypeScript Dependencies

```bash
pnpm install
```

### Install Python Dependencies

```bash
cd apps/agents
pip install -r requirements.txt
cd ../..
```

## Step 4: Set Up Database

### Using Supabase (Recommended)

1. Create a new project in Supabase
2. Run migrations in the Supabase SQL Editor:

```sql
-- Copy contents from packages/database/migrations/001_initial.sql
-- Then copy contents from packages/database/migrations/002_views.sql
```

3. Seed initial data:

```sql
-- Copy contents from packages/database/seed/001_guardrails.sql
-- Copy contents from packages/database/seed/002_avatars.sql
```

## Step 5: Start Development Servers

### Start All Services

Terminal 1 - Frontend & Backend:
```bash
pnpm dev
```

This starts:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/api/docs

Terminal 2 - Python Agents:
```bash
cd apps/agents
python main.py
```

This starts:
- Agents API: http://localhost:8000
- Agents Docs: http://localhost:8000/docs

### Start Services Individually

**Frontend:**
```bash
pnpm --filter @chorus/web dev
```

**Backend API:**
```bash
pnpm --filter @chorus/api dev
```

**Python Agents:**
```bash
cd apps/agents
python main.py
```

## Step 6: Verify Installation

1. Open http://localhost:3000 - you should see the Chorus landing page
2. Click "Get Started" to create an account
3. After signing up, you'll be redirected to the dashboard
4. Create your first study

## Troubleshooting

### Port Already in Use

If ports 3000, 3001, or 8000 are already in use, you can change them in the respective configuration files.

### Database Connection Issues

- Verify your `SUPABASE_URL` is correct
- Ensure `SUPABASE_SERVICE_KEY` (not anon key) is used in backend
- Check that migrations have been run successfully

### Python Module Not Found

```bash
cd apps/agents
pip install -r requirements.txt --upgrade
```

### OpenAI API Errors

- Verify your API key is valid
- Ensure you have credits in your OpenAI account
- Check the API key has access to GPT-4

## Next Steps

1. Read the [PRD](./PRD.md) to understand the product architecture
2. Explore the API Documentation at http://localhost:3001/api/docs
3. Create your first study in the dashboard
4. Import participants via CSV or manually
5. Send interview invitations
