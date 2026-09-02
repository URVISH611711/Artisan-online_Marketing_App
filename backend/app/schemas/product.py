from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from uuid import UUID
from datetime import datetime

from app.schemas.user import ArtisanProfileResponse


class ProductImageResponse(BaseModel):
    id: UUID
    url: str
    is_enhanced: bool
    original_url: Optional[str] = None
    sort_order: int

    class Config:
        from_attributes = True


class InventoryResponse(BaseModel):
    available_quantity: int
    reserved_quantity: int
    sold_quantity: int
    low_stock_threshold: int

    class Config:
        from_attributes = True


class ProductTranslationResponse(BaseModel):
    language_code: str
    name: str
    description: str
    short_description: Optional[str] = None
    is_ai_generated: bool = False
    reviewed_by_user: bool = False

    class Config:
        from_attributes = True


class ProductResponse(BaseModel):
    id: UUID
    artisan_id: UUID
    name: str
    description: str
    short_description: Optional[str] = None
    material: str
    craft_type: str
    color: Optional[str] = None
    origin: str
    production_time: Optional[str] = None
    price: float
    status: str
    views: int
    orders: int
    rating: Optional[float] = None
    length: Optional[float] = None
    width: Optional[float] = None
    diameter: Optional[float] = None
    dimension_unit: Optional[str] = None
    images: List[ProductImageResponse] = []
    inventory: Optional[InventoryResponse] = None
    artisan: Optional[ArtisanProfileResponse] = None
    translations: List[ProductTranslationResponse] = []
    keywords: List[str] = []
    seo: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @field_validator("keywords", mode="before")
    @classmethod
    def _flatten_keywords(cls, v):
        # ORM gives a list of ProductKeyword objects; expose plain strings.
        if not v:
            return []
        out = []
        for item in v:
            if isinstance(item, str):
                out.append(item)
            else:
                kw = getattr(item, "keyword", None)
                if kw:
                    out.append(kw)
        return out


class ProductCreate(BaseModel):
    name: str = Field(..., max_length=255)
    description: str
    short_description: Optional[str] = Field(None, max_length=500)
    material: str = Field(..., max_length=100)
    craft_type: str = Field(..., max_length=100)
    color: Optional[str] = Field(None, max_length=50)
    origin: str = Field(..., max_length=255)
    production_time: Optional[str] = Field(None, max_length=100)
    price: float = Field(..., gt=0)
    quantity: int = Field(0, ge=0)
    length: Optional[float] = None
    width: Optional[float] = None
    diameter: Optional[float] = None
    dimension_unit: Optional[str] = "cm"


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    short_description: Optional[str] = Field(None, max_length=500)
    material: Optional[str] = Field(None, max_length=100)
    craft_type: Optional[str] = Field(None, max_length=100)
    color: Optional[str] = Field(None, max_length=50)
    origin: Optional[str] = Field(None, max_length=255)
    production_time: Optional[str] = Field(None, max_length=100)
    price: Optional[float] = Field(None, gt=0)
    quantity: Optional[int] = Field(None, ge=0)
    length: Optional[float] = None
    width: Optional[float] = None
    diameter: Optional[float] = None
    dimension_unit: Optional[str] = None
    status: Optional[str] = None
    selected_image_ids: Optional[List[UUID]] = None
    selected_image_urls: Optional[List[str]] = None





class DashboardResponse(BaseModel):
    products_count: int
    orders_count: int
    total_sales: float
    new_orders_count: int
    period: Optional[str] = "month"
    avg_sales: Optional[float] = 0.0
