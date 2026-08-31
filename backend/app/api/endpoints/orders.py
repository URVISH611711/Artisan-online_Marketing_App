import uuid
import random
import string
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.database.connection import get_db
from app.api.deps import get_current_user
from app.core.enums import coerce_enum
from app.models.user import User
from app.models.order import Order, OrderStatus, OrderItem, OrderTimeline
from app.models.product import Product, ProductStatus, Inventory
from app.schemas.order import (
    OrderResponse,
    OrderItemResponse,
    OrderTimelineResponse,
    OrderStatusUpdate,
    CartCheckout,
)
from app.services.inventory import reconcile_availability

router = APIRouter()

# A seller may only move an order into one of these fulfillment states. Buyers
# never change status — they only see it.
_SELLER_SETTABLE = {
    OrderStatus.ACCEPTED,
    OrderStatus.REJECTED,
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
}

# Once an order reaches one of these, its status is final.
_TERMINAL = {
    OrderStatus.DELIVERED,
    OrderStatus.COMPLETED,
    OrderStatus.CANCELLED,
    OrderStatus.REJECTED,
}

_STATUS_LABELS = {
    OrderStatus.PENDING: "Order Placed",
    OrderStatus.ACCEPTED: "Order Accepted",
    OrderStatus.REJECTED: "Order Rejected",
    OrderStatus.PROCESSING: "Processing",
    OrderStatus.SHIPPED: "Shipped",
    OrderStatus.DELIVERED: "Delivered",
    OrderStatus.COMPLETED: "Completed",
    OrderStatus.CANCELLED: "Cancelled",
}

# Eager-load everything the role-filtered response needs (counterparty names,
# per-item seller/buyer, timeline) so building the response triggers no N+1.
_ORDER_LOADERS = (
    joinedload(Order.items).joinedload(OrderItem.seller),
    joinedload(Order.items).joinedload(OrderItem.buyer),
    joinedload(Order.buyer),
    joinedload(Order.timeline),
)


def _status_value(s) -> str:
    return s.value if hasattr(s, "value") else str(s)


def _item_response(item: OrderItem) -> OrderItemResponse:
    return OrderItemResponse(
        id=item.id,
        product_id=item.product_id,
        buyer_id=item.buyer_id,
        seller_id=item.seller_id,
        product_name_snapshot=item.product_name_snapshot,
        product_image_snapshot=item.product_image_snapshot,
        quantity=item.quantity,
        unit_price=float(item.unit_price),
        subtotal=float(item.subtotal),
        seller_name=item.seller.name if item.seller else None,
        buyer_name=item.buyer.name if item.buyer else None,
    )


def _order_response(order: Order, role: str, viewer_id: uuid.UUID) -> OrderResponse:
    """Build a role-filtered view of ONE underlying order.

    Buyer view ("My Purchases"): the whole order — every item and the full
    grand total.
    Seller view ("Received Orders"): ONLY the viewer's own items, and a total
    that sums just those items. A seller must never see another seller's lines
    or the buyer's grand total, even though it is the same order row.
    """
    if role == "seller":
        items = [i for i in order.items if i.seller_id == viewer_id]
        total = sum(float(i.subtotal) for i in items)
    else:
        items = list(order.items)
        total = float(order.total_amount)

    timeline = sorted(order.timeline, key=lambda t: t.created_at or order.created_at)

    return OrderResponse(
        id=order.id,
        order_number=order.order_number,
        total_amount=total,
        status=_status_value(order.status),
        payment_status=order.payment_status,
        shipping_address=order.shipping_address,
        expected_delivery=order.expected_delivery,
        items=[_item_response(i) for i in items],
        timeline=[
            OrderTimelineResponse(
                id=t.id,
                status_label=t.status_label,
                status_state=t.status_state,
                created_at=t.created_at,
            )
            for t in timeline
        ],
        buyer_name=order.buyer.name if order.buyer else None,
        role=role,
        created_at=order.created_at,
        updated_at=order.updated_at,
    )


