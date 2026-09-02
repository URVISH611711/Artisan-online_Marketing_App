"""
Smart Pricing Service — Gemini 2.0 Flash (Google AI)
Acts as the artisan's personal pricing assistant.

Receives: product name, current price, product image (base64 or URL).
Returns:  three pricing choices (Competitive, Recommended, Premium)
          with short reasons. Gemini independently approximates all
          other pricing factors from the image and product context.
"""
import base64
import json
import logging
import math
import re
from typing import Dict, Any, Optional

import requests
from app.core.config import settings

logger = logging.getLogger(__name__)

# ─── Gemini REST endpoint ─────────────────────────────────────────────────────
# We use raw HTTP (no SDK dependency) so the existing requests library suffices.
GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models"

# ─── System / developer instruction ──────────────────────────────────────────

SYSTEM_PROMPT = """You are Artisan AI's Expert Pricing Agent and Market Analyst.
Your job is to protect artisan sellers from undervaluing their work and to 
ensure their products are priced competitively against real-world brands.

You will receive:
- product name
- current/existing selling price
- product image

Analyze the product image carefully. You must independently approximate all 
pricing factors (materials, craftsmanship, labor, uniqueness).

CRITICAL DIRECTIVES:
1. MARKET COMPARISON: Actively search your knowledge base for similar products 
   from well-known brands, boutique stores, and online marketplaces (like Etsy, 
   Amazon Handmade, or premium decor brands). 
2. PREVENT UNDERVALUING: Artisans frequently set their prices mistakenly low. 
   If the existing price is significantly lower than market value for similar 
   quality/brand items, you MUST correct it and recommend a higher price.
3. JUSTIFY WITH REAL EXAMPLES: In your reasoning, mention the types of brands 
   or market averages you are comparing this against to build seller confidence.

Determine whether the existing price appears:
- too low (correct it upwards)
- reasonable (optimize it for psychology, e.g., ending in 99 or 50)
- too high (adjust it to be competitive)

Then generate exactly THREE realistic price choices.

The three choices must represent:

1. COMPETITIVE PRICE
   A price to compete aggressively with mass-produced alternatives or entry-level 
   handmade goods, while remaining fair to the artisan's labor.

2. RECOMMENDED PRICE
   Your strongest overall recommendation based on REAL market comparisons. 
   Balance seller value and buyer willingness to pay for premium craftsmanship.

3. PREMIUM PRICE
   A designer/luxury price point. How much would a high-end boutique or 
   premium brand charge for this exact item?

The three prices must be commercially realistic.

Do NOT generate arbitrary numbers.

Do NOT create extreme prices simply to maximize seller profit.

Do NOT recommend a price that is obviously inconsistent
with the product's apparent quality or category.

The current price must be considered, but the AI is allowed
to recommend a lower or higher price when justified.

For every recommended price provide a short explanation.

Also provide an overall explanation of why the recommended
price is the strongest choice.

If information is uncertain, lower the confidence level
rather than inventing facts.

Return ONLY valid JSON matching this exact schema:

{
  "current_price": 0,

  "prices": {
    "competitive": {
      "price": 0,
      "label": "Competitive",
      "reason": "",
      "confidence": "LOW|MEDIUM|HIGH"
    },

    "recommended": {
      "price": 0,
      "label": "Recommended",
      "reason": "",
      "confidence": "LOW|MEDIUM|HIGH"
    },

    "premium": {
      "price": 0,
      "label": "Premium",
      "reason": "",
      "confidence": "LOW|MEDIUM|HIGH"
    }
  },

  "analysis": {
    "product_type": "",
    "apparent_material": "",
    "craftsmanship": "",
    "quality": "",
    "complexity": "",
    "estimated_market_position": "",
    "estimated_demand": "",
    "pricing_assessment": ""
  },

  "recommended_reason": "",

  "warnings": []
}

Never return markdown.
Never return code fences.
Never return conversational text outside the JSON."""


