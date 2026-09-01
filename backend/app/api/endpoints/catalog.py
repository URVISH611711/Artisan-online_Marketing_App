"""
Multilingual Auto-Cataloger endpoints.

POST /ai/catalog/generate — transcript (+ optional product image) → structured
                            bilingual catalog draft (extracted facts, EN/HI copy,
                            SEO). NO DB writes to the product; the artisan edits it.
POST /ai/catalog/apply    — persist the artisan-reviewed catalog: EN/HI translations,
                            keywords and SEO onto an existing owned product.
"""
import logging
import uuid
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session, selectinload

from app.database.connection import get_db
from app.api.deps import get_current_user
from app.core.enums import coerce_enum
from app.models.user import User, AppLanguage
from app.models.product import Product, ProductTranslation, ProductKeyword
from app.models.ai import VoiceRecording, SpeechTranscript
from app.schemas.product import ProductResponse
from app.services.nvidia import generate_catalog

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Schemas ─────────────────────────────────────────────────────────────────

class CatalogGenerateRequest(BaseModel):
    transcript: str
    language: str = "auto"
    product_id: Optional[uuid.UUID] = None
    existing_description: Optional[str] = None
    confidence_score: Optional[float] = None  # STT language_probability, if known


class TranslationBlock(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None


class CatalogApplyRequest(BaseModel):
    product_id: uuid.UUID
    translations: Dict[str, TranslationBlock] = {}   # {"en": {...}, "hi": {...}}
    keywords: List[str] = []
    seo: Optional[Dict[str, Any]] = None
    base_updates: Optional[Dict[str, Any]] = None    # optional base-column edits


# ── Helpers ───────────────────────────────────────────────────────────────────

def _owned_product(db: Session, product_id, user: User) -> Product:
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .filter(Product.artisan_id == user.id)
        .filter(Product.deleted_at.is_(None))
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


def _primary_image_source(product: Product) -> Optional[str]:
    """A public http(s) URL for the product's primary image, for AI cross-check."""
    if not product.images:
        return None
    enhanced = next((i for i in product.images if getattr(i, "is_enhanced", False)), None)
    img = enhanced or product.images[0]
    url = getattr(img, "url", None)
    if url and url.startswith("http") and "127.0.0.1" not in url and "localhost" not in url:
        return url
    return None


# ── Endpoints ───────────────────────────────────────────────────────────────

@router.post("/generate")
def catalog_generate(
    payload: CatalogGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate an editable bilingual catalog draft from a voice-note transcript.
    Stores the original transcript, but writes nothing to the product itself —
    the artisan reviews/edits before /apply.
    """
    if not payload.transcript or not payload.transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript is required")

    image_source = None
    if payload.product_id is not None:
        product = _owned_product(db, payload.product_id, current_user)
        image_source = _primary_image_source(product)

    catalog = generate_catalog(
        transcript=payload.transcript,
        language=payload.language or "auto",
        image_source=image_source,
        existing_description=payload.existing_description,
    )

    # Persist the original transcript (spec: always store it). Best-effort — a
    # storage failure must not block the artisan from cataloguing.
    try:
        recording = VoiceRecording(
            id=uuid.uuid4(),
            user_id=current_user.id,
            product_id=payload.product_id,
            storage_url="",  # audio is not re-uploaded at generate time
            language=(payload.language or "auto")[:10],
            file_format="none",
        )
        db.add(recording)
        db.flush()
        db.add(SpeechTranscript(
            id=uuid.uuid4(),
            recording_id=recording.id,
            language=(payload.language or "auto")[:10],
            original_transcript=payload.transcript.strip(),
            confidence_score=float(payload.confidence_score or 0.0),
            stt_provider="faster-whisper",
        ))
        db.commit()
    except Exception as e:
        logger.warning(f"[Catalog] Could not persist transcript: {e}")
        db.rollback()

    return {"success": True, "catalog": catalog}


@router.post("/apply", response_model=ProductResponse)
def catalog_apply(
    payload: CatalogApplyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Persist the artisan-reviewed catalog onto an existing owned product:
    upsert EN/HI translations, replace keywords, store SEO in attributes.seo.
    """
    product = _owned_product(db, payload.product_id, current_user)

    # 1. Upsert translations. Present because the artisan reviewed them → reviewed_by_user=True.
    existing = {t.language_code: t for t in (product.translations or [])}
    for lang_str, block in payload.translations.items():
        lang = coerce_enum(AppLanguage, lang_str)
        if lang is None:
            continue
        if not (block.name or block.description):
            continue  # skip empty language blocks
        row = existing.get(lang)
        if row is None:
            row = ProductTranslation(
                id=uuid.uuid4(),
                product_id=product.id,
                language_code=lang,
            )
            db.add(row)
        row.name = block.name or (row.name if row.name else product.name)
        row.description = block.description or (row.description if row.description else product.description)
        row.short_description = block.short_description
        row.is_ai_generated = True
        row.reviewed_by_user = True

    # 2. Replace keywords (dedup, cap length).
    if payload.keywords is not None:
        db.query(ProductKeyword).filter(ProductKeyword.product_id == product.id).delete(
            synchronize_session=False
        )
        seen = set()
        for kw in payload.keywords:
            k = (kw or "").strip()[:100]
            if k and k.lower() not in seen:
                seen.add(k.lower())
                db.add(ProductKeyword(id=uuid.uuid4(), product_id=product.id, keyword=k))

    # 3. Store SEO in the existing attributes JSONB (no schema change).
    if payload.seo is not None:
        attrs = dict(product.attributes or {})
        attrs["seo"] = payload.seo
        product.attributes = attrs

    # 4. Optional base-column updates (only known, safe columns).
    if payload.base_updates:
        allowed = {"name", "material", "craft_type", "color", "origin", "production_time", "price", "short_description", "description", "length", "width", "diameter", "dimension_unit"}
        for key, value in payload.base_updates.items():
            if key in allowed and value is not None:
                setattr(product, key, value)

    db.commit()

    # Reload with relationships for the response.
    product = (
        db.query(Product)
        .options(
            selectinload(Product.images),
            selectinload(Product.inventory),
            selectinload(Product.artisan),
            selectinload(Product.translations),
            selectinload(Product.keywords),
        )
        .filter(Product.id == product.id)
        .first()
    )
    return product
