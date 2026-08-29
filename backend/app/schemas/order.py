from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class OrderItemResponse(BaseModel):
    id: UUID
    product_name_snapshot: str
    product_image_snapshot: Optional[str] = None
    quantity: int
    unit_price: float
    subtotal: float

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
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    status: str