# ─── Image helper ─────────────────────────────────────────────────────────────

def _build_image_part(image_source: str) -> dict:
    """
    Build the Gemini inlineData or fileData part for an image.

    Gemini image part formats:
      - base64 string  → inlineData { mimeType, data }
      - data: URI      → inlineData (strip the prefix)
      - http(s) URL    → download and inline (Gemini can't reach private URLs)
    """
    if image_source.startswith("data:image"):
        # data:image/jpeg;base64,<data>
        header, b64data = image_source.split(",", 1)
        mime = header.split(";")[0].replace("data:", "")
        return {"inlineData": {"mimeType": mime, "data": b64data}}

    if image_source.startswith("http://") or image_source.startswith("https://"):
        # Download and inline — handles both Supabase public URLs and
        # external URLs safely without depending on Gemini File API.
        try:
            resp = requests.get(image_source, timeout=20)
            resp.raise_for_status()
            ct = resp.headers.get("content-type", "image/jpeg").split(";")[0]
            b64 = base64.b64encode(resp.content).decode("utf-8")
            return {"inlineData": {"mimeType": ct, "data": b64}}
        except Exception as e:
            logger.warning(f"[Gemini] Could not download image from URL: {e}")
            # Fall through — pass empty (will get a text-only response)
            return {}

    # Plain base64 (no prefix) — from local disk reads in smart_pricing.py
    return {"inlineData": {"mimeType": "image/jpeg", "data": image_source}}


# ─── Validation ───────────────────────────────────────────────────────────────

def _validate_prices(data: Dict[str, Any], current_price: float) -> Optional[str]:
    """
    Validate that the parsed response has all required fields and sane values.
    Returns an error string if invalid, None if OK.
    """
    try:
        prices = data.get("prices", {})
        if not prices:
            return "Missing 'prices' field"

        for tier in ["competitive", "recommended", "premium"]:
            td = prices.get(tier)
            if td is None:
                return f"Missing price tier: {tier}"
            price = td.get("price")
            if price is None:
                return f"Missing price value for tier: {tier}"
            if not isinstance(price, (int, float)):
                return f"Price for {tier} is not numeric: {price}"
            if math.isnan(price) or math.isinf(price):
                return f"Price for {tier} is NaN or Inf"
            if price <= 0:
                return f"Price for {tier} must be positive, got: {price}"

        # Sanity check — catch obviously absurd outputs
        # (not a hard ±20% band — catches e.g. ₹2 or ₹999999 for a ₹1800 product)
        if current_price and current_price > 0:
            for label, val in [
                ("competitive", prices["competitive"]["price"]),
                ("recommended", prices["recommended"]["price"]),
                ("premium",     prices["premium"]["price"]),
            ]:
                ratio = val / current_price
                if ratio > 10 or ratio < 0.10:
                    return (
                        f"Sanity check failed for '{label}': "
                        f"₹{val} is wildly inconsistent with current price ₹{current_price}"
                    )

        return None

    except Exception as e:
        return f"Validation error: {e}"


# ─── Main service function ────────────────────────────────────────────────────