@router.get("/", response_model=List[OrderResponse])
def list_orders(
    role: str = Query("seller"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List the authenticated user's orders from one side of the transaction.

    role=buyer  → orders this user placed ("My Purchases").
    role=seller → orders that contain this user's products ("Received Orders").
    The same order can appear in both, filtered to the appropriate view.
    """
    role = role.lower()
    if role not in ("buyer", "seller"):
        raise HTTPException(status_code=400, detail="role must be 'buyer' or 'seller'")

    query = db.query(Order).options(*_ORDER_LOADERS).filter(Order.deleted_at.is_(None))
    if role == "buyer":
        query = query.filter(Order.buyer_id == current_user.id)
    else:
        query = query.filter(Order.items.any(OrderItem.seller_id == current_user.id))

    orders = query.order_by(Order.created_at.desc()).all()
    return [_order_response(o, role, current_user.id) for o in orders]


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: str,
    role: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single order. Visible to the buyer AND to any seller with an item
    in it, each getting their own role-filtered view."""
    order = (
        db.query(Order)
        .options(*_ORDER_LOADERS)
        .filter(Order.id == order_id)
        .filter(Order.deleted_at.is_(None))
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    is_buyer = order.buyer_id == current_user.id
    is_seller = any(i.seller_id == current_user.id for i in order.items)

    resolved = (role or "").lower() or None
    if resolved == "buyer" and not is_buyer:
        resolved = None
    if resolved == "seller" and not is_seller:
        resolved = None
    if resolved is None:
        if is_buyer:
            resolved = "buyer"
        elif is_seller:
            resolved = "seller"
        else:
            raise HTTPException(status_code=404, detail="Order not found")

    return _order_response(order, resolved, current_user.id)


@router.put("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: str,
    payload: OrderStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Seller-only fulfillment update. The buyer sees the new status but can
    never change it. Only sellers with an item in the order are allowed."""
    order = (
        db.query(Order)
        .options(*_ORDER_LOADERS)
        .filter(Order.id == order_id)
        .filter(Order.items.any(OrderItem.seller_id == current_user.id))
        .filter(Order.deleted_at.is_(None))
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    new_status = coerce_enum(OrderStatus, payload.status)
    if new_status is None:
        raise HTTPException(status_code=400, detail=f"Invalid status: {payload.status}")
    if new_status not in _SELLER_SETTABLE:
        raise HTTPException(status_code=400, detail=f"Sellers cannot set status to '{new_status.value}'")
    if order.status in _TERMINAL and order.status != new_status:
        raise HTTPException(
            status_code=400,
            detail=f"Order is already {_status_value(order.status)} and cannot be changed",
        )

    if order.status != new_status:
        order.status = new_status
        db.add(OrderTimeline(
            order_id=order.id,
            status_label=_STATUS_LABELS.get(new_status, new_status.value.title()),
            status_state="completed",
        ))
        db.commit()
        order = (
            db.query(Order).options(*_ORDER_LOADERS).filter(Order.id == order.id).first()
        )

    return _order_response(order, "seller", current_user.id)


@router.post("/checkout", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def checkout_cart(
    payload: CartCheckout,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Place ONE order for a (possibly multi-seller) cart.

    The database is the sole authority: the price comes from the product row,
    the seller comes from ``product.artisan_id``, and stock is deducted under a
    row lock so the last unit can never be double-sold. Nothing about identity,
    price, or seller is taken from the client.
    """
    if not payload.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    total_amount = 0.0
    validated_items = []

    for cart_item in payload.items:
        product = (
            db.query(Product)
            .filter(Product.id == cart_item.product_id, Product.deleted_at.is_(None))
            .first()
        )
        if not product:
            raise HTTPException(status_code=404, detail=f"Product not found: {cart_item.product_id}")
        if product.artisan_id == current_user.id:
            raise HTTPException(status_code=400, detail="You cannot buy your own product")
        if product.status != ProductStatus.PUBLISHED:
            raise HTTPException(status_code=400, detail=f"'{product.name}' is not available for purchase")

        # Lock the inventory row. Concurrent checkouts serialize here, so two
        # buyers can never both claim the last unit — the DB, not the client,
        # decides whether the sale succeeds.
        inventory = (
            db.query(Inventory)
            .filter(Inventory.product_id == cart_item.product_id)
            .with_for_update()
            .first()
        )
        if not inventory or inventory.available_quantity < cart_item.quantity:
            available = inventory.available_quantity if inventory else 0
            raise HTTPException(
                status_code=400,
                detail=f"Only {available} left of '{product.name}'",
            )

        # Price is read from the DB product, never trusted from the request.
        subtotal = float(product.price) * cart_item.quantity
        total_amount += subtotal

        inventory.available_quantity -= cart_item.quantity
        inventory.sold_quantity += cart_item.quantity
        product.orders = (product.orders or 0) + 1
        # Auto de-list when the last unit sells; the product stays visible in
        # the marketplace as OUT_OF_STOCK, just not purchasable.
        reconcile_availability(product, inventory.available_quantity)

        validated_items.append({
            "product": product,
            "quantity": cart_item.quantity,
            "subtotal": subtotal,
        })

    order_number = "ORD-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=8))
    order = Order(
        order_number=order_number,
        buyer_id=current_user.id,
        artisan_id=None,  # multi-seller ownership lives on each OrderItem
        total_amount=total_amount,
        shipping_address=payload.shipping_address,
        status=OrderStatus.PENDING,
        payment_status="pending",
    )
    db.add(order)
    db.flush()

    # Snapshot name/image/price so historical orders survive product edits or
    # soft-deletes. seller_id is copied from the product, never from the client.
    for v in validated_items:
        product = v["product"]
        db.add(OrderItem(
            order_id=order.id,
            product_id=product.id,
            buyer_id=current_user.id,
            seller_id=product.artisan_id,
            product_name_snapshot=product.name,
            product_image_snapshot=product.images[0].url if product.images else None,
            quantity=v["quantity"],
            unit_price=product.price,
            subtotal=v["subtotal"],
        ))

    db.add(OrderTimeline(order_id=order.id, status_label="Order Placed", status_state="completed"))

    db.commit()

    order = db.query(Order).options(*_ORDER_LOADERS).filter(Order.id == order.id).first()
    return _order_response(order, "buyer", current_user.id)
