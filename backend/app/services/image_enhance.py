import logging
from typing import Optional

logger = logging.getLogger(__name__)

MAX_IMAGES = 5
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp"
}

def validate_image(content_type: str, size: int, filename: str) -> Optional[str]:
    if content_type not in ALLOWED_MIME_TYPES:
        return f"File '{filename}' has invalid type '{content_type}'. Must be JPEG, PNG, or WEBP."
    if size > MAX_IMAGE_SIZE_BYTES:
        return f"File '{filename}' exceeds 10MB limit."
    return None
