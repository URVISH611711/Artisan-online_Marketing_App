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


# ── Multilingual Auto-Cataloger ────────────────────────────────────────────────

# llama-3.2-11b-vision is the model that actually responds quickly on this key
# (Kimi-K3 reliably read-times-out even at 90s). It handles both the text-only
# transcript case and the transcript+image cross-check case.
CATALOG_MODEL = "meta/llama-3.2-11b-vision-instruct"
CATALOG_FALLBACK_MODEL = "meta/llama-3.2-11b-vision-instruct"

# Returned when the API is unavailable or the response can't be parsed.
# Every field is null/empty so the artisan never sees invented data.
_EMPTY_CATALOG = {
    "extracted": {
        "name": None, "material": None, "color": None, "craft_type": None,
        "price": None, "dimensions": None, "origin": None,
        "confidence": {},
    },
    "translations": {
        "en": {"name": None, "description": None, "short_description": None},
        "hi": {"name": None, "description": None, "short_description": None},
    },
    "seo": {"title": None, "meta_description": None, "keywords": [], "tags": []},
    "image_check": {"mismatch": False, "message": None},
}


def _empty_catalog() -> Dict[str, Any]:
    import copy
    return copy.deepcopy(_EMPTY_CATALOG)


CATALOG_SYSTEM_PROMPT = """You are a product cataloging assistant for an Indian artisan marketplace.
An artisan has described one of their handmade products by voice, in their own language.
You are given the transcript (and possibly a photo of the product).

Your job is to turn the description into a structured, bilingual product catalog entry.

ABSOLUTE RULES — follow every one:
1. NEVER invent product facts. If a fact was not stated (or clearly visible in the image),
   set that field to null. Do NOT guess a material, colour, size, price or origin.
2. Preserve regional and craft terminology exactly (e.g. "Patola", "Bandhani", "Warli",
   "Kutch", "Meenakari"). Do NOT translate craft names into generic English words.
3. The English description must be professional, fluent marketplace copy.
4. The Hindi description must read naturally to a native Hindi speaker — write it as a Hindi
   speaker would, NOT a word-for-word translation of the English.
5. SEO must be genuinely useful: real, relevant search terms. Do NOT keyword-stuff or repeat.
6. If a photo is provided and it clearly contradicts the spoken description, set
   image_check.mismatch=true and explain briefly in image_check.message. Do NOT change any
   field to match the image — only warn.
7. For every extracted fact, give a confidence score 0.0-1.0 in "confidence" (how sure you are
   the value is correct and actually stated). Missing/null fields get 0.

Return ONLY valid raw JSON (no markdown fences) with EXACTLY this structure:
{
  "extracted": {
    "name": string|null, "material": string|null, "color": string|null,
    "craft_type": string|null, "price": number|null, "dimensions": string|null,
    "origin": string|null,
    "confidence": { "<field>": 0.0-1.0 }
  },
  "translations": {
    "en": { "name": string, "description": string, "short_description": string },
    "hi": { "name": string, "description": string, "short_description": string }
  },
  "seo": { "title": string, "meta_description": string, "keywords": [string], "tags": [string] },
  "image_check": { "mismatch": boolean, "message": string|null }
}
"""


