"""
Pydantic schemas for the AI Product Studio endpoints.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from enum import Enum


class BackgroundModeEnum(str, Enum):
    CLEAN_WHITE = "CLEAN_WHITE"
    STUDIO_GREY = "STUDIO_GREY"
    NATURAL_LIGHT = "NATURAL_LIGHT"
    LIFESTYLE = "LIFESTYLE"
    OUTDOOR = "OUTDOOR"
    FESTIVE = "FESTIVE"
    CUSTOM = "CUSTOM"


class ProductDetailsInput(BaseModel):
    """User-provided product information. All fields optional except name."""
    name: str = Field(..., min_length=1, max_length=255, description="Product name (required)")
    description: Optional[str] = None
    short_description: Optional[str] = None
    material: Optional[str] = None
    craft_type: Optional[str] = None
    color: Optional[str] = None
    origin: Optional[str] = None
    production_time: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    quantity: Optional[int] = Field(None, ge=0)
    key_features: Optional[str] = None
    intended_use: Optional[str] = None
    target_customer: Optional[str] = None
    style: Optional[str] = None


class StudioProcessResponse(BaseModel):
    success: bool
    job_id: str
    status: str
    message: str


class StudioImageResult(BaseModel):
    image_type: str
    url: str
    storage_path: Optional[str] = None


class StudioJobStatusResponse(BaseModel):
    success: bool
    job_id: str
    status: str
    progress: int
    message: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class StudioRegenerateRequest(BaseModel):
    job_id: str
    background_mode: Optional[BackgroundModeEnum] = None
    custom_prompt: Optional[str] = None


class StudioPublishRequest(BaseModel):
    job_id: str
    product_details: ProductDetailsInput


class StudioPublishResponse(BaseModel):
    success: bool
    product_id: str
    message: str
