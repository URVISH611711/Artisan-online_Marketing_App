from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class OrderItemResponse(BaseModel):
    id: UUID
    product_id: Optional[UUID] = None
    buyer_id: UUID
    seller_id: UUID
    product_name_snapshot: str
    product_image_snapshot: Optional[str] = None
    quantity: int
    unit_price: float
    subtotal: float
    seller_name: Optional[str] = None
    buyer_name: Optional[str] = None

    class Config:
        from_attributes = True


class OrderTimelineResponse(BaseModel):
    id: UUID
    status_label: str
    status_state: str
    created_at: datetime

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: UUID
    order_number: str
    total_amount: float
    status: str
    payment_status: str
    shipping_address: Optional[str] = None
    expected_delivery: Optional[datetime] = None
    items: List[OrderItemResponse] = []
    timeline: List[OrderTimelineResponse] = []
    buyer_name: Optional[str] = None
    role: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    status: str

class CartItemCreate(BaseModel):
    product_id: UUID
    quantity: int = Field(..., gt=0)

class CartCheckout(BaseModel):
    items: List[CartItemCreate]
    shipping_address: str
