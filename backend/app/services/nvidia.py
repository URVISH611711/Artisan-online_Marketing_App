import requests
import json
# Trigger hot reload
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
