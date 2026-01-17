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
    Transcription: Transcribe audio from a URL using OpenAI Whisper API.
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
        try:
            with open(temp_file, "rb") as audio_file:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="text"
                )
        finally:
            if os.path.exists(temp_file):
                os.remove(temp_file)

        return TranscribeResponse(
            text=transcript,
            language="en",
            confidence=0.95
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

from fastapi import UploadFile, File

@router.post("/transcribe/upload", response_model=TranscribeResponse)
async def transcribe_file(file: UploadFile = File(...)):
    """
    Transcription: Transcribe an uploaded audio file directly using OpenAI Whisper API.
    """
    temp_file = f"/tmp/upload_{os.urandom(8).hex()}_{file.filename}"
    try:
        # Save uploaded file temporarily
        with open(temp_file, "wb") as f:
            f.write(await file.read())

        # Transcribe
        with open(temp_file, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )

        return TranscribeResponse(
            text=transcript,
            language="en",
            confidence=0.95
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)
