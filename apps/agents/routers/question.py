from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
from openai import OpenAI


from supabase import create_client, Client

router = APIRouter()
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# Initialize Supabase Client
# Initialize Supabase Client
url: str = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url:
    raise ValueError("Supabase URL is missing. Please set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL.")
if not key:
    raise ValueError("Supabase Key is missing. Please set SUPABASE_SERVICE_ROLE_KEY.")

supabase: Client = create_client(url, key)

class ConversationTurn(BaseModel):
    question: str
    answer: str

class QuestionRequest(BaseModel):
    sessionId: str
    studyId: str
    questionId: Optional[str] = None  # UUID from research_questions table
    participantId: str # UUID from participants table
    conversationHistory: List[ConversationTurn]
    participantContext: Optional[Dict[str, Any]] = None # Deprecated, preferred to fetch from DB
    goodQuestions: List[str] = []
    badQuestions: List[str] = []

class QuestionResponse(BaseModel):
    id: str
    text: str
    type: str = "dynamic"
    rationale: Optional[str] = None

@router.post("/question", response_model=QuestionResponse)
async def get_next_question(request: QuestionRequest):
    """
    Question Agent: Generate the next question based on conversation history,
    background QID data, and participant data fetched from DB.
    """
    try:
        # 1. Fetch Question Data from Supabase
        question_data = None
        if request.questionId:
            try:
                response = supabase.table("research_questions").select("*").eq("id", request.questionId).single().execute()
                question_data = response.data
            except Exception as e:
                print(f"Error fetching question data: {e}")

        # 2. Fetch Participant Data from Supabase
        participant_data = None
        if request.participantId:
            try:
                response = supabase.table("participants").select("*").eq("id", request.participantId).single().execute()
                participant_data = response.data
            except Exception as e:
                print(f"Error fetching participant data: {e}")

        # Build context for GPT-4
        context_parts = []
        
        # A. ROOT RESEARCH QUESTIONS (from DB)
        if question_data:
            # Format DB fields into context
            fields_to_include = {
                "Root Question": question_data.get("root_question"),
                "Specific Product": question_data.get("specific_product"),
                "Target Demographics": question_data.get("demographics"),
                "Selected Dataset": question_data.get("selected_dataset"),
                "Other Information": question_data.get("other_info"),
                "Related Questions": question_data.get("other_questions")
            }
            # Filter distinct None/Empty values
            context_str = "\n".join([f"{k}: {v}" for k, v in fields_to_include.items() if v])
            context_parts.append(f"ROOT RESEARCH QUESTIONS & BACKGROUND DATA:\n{context_str}")
        else:
            context_parts.append(f"ROOT RESEARCH QUESTIONS:\n(No background data found for ID: {request.questionId})")

        # B. GUIDELINES
        if request.goodQuestions:
            context_parts.append("STRATEGY - EMULATE THESE QUESTION TYPES:\n" + "\n".join(f"- {q}" for q in request.goodQuestions))
        
        if request.badQuestions:
            context_parts.append("STRATEGY - AVOID THESE QUESTION TYPES:\n" + "\n".join(f"- {q}" for q in request.badQuestions))

        # C. PARTICIPANT PROFILE (From DB)
        if participant_data:
            # Construct profile string from available fields
            profile_parts = []
            
            # 1. Identity
            if participant_data.get("full_name"):
                profile_parts.append(f"Name: {participant_data.get('full_name')}")
            
            # 2. Core Demographics
            demos = []
            if participant_data.get("age"):
                demos.append(f"Age: {participant_data.get('age')}")
            if participant_data.get("gender"):
                demos.append(f"Gender: {participant_data.get('gender')}")
            if participant_data.get("city") or participant_data.get("country"):
                loc_parts = [p for p in [participant_data.get("city"), participant_data.get("country")] if p]
                demos.append(f"Location: {', '.join(loc_parts)}")
            if participant_data.get("language"):
                demos.append(f"Language: {participant_data.get('language')}")
            if participant_data.get("timezone"):
                demos.append(f"Timezone: {participant_data.get('timezone')}")
            
            if demos:
                profile_parts.append("Demographics:\n- " + "\n- ".join(demos))

            # 3. Tags
            if participant_data.get("tags"):
                tags_str = ", ".join(participant_data.get("tags"))
                profile_parts.append(f"Tags: {tags_str}")
            
            # 4. Detailed Metadata
            # Iterate through all metadata fields
            meta = participant_data.get("metadata", {})
            if meta:
                meta_points = []
                for k, v in meta.items():
                    # Format key to be readable (e.g., "job_title" -> "Job Title")
                    readable_key = k.replace("_", " ").title()
                    meta_points.append(f"{readable_key}: {v}")
                
                if meta_points:
                    profile_parts.append("Additional Background:\n- " + "\n- ".join(meta_points))
            
            context_parts.append("PARTICIPANT PROFILE:\n" + "\n".join(profile_parts))
        
        # Fallback to request context if DB fetch failed but context provided
        elif request.participantContext:
            demo = request.participantContext.get("demographics", {})
            metadata = request.participantContext.get("metadata", {})
            context_parts.append(f"PARTICIPANT PROFILE (Fallback):\nDemographics: {demo}\nMetadata: {metadata}")

        # 4. Conversation History
        history_text = ""
        last_turn_text = ""
        
        if request.conversationHistory:
            # Separate the last turn if history exists
            past_turns = request.conversationHistory[:-1]
            last_turn = request.conversationHistory[-1]
            
            if past_turns:
                history_str = "\n".join([
                    f"Q: {turn.question}\nA: {turn.answer}"
                    for turn in past_turns
                ])
                history_text = f"CONVERSATION HISTORY:\n{history_str}"
                context_parts.append(history_text)
            
            # 5. Review the immediate context
            last_turn_text = f"IMMEDIATE CONTEXT (Last Turn):\nAgent Asked: {last_turn.question}\nParticipant Responded: {last_turn.answer}"
            context_parts.append(last_turn_text)

        # Create the High-Fidelity System Prompt
        system_prompt = """You are an elite Qualitative Researcher and Ethnographer (e.g., equivalent to a Senior UX Researcher at a top firm).
Your specific mission is to conduct a semi-structured interview to gather deep, rich data that answers the ROOT RESEARCH QUESTIONS provided in the context.

## YOUR OBJECTIVES
1. **Uncover the "Why"**: Do not settle for surface-level facts. We need to understand motivations, mental models, emotions, and decision-making processes.
2. **Bridge to the Root Questions**: Every question you ask must serve the purpose of answering the Root Research Questions. If the conversation drifts, gently guide it back to relevant topics.
3. **Follow the Energy**: If the participant seems passionate or emotional about a specific topic, DIG DEEPER there. That is where the gold is.
4. **Maintain Rapport**: Be conversational, empathetic, and professional. Use natural language, not robotic interview scripts.

## PROMPTING STRATEGY
- **Laddering**: Use "Why is that important to you?" or "What does that mean for you?" to move from attributes to values.
- **Clarification**: "Can you walk me through that specifically?" or "What did you mean by X?"
- **Contrast**: "How is this different from [previous experience]?"

## CRITICAL CONSTRAINTS
- Generate EXACTLY ONE follow-up question.
- Do NOT number the question.
- Do NOT provide an explanation or rationale in the output (just the question).
- Do NOT be repetitive. If we already know the answer, move on.
- Use the "Good/Bad" question examples as a style guide for tone and structure.
"""

        user_prompt = "\n\n====================\n\n".join(context_parts) + "\n\n====================\n\nTASK: Based on the ROOT RESEARCH QUESTIONS and the IMMEDIATE CONTEXT above, generate the single most high-value follow-up question now."
        
        if not request.conversationHistory:
            # First question - use the root question directly from the looked-up data
            if question_data and "root_question" in question_data:
                return QuestionResponse(
                    id=request.questionId,
                    text=question_data["root_question"],
                    type="seed"
                )

        # Call GPT-4
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=150
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
