from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
from openai import OpenAI
from supabase import create_client, Client

router = APIRouter()
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = (
    os.getenv("SUPABASE_SERVICE_KEY")
    or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
)
if not supabase_url:
    raise ValueError("Supabase URL is missing. Set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL.")
if not supabase_key:
    raise ValueError(
        "Supabase key is missing. Set SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY."
    )
supabase: Client = create_client(supabase_url, supabase_key)

class SummaryRequest(BaseModel):
    sessionId: str

class SummaryResponse(BaseModel):
    session_id: str
    key_insights: List[str]
    sentiment: str
    themes: List[str]
    notable_quotes: List[str]
    positive_feedback: List[str]
    negative_feedback: List[str]
    summary_text: str

@router.post("/summary", response_model=SummaryResponse)
async def generate_session_summary(request: SummaryRequest):
    """
    Summary Agent: Generate a summary of a completed interview session using GPT-4.
    """
    try:
        # Fetch session and Q&A turns from database
        qa_turns = supabase.table("qa_turns").select("*").eq("session_id", request.sessionId).order("turn_index").execute()

        if not qa_turns.data:
            raise HTTPException(status_code=404, detail="Session not found or has no Q&A turns")

        # Build conversation text
        conversation = "\n\n".join([
            f"Q: {turn['question_text']}\nA: {turn['answer_transcript']}"
            for turn in qa_turns.data
            if turn.get('answer_transcript') and turn['answer_transcript'] != '[SKIPPED]'
        ])

        # Generate summary with GPT-4
        system_prompt = """You are an expert at analyzing qualitative research interviews.
Analyze the following interview and provide:

1. Key Insights: 3-5 most important takeaways
2. Sentiment: Overall participant sentiment (positive, neutral, negative, mixed)
3. Themes: Main topics/themes discussed
4. Notable Quotes: 2-3 most interesting or revealing quotes
5. Positive Feedback: Things the participant liked, praised, or expressed satisfaction about
6. Negative Feedback: Things the participant disliked, complained about, or expressed frustration with
7. Summary: A concise paragraph summarizing the interview

Return your analysis as JSON with this structure:
{
  "key_insights": [<list of insights>],
  "sentiment": "<sentiment>",
  "themes": [<list of themes>],
  "notable_quotes": [<list of quotes>],
  "positive_feedback": [<list of positive points>],
  "negative_feedback": [<list of negative points>],
  "summary_text": "<summary paragraph>"
}"""

        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Interview:\n\n{conversation}"}
            ],
            temperature=0.5,
            max_tokens=1000,
            response_format={"type": "json_object"}
        )

        import json
        result = json.loads(response.choices[0].message.content)

        # Save summary to database
        summary_data = {
            "session_id": request.sessionId,
            **result
        }

        try:
            supabase.table("interview_summaries").insert(summary_data).execute()
        except Exception as db_error:
            # Log the error but don't fail the request
            print(f"Warning: Could not save to database: {db_error}")

        return SummaryResponse(
            session_id=request.sessionId,
            **result
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary generation failed: {str(e)}")
