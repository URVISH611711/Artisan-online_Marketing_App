from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from pydantic import BaseModel, Field

from app.database.connection import get_db
from app.api.deps import get_current_user, ensure_artisan_profile
from app.models.user import User, ArtisanProfile
from app.models.product import Product
from app.models.order import Order, OrderStatus, OrderItem
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


def build_profile_response(user: User, artisan: Optional[ArtisanProfile] = None) -> ProfileResponse:
    role_val = user.role.value if hasattr(user.role, 'value') else str(user.role)
    return ProfileResponse(
        id=str(user.id),
        name=user.name,
        email=user.email,
        phone=user.phone,
        address=user.address,
        role=role_val,
        is_verified=user.is_verified,
        business_name=artisan.business_name if artisan else None,
        craft_type=artisan.craft_type if artisan else None,
        location=artisan.location if artisan else None,
        state=artisan.state if artisan else None,
        bio=artisan.bio if artisan else None,
    )


@router.get("/", response_model=ProfileResponse)
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the authenticated user's full profile."""
    artisan = db.query(ArtisanProfile).filter(
        ArtisanProfile.user_id == current_user.id
    ).first()
    return build_profile_response(current_user, artisan)


@router.put("/", response_model=ProfileResponse)
def update_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update the authenticated user's profile."""
    # Ensure we have a user instance attached to the current session
    db_user = db.query(User).filter(User.id == current_user.id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    update_data = payload.model_dump(exclude_unset=True)

    user_fields = {"name", "phone", "address"}
    artisan_fields = {"business_name", "craft_type", "location", "state", "bio"}

    for key, value in update_data.items():
        if key in user_fields:
            setattr(db_user, key, value)

    artisan_updates = {k: v for k, v in update_data.items() if k in artisan_fields}
    artisan = None
    if artisan_updates:
        artisan = ensure_artisan_profile(db, db_user)
        for key, value in artisan_updates.items():
            setattr(artisan, key, value)
    else:
        artisan = db.query(ArtisanProfile).filter(ArtisanProfile.user_id == db_user.id).first()

    db.commit()
    db.refresh(db_user)

    return get_profile(current_user=db_user, db=db)


@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    period: str = Query("month", description="Time period filter: week, month, year"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get aggregated dashboard statistics for the authenticated artisan for week, month, or year."""
    products_count = (
        db.query(func.count(Product.id))
        .filter(Product.artisan_id == current_user.id)
        .filter(Product.deleted_at.is_(None))
        .scalar()
    ) or 0

    now = datetime.now(timezone.utc)

    if period == "today":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        divisor = 1.0
    elif period == "week":
        start_date = (now - timedelta(days=now.weekday())).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        divisor = 7.0
    elif period == "year":
        start_date = datetime(now.year, 1, 1, tzinfo=timezone.utc)
        divisor = 12.0
    else:
        period = "month"
        start_date = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
        divisor = 4.0

    shipped_statuses = [
        OrderStatus.SHIPPED,
        OrderStatus.DELIVERED,
        OrderStatus.COMPLETED,
    ]

    period_orders = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.deleted_at.is_(None))
        .filter(
            (Order.artisan_id == current_user.id) |
            (Order.items.any(OrderItem.seller_id == current_user.id))
        )
        .filter(Order.status.in_(shipped_statuses))
        .filter(
            (Order.updated_at >= start_date) | (Order.created_at >= start_date)
        )
        .all()
    )

    orders_count = len(period_orders)

    total_sales = 0.0
    for order in period_orders:
        seller_items = [i for i in order.items if i.seller_id == current_user.id]
        if seller_items:
            total_sales += sum(float(i.subtotal) for i in seller_items)
        else:
            total_sales += float(order.total_amount)

    avg_sales = total_sales / divisor if divisor > 0 else 0.0

    new_orders_count = (
        db.query(func.count(Order.id))
        .filter(
            (Order.artisan_id == current_user.id) |
            (Order.items.any(OrderItem.seller_id == current_user.id))
        )
        .filter(Order.status == OrderStatus.PENDING)
        .filter(Order.deleted_at.is_(None))
        .scalar()
    ) or 0

    return {
        "products_count": products_count,
        "orders_count": orders_count,
        "total_sales": float(total_sales),
        "new_orders_count": new_orders_count,
        "period": period,
        "avg_sales": float(avg_sales),
    }
