"""
product_vision.py — Uses NVIDIA API (Kimi-K3) for image and background analysis.
No local SmolVLM dependency.
"""
import base64
import logging
from typing import Dict, Any
from app.services.nvidia import analyze_product_and_background

logger = logging.getLogger(__name__)

def analyze_product_vision(image_bytes: bytes, mime_type: str, details: dict) -> dict:
    """
    Analyzes product image and metadata via NVIDIA Vision API (Kimi-K3).
    Returns structured analysis for background customization.
    """
    try:
        b64_img = base64.b64encode(image_bytes).decode("utf-8")
        image_source = f"data:{mime_type};base64,{b64_img}"
        result = analyze_product_and_background(image_source, details)
        return result
    except Exception as e:
        logger.error(f"[Vision] NVIDIA API vision analysis failed: {e}")
        return {
            "product": details,
            "background": {
                "style": "Premium Studio",
                "environment": "Warm handcrafted studio",
                "surface": "Natural wooden tabletop",
                "color_palette": ["warm beige", "cream"],
                "lighting": "Soft natural window light",
                "shadow": "Realistic soft contact shadow",
                "depth": "Subtle shallow depth of field",
                "mood": "Premium, authentic",
                "composition": "Minimal product photography"
            }
        }
