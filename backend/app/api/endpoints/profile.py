from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, Field
from typing import Optional

from app.database.connection import get_db
from app.api.deps import get_current_user, ensure_artisan_profile
from app.models.user import User, ArtisanProfile
from app.models.product import Product
from app.models.order import Order, OrderStatus
from app.schemas.product import DashboardResponse

router = APIRouter()


class ProfileResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    role: str
    is_verified: bool
    # Artisan profile fields (optional)
    business_name: Optional[str] = None
    craft_type: Optional[str] = None
    location: Optional[str] = None
    state: Optional[str] = None
    bio: Optional[str] = None
    years_experience: Optional[int] = None
    products_count: int = 0
    orders_count: int = 0
    rating: float = 0.0


class ProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=255)
    business_name: Optional[str] = Field(None, max_length=255)
    craft_type: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=255)
    state: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = None


@router.get("/", response_model=ProfileResponse)
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the authenticated user's full profile."""
    artisan = db.query(ArtisanProfile).filter(
        ArtisanProfile.user_id == current_user.id
    ).first()

    response = {
        "id": str(current_user.id),
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone,
        "address": current_user.address,
        "role": current_user.role.value if hasattr(current_user.role, 'value') else current_user.role,
        "is_verified": current_user.is_verified,
    }

    if artisan:
        response.update({
            "business_name": artisan.business_name,
            "craft_type": artisan.craft_type,
            "location": artisan.location,
            "state": artisan.state,
            "bio": artisan.bio,
            "years_experience": artisan.years_experience,
            "products_count": artisan.products_count,
            "orders_count": artisan.orders_count,
            "rating": artisan.rating,
        })

    return response


@router.put("/", response_model=ProfileResponse)
def update_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update the authenticated user's profile."""
    update_data = payload.model_dump(exclude_unset=True)

    # Separate user fields from artisan profile fields
    user_fields = {"name", "phone", "address"}
    artisan_fields = {"business_name", "craft_type", "location", "state", "bio"}

    for key, value in update_data.items():
        if key in user_fields:
            setattr(current_user, key, value)

    # Handle artisan profile updates
    artisan_updates = {k: v for k, v in update_data.items() if k in artisan_fields}
    if artisan_updates:
        # Previously this did a bare query and silently discarded the updates
        # when no row existed — which was ALWAYS, since nothing created one.
        artisan = ensure_artisan_profile(db, current_user)
        for key, value in artisan_updates.items():
            setattr(artisan, key, value)

    db.commit()
    db.refresh(current_user)

    return get_profile(current_user=current_user, db=db)


@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get aggregated dashboard statistics for the authenticated artisan."""
    # Count products
    products_count = (
        db.query(func.count(Product.id))
        .filter(Product.artisan_id == current_user.id)
        .filter(Product.deleted_at.is_(None))
        .scalar()
    ) or 0

    # Count orders
    orders_count = (
        db.query(func.count(Order.id))
        .filter(Order.artisan_id == current_user.id)
        .filter(Order.deleted_at.is_(None))
        .scalar()
    ) or 0

    # Count new orders
    new_orders_count = (
        db.query(func.count(Order.id))
        .filter(Order.artisan_id == current_user.id)
        .filter(Order.status == OrderStatus.PENDING)
        .filter(Order.deleted_at.is_(None))
        .scalar()
    ) or 0

    # Total sales (completed orders)
    total_sales = (
        db.query(func.sum(Order.total_amount))
        .filter(Order.artisan_id == current_user.id)
        .filter(Order.status.in_([OrderStatus.COMPLETED, OrderStatus.DELIVERED]))
        .filter(Order.deleted_at.is_(None))
        .scalar()
    ) or 0.0

    return {
        "products_count": products_count,
        "orders_count": orders_count,
        "total_sales": float(total_sales),
        "new_orders_count": new_orders_count,
    }
