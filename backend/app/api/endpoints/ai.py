"""
AI endpoints for Artisan AI.

POST /ai/voice/transcribe -- Transcribe voice locally
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.voice_stt import transcribe_audio, unload_whisper_model

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/voice/transcribe")
async def process_voice(
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Transcribe voice locally using faster-whisper."""
    from app.services.ai.gpu_lock import gpu_lock
    from app.services.ai.model_manager import model_manager, ModelKey
    
    audio_bytes = await audio.read()
    
    try:
        with gpu_lock("backend-WHISPER"):
            with model_manager.using(ModelKey.WHISPER):
                result = transcribe_audio(audio_bytes)
                
        return {
            "success": True,
            "text": result["text"],
            "language": result["language"]
        }
    except Exception as e:
        logger.error(f"[Voice] Transcription failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Voice transcription failed")
