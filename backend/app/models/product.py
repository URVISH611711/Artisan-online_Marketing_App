import uuid
from typing import Optional, List
from sqlalchemy import String, ForeignKey, Integer, Float, Enum, Text, UniqueConstraint, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
import enum

from app.models.base import Base, TimestampMixin, UUIDMixin, SoftDeleteMixin
from app.models.user import AppLanguage

class Category(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "categories"

    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)

    parent = relationship("Category", remote_side="Category.id", backref="children")

class ProductStatus(str, enum.Enum):
    DRAFT = "draft"
    PROCESSING = "processing"
    READY = "ready"
    PUBLISHED = "published"
    OUT_OF_STOCK = "out_of_stock"
    ARCHIVED = "archived"

class Product(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "products"

    artisan_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("artisan_profiles.user_id", ondelete="CASCADE"), index=True)
    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    
    name: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[str] = mapped_column(Text)
    short_description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Core attributes mapped directly for fast filtering
    material: Mapped[str] = mapped_column(String(100), index=True)
    craft_type: Mapped[str] = mapped_column(String(100), index=True)
    color: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    origin: Mapped[str] = mapped_column(String(255))
    production_time: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    sku: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True, index=True)
    
    # Flexible attributes stored in JSONB
    attributes: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    
    price: Mapped[float] = mapped_column(Float, index=True)
    status: Mapped[ProductStatus] = mapped_column(Enum(ProductStatus), default=ProductStatus.DRAFT, index=True)
    
    views: Mapped[int] = mapped_column(Integer, default=0)
    orders: Mapped[int] = mapped_column(Integer, default=0)
    rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Relationships
    artisan: Mapped["ArtisanProfile"] = relationship("ArtisanProfile", back_populates="products")
    category: Mapped[Optional["Category"]] = relationship("Category")
    images: Mapped[List["ProductImage"]] = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan", order_by="ProductImage.sort_order")
    translations: Mapped[List["ProductTranslation"]] = relationship("ProductTranslation", back_populates="product", cascade="all, delete-orphan")
    keywords: Mapped[List["ProductKeyword"]] = relationship("ProductKeyword", back_populates="product", cascade="all, delete-orphan")
    inventory: Mapped[Optional["Inventory"]] = relationship("Inventory", back_populates="product", uselist=False, cascade="all, delete-orphan")

class ProductDraft(Base, UUIDMixin, TimestampMixin):
    """
    Stores incomplete products during the multi-step creation flow.
    Drafts are schemaless JSONB until they are published to the products table.
    """
    __tablename__ = "product_drafts"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    current_step: Mapped[str] = mapped_column(String(50))
    draft_data: Mapped[dict] = mapped_column(JSONB, default=dict)

class ProductImage(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "product_images"

    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), index=True)
    url: Mapped[str] = mapped_column(String(1024))
    original_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    is_enhanced: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    product: Mapped["Product"] = relationship("Product", back_populates="images")

class ProductTranslation(Base, TimestampMixin):
    __tablename__ = "product_translations"
    __table_args__ = (UniqueConstraint('product_id', 'language_code', name='uix_product_language'),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), index=True)
    language_code: Mapped[AppLanguage] = mapped_column(Enum(AppLanguage), index=True)
    
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    short_description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    is_ai_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    reviewed_by_user: Mapped[bool] = mapped_column(Boolean, default=False)

    product: Mapped["Product"] = relationship("Product", back_populates="translations")

class ProductKeyword(Base, TimestampMixin):
    __tablename__ = "product_keywords"
    __table_args__ = (UniqueConstraint('product_id', 'keyword', name='uix_product_keyword'),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), index=True)
    keyword: Mapped[str] = mapped_column(String(100), index=True)

    product: Mapped["Product"] = relationship("Product", back_populates="keywords")

class Inventory(Base, TimestampMixin):
    __tablename__ = "inventory"

    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), primary_key=True)
    available_quantity: Mapped[int] = mapped_column(Integer, default=0)
    reserved_quantity: Mapped[int] = mapped_column(Integer, default=0)
    sold_quantity: Mapped[int] = mapped_column(Integer, default=0)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, default=5)

    product: Mapped["Product"] = relationship("Product", back_populates="inventory")

class InventoryTransactionType(str, enum.Enum):
    SALE = "sale"
    RESTOCK = "restock"
    ADJUSTMENT = "adjustment"
    RESERVATION = "reservation"
    CANCELLATION = "cancellation"
    RETURN = "return"

class InventoryTransaction(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "inventory_transactions"

    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), index=True)
    transaction_type: Mapped[InventoryTransactionType] = mapped_column(Enum(InventoryTransactionType))
    quantity_change: Mapped[int] = mapped_column(Integer) # positive or negative
    reference_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True) # e.g. order_id
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
