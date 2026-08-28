from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from app.models.product import ProductStatus

class ProductImageBase(BaseModel):
    url: str
    original_url: Optional[str] = None
    is_enhanced: bool = False
    sort_order: int = 0

class ProductImageCreate(ProductImageBase):
    pass

class ProductImageResponse(ProductImageBase):
    id: UUID
    product_id: UUID

    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: str
    short_description: Optional[str] = None
    material: str = Field(..., max_length=100)
    craft_type: str = Field(..., max_length=100)
    color: Optional[str] = None
    origin: str = Field(..., max_length=255)
    production_time: Optional[str] = None
    sku: Optional[str] = None
    attributes: Optional[Dict[str, Any]] = None
    price: float = Field(..., ge=0)
    status: ProductStatus = ProductStatus.DRAFT

class ProductCreate(ProductBase):
    category_id: Optional[UUID] = None
    images: Optional[List[ProductImageCreate]] = []

class ProductResponse(ProductBase):
    id: UUID
    artisan_id: UUID
    category_id: Optional[UUID] = None
    views: int
    orders: int
    rating: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    images: List[ProductImageResponse] = []

    class Config:
        from_attributes = True

class ProductDraftBase(BaseModel):
    current_step: str
    draft_data: Dict[str, Any]

class ProductDraftCreate(ProductDraftBase):
    pass

class ProductDraftResponse(ProductDraftBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
