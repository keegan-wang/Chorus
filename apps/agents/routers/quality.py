from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
from openai import OpenAI
import json
from supabase import create_client, Client
from datetime import datetime

router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Initialize Supabase Client
url: str = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    raise ValueError("Supabase credentials missing. Check .env")

supabase: Client = create_client(url, key)

class ConversationTurn(BaseModel):
    question: str
    answer: str

class QualityRequest(BaseModel):
    sessionId: str
    questionId: Optional[str] = None
    questionText: str
    answerText: str
    participantContext: Optional[Dict[str, Any]] = None
    conversationHistory: List[ConversationTurn] = []

class QualityResponse(BaseModel):
    overall_score: float
    relevance_score: float
    depth_score: float
    clarity_score: float
    actionability_score: float
    flags: List[str]
    rationale: Optional[str] = None
    qaTurnId: Optional[str] = None
    qualityLabelId: Optional[str] = None

@router.post("/quality", response_model=QualityResponse)
async def score_qa(request: QualityRequest):
    """
    Quality Agent: Score a Q&A pair and save the turn to the DB.
    """
    try:
        # 1. AI Scoring
        system_prompt = """You are an expert at evaluating qualitative research interviews.
Score the following Question & Answer pair (0-100 scale, where 100 is perfect).
Focus on: Did this question elicit a good, deep answer that pushed the research forward?

Dimensions:
1. RELEVANCE: Is the answer on topic?
2. DEPTH: Is it rich, detailed, and specific?
3. CLARITY: Is it easy to understand?
4. ACTIONABILITY: Does it provide usable insights?

Return JSON:
{
  "overall_score": <float 0-100>,
  "relevance_score": <float 0-100>,
  "depth_score": <float 0-100>,
  "clarity_score": <float 0-100>,
  "actionability_score": <float 0-100>,
  "flags": ["too_short", "off_topic", "generic", "excellent", "emotional"],
  "rationale": "<brief explanation>",
  "label": "<good|neutral|bad>"
}"""

        user_prompt = f"""CONTEXT:
Session ID: {request.sessionId}
Total Turns So Far: {len(request.conversationHistory)}

PREVIOUS CONTEXT:
{json.dumps([t.dict() for t in request.conversationHistory[-2:]] if request.conversationHistory else [], indent=2)}

CURRENT INTERACTION (EVALUATE THIS):
Q: {request.questionText}
A: {request.answerText}

Task: Score this specific Q&A pair."""

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,
            max_tokens=400,
            response_format={"type": "json_object"}
        )

        result = json.loads(response.choices[0].message.content)
        
        # 2. DB Persistence (qa_turns)
        qa_turn_data = {
            "session_id": request.sessionId,
            "turn_index": len(request.conversationHistory) + 1,
            "question_text": request.questionText,
            "question_type": "follow_up", # Default
            "answer_transcript": request.answerText,
            "question_generated_at": datetime.now().isoformat(),
            "answer_completed_at": datetime.now().isoformat(),
            "agent_model_version": "gpt-4-quality-v1"
        }
        
        try:
            turn_res = supabase.table("qa_turns").insert(qa_turn_data).execute()
            qa_turn_id = turn_res.data[0]['id']
            
            # 3. DB Persistence (qa_quality_labels)
            label_data = {
                "qa_turn_id": qa_turn_id,
                "label": result.get("label", "neutral"),
                "scores": {
                    "overall": result.get("overall_score"),
                    "relevance": result.get("relevance_score"),
                    "depth": result.get("depth_score"),
                    "clarity": result.get("clarity_score"),
                    "actionability": result.get("actionability_score")
                },
                "reasoning": result.get("rationale"),
                "agent_model_version": "gpt-4-quality-v1"
            }
            
            label_res = supabase.table("qa_quality_labels").insert(label_data).execute()
            quality_label_id = label_res.data[0]['id']
            
        except Exception as db_e:
            print(f"DB Save Error: {db_e}")
            qa_turn_id = None
            quality_label_id = None
            # We don't fail the request if DB fails, but we log it.

        return QualityResponse(
            overall_score=float(result.get("overall_score", 0)),
            relevance_score=float(result.get("relevance_score", 0)),
            depth_score=float(result.get("depth_score", 0)),
            clarity_score=float(result.get("clarity_score", 0)),
            actionability_score=float(result.get("actionability_score", 0)),
            flags=result.get("flags", []),
            rationale=result.get("rationale", ""),
            qaTurnId=qa_turn_id,
            qualityLabelId=quality_label_id
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quality scoring failed: {str(e)}")
