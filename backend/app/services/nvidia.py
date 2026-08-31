import requests
import json
import re
import logging
from typing import Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

INVOKE_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
DEFAULT_KEY = "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"
VISION_MODEL = "moonshotai/kimi-k3"
FALLBACK_VISION_MODEL = "meta/llama-3.2-11b-vision-instruct"

def _format_image_payload(image_source: str) -> dict:
    if image_source.startswith("http://") or image_source.startswith("https://") or image_source.startswith("data:image"):
        return {"url": image_source}
    return {"url": f"data:image/jpeg;base64,{image_source}"}


def auto_describe_product(image_source: str) -> Dict[str, Any]:
    """
    Sends an image URL or base64 string to NVIDIA Vision API
    to extract product details as JSON.
    """
    api_key = settings.NVIDIA_API_KEY or DEFAULT_KEY
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json",
    }
    img_payload = _format_image_payload(image_source)

    prompt = """
    Analyze this product image and extract the following details in JSON format:
    {
      "name": "A short, catchy product name",
      "description": "A detailed product description",
      "material": "Main material (e.g., Cotton, Leather, Wood)",
      "color": "Primary color",
      "craft_type": "The type of craft or making style (e.g., Handwoven, Carved)"
    }
    Return ONLY valid JSON without any markdown formatting.
    """

    payload = {
      "messages": [
        {
          "role": "user",
          "content": [
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": img_payload}
          ]
        }
      ],
      "model": FALLBACK_VISION_MODEL,
      "max_tokens": 1024,
      "temperature": 0.2
    }

    try:
        response = requests.post(INVOKE_URL, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()
        if "choices" in data and len(data["choices"]) > 0:
            content = data["choices"][0]["message"].get("content", "")
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
            if content.strip():
                return json.loads(content.strip())
        return {}
    except Exception as e:
        logger.error(f"Failed to auto-describe product: {e}")
        return {}


def analyze_product_and_background(image_source: str, product_details: dict) -> Dict[str, Any]:
    """
    Analyzes the background-removed product image and existing product metadata
    using NVIDIA's Kimi-K3 model (or fallback vision model).
    Extracts structured product + background specifications.
    """
    api_key = settings.NVIDIA_API_KEY or DEFAULT_KEY
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json",
    }
    img_payload = _format_image_payload(image_source)

    details_summary = json.dumps(product_details, indent=2)

    prompt = f"""
    You are an expert commercial product photographer and AI vision analyst.
    Analyze this product image (background has been removed) along with its known metadata:
    
    PRODUCT METADATA:
    {details_summary}

    Generate a structured analysis of the REAL PRODUCT and recommend an optimal commercial studio background setup.
    Return ONLY valid JSON matching this exact structure:
    {{
      "product": {{
        "name": "Product Name",
        "category": "Category or Craft Style",
        "material": "Primary Material",
        "primary_color": "Primary Color",
        "secondary_colors": ["secondary color 1"],
        "shape": "Product Shape",
        "texture": "Product Surface Texture",
        "craft_style": "Craftsmanship Style"
      }},
      "background": {{
        "style": "Premium Artisan Studio",
        "environment": "Warm handcrafted studio setting",
        "surface": "Natural light wooden tabletop",
        "color_palette": ["warm beige", "soft cream"],
        "lighting": "Soft natural window light from left",
        "shadow": "Realistic soft contact shadow directly beneath",
        "depth": "Gentle shallow depth of field",
        "mood": "Premium, authentic, handcrafted",
        "composition": "Minimal commercial product photography"
      }}
    }}
    Do NOT invent product characteristics that cannot be determined from the image or metadata.
    Return ONLY valid raw JSON without markdown code fences.
    """

    # Try VISION_MODEL first, fallback to FALLBACK_VISION_MODEL if needed
    for model_name in [VISION_MODEL, FALLBACK_VISION_MODEL]:
        payload = {
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": img_payload}
                    ]
                }
            ],
            "model": model_name,
            "max_tokens": 1500,
            "temperature": 0.3
        }

        try:
            logger.info(f"[NVIDIA] Sending vision request to {model_name}...")
            response = requests.post(INVOKE_URL, headers=headers, json=payload, timeout=45)
            response.raise_for_status()
            data = response.json()

            if "choices" in data and len(data["choices"]) > 0:
                content = data["choices"][0]["message"].get("content", "")
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    parsed = json.loads(json_match.group(0))
                    if "background" in parsed:
                        return parsed
                if content.strip():
                    parsed = json.loads(content.strip())
                    if "background" in parsed:
                        return parsed
        except Exception as e:
            logger.warning(f"[NVIDIA] Model {model_name} failed or timed out: {e}. Trying fallback if available.")

    # Hard fallback default if API fails
    return {
        "product": {
            "name": product_details.get("name", "Handcrafted Item"),
            "category": product_details.get("craft_type", "Handicraft"),
            "material": product_details.get("material", "Natural"),
            "primary_color": product_details.get("color", "Natural"),
            "secondary_colors": [],
            "shape": "Standard",
            "texture": "Handmade",
            "craft_style": product_details.get("craft_type", "Artisan")
        },
        "background": {
          "style": "Premium Artisan Studio",
          "environment": "Warm handcrafted studio",
          "surface": "Natural wooden tabletop",
          "color_palette": ["warm beige", "soft cream"],
          "lighting": "Soft natural window lighting",
          "shadow": "Realistic soft contact shadow",
          "depth": "Subtle shallow depth of field",
          "mood": "Premium, authentic, handcrafted",
          "composition": "Minimal commercial product photography"
        }
    }


def build_sd_inpainting_prompt(bg_details: dict, user_instructions: str = "") -> str:
    """
    Constructs a complete SD 1.5 inpainting prompt from structured background parameters.
    Only describes the background/environment.
    """
    style = bg_details.get("style", "Premium Artisan Studio")
    surface = bg_details.get("surface", "natural wooden tabletop")
    env = bg_details.get("environment", "warm handcrafted studio")
    palette = ", ".join(bg_details.get("color_palette", ["warm beige", "cream"])) if isinstance(bg_details.get("color_palette"), list) else bg_details.get("color_palette", "warm beige, cream")
    lighting = bg_details.get("lighting", "soft natural window light")
    shadow = bg_details.get("shadow", "realistic soft contact shadow")
    mood = bg_details.get("mood", "premium authentic")
    comp = bg_details.get("composition", "minimal product photography")

    base = f"Create a photorealistic {style} product photography environment. Place the existing product naturally on a clean {surface} inside a {env}. Use a {palette} color palette, gentle {lighting}, {shadow} directly beneath product, {mood} atmosphere, {comp}."
    if user_instructions and user_instructions.strip():
        base += f" {user_instructions.strip()}"
    return base
