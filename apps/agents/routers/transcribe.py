from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
from openai import OpenAI
import httpx

router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class TranscribeRequest(BaseModel):
    audioUrl: str

class TranscribeResponse(BaseModel):
    text: str
    language: str = "en"
    confidence: float = 0.95

@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_audio(request: TranscribeRequest):
    """
    Transcription: Transcribe audio to text using OpenAI Whisper API.
    """
    try:
        # Download the audio file
        async with httpx.AsyncClient() as http_client:
            response = await http_client.get(request.audioUrl, timeout=30.0)

            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to download audio file")

            audio_data = response.content

        # Save temporarily
        temp_file = f"/tmp/audio_{os.urandom(8).hex()}.webm"
        with open(temp_file, "wb") as f:
            f.write(audio_data)

        # Transcribe with Whisper
        with open(temp_file, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )

        # Clean up temp file
        os.remove(temp_file)

        return TranscribeResponse(
            text=transcript,
            language="en",
            confidence=0.95
        )

    except Exception as e:
        # Clean up temp file if it exists
        if 'temp_file' in locals() and os.path.exists(temp_file):
            os.remove(temp_file)
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
