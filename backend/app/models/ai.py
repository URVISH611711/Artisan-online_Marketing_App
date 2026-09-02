import uuid
from typing import Optional, List
from sqlalchemy import String, ForeignKey, Integer, Float, Enum, Text, Boolean, Numeric, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
import enum

from app.models.base import Base, TimestampMixin, UUIDMixin

class PricePrediction(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "price_predictions"

    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), index=True)
    
    input_cost: Mapped[float] = mapped_column(Numeric(10, 2))
    recommended_price: Mapped[float] = mapped_column(Numeric(10, 2))
    min_price: Mapped[float] = mapped_column(Numeric(10, 2))
    max_price: Mapped[float] = mapped_column(Numeric(10, 2))
    
    estimated_profit: Mapped[float] = mapped_column(Numeric(10, 2))
    confidence: Mapped[float] = mapped_column(Float) # 0.0 to 1.0
    
    model_name: Mapped[str] = mapped_column(String(100))
    model_version: Mapped[str] = mapped_column(String(50))
    
    product: Mapped["Product"] = relationship("Product")

class MarketData(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "market_data"
    
    category: Mapped[str] = mapped_column(String(100), index=True)
    source: Mapped[str] = mapped_column(String(100))
    price: Mapped[float] = mapped_column(Numeric(10, 2))
    currency: Mapped[str] = mapped_column(String(10), default="INR")
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    meta_data: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

class AIProcessingJob(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "ai_processing_jobs"
    
    product_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=True)
    job_type: Mapped[str] = mapped_column(String(100), index=True) # BACKGROUND_REMOVAL, UPSCALE
    model_provider: Mapped[str] = mapped_column(String(100))
    
    status: Mapped[str] = mapped_column(String(50), index=True)
    input_data: Mapped[dict] = mapped_column(JSONB)
    output_data: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    started_at: Mapped[Optional[DateTime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[DateTime]] = mapped_column(DateTime(timezone=True), nullable=True)

class VoiceRecording(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "voice_recordings"
    
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    product_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    
    storage_url: Mapped[str] = mapped_column(String(1024))
    language: Mapped[str] = mapped_column(String(10))
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    file_format: Mapped[str] = mapped_column(String(20))
    
    transcript: Mapped[Optional["SpeechTranscript"]] = relationship("SpeechTranscript", back_populates="recording", uselist=False)

class SpeechTranscript(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "speech_transcripts"
    
    recording_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("voice_recordings.id", ondelete="CASCADE"), unique=True)
    language: Mapped[str] = mapped_column(String(10))
    
    original_transcript: Mapped[Text] = mapped_column(Text)
    corrected_transcript: Mapped[Optional[Text]] = mapped_column(Text, nullable=True)
    
    confidence_score: Mapped[float] = mapped_column(Float)
    stt_provider: Mapped[str] = mapped_column(String(100))
    
    recording: Mapped["VoiceRecording"] = relationship("VoiceRecording", back_populates="transcript")

class NotificationType(str, enum.Enum):
    # Old ones to keep compatibility
    NEW_ORDER = "new_order"
    BULK_ORDER = "bulk_order"
    COUNTER_OFFER = "counter_offer"
    PRICE_OPPORTUNITY = "price_opportunity"
    LOW_STOCK = "low_stock"
    AI_INSIGHT = "ai_insight"
    SYSTEM = "system"
    
    # New ones based on requirements
    ORDER_PLACED = "order_placed"
    PAYMENT_CONFIRMED = "payment_confirmed"
    ORDER_ACCEPTED = "order_accepted"
    ORDER_SHIPPED = "order_shipped"
    ORDER_DELIVERED = "order_delivered"
    ORDER_CANCELLED = "order_cancelled"
    ORDER_REFUND = "order_refund"
    PAYMENT_RECEIVED = "payment_received"
    OUT_OF_STOCK = "out_of_stock"
    PRODUCT_PUBLISHED = "product_published"
    PROFILE_UPDATED = "profile_updated"
    SECURITY_ALERT = "security_alert"

class Notification(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "notifications"
    
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    type: Mapped[NotificationType] = mapped_column(Enum(NotificationType))
    
    title: Mapped[str] = mapped_column(String(255))
    message: Mapped[Text] = mapped_column(Text)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    
    related_entity_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    related_entity_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

class AIConversation(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "ai_conversations"
    
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    messages: Mapped[List["AIMessage"]] = relationship("AIMessage", back_populates="conversation", cascade="all, delete-orphan", order_by="AIMessage.created_at")

class MessageRole(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
    TOOL = "tool"

class AIMessage(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "ai_messages"
    
    conversation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("ai_conversations.id", ondelete="CASCADE"), index=True)
    role: Mapped[MessageRole] = mapped_column(Enum(MessageRole))
    content: Mapped[Text] = mapped_column(Text)
    
    intent: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    meta_data: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    
    conversation: Mapped["AIConversation"] = relationship("AIConversation", back_populates="messages")

class BusinessInsight(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "business_insights"
    
    artisan_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    
    type: Mapped[str] = mapped_column(String(100)) # e.g. demand_increased, low_stock
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[Text] = mapped_column(Text)
    
    severity: Mapped[str] = mapped_column(String(50)) # high, medium, low
    data_source: Mapped[str] = mapped_column(String(100)) # DATA_BASED, AI_PREDICTION
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    expires_at: Mapped[Optional[DateTime]] = mapped_column(DateTime(timezone=True), nullable=True)

class Review(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "reviews"
    
    reviewer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    artisan_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    product_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=True)
    order_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=True)
    
    rating: Mapped[int] = mapped_column(Integer)
    review_text: Mapped[Optional[Text]] = mapped_column(Text, nullable=True)
