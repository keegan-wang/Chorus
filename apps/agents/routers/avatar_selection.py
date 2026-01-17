from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
from openai import OpenAI
import json

router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class AvatarSelectionRequest(BaseModel):
    participantDemographics: Dict[str, Any]
    studyContext: Dict[str, Any]
    availableAvatars: List[Dict[str, Any]]

class AvatarSelectionResponse(BaseModel):
    selectedAvatar: Dict[str, Any]
    rationale: str
    match_score: float

@router.post("/avatar-selection", response_model=AvatarSelectionResponse)
async def select_avatar(request: AvatarSelectionRequest):
    """
    Selection Agent: Select the most appropriate avatar for a participant
    based on demographics and study context using GPT-4.
    """
    try:
        if not request.availableAvatars:
            raise HTTPException(status_code=400, detail="No available avatars provided")

        # Build context
        demographics = request.participantDemographics
        avatars_text = "\n".join([
            f"- {avatar.get('name', 'Unknown')} ({avatar.get('id', '')}): "
            f"Gender: {avatar.get('gender', 'N/A')}, "
            f"Age Range: {avatar.get('age_range', 'N/A')}, "
            f"Ethnicity: {avatar.get('ethnicity', 'N/A')}, "
            f"Personality: {avatar.get('personality_traits', 'N/A')}"
            for avatar in request.availableAvatars
        ])

        system_prompt = """You are an expert at matching interview avatars to participants.
Select the most appropriate avatar considering:
1. Demographic alignment (age, gender, ethnicity)
2. Study topic and context
3. Participant comfort and rapport
4. Cultural sensitivity

Respond with JSON:
{
  "selected_avatar_id": "<id>",
  "rationale": "<explanation>",
  "match_score": <0.0-1.0>
}"""

        user_prompt = f"""Participant Demographics:
Age: {demographics.get('age', 'Unknown')}
Gender: {demographics.get('gender', 'Unknown')}
Location: {demographics.get('location', 'Unknown')}

Study Type: {request.studyContext.get('type', 'general')}
Study Title: {request.studyContext.get('title', '')}

Available Avatars:
{avatars_text}

Which avatar should be selected?"""

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,
            max_tokens=300,
            response_format={"type": "json_object"}
        )

        result = json.loads(response.choices[0].message.content)
        selected_id = result.get("selected_avatar_id")

        # Find the selected avatar
        selected_avatar = next(
            (a for a in request.availableAvatars if a.get("id") == selected_id),
            request.availableAvatars[0]  # Fallback to first avatar
        )

        return AvatarSelectionResponse(
            selectedAvatar=selected_avatar,
            rationale=result.get("rationale", "Selected based on demographic match"),
            match_score=float(result.get("match_score", 0.8))
        )

    except Exception as e:
        # Fallback to first avatar on error
        if request.availableAvatars:
            return AvatarSelectionResponse(
                selectedAvatar=request.availableAvatars[0],
                rationale="Default selection due to error",
                match_score=0.5
            )
        raise HTTPException(status_code=500, detail=f"Avatar selection failed: {str(e)}")
