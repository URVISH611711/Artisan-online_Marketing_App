"""
AI Vision Service — Gemini 2.0 Flash (Google AI)

Provides two vision capabilities used by the rest of the backend:

  1. auto_describe_product()          — used by /products/auto-describe
  2. analyze_product_and_background() — used by AI Studio pipeline
  3. build_sd_inpainting_prompt()     — pure string helper, unchanged

Previously used NVIDIA NIM (Kimi-K3 / LLaMA-Vision).
Now uses Gemini via REST API with the same prompts and response contracts.
"""
import base64
import json
import logging
import re
from typing import Dict, Any

import requests
from app.core.config import settings

logger = logging.getLogger(__name__)

GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models"


# ─── Shared image helper ──────────────────────────────────────────────────────

def _build_image_part(image_source: str) -> dict:
    """
    Build a Gemini inlineData image part from a base64 string, data URI,
    or a publicly accessible HTTP(S) URL.
    """
    if image_source.startswith("data:image"):
        header, b64data = image_source.split(",", 1)
        mime = header.split(";")[0].replace("data:", "")
        return {"inlineData": {"mimeType": mime, "data": b64data}}

    if image_source.startswith("http://") or image_source.startswith("https://"):
        try:
            resp = requests.get(image_source, timeout=20)
            resp.raise_for_status()
            ct = resp.headers.get("content-type", "image/jpeg").split(";")[0]
            b64 = base64.b64encode(resp.content).decode("utf-8")
            return {"inlineData": {"mimeType": ct, "data": b64}}
        except Exception as e:
            logger.warning(f"[Gemini] Could not download image from URL: {e}")
            return {}

    # Plain base64 string (no prefix)
    return {"inlineData": {"mimeType": "image/jpeg", "data": image_source}}


def _gemini_call(prompt: str, image_source: str, max_tokens: int = 4000) -> str:
    """
    Single Gemini API call. Returns the raw text content or "" on failure.
    """
    api_key = getattr(settings, "GEMINI_API_KEY", "") or ""
    model   = getattr(settings, "GEMINI_MODEL", "gemini-2.0-flash") or "gemini-2.0-flash"

    if not api_key:
        logger.error("[Gemini] GEMINI_API_KEY not configured")
        return ""

    url = f"{GEMINI_BASE}/{model}:generateContent?key={api_key}"
    image_part = _build_image_part(image_source)
    parts: list = [{"text": prompt}]
    if image_part:
        parts.append(image_part)

    payload = {
        "contents": [{"role": "user", "parts": parts}],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": max_tokens,
            # responseMimeType not set — model returns JSON in markdown fences;
            # _parse_json() strips fences reliably.
        },
    }

    try:
        resp = requests.post(url, json=payload, timeout=45)
        resp.raise_for_status()
        data = resp.json()
        candidates = data.get("candidates", [])
        if not candidates:
            return ""
        parts_out = candidates[0].get("content", {}).get("parts", [])
        return parts_out[0].get("text", "").strip() if parts_out else ""
    except Exception as e:
        logger.warning(f"[Gemini] Call failed: {e}")
        return ""


def _parse_json(content: str) -> dict:
    """Strip markdown fences then parse JSON. Returns {} on failure."""
    clean = re.sub(r"```[a-zA-Z]*\n?", "", content).strip()
    clean = re.sub(r"```", "", clean).strip()
    try:
        m = re.search(r"\{.*\}", clean, re.DOTALL)
        if m:
            return json.loads(m.group(0))
        return json.loads(clean)
    except Exception:
        return {}


# ─── 1. Auto-describe product ─────────────────────────────────────────────────

def auto_describe_product(image_source: str) -> Dict[str, Any]:
    """
    Sends an image to Gemini to extract product details as JSON.
    Used by POST /products/auto-describe.
    """
    prompt = (
        "Analyze this product image and extract the following details. "
        "Return ONLY valid JSON without any markdown formatting:\n"
        "{\n"
        '  "name": "A short, catchy product name",\n'
        '  "description": "A detailed product description",\n'
        '  "material": "Main material (e.g., Cotton, Leather, Wood)",\n'
        '  "color": "Primary color",\n'
        '  "craft_type": "The type of craft or making style (e.g., Handwoven, Carved)"\n'
        "}"
    )
    content = _gemini_call(prompt, image_source, max_tokens=2048)
    if not content:
        return {}
    result = _parse_json(content)
    if result:
        logger.info("[Gemini] auto_describe_product: success")
    return result


# ─── 2. Analyze product + suggest AI Studio background ───────────────────────

def analyze_product_and_background(
    image_source: str,
    product_details: dict,
) -> Dict[str, Any]:
    """
    Analyzes the background-removed product image and existing product metadata.
    Returns structured product + background specifications for the AI Studio pipeline.
    Used by POST /ai/studio/process.
    """
    details_summary = json.dumps(product_details, indent=2)

    prompt = f"""You are an expert commercial product photographer and AI vision analyst.
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
Return ONLY valid raw JSON without markdown code fences."""

    content = _gemini_call(prompt, image_source, max_tokens=4000)

    if content:
        result = _parse_json(content)
        if "background" in result:
            logger.info("[Gemini] analyze_product_and_background: success")
            return result

    # Hard fallback — same structure as before so the Studio pipeline never crashes
    logger.warning("[Gemini] analyze_product_and_background: using fallback")
    return {
        "product": {
            "name": product_details.get("name", "Handcrafted Item"),
            "category": product_details.get("craft_type", "Handicraft"),
            "material": product_details.get("material", "Natural"),
            "primary_color": product_details.get("color", "Natural"),
            "secondary_colors": [],
            "shape": "Standard",
            "texture": "Handmade",
            "craft_style": product_details.get("craft_type", "Artisan"),
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
            "composition": "Minimal commercial product photography",
        },
    }


# ─── 3. Build SD inpainting prompt — pure string helper, unchanged ────────────

def build_sd_inpainting_prompt(bg_details: dict, user_instructions: str = "") -> str:
    """
    Constructs a complete SD 1.5 inpainting prompt from structured background
    parameters. Only describes the background/environment — never the product.
    """
    style    = bg_details.get("style", "Premium Artisan Studio")
    surface  = bg_details.get("surface", "natural wooden tabletop")
    env      = bg_details.get("environment", "warm handcrafted studio")
    palette  = (
        ", ".join(bg_details["color_palette"])
        if isinstance(bg_details.get("color_palette"), list)
        else bg_details.get("color_palette", "warm beige, cream")
    )
    lighting = bg_details.get("lighting", "soft natural window light")
    shadow   = bg_details.get("shadow", "realistic soft contact shadow")
    mood     = bg_details.get("mood", "premium authentic")
    comp     = bg_details.get("composition", "minimal product photography")

    base = (
        f"Create a photorealistic {style} product photography environment. "
        f"Place the existing product naturally on a clean {surface} inside a {env}. "
        f"Use a {palette} color palette, gentle {lighting}, {shadow} directly beneath "
        f"product, {mood} atmosphere, {comp}."
    )
    if user_instructions and user_instructions.strip():
        base += f" {user_instructions.strip()}"
    return base
