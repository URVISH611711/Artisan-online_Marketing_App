from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from app.models.order import OrderStatus, BulkOrderStatus

class OrderItemBase(BaseModel):
    product_id: Optional[UUID] = None
    product_name_snapshot: str = Field(..., max_length=255)
    product_image_snapshot: Optional[str] = None
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., ge=0)
    subtotal: float = Field(..., ge=0)

class OrderItemCreate(OrderItemBase):
    pass

class OrderItemResponse(OrderItemBase):
    id: UUID
    order_id: UUID

    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    order_number: str = Field(..., max_length=50)
    total_amount: float = Field(..., ge=0)
    shipping_address: Optional[str] = None
    expected_delivery: Optional[datetime] = None
    status: OrderStatus = OrderStatus.PENDING
    payment_status: str = "pending"

class OrderCreate(OrderBase):
    artisan_id: UUID
    items: List[OrderItemCreate]

class OrderResponse(OrderBase):
    id: UUID
    buyer_id: UUID
    artisan_id: UUID
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True

class BulkOrderRequestBase(BaseModel):
    quantity: int = Field(..., gt=0)
    target_price_per_unit: float = Field(..., ge=0)
    delivery_days: int = Field(..., gt=0)
    notes: Optional[str] = None
    status: BulkOrderStatus = BulkOrderStatus.PENDING

class BulkOrderRequestCreate(BulkOrderRequestBase):
    product_id: UUID

class BulkOrderRequestResponse(BulkOrderRequestBase):
    id: UUID
    buyer_id: UUID
    product_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
