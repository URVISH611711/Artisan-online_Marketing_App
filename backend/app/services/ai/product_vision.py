"""
product_vision.py — HTTP client for the vision sidecar.

Calls the standalone vision service (port 8001) to analyze images.
If the sidecar is down or fails, degrades gracefully to llm_prompt.py
(text-only analysis using user details) so the pipeline NEVER crashes.
"""
import io
import json
import logging
import requests
from PIL import Image

from app.core.config import settings

logger = logging.getLogger(__name__)


def analyze_product_vision(image_bytes: bytes, mime_type: str, details: dict) -> dict:
    """
    Send an image to the vision sidecar for analysis.
    Returns a structured dictionary matching the expected output schema.
    
    If the sidecar is unavailable, falls back to text-only LLM.
    """
    sidecar_url = f"{settings.VISION_SERVICE_URL}/analyze"
    
    try:
        files = {
            "image": ("product.jpg", image_bytes, mime_type)
        }
        data = {
            "product_name": details.get("name", ""),
            "material": details.get("material", ""),
            "color": details.get("color", ""),
            "craft_type": details.get("craft_type", ""),
            "style": details.get("style", ""),
        }
        
        logger.info("[Vision] Calling sidecar...")
        # A generous timeout since loading the model for the first time takes a few seconds
        resp = requests.post(sidecar_url, files=files, data=data, timeout=settings.VISION_TIMEOUT)
        resp.raise_for_status()
        
        result = resp.json()
        if result.get("success") and result.get("analysis"):
            return result["analysis"]
            
        logger.warning(f"[Vision] Sidecar succeeded but returned no analysis: {result}")
        
    except requests.exceptions.RequestException as e:
        logger.warning(f"[Vision] Sidecar unavailable or failed ({e}). Degrading to text-only LLM fallback.")
        
    # --- GRACEFUL DEGRADATION: Fallback to text-only LLM ---
    from app.services.llm_prompt import generate_sd_prompt
    from app.services.ai.model_manager import model_manager, ModelKey
    from app.services.ai.gpu_lock import gpu_lock
    
    logger.info("[Vision] Executing text-only fallback analysis...")
    with gpu_lock("backend-LLM", timeout=60):
        with model_manager.using(ModelKey.LLM_TEXT):
            fallback_prompt = generate_sd_prompt(details)
            
    # Package the fallback prompt into the same JSON structure
    return {
        "name": details.get("name") or "Unknown Product",
        "description": details.get("description") or "A handcrafted product.",
        "material": details.get("material") or fallback_prompt.get("material_hint") or "Unknown",
        "color": details.get("color") or fallback_prompt.get("color_hint") or "Unknown",
        "style": details.get("style") or fallback_prompt.get("style_hint") or "Unknown",
        "key_features": details.get("key_features") or "Handcrafted quality.",
        "target_customer": details.get("target_customer") or "General audience.",
        "sd_prompt_hint": fallback_prompt.get("prompt", ""),
    }
