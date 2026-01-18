from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
from supabase import create_client, Client
from services.wordware_client import get_wordware_client, WordwareClient
import json
from datetime import datetime

router = APIRouter()

# Initialize Supabase client
supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

class AggregateSummaryRequest(BaseModel):
    research_question_id: str
    recompute: bool = False

class StatisticItem(BaseModel):
    percentage: str
    description: str

class AggregateSummaryResponse(BaseModel):
    research_question_id: str
    statistics: List[StatisticItem]
    pros: List[str]
    cons: List[str]
    total_responses_analyzed: int
    generated_at: str

@router.post("/aggregate-summary", response_model=AggregateSummaryResponse)
async def generate_aggregate_summary(
    request: AggregateSummaryRequest,
    wordware: WordwareClient = Depends(get_wordware_client)
):
    """
    Aggregate Summary Agent: Analyze multiple interview sessions for a research question
    to generate percentages, statistics, and pros/cons using Wordware AI.
    """
    try:
        # 1. Check if we already have a recent summary
        if not request.recompute:
            existing = supabase.table("research_question_aggregate_summaries") \
                .select("*") \
                .eq("research_question_id", request.research_question_id) \
                .order("generated_at", desc=True) \
                .limit(1) \
                .execute()
            
            if existing.data:
                item = existing.data[0]
                return AggregateSummaryResponse(
                    research_question_id=item["research_question_id"],
                    statistics=[StatisticItem(**s) for s in item["statistics"]],
                    pros=item["pros"],
                    cons=item["cons"],
                    total_responses_analyzed=item["total_responses_analyzed"],
                    generated_at=item["generated_at"]
                )

        # 2. Fetch the research question details
        rq_res = supabase.table("research_questions").select("*").eq("id", request.research_question_id).single().execute()
        if not rq_res.data:
            raise HTTPException(status_code=404, detail="Research question not found")
        
        research_question_text = rq_res.data.get("root_question", "General research study")

        # 3. Fetch all completed sessions for this research question
        # We need to find assignments -> sessions
        assignments = supabase.table("research_question_assignments") \
            .select("id") \
            .eq("research_question_id", request.research_question_id) \
            .execute()
        
        assignment_ids = [a["id"] for a in assignments.data]
        if not assignment_ids:
            return AggregateSummaryResponse(
                research_question_id=request.research_question_id,
                statistics=[],
                pros=[],
                cons=[],
                total_responses_analyzed=0,
                generated_at=datetime.now().isoformat()
            )

        # Fetch sessions for these assignments (Wait, the schema in initial showed sessions linked to assignment_id)
        # Note: 001_initial has interview_sessions(assignment_id)
        sessions = supabase.table("interview_sessions") \
            .select("id") \
            .in_("assignment_id", assignment_ids) \
            .eq("status", "completed") \
            .execute()
        
        session_ids = [s["id"] for s in sessions.data]
        if not session_ids:
            raise HTTPException(status_code=400, detail="No completed sessions found for this research question")

        # 4. Fetch all QA turns for these sessions
        qa_turns = supabase.table("qa_turns") \
            .select("session_id, question_text, answer_transcript") \
            .in_("session_id", session_ids) \
            .order("session_id") \
            .order("turn_index") \
            .execute()

        # 5. Group by session to build transcripts
        session_transcripts = {}
        for turn in qa_turns.data:
            sid = turn["session_id"]
            if sid not in session_transcripts:
                session_transcripts[sid] = []
            
            q = turn.get("question_text", "")
            a = turn.get("answer_transcript", "") or "[No response]"
            session_transcripts[sid].append(f"Q: {q}\nA: {a}")
        
        transcripts_data = [
            {"content": "\n".join(turns)} 
            for sid, turns in session_transcripts.items()
        ]

        # 6. Call Wordware AI
        app_id = os.getenv("WORDWARE_AGGREGATE_APP_ID")
        if not app_id:
            raise HTTPException(status_code=500, detail="WORDWARE_AGGREGATE_APP_ID is not configured")

        wordware_response = await wordware.generate_aggregate_summary(
            app_id=app_id,
            transcripts=transcripts_data,
            research_question=research_question_text
        )

        # Expected structured response from Wordware:
        # {
        #   "statistics": [{"percentage": "70%", "description": "use water bottle for more than 4 hours"}],
        #   "pros": ["Eco-friendly", "Durable"],
        #   "cons": ["Heavy", "Hard to clean"],
        #   "model_version": "gpt-4"
        # }
        
        # Wordware client _collect_streaming_response returns the last chunk
        # Let's extract the actual data from Wordware's output format
        # Wordware typically puts the output in an 'output' or 'value' field depending on how it's set up
        
        output = wordware_response.get("value", wordware_response)
        if isinstance(output, str):
            try:
                output = json.loads(output)
            except:
                pass

        stats = output.get("statistics", [])
        pros = output.get("pros", [])
        cons = output.get("cons", [])
        model_version = output.get("model_version", "unknown")

        # 7. Save to database
        summary_data = {
            "research_question_id": request.research_question_id,
            "statistics": stats,
            "pros": pros,
            "cons": cons,
            "total_responses_analyzed": len(session_ids),
            "generated_at": datetime.now().isoformat(),
            "wordware_model_version": model_version,
            "raw_response": wordware_response
        }

        supabase.table("research_question_aggregate_summaries").insert(summary_data).execute()

        return AggregateSummaryResponse(
            research_question_id=request.research_question_id,
            statistics=[StatisticItem(**s) for s in stats],
            pros=pros,
            cons=cons,
            total_responses_analyzed=len(session_ids),
            generated_at=summary_data["generated_at"]
        )

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Aggregate summary generation failed: {str(e)}")
