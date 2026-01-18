from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
import json
import asyncio
import websockets
from openai import AsyncOpenAI
from supabase import create_client, Client

router = APIRouter()
client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# Initialize Supabase Client
url: str = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url:
    raise ValueError("Supabase URL is missing. Please set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL.")
if not key:
    raise ValueError("Supabase Key is missing. Please set SUPABASE_SERVICE_ROLE_KEY.")

supabase: Client = create_client(url, key)

class RealtimeInterviewSession:
    """Manages a single realtime interview session"""

    def __init__(self, session_id: str, study_id: str, question_id: str, participant_id: str):
        self.session_id = session_id
        self.study_id = study_id
        self.question_id = question_id
        self.participant_id = participant_id
        self.conversation_history = []
        self.current_question = None
        self.openai_ws = None
        self.client_ws = None
        self.turn_index = 0
        self.audio_buffer = []  # Buffer to collect audio chunks

    async def start(self, client_ws: WebSocket):
        """Initialize the interview session"""
        self.client_ws = client_ws

        # Connect to OpenAI Realtime API
        openai_api_key = os.environ.get("OPENAI_API_KEY")
        headers = {
            "Authorization": f"Bearer {openai_api_key}",
            "OpenAI-Beta": "realtime=v1"
        }

        try:
            self.openai_ws = await websockets.connect(
                "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17",
                additional_headers=headers
            )

            # Configure the session
            await self.configure_session()

            # Get first question from question agent
            await self.get_and_speak_next_question()

        except Exception as e:
            print(f"Error connecting to OpenAI Realtime API: {e}")
            raise

    async def configure_session(self):
        """Configure the OpenAI Realtime session"""
        config = {
            "type": "session.update",
            "session": {
                "modalities": ["text", "audio"],
                "instructions": "You are a professional qualitative researcher conducting an interview. You will be given specific questions to ask. Speak them naturally and conversationally. After asking each question, listen carefully to the participant's response.",
                "voice": "alloy",
                "input_audio_format": "pcm16",
                "output_audio_format": "pcm16",
                "input_audio_transcription": {
                    "model": "whisper-1"
                },
                "turn_detection": {
                    "type": "server_vad",
                    "threshold": 0.5,
                    "prefix_padding_ms": 300,
                    "silence_duration_ms": 3000
                },
                "temperature": 0.8
            }
        }

        await self.openai_ws.send(json.dumps(config))

    async def get_and_speak_next_question(self):
        """Get next question from question agent and instruct voice model to speak it"""

        # Fetch participant data
        participant_response = supabase.table("participants").select("*").eq("id", self.participant_id).single().execute()
        participant_data = participant_response.data if participant_response.data else {}

        # Fetch question data
        question_response = supabase.table("research_questions").select("*").eq("id", self.question_id).single().execute()
        question_data = question_response.data if question_response.data else {}

        # Build conversation history for question agent
        conversation_turns = []
        for turn in self.conversation_history:
            conversation_turns.append({
                "question": turn.get("question_text", ""),
                "answer": turn.get("answer_text", "")
            })

        # Determine the question text
        if len(self.conversation_history) == 0:
            # First question - use root question
            question_text = question_data.get("root_question", "Tell me about your experience.")
        else:
            # Call question agent to generate next question
            from routers.question import get_next_question, QuestionRequest, ConversationTurn

            request = QuestionRequest(
                sessionId=self.session_id,
                studyId=self.study_id,
                questionId=self.question_id,
                participantId=self.participant_id,
                conversationHistory=[ConversationTurn(**turn) for turn in conversation_turns],
                participantContext=None,
                goodQuestions=[],
                badQuestions=[]
            )

            question_response = await get_next_question(request)
            question_text = question_response.text

        self.current_question = question_text
        self.audio_buffer = []  # Clear audio buffer for new question

        # Send to client for display
        await self.client_ws.send_json({
            "type": "question",
            "text": question_text
        })

        # Instruct OpenAI to speak the question
        response_create = {
            "type": "response.create",
            "response": {
                "modalities": ["text", "audio"],
                "instructions": f"Please ask this question naturally and conversationally: {question_text}"
            }
        }

        await self.openai_ws.send(json.dumps(response_create))

    async def handle_transcript(self, transcript: str):
        """Handle participant's response transcript"""

        # Store the Q&A turn
        self.turn_index += 1

        qa_turn = {
            "session_id": self.session_id,
            "question_text": self.current_question,
            "answer_text": transcript,
            "turn_index": self.turn_index
        }

        # Save to database
        db_response = supabase.table("qa_turns").insert(qa_turn).execute()
        qa_turn_id = db_response.data[0]["id"] if db_response.data else None

        # Add to conversation history
        self.conversation_history.append(qa_turn)

        # Send to client
        await self.client_ws.send_json({
            "type": "transcript",
            "text": transcript
        })

        # Call quality agent to score the Q&A
        await self.score_qa(qa_turn_id, transcript)

        # Check if interview should end
        if await self.should_end_interview():
            await self.end_interview()
        else:
            # Get and speak next question
            await self.get_and_speak_next_question()

    async def score_qa(self, qa_turn_id: str, answer_text: str):
        """Score the Q&A pair using quality agent"""
        try:
            from routers.quality import score_qa, QualityRequest, ConversationTurn

            # Build conversation history
            conversation_turns = []
            for turn in self.conversation_history[:-1]:  # Exclude current turn
                conversation_turns.append(ConversationTurn(
                    question=turn.get("question_text", ""),
                    answer=turn.get("answer_text", "")
                ))

            request = QualityRequest(
                sessionId=self.session_id,
                questionId=None,
                questionText=self.current_question,
                answerText=answer_text,
                participantContext=None,
                conversationHistory=conversation_turns
            )

            quality_response = await score_qa(request)

            # The quality agent already saves to DB, so we don't need to duplicate that

        except Exception as e:
            print(f"Error scoring Q&A: {e}")

    async def should_end_interview(self) -> bool:
        """Check if interview should end"""
        # Fetch study config
        study_response = supabase.table("studies").select("interview_config").eq("id", self.study_id).single().execute()
        study_data = study_response.data if study_response.data else {}

        max_questions = study_data.get("interview_config", {}).get("max_questions", 10)

        return len(self.conversation_history) >= max_questions

    async def end_interview(self):
        """End the interview session"""
        # Update session status
        supabase.table("interview_sessions").update({
            "status": "completed",
            "completed_at": "now()"
        }).eq("id", self.session_id).execute()

        # Send completion message to client
        await self.client_ws.send_json({
            "type": "interview_complete"
        })

        # Close OpenAI connection
        if self.openai_ws:
            await self.openai_ws.close()

    async def handle_openai_message(self, message: dict):
        """Handle messages from OpenAI Realtime API"""
        msg_type = message.get("type")

        # Log all events for debugging (excluding audio deltas to reduce noise)
        if msg_type != "response.audio.delta":
            print(f"[OpenAI Event] {msg_type}: {json.dumps(message, indent=2)}")

        if msg_type == "conversation.item.input_audio_transcription.completed":
            # Participant's response has been transcribed
            transcript = message.get("transcript", "")
            print(f"[Transcript] {transcript}")
            await self.handle_transcript(transcript)

        elif msg_type == "input_audio_buffer.speech_started":
            # User started speaking
            print("[VAD] Speech started")
            await self.client_ws.send_json({
                "type": "speech_started"
            })

        elif msg_type == "input_audio_buffer.speech_stopped":
            # User stopped speaking - commit the buffer
            print("[VAD] Speech stopped - committing audio buffer")
            await self.client_ws.send_json({
                "type": "speech_stopped"
            })
            await self.openai_ws.send(json.dumps({
                "type": "input_audio_buffer.commit"
            }))

        elif msg_type == "input_audio_buffer.committed":
            # Buffer committed - with server_vad, response is auto-created
            print("[VAD] Audio buffer committed")

        elif msg_type == "conversation.item.created":
            # Conversation item created (user or assistant message)
            item = message.get("item", {})
            print(f"[Conversation] Item created: {item.get('type')}")

        elif msg_type == "response.done":
            # Response generation complete - extract transcript from user input
            response = message.get("response", {})
            print(f"[Response] Done: {response}")

            # Look for the user's transcript in the output
            output = response.get("output", [])
            for item in output:
                if item.get("type") == "message":
                    content = item.get("content", [])
                    for content_part in content:
                        if content_part.get("type") == "input_audio":
                            transcript = content_part.get("transcript")
                            if transcript:
                                print(f"[Transcript from response.done] {transcript}")
                                await self.handle_transcript(transcript)

        elif msg_type == "response.audio.delta":
            # Buffer audio chunk instead of streaming
            audio_data = message.get("delta", "")
            if audio_data:
                self.audio_buffer.append(audio_data)
                if len(self.audio_buffer) % 10 == 0:
                    print(f"[Audio] Buffered {len(self.audio_buffer)} chunks")

        elif msg_type == "response.audio.done":
            # Send complete audio to client
            print(f"[Audio] Audio generation complete. Sending {len(self.audio_buffer)} buffered chunks as one")

            # Concatenate all audio chunks
            complete_audio = "".join(self.audio_buffer)

            # Send complete audio to client
            await self.client_ws.send_json({
                "type": "audio_complete",
                "data": complete_audio
            })

            print(f"[Audio] Sent complete audio ({len(complete_audio)} bytes base64)")

            # Clear buffer
            self.audio_buffer = []

        elif msg_type == "error":
            error_msg = message.get("error", {})
            print(f"OpenAI error: {error_msg}")
            await self.client_ws.send_json({
                "type": "error",
                "message": str(error_msg)
            })

    async def forward_audio_to_openai(self, audio_data: str):
        """Forward audio from client to OpenAI"""
        # Log first time we receive audio
        if not hasattr(self, '_audio_received'):
            self._audio_received = True
            print(f"[Audio] First audio chunk received, length: {len(audio_data)} bytes")

        audio_message = {
            "type": "input_audio_buffer.append",
            "audio": audio_data
        }

        await self.openai_ws.send(json.dumps(audio_message))


