"""
AI endpoints for Artisan AI.

POST /ai/voice/transcribe -- Transcribe voice via Sarvam AI (cloud STT)
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.sarvam_stt import transcribe_audio

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/voice/transcribe")
async def process_voice(
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Transcribe voice using Sarvam AI (auto-detects the spoken language)."""
    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio file")

    try:
        result = transcribe_audio(
            audio_bytes,
            filename=audio.filename or "voice.m4a",
            content_type=audio.content_type or "audio/m4a",
        )
        return {
            "success": True,
            "text": result["text"],
            "language": result["language"],
            "language_probability": result.get("language_probability"),
        }
    except Exception as e:
        logger.error(f"[Voice] Sarvam transcription failed: {e}", exc_info=True)
        raise HTTPException(status_code=502, detail="Voice transcription failed")
