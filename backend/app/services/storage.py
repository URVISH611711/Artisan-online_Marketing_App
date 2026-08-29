"""
Image storage service for Artisan AI.

Primary: Supabase Storage (when SUPABASE_URL + SUPABASE_SERVICE_KEY are set)
Fallback: Local filesystem served via FastAPI StaticFiles at /uploads

Bucket name: product-images  (create it in Supabase dashboard → Storage if it doesn't exist)
"""
import os
import uuid
import logging
from typing import Tuple

from app.core.config import settings

logger = logging.getLogger(__name__)

BUCKET_NAME = "product-images"


# ── Supabase Storage client (lazy-loaded) ────────────────────────────

_supabase_client = None

def _get_supabase():
    """Lazily create and cache the Supabase client."""
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
        return None

    try:
        from supabase import create_client
        _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        logger.info("[STORAGE] Supabase client initialized")
        return _supabase_client
    except Exception as e:
        logger.warning(f"[STORAGE] Could not init Supabase client: {e}")
        return None


def _ensure_bucket(client) -> bool:
    """Create the storage bucket if it doesn't exist. Returns True on success."""
    try:
        buckets = client.storage.list_buckets()
        names = [b.name for b in buckets]
        if BUCKET_NAME not in names:
            client.storage.create_bucket(BUCKET_NAME, options={"public": True})
            logger.info(f"[STORAGE] Created bucket: {BUCKET_NAME}")
        return True
    except Exception as e:
        logger.warning(f"[STORAGE] Could not ensure bucket exists: {e}")
        return False


# ── Supabase upload ──────────────────────────────────────────────────

def _upload_to_supabase(
    path: str,
    data: bytes,
    content_type: str,
) -> str:
    """
    Upload bytes to Supabase Storage.
    Returns the public URL.
    Raises on failure.
    """
    client = _get_supabase()
    if client is None:
        raise RuntimeError("Supabase client not available")

    _ensure_bucket(client)

    client.storage.from_(BUCKET_NAME).upload(
        path=path,
        file=data,
        file_options={"content-type": content_type, "upsert": "true"},
    )

    res = client.storage.from_(BUCKET_NAME).get_public_url(path)
    return res


# ── Local filesystem fallback ────────────────────────────────────────

def _get_upload_dir() -> str:
    base = os.path.join(os.getcwd(), settings.UPLOADS_DIR)
    os.makedirs(base, exist_ok=True)
    return base


def _save_locally(
    rel_path: str,
    data: bytes,
) -> str:
    """Save bytes to local disk. Returns relative path from uploads root."""
    base = _get_upload_dir()
    full_path = os.path.join(base, rel_path.replace("/", os.sep))
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "wb") as f:
        f.write(data)
    return rel_path


def _get_local_url(rel_path: str, base_url: str) -> str:
    return f"{base_url}/uploads/{rel_path}"


# ── Public API ───────────────────────────────────────────────────────

def generate_session_id() -> str:
    """Generate a short unique session ID for a processing request."""
    return str(uuid.uuid4())[:12]


def save_image(
    user_id: str,
    session_id: str,
    image_bytes: bytes,
    filename: str,
    subfolder: str = "original",
    content_type: str = "image/jpeg",
    base_url: str = "",
) -> Tuple[str, str]:
    """
    Save an image to Supabase Storage (primary) or local disk (fallback).

    Returns:
        (storage_path, public_url)
        - storage_path: relative path within bucket / uploads dir
        - public_url: full HTTP URL accessible by the mobile app
    """
    # Sanitise filename
    safe_name = (
        filename.replace("..", "")
               .replace("/", "_")
               .replace("\\", "_")
    )
    rel_path = f"product-images/{user_id}/{session_id}/{subfolder}/{safe_name}"

    # Try Supabase first
    client = _get_supabase()
    if client is not None:
        try:
            public_url = _upload_to_supabase(rel_path, image_bytes, content_type)
            logger.info(f"[STORAGE] Uploaded to Supabase: {rel_path}")
            return rel_path, public_url
        except Exception as e:
            logger.warning(f"[STORAGE] Supabase upload failed, falling back to local: {e}")

    # Fallback: local filesystem
    _save_locally(rel_path, image_bytes)
    public_url = _get_local_url(rel_path, base_url)
    logger.info(f"[STORAGE] Saved locally: {rel_path}")
    return rel_path, public_url
