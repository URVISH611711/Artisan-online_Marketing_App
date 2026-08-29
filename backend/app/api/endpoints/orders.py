from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List

from app.database.connection import get_db
from app.api.deps import get_current_user
from app.core.enums import coerce_enum
from app.models.user import User
from app.models.order import Order, OrderStatus
from app.schemas.order import OrderResponse, OrderStatusUpdate

router = APIRouter()


@router.get("/", response_model=List[OrderResponse])
def list_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all orders for the authenticated artisan."""
    orders = (
        db.query(Order)
        .options(joinedload(Order.items), joinedload(Order.timeline))
        .filter(Order.artisan_id == current_user.id)
        .filter(Order.deleted_at.is_(None))
        .order_by(Order.created_at.desc())
        .all()
    )
    return orders


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single order by ID."""
    order = (
        db.query(Order)
        .options(joinedload(Order.items), joinedload(Order.timeline))
        .filter(Order.id == order_id)
        .filter(Order.artisan_id == current_user.id)
        .filter(Order.deleted_at.is_(None))
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.put("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: str,
    payload: OrderStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an order's status."""
    order = (
        db.query(Order)
        .options(joinedload(Order.items), joinedload(Order.timeline))
        .filter(Order.id == order_id)
        .filter(Order.artisan_id == current_user.id)
        .filter(Order.deleted_at.is_(None))
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    new_status = coerce_enum(OrderStatus, payload.status)
    if new_status is None:
        raise HTTPException(status_code=400, detail=f"Invalid status: {payload.status}")

    order.status = new_status
    db.commit()
    db.refresh(order)
    return order