def generate_catalog(transcript: str, language: str = "auto", image_source: str | None = None, existing_description: str | None = None) -> Dict[str, Any]:
    """
    Turn an artisan's voice-note transcript into a structured bilingual catalog entry
    (extracted facts + EN/HI copy + SEO) using the NVIDIA chat API.

    Never fabricates: on API failure or unparseable output, returns an empty skeleton
    with null fields so the caller/artisan is never shown invented data.
    """
    if not transcript or not transcript.strip():
        return _empty_catalog()

    api_key = settings.NVIDIA_API_KEY or DEFAULT_KEY
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json",
    }

    user_text = (
        f"Detected/declared language of the transcript: {language}.\n"
        f"Artisan's spoken product description (transcript):\n\"\"\"\n{transcript.strip()}\n\"\"\"\n"
    )
    
    if existing_description and existing_description.strip():
        user_text += f"\nPrevious Product Description (merge and polish with transcript):\n\"\"\"\n{existing_description.strip()}\n\"\"\"\n"

    user_text += "\nProduce the JSON catalog entry now."

    content: list = [{"type": "text", "text": user_text}]
    
    models = []
    if image_source:
        content.append({"type": "image_url", "image_url": _format_image_payload(image_source)})
        models = ["meta/llama-3.2-11b-vision-instruct"]
    else:
        # If no image is provided, use a pure text model which is much more reliable for JSON
        models = ["meta/llama-3.3-70b-instruct", "meta/llama-3.2-11b-vision-instruct"]

    for model_name in models:
        payload = {
            "messages": [
                {"role": "system", "content": CATALOG_SYSTEM_PROMPT},
                {"role": "user", "content": content},
            ],
            "model": model_name,
            "max_tokens": 2000,
            "temperature": 0.4,
        }
        # Kimi-K3 is a heavy reasoning model and can be slow to first byte, so allow a
        # generous read window (connect stays short) and retry once on a transient timeout.
        for attempt in range(2):
            try:
                logger.info(
                    f"[NVIDIA] Generating catalog via {model_name} "
                    f"(image={'yes' if image_source else 'no'}, attempt={attempt + 1})..."
                )
                response = requests.post(
                    INVOKE_URL, headers=headers, json=payload, timeout=(10, 120)
                )
                response.raise_for_status()
                data = response.json()
                if "choices" in data and len(data["choices"]) > 0:
                    raw = data["choices"][0]["message"].get("content", "")
                    json_match = re.search(r'\{.*\}', raw, re.DOTALL)
                    candidate = json_match.group(0) if json_match else raw.strip()
                    if candidate:
                        parsed = json.loads(candidate)
                        if isinstance(parsed, dict) and "translations" in parsed:
                            return _normalize_catalog(parsed)
                # Got a response but no usable JSON — no point retrying the same model.
                logger.warning(f"[NVIDIA] Catalog model {model_name} returned no usable JSON.")
                break
            except requests.exceptions.Timeout as e:
                logger.warning(
                    f"[NVIDIA] Catalog model {model_name} timed out "
                    f"(attempt {attempt + 1}/2): {e}."
                )
                if attempt == 0:
                    continue  # retry once before falling back
                logger.warning(f"[NVIDIA] Giving up on {model_name}; trying fallback if available.")
                break
            except Exception as e:
                logger.warning(f"[NVIDIA] Catalog model {model_name} failed: {e}. Trying fallback if available.")
                break

    logger.error("[NVIDIA] Catalog generation failed for all models; returning empty skeleton.")
    return _empty_catalog()


def _normalize_catalog(parsed: Dict[str, Any]) -> Dict[str, Any]:
    """Merge the model output onto the empty skeleton so all keys always exist."""
    out = _empty_catalog()
    extracted = parsed.get("extracted") or {}
    for k in ("name", "material", "color", "craft_type", "price", "dimensions", "origin"):
        if k in extracted:
            out["extracted"][k] = extracted[k]
    if isinstance(extracted.get("confidence"), dict):
        out["extracted"]["confidence"] = extracted["confidence"]

    tr = parsed.get("translations") or {}
    for lang in ("en", "hi"):
        block = tr.get(lang) or {}
        if isinstance(block, dict):
            for k in ("name", "description", "short_description"):
                if block.get(k) is not None:
                    out["translations"][lang][k] = block[k]

    seo = parsed.get("seo") or {}
    if isinstance(seo, dict):
        out["seo"]["title"] = seo.get("title")
        out["seo"]["meta_description"] = seo.get("meta_description")
        out["seo"]["keywords"] = seo.get("keywords") or []
        out["seo"]["tags"] = seo.get("tags") or []

    ic = parsed.get("image_check") or {}
    if isinstance(ic, dict):
        out["image_check"]["mismatch"] = bool(ic.get("mismatch", False))
        out["image_check"]["message"] = ic.get("message")

    return out