def get_smart_prices(
    image_source: str,
    product_name: str,
    current_price: float,
) -> Dict[str, Any]:
    """
    Ask Gemini to return three pricing tiers for the given product.

    Returns:
      { "success": True,  "result": { ... } }   on success
      { "success": False, "error": "..." }        on failure
    """
    api_key = getattr(settings, "GEMINI_API_KEY", "") or ""
    model   = getattr(settings, "GEMINI_MODEL", "gemini-2.0-flash") or "gemini-2.0-flash"

    if not api_key:
        logger.error("[Gemini] GEMINI_API_KEY is not configured")
        return {"success": False, "error": "Smart Pricing is temporarily unavailable."}

    url = f"{GEMINI_BASE}/{model}:generateContent?key={api_key}"

    user_text = (
        f"Product name: {product_name}\n"
        f"Current selling price: ₹{current_price}\n\n"
        "Analyze this product image and return exactly three pricing choices "
        "(competitive, recommended, premium) as valid JSON matching the schema "
        "in your instructions."
    )

    image_part = _build_image_part(image_source)

    def _build_payload(extra_instruction: str = "") -> dict:
        text = (extra_instruction + "\n\n" + user_text).strip() if extra_instruction else user_text
        parts: list = [{"text": text}]
        if image_part:
            parts.append(image_part)
        return {
            "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
            "contents": [{"role": "user", "parts": parts}],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 4000,
                # NOTE: responseMimeType is NOT set — the model returns JSON in
                # markdown fences which our _attempt() regex strips reliably.
            },
        }

    def _attempt(extra: str = "") -> Optional[Dict[str, Any]]:
        """Single Gemini call. Returns parsed dict or None."""
        payload = _build_payload(extra)
        try:
            logger.info(f"[Gemini] Calling {model}...")
            resp = requests.post(url, json=payload, timeout=60)
            resp.raise_for_status()
            data = resp.json()

            # Extract text from response
            candidates = data.get("candidates", [])
            if not candidates:
                logger.warning("[Gemini] Empty candidates in response")
                return None

            parts = candidates[0].get("content", {}).get("parts", [])
            if not parts:
                logger.warning("[Gemini] No parts in candidate")
                return None

            content = parts[0].get("text", "").strip()
            if not content:
                logger.warning("[Gemini] Empty text part")
                return None

            # Strip markdown fences if present (defensive)
            clean = re.sub(r"```[a-zA-Z]*\n?", "", content).strip()
            clean = re.sub(r"```", "", clean).strip()

            # Parse JSON
            json_match = re.search(r"\{.*\}", clean, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
            return json.loads(clean)

        except requests.exceptions.Timeout:
            logger.warning("[Gemini] Request timed out")
            return None
        except json.JSONDecodeError as e:
            logger.warning(f"[Gemini] JSON decode error: {e}")
            return None
        except Exception as e:
            logger.warning(f"[Gemini] Request failed: {e}")
            return None

    # ── First attempt ─────────────────────────────────────────────────────────
    parsed = _attempt()

    if parsed is not None:
        err = _validate_prices(parsed, current_price)
        if err:
            logger.warning(f"[Gemini] Validation failed: {err} — retrying once...")
            correction = (
                "IMPORTANT: Your previous response was invalid. "
                "Return ONLY valid JSON with no markdown, no code fences. "
                f"Validation failed because: {err}. "
                "Ensure all three prices (competitive, recommended, premium) are "
                "positive numbers close to the current price."
            )
            parsed = _attempt(extra=correction)
            if parsed is not None:
                err = _validate_prices(parsed, current_price)
                if err:
                    logger.error(f"[Gemini] Retry also failed validation: {err}")
                    parsed = None

    if parsed is None:
        return {
            "success": False,
            "error": "Unable to generate smart pricing right now. Please try again.",
        }

    # ── Normalise and return ──────────────────────────────────────────────────
    parsed["current_price"] = current_price
    for tier in ["competitive", "recommended", "premium"]:
        if "prices" in parsed and tier in parsed["prices"]:
            raw = parsed["prices"][tier].get("price", 0)
            parsed["prices"][tier]["price"] = round(raw)

    logger.info("[Gemini] Smart pricing success")
    return {"success": True, "result": parsed}


# ─── Legacy alias (kept so anything still importing analyze_and_price works) ──

def analyze_and_price(
    image_source: str,
    product_metadata: Dict[str, Any],
    seller_location: Dict[str, Optional[str]],
) -> Dict[str, Any]:
    name  = product_metadata.get("name", "Unknown Product")
    price = float(product_metadata.get("current_price", 0) or 0)
    return get_smart_prices(image_source, name, price)
