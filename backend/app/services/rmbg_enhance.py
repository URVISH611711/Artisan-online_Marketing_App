"""
Local Background Removal & Image Enhancement using BRIA AI RMBG-1.4.

Uses HuggingFace Transformers pipeline.
Returns transparent PNGs instead of compositing, to be used later in SD.
"""
import io
import logging
import time
from typing import Dict, Any
from PIL import Image

from app.services.memory_manager import memory_manager

logger = logging.getLogger(__name__)

# Global lazy-loaded pipeline instance
_pipe = None


def get_rmbg_pipeline():
    global _pipe
    if _pipe is None:
        logger.info("[RMBG-1.4] Loading local model briaai/RMBG-1.4...")
        from transformers import pipeline
        import torch
        device = 0 if torch.cuda.is_available() else -1
        _pipe = pipeline(
            "image-segmentation",
            model="briaai/RMBG-1.4",
            trust_remote_code=True,
            device=device
        )
        logger.info("[RMBG-1.4] Local model loaded successfully.")
    return _pipe

def unload_rmbg_pipeline():
    global _pipe
    if _pipe is not None:
        logger.info("[RMBG-1.4] Unloading model to free VRAM...")
        memory_manager.offload_model(_pipe)
        _pipe = None


def remove_background(
    image_bytes: bytes,
    mime_type: str = "image/jpeg",
) -> Dict[str, Any]:
    """
    Remove background and produce a transparent PNG using RMBG-1.4.

    Args:
        image_bytes: Raw input image bytes
        mime_type: MIME type of original image

    Returns:
        Dict with transparent_image_bytes, mime_type, processing_time_seconds
    """
    started_at = time.time()
    pipe = get_rmbg_pipeline()

    # Open image with PIL
    original_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Run RMBG-1.4 pipeline
    logger.info("[RMBG-1.4] Running background segmentation...")
    result = pipe(original_img)

    # Handle pipeline output formats (PIL.Image or list/dict)
    rgba_img = None
    if isinstance(result, Image.Image):
        # If it returns RGBA directly
        if result.mode == "RGBA":
            rgba_img = result
        else:
            rgba_img = original_img.convert("RGBA")
            rgba_img.putalpha(result.convert("L"))
    elif isinstance(result, list) and len(result) > 0:
        item = result[0]
        if isinstance(item, dict):
            if "mask" in item:
                mask = item["mask"].convert("L").resize(original_img.size, Image.LANCZOS)
                rgba_img = original_img.convert("RGBA")
                rgba_img.putalpha(mask)
            elif "image" in item:
                rgba_img = item["image"].convert("RGBA")
        elif isinstance(item, Image.Image):
            if item.mode == "RGBA":
                rgba_img = item
            else:
                rgba_img = original_img.convert("RGBA")
                rgba_img.putalpha(item.convert("L"))

    if rgba_img is None:
        rgba_img = original_img.convert("RGBA")

    # Output as transparent PNG
    output_buffer = io.BytesIO()
    rgba_img.save(output_buffer, format="PNG")
    enhanced_bytes = output_buffer.getvalue()
    
    # We don't unload immediately here in case there are multiple images to process,
    # The caller (job manager) is responsible for calling unload_rmbg_pipeline() when done.

    elapsed = round(time.time() - started_at, 2)
    logger.info(f"[RMBG-1.4] Background removal complete in {elapsed}s")

    return {
        "enhanced_image_bytes": enhanced_bytes,
        "enhanced_mime_type": "image/png",
        "processing_time_seconds": elapsed,
        "model": "briaai/RMBG-1.4",
        "size": rgba_img.size
    }
