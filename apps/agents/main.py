from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv

load_dotenv(dotenv_path="../../.env")
load_dotenv(dotenv_path="../../.env.local", override=True)

from routers import question, quality, summary, overview, avatar, transcribe, avatar_selection, participant_selection, aggregate, realtime_interview, realtime_interview_simple

app = FastAPI(
    title="Chorus Agents API",
    description="AI agents for interview question generation, quality scoring, and summarization",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(question.router, prefix="/api/agents", tags=["Question Agent"])
app.include_router(quality.router, prefix="/api/agents", tags=["Quality Agent"])
app.include_router(summary.router, prefix="/api/agents", tags=["Summary Agent"])
app.include_router(overview.router, prefix="/api/agents", tags=["Overview Agent"])
app.include_router(avatar.router, prefix="/api/agents", tags=["Avatar Agent"])
app.include_router(transcribe.router, prefix="/api/agents", tags=["Transcription"])
app.include_router(avatar_selection.router, prefix="/api/agents", tags=["Avatar Selection"])
app.include_router(participant_selection.router, prefix="/api/agents", tags=["Participant Selection"])
app.include_router(aggregate.router, prefix="/api/agents", tags=["Aggregate Summary Agent"])
app.include_router(realtime_interview.router, prefix="/api/agents", tags=["Realtime Interview (Legacy)"])
app.include_router(realtime_interview_simple.router, prefix="/api/agents", tags=["Simple Interview"])

@app.get("/")
async def root():
    return {
        "message": "Chorus Agents API",
        "version": "1.0.0",
        "docs": "/docs",
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
