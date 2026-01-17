from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
from openai import OpenAI
import json

router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class QualityRequest(BaseModel):
    questionText: str
    answerText: str
    studyContext: Dict[str, Any]

class QualityResponse(BaseModel):
    overall_score: float
    relevance_score: float
    depth_score: float
    clarity_score: float
    actionability_score: float
    flags: List[str]
    rationale: Optional[str] = None

@router.post("/quality", response_model=QualityResponse)
async def score_qa(request: QualityRequest):
    """
    Quality Agent: Score a Q&A pair for quality using GPT-4.
    Scores range from 1-5 with 5 being best.
    """
    try:
        system_prompt = """You are an expert at evaluating qualitative research responses.
Score the following Q&A pair on these dimensions (1-5 scale, 5 is best):

1. RELEVANCE: How relevant is the answer to the question?
2. DEPTH: How detailed and insightful is the response?
3. CLARITY: How clear and understandable is the response?
4. ACTIONABILITY: Does the response provide actionable insights?

Also identify any flags:
- "too_short": Response is too brief
- "off_topic": Response doesn't address the question
- "unclear": Response is confusing or vague
- "generic": Response lacks specificity
- "excellent": Exceptionally valuable response

Return your evaluation as a JSON object with this structure:
{
  "overall_score": <float 1-5>,
  "relevance_score": <float 1-5>,
  "depth_score": <float 1-5>,
  "clarity_score": <float 1-5>,
  "actionability_score": <float 1-5>,
  "flags": [<list of applicable flags>],
  "rationale": "<brief explanation of scores>"
}"""

        user_prompt = f"""Question: {request.questionText}

Answer: {request.answerText}

Evaluate this Q&A pair:"""

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

        return QualityResponse(
            overall_score=float(result.get("overall_score", 3.0)),
            relevance_score=float(result.get("relevance_score", 3.0)),
            depth_score=float(result.get("depth_score", 3.0)),
            clarity_score=float(result.get("clarity_score", 3.0)),
            actionability_score=float(result.get("actionability_score", 3.0)),
            flags=result.get("flags", []),
            rationale=result.get("rationale", "")
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quality scoring failed: {str(e)}")
