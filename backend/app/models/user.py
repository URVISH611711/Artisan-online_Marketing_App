import uuid
from typing import Optional, List
from sqlalchemy import String, Boolean, ForeignKey, Integer, Float, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.models.base import Base, TimestampMixin, UUIDMixin, SoftDeleteMixin

class UserRole(str, enum.Enum):
    ARTISAN = "artisan"
    BUYER = "buyer"
    ADMIN = "admin"

class AppLanguage(str, enum.Enum):
    EN = "en"
    HI = "hi"
    GU = "gu"

class User(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "users"

    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True, index=True, nullable=True)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    name: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.ARTISAN, index=True)
    preferred_language: Mapped[AppLanguage] = mapped_column(Enum(AppLanguage), default=AppLanguage.EN)
    voice_language: Mapped[AppLanguage] = mapped_column(Enum(AppLanguage), default=AppLanguage.EN)
    
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    artisan_profile: Mapped[Optional["ArtisanProfile"]] = relationship("ArtisanProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    buyer_profile: Mapped[Optional["BuyerProfile"]] = relationship("BuyerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")


class ArtisanProfile(Base, TimestampMixin):
    __tablename__ = "artisan_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    business_name: Mapped[str] = mapped_column(String(255), index=True)
    craft_type: Mapped[str] = mapped_column(String(100), index=True)
    
    location: Mapped[str] = mapped_column(String(255))
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[str] = mapped_column(String(100), index=True)
    
    bio: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    craft_story: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    years_experience: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    profile_image: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    products_count: Mapped[int] = mapped_column(Integer, default=0)
    orders_count: Mapped[int] = mapped_column(Integer, default=0)
    rating: Mapped[float] = mapped_column(Float, default=0.0)

    # Relationship
    user: Mapped["User"] = relationship("User", back_populates="artisan_profile")
    products: Mapped[List["Product"]] = relationship("Product", back_populates="artisan", cascade="all, delete-orphan")


class BuyerProfile(Base, TimestampMixin):
    __tablename__ = "buyer_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    company_name: Mapped[str] = mapped_column(String(255), index=True)
    company_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    location: Mapped[str] = mapped_column(String(255))
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    gst_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    business_description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    orders_completed: Mapped[int] = mapped_column(Integer, default=0)

    # Relationship
    user: Mapped["User"] = relationship("User", back_populates="buyer_profile")
