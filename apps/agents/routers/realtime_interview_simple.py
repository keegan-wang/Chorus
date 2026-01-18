from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict
import os
import json
import asyncio
import base64
import io
import wave
from openai import AsyncOpenAI
from supabase import create_client, Client

router = APIRouter()
client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# Initialize Supabase Client
url: str = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url:
    raise ValueError("Supabase URL is missing.")
if not key:
    raise ValueError("Supabase Key is missing.")

supabase: Client = create_client(url, key)


class SimpleInterviewSession:
    """Simplified interview session using Whisper + TTS"""

    def __init__(self, session_id: str, study_id: str, participant_id: str, question_id: str = None):
        self.session_id = session_id
        self.study_id = study_id
        self.participant_id = participant_id
        self.question_id = question_id
        self.conversation_history = []
        self.current_question = None
        self.client_ws = None
        self.turn_index = 0
        self.audio_buffer = []  # Buffer for incoming audio from user
        self.is_listening = False

    async def start(self, client_ws: WebSocket):
        """Initialize the interview session"""
        self.client_ws = client_ws

        # Get and speak first question
        await self.get_and_speak_next_question()

    async def get_and_speak_next_question(self):
        """Get next question and generate TTS audio"""

        print(f"\n{'='*80}")
        print(f"[Question Agent] Starting question generation for turn {len(self.conversation_history) + 1}")
        print(f"{'='*80}\n")

        # Fetch participant data
        participant_response = supabase.table("participants").select("*").eq("id", self.participant_id).single().execute()
        participant_data = participant_response.data if participant_response.data else {}
        print(f"[Question Agent] Fetched participant data")

        # Fetch question data
        question_data = {}
        if self.question_id:
            question_response = supabase.table("research_questions").select("*").eq("id", self.question_id).single().execute()
            question_data = question_response.data if question_response.data else {}

        # Fetch simple questions if no research question ID
        simple_questions = []
        if not self.question_id:
            q_response = supabase.table("questions").select("*").eq("study_id", self.study_id).order("order_index").execute()
            simple_questions = q_response.data or []

        # Build conversation history for question agent
        conversation_turns = []
        for turn in self.conversation_history:
            conversation_turns.append({
                "question": turn.get("question_text", ""),
                "answer": turn.get("answer_transcript", "")
            })

        # Determine the question text
        if len(self.conversation_history) == 0:
            # First question - use root question or first simple question
            print(f"[Question Agent] This is the FIRST question")
            if question_data.get("root_question"):
                question_text = question_data.get("root_question")
                print(f"[Question Agent] Using root question: {question_text}")
            elif simple_questions and len(simple_questions) > 0:
                question_text = simple_questions[0]["text"]
                print(f"[Question Agent] Using first simple question: {question_text}")
            else:
                question_text = "Tell me about your experience."
                print(f"[Question Agent] Using default question: {question_text}")
        else:
            # Call question agent to generate next question
            print(f"[Question Agent] Calling Question Agent to generate follow-up question...")
            print(f"[Question Agent] Conversation history has {len(conversation_turns)} turns")

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

            print(f"[Question Agent] Sending request to Question Agent...")
            question_response = await get_next_question(request)
            question_text = question_response.text
            print(f"[Question Agent] ✅ Question Agent returned: {question_text}")

        self.current_question = question_text

        # Send question text to client
        await self.client_ws.send_json({
            "type": "question",
            "text": question_text
        })

        # Generate TTS audio
        print(f"[TTS] Generating audio for: {question_text}")

        try:
            # Use OpenAI TTS API
            response = await client.audio.speech.create(
                model="tts-1",  # or "tts-1-hd" for higher quality
                voice="alloy",
                input=question_text,
                response_format="opus"  # Use opus format (better compression, widely supported)
            )

            # Get the audio bytes
            audio_bytes = response.content

            # Convert to base64
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')

            print(f"[TTS] Generated {len(audio_bytes)} bytes of audio ({len(audio_base64)} base64)")

            # Send complete audio to client
            print(f"[TTS] Sending audio_complete message to client...")
            await self.client_ws.send_json({
                "type": "audio_complete",
                "data": audio_base64,
                "format": "opus"  # Tell client what format this is
            })
            print(f"[TTS] ✅ Audio_complete message sent successfully")

            # Start listening for response
            self.is_listening = True
            self.audio_buffer = []
            print(f"[TTS] ✅ Now listening for user response (is_listening={self.is_listening})")
            print(f"\n{'='*80}")
            print(f"[System] READY FOR USER RESPONSE - Waiting for audio from frontend...")
            print(f"{'='*80}\n")

        except Exception as e:
            print(f"[TTS] ❌ Error generating audio: {e}")
            import traceback
            traceback.print_exc()
            await self.client_ws.send_json({
                "type": "error",
                "message": f"Failed to generate audio: {str(e)}"
            })

    async def handle_audio_data(self, audio_data: str):
        """Receive complete audio recording from user"""
        if not self.is_listening:
            print("[Audio] Not listening, ignoring audio data")
            return

        print(f"[Audio] Received complete audio recording ({len(audio_data)} bytes base64)")

        # Stop listening immediately
        self.is_listening = False

        # Handle skip/empty audio
        if not audio_data or len(audio_data) < 100:
            print("[Audio] Empty or skip audio - moving to next question")
            await self.handle_transcript("[SKIPPED]")
            return

        try:
            # Decode base64 audio
            audio_bytes = base64.b64decode(audio_data)

            print(f"[Whisper] Decoded {len(audio_bytes)} bytes of raw PCM audio")

            # Convert PCM to WAV format for Whisper
            wav_buffer = io.BytesIO()
            with wave.open(wav_buffer, 'wb') as wav_file:
                wav_file.setnchannels(1)  # Mono
                wav_file.setsampwidth(2)  # 16-bit
                wav_file.setframerate(24000)  # 24kHz sample rate
                wav_file.writeframes(audio_bytes)

            # Get the WAV bytes
            wav_bytes = wav_buffer.getvalue()
            print(f"[Whisper] Created WAV file: {len(wav_bytes)} bytes")

            # Create a file-like object for Whisper
            audio_file = io.BytesIO(wav_bytes)
            audio_file.name = "audio.wav"

            # Transcribe using Whisper
            transcription = await client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )

            transcript = transcription if isinstance(transcription, str) else transcription.text

            print(f"[Whisper] Transcription: {transcript}")

            # Handle the transcript
            await self.handle_transcript(transcript)

        except Exception as e:
            print(f"[Whisper] Error transcribing audio: {e}")
            import traceback
            traceback.print_exc()
            await self.client_ws.send_json({
                "type": "error",
                "message": f"Failed to transcribe audio: {str(e)}"
            })
        finally:
            self.audio_buffer = []

    async def handle_transcript(self, transcript: str):
        """Handle participant's response transcript"""

        print(f"[Transcript] Received transcript: {transcript}")

        # Store the Q&A turn
        self.turn_index += 1

        qa_turn = {
            "session_id": self.session_id,
            "question_text": self.current_question,
            "answer_transcript": transcript,  # Correct column name
            "turn_index": self.turn_index
        }

        print(f"[Transcript] Saving Q&A turn {self.turn_index} to database")

        # Save to database
        try:
            db_response = supabase.table("qa_turns").insert(qa_turn).execute()
            qa_turn_id = db_response.data[0]["id"] if db_response.data else None
            print(f"[Transcript] Saved Q&A turn with ID: {qa_turn_id}")
        except Exception as e:
            print(f"[Transcript] Error saving to database: {e}")
            qa_turn_id = None

        # Add to conversation history
        self.conversation_history.append(qa_turn)
        print(f"[Transcript] Conversation history now has {len(self.conversation_history)} turns")

        # Send to client
        await self.client_ws.send_json({
            "type": "transcript",
            "text": transcript
        })

        # Call quality agent to score the Q&A (don't block on errors)
        print(f"[Transcript] Scoring Q&A turn...")
        try:
            await self.score_qa(qa_turn_id, transcript)
        except Exception as e:
            print(f"[Transcript] Quality scoring failed but continuing: {e}")

        # Check if interview should end
        should_end = await self.should_end_interview()
        print(f"[Transcript] Should end interview? {should_end}")

        if should_end:
            print(f"[Transcript] Interview complete after {len(self.conversation_history)} turns")
            await self.end_interview()
        else:
            # Get and speak next question
            print(f"[Transcript] ✅ Getting next question (turn {len(self.conversation_history) + 1})...")
            await self.get_and_speak_next_question()

    async def score_qa(self, qa_turn_id: str, answer_text: str):
        """Score the Q&A pair using quality agent"""
        try:
            print(f"[Quality] Starting quality scoring for turn {qa_turn_id}")
            from routers.quality import score_qa, QualityRequest, ConversationTurn

            # Build conversation history
            conversation_turns = []
            for turn in self.conversation_history[:-1]:  # Exclude current turn
                conversation_turns.append(ConversationTurn(
                    question=turn.get("question_text", ""),
                    answer=turn.get("answer_transcript", "")
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
            print(f"[Quality] Quality score completed")

        except Exception as e:
            print(f"[Quality] Error scoring Q&A: {e}")
            import traceback
            traceback.print_exc()

    async def should_end_interview(self) -> bool:
        """Check if interview should end"""
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


@router.websocket("/simple-interview/{session_id}")
async def simple_interview_websocket(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for simplified interview (Whisper + TTS)"""

    await websocket.accept()

    interview = None

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
                supabase.table("interview_sessions").update({"research_question_id": question_id}).eq("id", session_id).execute()
            else:
                # Allow proceeding without a specific research question ID (will fallback to study questions)
                print(f"No research question assignment found for participant {session_data['participant_id']}, proceeding with general study questions.")
                question_id = None

        # Create interview session
        interview = SimpleInterviewSession(
            session_id=session_id,
            study_id=session_data["study_id"],
            participant_id=session_data["participant_id"],
            question_id=question_id
        )

        # Start the interview
        await interview.start(websocket)

        # Handle incoming messages from client
        while True:
            message = await websocket.receive_json()
            msg_type = message.get("type")

            if msg_type == "audio":
                # Receive complete audio data
                await interview.handle_audio_data(message.get("data"))

            elif msg_type == "end":
                # Client requested to end interview
                await interview.end_interview()
                break

    except WebSocketDisconnect:
        print(f"Client disconnected from session {session_id}")
    except Exception as e:
        print(f"Error in simple interview: {e}")
        import traceback
        traceback.print_exc()
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except:
            pass
    finally:
        try:
            await websocket.close()
        except:
            pass
