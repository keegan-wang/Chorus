from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
from openai import OpenAI

router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class ConversationTurn(BaseModel):
    question: str
    answer: str

class QuestionRequest(BaseModel):
    sessionId: str
    studyId: str
    seedQuestions: List[Dict[str, Any]]
    conversationHistory: List[ConversationTurn]
    participantContext: Dict[str, Any]

class QuestionResponse(BaseModel):
    id: str
    text: str
    type: str = "dynamic"
    rationale: Optional[str] = None

@router.post("/question", response_model=QuestionResponse)
async def get_next_question(request: QuestionRequest):
    """
    Question Agent: Generate the next question based on conversation history
    and seed questions using GPT-4.
    """
    try:
        # Build context for GPT-4
        context_parts = []

        # Add seed questions
        if request.seedQuestions:
            seed_texts = [q.get("text", "") for q in request.seedQuestions]
            context_parts.append(f"Research Questions:\n" + "\n".join(f"- {q}" for q in seed_texts))

        # Add participant context
        if request.participantContext:
            demo = request.participantContext.get("demographics", {})
            if demo:
                context_parts.append(f"Participant Demographics: {demo}")

        # Build conversation history
        if request.conversationHistory:
            history_text = "\n".join([
                f"Q: {turn.question}\nA: {turn.answer}"
                for turn in request.conversationHistory
            ])
            context_parts.append(f"Conversation so far:\n{history_text}")

        # Create the prompt
        system_prompt = """You are an expert interviewer conducting qualitative customer research.
Your goal is to generate insightful follow-up questions that:
1. Dig deeper into interesting responses
2. Uncover underlying motivations and pain points
3. Explore topics the participant seems engaged with
4. Maintain natural conversation flow
5. Avoid repetitive questions

Generate ONE question that would be most valuable to ask next.
Be specific and relevant to what the participant has already shared.
Keep questions open-ended and exploratory."""

        user_prompt = "\n\n".join(context_parts) + "\n\nWhat question should I ask next?"

        if not request.conversationHistory:
            # First question - use first seed question or generate opening
            if request.seedQuestions and len(request.seedQuestions) > 0:
                return QuestionResponse(
                    id=request.seedQuestions[0].get("id", "seed-0"),
                    text=request.seedQuestions[0].get("text", ""),
                    type="seed"
                )

        # Call GPT-4 to generate next question
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=200
        )

        question_text = response.choices[0].message.content.strip()

        # Remove question mark formatting if GPT added one
        question_text = question_text.strip('"\'')

        return QuestionResponse(
            id=f"dynamic-{request.sessionId}-{len(request.conversationHistory)}",
            text=question_text,
            type="dynamic",
            rationale="Generated based on conversation flow"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Question generation failed: {str(e)}")
