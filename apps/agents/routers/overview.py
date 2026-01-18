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
    positive_highlights: List[str]
    negative_pain_points: List[str]
    metadata: Optional[Dict[str, Any]] = None

@router.post("/overview", response_model=OverviewResponse)
async def generate_study_report(request: OverviewRequest):
    """
    Overview Agent: Generate a comprehensive study-level report using GPT-4.
    """
    try:
        # Fetch all session summaries for this study
        # Accept both completed and in_progress sessions for testing/development
        sessions = supabase.table("interview_sessions").select("id").eq("study_id", request.studyId).execute()

        if not sessions.data:
            raise HTTPException(status_code=404, detail="No sessions found for this study")

        session_ids = [s["id"] for s in sessions.data]

        # Try to fetch summaries from database first
        summaries = supabase.table("interview_summaries").select("*").in_("session_id", session_ids).execute()

        # If no summaries found in database, generate them inline
        if not summaries.data:
            print(f"No saved summaries found. Generating summaries inline for {len(session_ids)} sessions...")
            summaries_list = []

            for session_id in session_ids:
                try:
                    # Fetch Q&A turns for this session
                    qa_turns = supabase.table("qa_turns").select("*").eq("session_id", session_id).order("turn_index").execute()

                    if not qa_turns.data:
                        continue

                    # Build conversation
                    conversation = "\n\n".join([
                        f"Q: {turn['question_text']}\nA: {turn['answer_transcript']}"
                        for turn in qa_turns.data
                        if turn.get('answer_transcript') and turn['answer_transcript'] != '[SKIPPED]'
                    ])

                    # Generate summary using GPT-4o
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

                    result = json.loads(response.choices[0].message.content)
                    result['session_id'] = session_id
                    summaries_list.append(result)

                except Exception as e:
                    print(f"Warning: Could not generate summary for session {session_id}: {e}")

            if not summaries_list:
                raise HTTPException(status_code=404, detail="No interview data available")

            # Convert to the format expected by the rest of the code
            class FakeSummariesData:
                def __init__(self, data):
                    self.data = data
            summaries = FakeSummariesData(summaries_list)

        # Aggregate data
        all_insights = []
        all_themes = []
        all_quotes = []
        all_positive_feedback = []
        all_negative_feedback = []
        sentiment_counts = {"positive": 0, "neutral": 0, "negative": 0, "mixed": 0}

        for summary in summaries.data:
            all_insights.extend(summary.get("key_insights", []))
            all_themes.extend(summary.get("themes", []))
            all_quotes.extend(summary.get("notable_quotes", []))
            all_positive_feedback.extend(summary.get("positive_feedback", []))
            all_negative_feedback.extend(summary.get("negative_feedback", []))
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

Positive Feedback from Participants:
{chr(10).join(f"+ {item}" for item in all_positive_feedback[:30])}

Negative Feedback from Participants:
{chr(10).join(f"- {item}" for item in all_negative_feedback[:30])}

Sample Quotes:
{chr(10).join(f'- "{quote}"' for quote in all_quotes[:10])}
"""

        # Generate comprehensive report
        system_prompt = """You are an expert research analyst synthesizing qualitative customer research data.
Create a comprehensive market research study report that includes:

1. Executive Summary: High-level overview of findings (2-3 paragraphs)
2. Key Findings: 5-7 most important discoveries across all interviews
3. Themes: Main themes with frequency and description
4. Positive Highlights: Top 5-7 things participants liked, praised, or want to see more of
5. Negative Pain Points: Top 5-7 things participants disliked, complained about, or want changed
6. Recommendations: 3-5 actionable recommendations based on findings
7. Representative Quotes: Select the most impactful quotes

Return as JSON:
{
  "executive_summary": "<summary>",
  "key_findings": [<findings>],
  "themes": [{"name": "<theme>", "frequency": <count>, "description": "<desc>"}],
  "positive_highlights": [<positive items>],
  "negative_pain_points": [<negative items>],
  "recommendations": [<recommendations>],
  "participant_quotes": [{"quote": "<quote>", "context": "<context>"}]
}"""

        response = openai_client.chat.completions.create(
            model="gpt-4o",
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
            positive_highlights=result.get("positive_highlights", []),
            negative_pain_points=result.get("negative_pain_points", []),
            metadata={
                "total_interviews": len(summaries.data),
                "total_insights": len(all_insights),
                "unique_themes": len(set(all_themes)),
                "total_positive_feedback": len(all_positive_feedback),
                "total_negative_feedback": len(all_negative_feedback)
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Overview generation failed: {str(e)}")
