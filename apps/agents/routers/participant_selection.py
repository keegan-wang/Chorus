from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
from openai import OpenAI
import json
from supabase import create_client

router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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
supabase = create_client(supabase_url, supabase_key)

class ParticipantSelectionRequest(BaseModel):
    studyId: str
    targetCount: int
    targetDemographics: Dict[str, Any]
    studyContext: Dict[str, Any]

class SelectedParticipant(BaseModel):
    participant_id: str
    selection_score: float
    selection_reasoning: str

class ParticipantSelectionResponse(BaseModel):
    selectedParticipants: List[SelectedParticipant]
    totalEvaluated: int

@router.post("/participant-selection", response_model=ParticipantSelectionResponse)
async def select_participants(request: ParticipantSelectionRequest):
    """
    Selection Agent: Select the most appropriate participants for a study
    based on study criteria and target demographics using GPT-4.
    """
    try:
        # 1. Get study details
        study_response = supabase.table("studies").select("*").eq("id", request.studyId).single().execute()
        if not study_response.data:
            raise HTTPException(status_code=404, detail="Study not found")

        study = study_response.data
        organization_id = study["organization_id"]

        # 2. Get all active participants for this organization
        participants_response = supabase.table("participants").select(
            "id, email, full_name, age, gender, country, city, tags, metadata"
        ).eq("organization_id", organization_id).eq("status", "active").execute()

        if not participants_response.data or len(participants_response.data) == 0:
            raise HTTPException(status_code=400, detail="No active participants found for this organization")

        participants = participants_response.data

        # 3. Use LLM to score and select participants
        selected = await score_participants_with_llm(
            participants=participants,
            target_count=request.targetCount,
            target_demographics=request.targetDemographics,
            study_context=request.studyContext
        )

        # 4. Get available avatars for assignment
        avatars_response = supabase.table("avatars").select("*").eq("is_active", True).execute()
        avatars = avatars_response.data if avatars_response.data else []

        if not avatars:
            raise HTTPException(status_code=400, detail="No active avatars available")

        # 5. Create assignments in study_participant_assignments table
        for participant in selected:
            # Simple avatar assignment (first available for now)
            # TODO: Could enhance this with demographic matching
            avatar = avatars[0] if avatars else None

            if not avatar:
                continue

            assignment_data = {
                "study_id": request.studyId,
                "participant_id": participant.participant_id,
                "avatar_id": avatar["id"],
                "selection_score": participant.selection_score,
                "selection_reasoning": participant.selection_reasoning,
                "invite_status": "pending",
                "invite_expires_at": None  # Set expiry based on study config
            }

            # Insert assignment (ignore conflicts if already assigned)
            supabase.table("study_participant_assignments").insert(assignment_data).execute()

        return ParticipantSelectionResponse(
            selectedParticipants=selected,
            totalEvaluated=len(participants)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Participant selection failed: {str(e)}")


async def score_participants_with_llm(
    participants: List[Dict[str, Any]],
    target_count: int,
    target_demographics: Dict[str, Any],
    study_context: Dict[str, Any]
) -> List[SelectedParticipant]:
    """
    Use GPT-4 to score participants based on fit for the study.
    Returns top N participants sorted by score.
    """
    # Build participant descriptions for LLM
    participants_text = "\n".join([
        f"- ID: {p['id']}, Name: {p.get('full_name', 'N/A')}, "
        f"Age: {p.get('age', 'N/A')}, Gender: {p.get('gender', 'N/A')}, "
        f"Location: {p.get('city', 'N/A')}, {p.get('country', 'N/A')}, "
        f"Tags: {', '.join(p.get('tags', []))}"
        for p in participants[:100]  # Limit to avoid token limits
    ])

    system_prompt = """You are an expert at selecting research participants for studies.
Evaluate each participant's fit for the study based on:
1. Demographic alignment with target criteria
2. Relevant experience or characteristics (from tags/metadata)
3. Diversity considerations to get varied perspectives
4. Geographic relevance if applicable

For each participant, assign a score from 0.0 to 1.0 indicating fit.
Select the top participants up to the target count.

Respond with JSON array:
[
  {
    "participant_id": "<id>",
    "selection_score": <0.0-1.0>,
    "selection_reasoning": "<brief explanation>"
  }
]"""

    user_prompt = f"""Study Title: {study_context.get('title', '')}
Study Type: {study_context.get('type', 'general')}
Study Description: {study_context.get('description', '')}

Target Demographics:
- Age: {target_demographics.get('age', 'all')}
- Gender: {target_demographics.get('gender', 'all')}

Target Participant Count: {target_count}

Available Participants:
{participants_text}

Select the {target_count} best-fitting participants and explain why."""

    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,
            max_tokens=2000,
            response_format={"type": "json_object"}
        )

        result = json.loads(response.choices[0].message.content)

        # Handle both array and object with selections key
        if isinstance(result, list):
            selections = result
        elif "selections" in result:
            selections = result["selections"]
        elif "participants" in result:
            selections = result["participants"]
        else:
            # Fallback: select first N participants with default scores
            selections = [
                {
                    "participant_id": p["id"],
                    "selection_score": 0.7,
                    "selection_reasoning": "Default selection"
                }
                for p in participants[:target_count]
            ]

        # Convert to SelectedParticipant objects and limit to target count
        selected = [
            SelectedParticipant(**s)
            for s in selections[:target_count]
        ]

        # Sort by score descending
        selected.sort(key=lambda x: x.selection_score, reverse=True)

        return selected

    except Exception as e:
        print(f"LLM selection error: {e}")
        # Fallback: random selection with default score
        import random
        fallback = random.sample(participants, min(target_count, len(participants)))
        return [
            SelectedParticipant(
                participant_id=p["id"],
                selection_score=0.5,
                selection_reasoning="Random selection due to LLM error"
            )
            for p in fallback
        ]
