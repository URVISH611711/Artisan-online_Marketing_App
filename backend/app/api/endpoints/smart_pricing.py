"""
Smart Pricing endpoint — POST /api/v1/ai/smart-price/{product_id}

Fetches the seller's own product, resolves its primary image,
then delegates to Kimi-K3 (via pricing service) to generate
three price recommendations: Competitive, Recommended, Premium.

The seller is NOT asked to provide manufacturing cost, demand,
or any other factor — Kimi estimates everything from the image,
product name and current price.
"""
import base64
import logging
import urllib.parse
import os

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database.connection import get_db
from app.api.deps import get_current_user
from app.models.user import User, ArtisanProfile
from app.models.product import Product
from app.services.pricing import get_smart_prices

logging.basicConfig(filename="smart_pricing_debug.txt", level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/smart-price/{product_id}")
def smart_price(
    product_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate AI smart pricing for the seller's product.

    Returns:
      {
        "success": true,
        "product_id": "...",
        "product_name": "...",
        "current_price": 1800,
        "image_url": "...",
        "result": { <Kimi pricing JSON> }
      }

    On AI failure returns 200 with:
      { "success": false, "error": "..." }
    """
    # ── 1. Fetch product with images ─────────────────────────────────────────
    product = (
        db.query(Product)
        .options(joinedload(Product.images))
        .filter(Product.id == product_id)
        .filter(Product.deleted_at.is_(None))
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    # ── 2. Ownership check ───────────────────────────────────────────────────
    if str(product.artisan_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only analyze your own products",
        )

    # ── 3. Resolve primary image ─────────────────────────────────────────────
    # Prefer enhanced images; fall back to first image by sort_order.
    image_url = None
    if product.images:
        sorted_images = sorted(
            product.images,
            key=lambda img: (not img.is_enhanced, img.sort_order),
        )
        image_url = sorted_images[0].url

    if not image_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product image is required for AI pricing. Please upload at least one image.",
        )

    # ── 4. Convert local image URL to base64 ─────────────────────────────────
    # NVIDIA's API cannot reach local/private network addresses, so we read
    # the image from disk and encode it instead of forwarding a local URL.
    image_source = image_url
    logger.info(f"[SmartPrice] Product: {product.name!r}, Price: {product.price}, Image: {image_url}")

    is_local = any(
        token in image_url
        for token in ["127.0.0.1", "localhost", "10.", "192.168.", "172."]
    )
    if is_local:
        try:
            path = urllib.parse.urlparse(image_url).path
            if path.startswith("/uploads/"):
                filepath = os.path.join(os.getcwd(), path.lstrip("/"))
                with open(filepath, "rb") as f:
                    image_source = base64.b64encode(f.read()).decode("utf-8")
                logger.info("[SmartPrice] Local image loaded and base64-encoded from disk.")
            else:
                logger.error(f"[SmartPrice] Cannot resolve local path for {image_url}")
        except Exception as e:
            logger.error(f"[SmartPrice] Failed to read local image: {e}")
            # Fall through — NVIDIA may still reject this, which produces a
            # meaningful error rather than silently using a broken URL.

    # ── 5. Call Kimi-K3 pricing assistant ────────────────────────────────────
    logger.info(f"[SmartPrice] Sending to Kimi: name={product.name!r}, price={product.price}")
    pricing_result = get_smart_prices(
        image_source=image_source,
        product_name=product.name,
        current_price=float(product.price),
    )

    if not pricing_result.get("success"):
        # Return a controlled error — do NOT expose internal details
        logger.error(f"[SmartPrice] Pricing failed: {pricing_result.get('error')}")
        return {
            "success": False,
            "error": pricing_result.get("error", "Unable to generate smart pricing right now."),
        }

    # ── 6. Return success response ───────────────────────────────────────────
    return {
        "success": True,
        "product_id": str(product.id),
        "product_name": product.name,
        "current_price": float(product.price),
        "image_url": image_url,
        "result": pricing_result["result"],
    }
