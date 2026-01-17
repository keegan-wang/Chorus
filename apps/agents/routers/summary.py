from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
from openai import OpenAI
from supabase import create_client, Client

router = APIRouter()
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Initialize Supabase client
supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

class SummaryRequest(BaseModel):
    sessionId: str

class SummaryResponse(BaseModel):
    session_id: str
    key_insights: List[str]
    sentiment: str
    themes: List[str]
    notable_quotes: List[str]
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
            f"Q: {turn['question_text']}\nA: {turn['answer_text']}"
            for turn in qa_turns.data
            if turn['answer_text'] and turn['answer_text'] != '[SKIPPED]'
        ])

        # Generate summary with GPT-4
        system_prompt = """You are an expert at analyzing qualitative research interviews.
Analyze the following interview and provide:

1. Key Insights: 3-5 most important takeaways
2. Sentiment: Overall participant sentiment (positive, neutral, negative, mixed)
3. Themes: Main topics/themes discussed
4. Notable Quotes: 2-3 most interesting or revealing quotes
5. Summary: A concise paragraph summarizing the interview

Return your analysis as JSON with this structure:
{
  "key_insights": [<list of insights>],
  "sentiment": "<sentiment>",
  "themes": [<list of themes>],
  "notable_quotes": [<list of quotes>],
  "summary_text": "<summary paragraph>"
}"""

        response = openai_client.chat.completions.create(
            model="gpt-4",
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

        supabase.table("session_summaries").insert(summary_data).execute()

        return SummaryResponse(
            session_id=request.sessionId,
            **result
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary generation failed: {str(e)}")
