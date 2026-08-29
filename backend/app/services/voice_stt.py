"""
Local Voice-to-Text using faster-whisper.
"""
import io
import logging
import time
from typing import Dict, Any

from app.services.memory_manager import memory_manager

logger = logging.getLogger(__name__)

_whisper_model = None

def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        logger.info("[Whisper] Loading faster-whisper tiny.en model...")
        from faster_whisper import WhisperModel
        
        # Load tiny or base model on CPU to save VRAM for other tasks,
        # or load on GPU (int8) if preferred. CPU is usually fast enough for short clips.
        _whisper_model = WhisperModel("tiny", device="cpu", compute_type="int8")
        logger.info("[Whisper] Model loaded.")
    return _whisper_model

def unload_whisper_model():
    global _whisper_model
    if _whisper_model is not None:
        logger.info("[Whisper] Unloading model...")
        memory_manager.offload_model(_whisper_model)
        _whisper_model = None

def transcribe_audio(audio_bytes: bytes) -> Dict[str, Any]:
    """Transcribes an audio byte stream to text."""
    started_at = time.time()
    
    # Write bytes to a temp file or use a BytesIO wrapper that faster-whisper accepts
    # faster-whisper accepts file path or binary file-like object
    audio_file = io.BytesIO(audio_bytes)
    
    model = get_whisper_model()
    
    logger.info("[Whisper] Transcribing audio...")
    segments, info = model.transcribe(audio_file, beam_size=5)
    
    text = " ".join([segment.text for segment in segments])
    
    # Optionally unload right after if we want to save RAM
    # unload_whisper_model()
    
    elapsed = round(time.time() - started_at, 2)
    logger.info(f"[Whisper] Transcription complete in {elapsed}s")
    
    return {
        "text": text.strip(),
        "language": info.language,
        "language_probability": info.language_probability,
        "processing_time_seconds": elapsed
    }
