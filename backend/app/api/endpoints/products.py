import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List

from app.database.connection import get_db
from app.api.deps import get_current_user, ensure_artisan_profile
from app.core.enums import coerce_enum
from app.models.user import User
from app.models.product import Product, ProductStatus, ProductImage, Inventory
from app.schemas.product import ProductResponse, ProductCreate, ProductUpdate

router = APIRouter()


@router.get("/", response_model=List[ProductResponse])
def list_products(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all products for the authenticated artisan."""
    query = (
        db.query(Product)
        .options(joinedload(Product.images))
        .filter(Product.artisan_id == current_user.id)
        .filter(Product.deleted_at.is_(None))
    )

    if status_filter:
        ps = coerce_enum(ProductStatus, status_filter)
        if ps is not None:
            query = query.filter(Product.status == ps)

    products = query.order_by(Product.created_at.desc()).all()
    return products


@router.get("/marketplace", response_model=List[ProductResponse])
def list_marketplace_products(
    search: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List published products for the marketplace (public endpoint)."""
    query = (
        db.query(Product)
        .options(joinedload(Product.images))
        .filter(Product.status == ProductStatus.PUBLISHED)
        .filter(Product.deleted_at.is_(None))
    )

    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))

    if category:
        query = query.filter(Product.craft_type.ilike(f"%{category}%"))

    products = query.order_by(Product.created_at.desc()).limit(50).all()
    return products


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: str,
    db: Session = Depends(get_db),
):
    """Get a single product by ID."""
    product = (
        db.query(Product)
        .options(joinedload(Product.images))
        .filter(Product.id == product_id)
        .filter(Product.deleted_at.is_(None))
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new product for the authenticated artisan."""
    # artisan_id FKs to artisan_profiles.user_id — without this row the INSERT
    # below fails with a foreign-key violation.
    ensure_artisan_profile(db, current_user)

    product = Product(
        id=uuid.uuid4(),
        artisan_id=current_user.id,
        name=payload.name,
        description=payload.description,
        short_description=payload.short_description,
        material=payload.material,
        craft_type=payload.craft_type,
        color=payload.color,
        origin=payload.origin,
        production_time=payload.production_time,
        price=payload.price,
        status=ProductStatus.DRAFT,
    )
    db.add(product)

    # Create inventory record
    inv = Inventory(
        product_id=product.id,
        available_quantity=payload.quantity,
    )
    db.add(inv)

    db.commit()
    db.refresh(product)
    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: str,
    payload: ProductUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a product owned by the authenticated artisan."""
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .filter(Product.artisan_id == current_user.id)
        .filter(Product.deleted_at.is_(None))
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key == "status" and value:
            coerced = coerce_enum(ProductStatus, value)
            if coerced is None:
                raise HTTPException(status_code=400, detail=f"Invalid status: {value}")
            value = coerced
        if key == "quantity":
            # Update inventory instead
            if product.inventory:
                product.inventory.available_quantity = value
            continue
        setattr(product, key, value)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Soft-delete a product owned by the authenticated artisan."""
    from datetime import datetime, timezone

    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .filter(Product.artisan_id == current_user.id)
        .filter(Product.deleted_at.is_(None))
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.deleted_at = datetime.now(timezone.utc)
    db.commit()
