import uuid
from typing import Optional, List
from sqlalchemy import String, ForeignKey, Integer, Float, Enum, Text, Boolean, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import enum
from datetime import datetime

from app.models.base import Base, TimestampMixin, UUIDMixin, SoftDeleteMixin

class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REJECTED = "rejected"

class Order(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "orders"

    order_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    buyer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    artisan_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2))
    shipping_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    expected_delivery: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus), default=OrderStatus.PENDING, index=True)
    payment_status: Mapped[str] = mapped_column(String(50), default="pending")
    
    buyer: Mapped["User"] = relationship("User", foreign_keys=[buyer_id])
    artisan: Mapped["User"] = relationship("User", foreign_keys=[artisan_id])
    items: Mapped[List["OrderItem"]] = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    timeline: Mapped[List["OrderTimeline"]] = relationship("OrderTimeline", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "order_items"

    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    product_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    
    product_name_snapshot: Mapped[str] = mapped_column(String(255))
    product_image_snapshot: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    
    quantity: Mapped[int] = mapped_column(Integer)
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2))
    subtotal: Mapped[float] = mapped_column(Numeric(10, 2))
    
    order: Mapped["Order"] = relationship("Order", back_populates="items")
    product: Mapped[Optional["Product"]] = relationship("Product")

class OrderTimeline(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "order_timeline"
    
    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    status_label: Mapped[str] = mapped_column(String(100))
    status_state: Mapped[str] = mapped_column(String(50)) # 'completed', 'current', 'pending'
    
    order: Mapped["Order"] = relationship("Order", back_populates="timeline")

class BulkOrderStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    NEGOTIATING = "negotiating"
    EXPIRED = "expired"
    CONVERTED_TO_ORDER = "converted_to_order"

class BulkOrderRequest(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "bulk_order_requests"

    buyer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), index=True)
    
    quantity: Mapped[int] = mapped_column(Integer)
    target_price_per_unit: Mapped[float] = mapped_column(Numeric(10, 2))
    delivery_days: Mapped[int] = mapped_column(Integer)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    status: Mapped[BulkOrderStatus] = mapped_column(Enum(BulkOrderStatus), default=BulkOrderStatus.PENDING, index=True)
    
    buyer: Mapped["User"] = relationship("User")
    product: Mapped["Product"] = relationship("Product")
    counter_offers: Mapped[List["CounterOffer"]] = relationship("CounterOffer", back_populates="bulk_request", cascade="all, delete-orphan")

class CounterOffer(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "counter_offers"
    
    bulk_request_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("bulk_order_requests.id", ondelete="CASCADE"), index=True)
    sender_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    receiver_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    quantity: Mapped[int] = mapped_column(Integer)
    price_per_unit: Mapped[float] = mapped_column(Numeric(10, 2))
    delivery_days: Mapped[int] = mapped_column(Integer)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    status: Mapped[str] = mapped_column(String(50), default="pending")
    
    bulk_request: Mapped["BulkOrderRequest"] = relationship("BulkOrderRequest", back_populates="counter_offers")
    
class Payment(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "payments"
    
    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id"))
    transaction_reference: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)
    amount: Mapped[float] = mapped_column(Numeric(10, 2))
    currency: Mapped[str] = mapped_column(String(10), default="INR")
    provider: Mapped[str] = mapped_column(String(50), default="mock")
    status: Mapped[str] = mapped_column(String(50), default="pending")
