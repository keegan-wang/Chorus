from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
from openai import OpenAI
from supabase import create_client, Client
import json

router = APIRouter()
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Initialize Supabase client
supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

class OverviewRequest(BaseModel):
    studyId: str

class OverviewResponse(BaseModel):
    study_id: str
    executive_summary: str
    key_findings: List[str]
    themes: List[Dict[str, Any]]
    sentiment_distribution: Dict[str, int]
    recommendations: List[str]
    participant_quotes: List[Dict[str, str]]
    metadata: Optional[Dict[str, Any]] = None

@router.post("/overview", response_model=OverviewResponse)
async def generate_study_report(request: OverviewRequest):
    """
    Overview Agent: Generate a comprehensive study-level report using GPT-4.
    """
    try:
        # Fetch all session summaries for this study
        sessions = supabase.table("sessions").select("id").eq("study_id", request.studyId).eq("status", "completed").execute()

        if not sessions.data:
            raise HTTPException(status_code=404, detail="No completed sessions found for this study")

        session_ids = [s["id"] for s in sessions.data]

        # Fetch summaries
        summaries = supabase.table("session_summaries").select("*").in_("session_id", session_ids).execute()

        if not summaries.data:
            raise HTTPException(status_code=404, detail="No session summaries found")

        # Aggregate data
        all_insights = []
        all_themes = []
        all_quotes = []
        sentiment_counts = {"positive": 0, "neutral": 0, "negative": 0, "mixed": 0}

        for summary in summaries.data:
            all_insights.extend(summary.get("key_insights", []))
            all_themes.extend(summary.get("themes", []))
            all_quotes.extend(summary.get("notable_quotes", []))
            sentiment = summary.get("sentiment", "neutral")
            if sentiment in sentiment_counts:
                sentiment_counts[sentiment] += 1

        # Build context for GPT-4
        context = f"""Study Analysis Context:

Total Interviews: {len(summaries.data)}

Sentiment Distribution:
- Positive: {sentiment_counts['positive']}
- Neutral: {sentiment_counts['neutral']}
- Negative: {sentiment_counts['negative']}
- Mixed: {sentiment_counts['mixed']}

All Insights:
{chr(10).join(f"- {insight}" for insight in all_insights[:50])}

All Themes:
{chr(10).join(f"- {theme}" for theme in set(all_themes))}

Sample Quotes:
{chr(10).join(f'- "{quote}"' for quote in all_quotes[:10])}
"""

        # Generate comprehensive report
        system_prompt = """You are an expert research analyst synthesizing qualitative customer research data.
Create a comprehensive study report that includes:

1. Executive Summary: High-level overview of findings (2-3 paragraphs)
2. Key Findings: 5-7 most important discoveries across all interviews
3. Themes: Main themes with frequency and description
4. Recommendations: 3-5 actionable recommendations based on findings
5. Representative Quotes: Select the most impactful quotes

Return as JSON:
{
  "executive_summary": "<summary>",
  "key_findings": [<findings>],
  "themes": [{"name": "<theme>", "frequency": <count>, "description": "<desc>"}],
  "recommendations": [<recommendations>],
  "participant_quotes": [{"quote": "<quote>", "context": "<context>"}]
}"""

        response = openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": context}
            ],
            temperature=0.5,
            max_tokens=2000,
            response_format={"type": "json_object"}
        )

        result = json.loads(response.choices[0].message.content)

        return OverviewResponse(
            study_id=request.studyId,
            executive_summary=result.get("executive_summary", ""),
            key_findings=result.get("key_findings", []),
            themes=result.get("themes", []),
            sentiment_distribution=sentiment_counts,
            recommendations=result.get("recommendations", []),
            participant_quotes=result.get("participant_quotes", []),
            metadata={
                "total_interviews": len(summaries.data),
                "total_insights": len(all_insights),
                "unique_themes": len(set(all_themes))
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Overview generation failed: {str(e)}")