@router.websocket("/realtime-interview/{session_id}")
async def realtime_interview_websocket(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for realtime interview"""

    await websocket.accept()

    try:
        # Get session details
        session_response = supabase.table("interview_sessions").select("""
            *,
            study:studies(*),
            participant:participants(*)
        """).eq("id", session_id).single().execute()

        if not session_response.data:
            await websocket.send_json({"type": "error", "message": "Session not found"})
            await websocket.close()
            return

        session_data = session_response.data

        # Get research question from the session
        question_id = session_data.get("research_question_id")

        # Fallback: if session doesn't have research_question_id, try to find it via participant's assignment
        if not question_id:
            assignment_response = supabase.table("research_question_assignments").select("research_question_id").eq("participant_id", session_data["participant_id"]).limit(1).execute()

            if assignment_response.data and len(assignment_response.data) > 0:
                question_id = assignment_response.data[0]["research_question_id"]
                # Update the session with the research_question_id for future use
                supabase.table("interview_sessions").update({"research_question_id": question_id}).eq("id", session_id).execute()
            else:
                await websocket.send_json({"type": "error", "message": "No research question found for this participant"})
                await websocket.close()
                return

        # Create interview session
        interview = RealtimeInterviewSession(
            session_id=session_id,
            study_id=session_data["study_id"],
            question_id=question_id,
            participant_id=session_data["participant_id"]
        )

        # Start the interview
        await interview.start(websocket)

        # Create tasks for bidirectional communication
        async def client_to_openai():
            """Forward messages from client to OpenAI"""
            try:
                while True:
                    message = await websocket.receive_json()
                    msg_type = message.get("type")

                    if msg_type == "audio":
                        # Forward audio data to OpenAI
                        await interview.forward_audio_to_openai(message.get("data"))

                    elif msg_type == "end":
                        # Client requested to end interview
                        await interview.end_interview()
                        break

            except WebSocketDisconnect:
                print(f"Client disconnected from session {session_id}")

        async def openai_to_client():
            """Forward messages from OpenAI to client"""
            try:
                while True:
                    message = await interview.openai_ws.recv()
                    data = json.loads(message)
                    await interview.handle_openai_message(data)

            except websockets.exceptions.ConnectionClosed:
                print(f"OpenAI connection closed for session {session_id}")

        # Run both tasks concurrently
        await asyncio.gather(
            client_to_openai(),
            openai_to_client(),
            return_exceptions=True
        )

    except WebSocketDisconnect:
        print(f"WebSocket disconnected for session {session_id}")
    except Exception as e:
        print(f"Error in realtime interview: {e}")
        await websocket.send_json({"type": "error", "message": str(e)})
    finally:
        if interview.openai_ws:
            await interview.openai_ws.close()
        await websocket.close()
