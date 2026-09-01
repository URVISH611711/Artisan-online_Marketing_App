"""
Cloud Speech-to-Text via Sarvam AI.

Sarvam's REST STT (`/speech-to-text`) natively accepts m4a/aac/wav/mp3 and
auto-detects the spoken Indic/English language when `language_code="unknown"`,
returning a confidence score. Used for the multilingual voice pipeline
(catalog "Boost Product" + the AddProduct voice step).

The API key lives server-side in `.env` as SARVAM_API — never sent to the app.
"""
import logging
import time
from typing import Dict, Any, Optional

import requests

from app.core.config import settings

logger = logging.getLogger(__name__)

SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text"


def transcribe_audio(
    audio_bytes: bytes,
    filename: str = "voice.m4a",
    content_type: str = "audio/m4a",
    language_code: str = "unknown",
) -> Dict[str, Any]:
    """
    Transcribe an audio byte stream using Sarvam AI.

    Returns {text, language, language_probability, processing_time_seconds}.
    `language` is normalized to a short code (e.g. "hi", "gu", "en") from
    Sarvam's BCP-47 `language_code` (e.g. "hi-IN"). Raises on failure so the
    caller surfaces a clear error rather than a silent empty transcript.
    """
    api_key = settings.SARVAM_API
    if not api_key:
        raise RuntimeError("SARVAM_API key is not configured on the server.")

    started_at = time.time()
    # Sarvam API has a strict MIME type whitelist. 'audio/m4a' is not supported, 
    # but 'audio/x-m4a' and 'audio/mp4' are.
    if content_type == "audio/m4a":
        content_type = "audio/x-m4a"
    elif not content_type:
        content_type = "audio/x-m4a"

    files = {"file": (filename or "voice.m4a", audio_bytes, content_type)}
    # Omit `model` to use Sarvam's default (saaras:v3), which supports auto-detect.
    data = {"language_code": language_code or "unknown"}
    headers = {"api-subscription-key": api_key}

    logger.info("[Sarvam] Transcribing audio (%s, %d bytes)...", content_type, len(audio_bytes))
    resp = requests.post(SARVAM_STT_URL, headers=headers, files=files, data=data, timeout=(10, 60))
    try:
        resp.raise_for_status()
    except requests.exceptions.HTTPError as e:
        logger.error(f"[Sarvam] API Error: {resp.text}")
        raise
    payload = resp.json()

    lang_full: Optional[str] = payload.get("language_code")
    short_lang = lang_full.split("-")[0] if lang_full else None

    elapsed = round(time.time() - started_at, 2)
    logger.info("[Sarvam] Transcription complete in %ss (lang=%s)", elapsed, lang_full)

    return {
        "text": (payload.get("transcript") or "").strip(),
        "language": short_lang,
        "language_probability": payload.get("language_probability"),
        "processing_time_seconds": elapsed,
    }
