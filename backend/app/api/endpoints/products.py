import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
import base64
from sqlalchemy.orm import Session, joinedload, selectinload
from typing import Optional, List

from app.database.connection import get_db
from app.api.deps import get_current_user, get_optional_user, ensure_artisan_profile
from app.core.enums import coerce_enum
from app.models.user import User, ArtisanProfile
from app.models.product import Product, ProductStatus, ProductImage, Inventory, Category
from app.schemas.product import ProductResponse, ProductCreate, ProductUpdate
from app.services.inventory import reconcile_availability
from app.services.notifications import send_notification
from app.models.ai import NotificationType
from app.services.nvidia import auto_describe_product

router = APIRouter()

from app.services.storage import save_image

@router.post("/auto-describe")
async def auto_describe(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Auto-fill product details using NVIDIA API"""
    try:
        contents = await image.read()
        
        # Save image to get public URL if stored on Supabase
        _, public_url = save_image(
            user_id=str(current_user.id),
            session_id="autofill",
            image_bytes=contents,
            filename=image.filename or "product.jpg",
            content_type=image.content_type or "image/jpeg"
        )
        
        image_source = public_url if public_url.startswith("http") and not "127.0.0.1" in public_url and not "localhost" in public_url else base64.b64encode(contents).decode("utf-8")
        
        result = auto_describe_product(image_source)
        return {"success": True, "data": result}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/", response_model=List[ProductResponse])
def list_products(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all products for the authenticated artisan."""
    query = (
        db.query(Product)
        .options(
            joinedload(Product.images),
            joinedload(Product.inventory),
            joinedload(Product.artisan).joinedload(ArtisanProfile.user),
            selectinload(Product.translations),
            selectinload(Product.keywords),
        )
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
    skip: int = 0,
    limit: int = 20,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Auto-generated marketplace feed of every seller's live products.

    Includes PUBLISHED (in stock) AND OUT_OF_STOCK (visible but not
    purchasable) products from all sellers, including the current user. Out-of-stock items are intentionally
    NOT filtered out — the client renders them as "Out of Stock".
    """
    query = (
        db.query(Product)
        .options(
            joinedload(Product.images),
            joinedload(Product.inventory),
            joinedload(Product.artisan).joinedload(ArtisanProfile.user),
            selectinload(Product.translations),
            selectinload(Product.keywords),
        )
        .filter(Product.status.in_([ProductStatus.PUBLISHED, ProductStatus.OUT_OF_STOCK]))
        .filter(Product.deleted_at.is_(None))
    )

    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))

    if category and category.lower() != "all":
        query = query.filter(Product.category_id.in_(
            db.query(Category.id).filter(Category.name.ilike(f"%{category}%"))
        ) | Product.craft_type.ilike(f"%{category}%"))

    products = query.order_by(Product.created_at.desc()).offset(skip).limit(limit).all()
    return products


@router.get("/categories", response_model=List[str])
def list_categories(db: Session = Depends(get_db)):
    """Return all unique product categories currently used by published products."""
    categories = (
        db.query(Product.craft_type)
        .filter(Product.status == ProductStatus.PUBLISHED)
        .filter(Product.deleted_at.is_(None))
        .distinct()
        .all()
    )
    # The query returns a list of tuples like [('Handicrafts',), ('Pottery',)]
    return sorted(list(set(c[0] for c in categories if c[0])))


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: str,
    db: Session = Depends(get_db),
):
    """Get a single product by ID."""
    product = (
        db.query(Product)
        .options(
            joinedload(Product.images),
            joinedload(Product.inventory),
            joinedload(Product.artisan).joinedload(ArtisanProfile.user),
            selectinload(Product.translations),
            selectinload(Product.keywords),
        )
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

    old_status = product.status
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key == "status" and value:
            coerced = coerce_enum(ProductStatus, value)
            if coerced is None:
                raise HTTPException(status_code=400, detail=f"Invalid status: {value}")
            product.status = coerced
            continue
        if key == "quantity":
            # Stock lives on the inventory row, not the product.
            if product.inventory:
                product.inventory.available_quantity = value
            continue
        if key in ("selected_image_ids", "selected_image_urls"):
            continue
        setattr(product, key, value)

    # Delete unselected images if selected list is provided
    if payload.selected_image_ids is not None:
        db.query(ProductImage).filter(
            ProductImage.product_id == product.id,
            ProductImage.id.notin_(payload.selected_image_ids)
        ).delete(synchronize_session=False)
    elif payload.selected_image_urls is not None:
        db.query(ProductImage).filter(
            ProductImage.product_id == product.id,
            ProductImage.url.notin_(payload.selected_image_urls)
        ).delete(synchronize_session=False)

    # Keep purchasability in sync with REAL stock
    available = product.inventory.available_quantity if product.inventory else 0
    reconcile_availability(product, available)

    db.commit()
    db.refresh(product)
    
    if old_status != ProductStatus.PUBLISHED and product.status == ProductStatus.PUBLISHED:
        send_notification(
            db, product.artisan_id, NotificationType.PRODUCT_PUBLISHED,
            "Product Published",
            f"Your product '{product.name}' is now live.",
            "product", str(product.id)
        )
        
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
