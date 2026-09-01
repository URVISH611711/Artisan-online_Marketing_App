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


from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Any, Dict, Union
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
    name: str = Field("Untitled Product", max_length=255, description="Product name")
    description: Optional[str] = None
    short_description: Optional[str] = None
    material: Optional[str] = None
    craft_type: Optional[str] = None
    color: Optional[str] = None
    origin: Optional[str] = None
    production_time: Optional[str] = None
    price: Optional[float] = None
    quantity: Optional[int] = None
    key_features: Optional[str] = None
    intended_use: Optional[str] = None
    target_customer: Optional[str] = None
    style: Optional[str] = None
    
    # New AI-enriched fields passed from BoostProductScreen
    length: Optional[float] = None
    width: Optional[float] = None
    diameter: Optional[float] = None
    seo: Optional[Dict[str, Any]] = None
    translations: Optional[Dict[str, Any]] = None

    @field_validator("name", mode="before")
    def validate_name(cls, v):
        if not v or not str(v).strip():
            return "Untitled Product"
        return str(v).strip()

    @field_validator("price", mode="before")
    def validate_price(cls, v):
        if v is None or v == "" or v == "undefined":
            return None
        try:
            val = float(v)
            return val if val >= 0 else 0.0
        except (ValueError, TypeError):
            return None

    @field_validator("quantity", mode="before")
    def validate_quantity(cls, v):
        if v is None or v == "" or v == "undefined":
            return None
        try:
            val = int(v)
            return val if val >= 0 else 0
        except (ValueError, TypeError):
            return None

    @field_validator("craft_type", mode="before")
    def validate_craft_type(cls, v, values):
        if v:
            return str(v)
        return None


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


class BackgroundDetailsInput(BaseModel):
    style: Optional[str] = "Premium Artisan Studio"
    environment: Optional[str] = "Warm handcrafted studio"
    surface: Optional[str] = "Natural wooden tabletop"
    color_palette: Optional[Union[List[str], str]] = "Warm beige, cream"
    lighting: Optional[str] = "Soft natural window light"
    shadow: Optional[str] = "Realistic soft contact shadow"
    mood: Optional[str] = "Premium, authentic, handcrafted"
    composition: Optional[str] = "Minimal commercial product photography"
    additional_instructions: Optional[str] = None


class AutoFillBackgroundRequest(BaseModel):
    image_url: Optional[str] = None
    image_base64: Optional[str] = None
    product_details: Optional[ProductDetailsInput] = None


class AutoFillBackgroundResponse(BaseModel):
    success: bool
    product_analysis: Optional[Dict[str, Any]] = None
    background_details: Optional[BackgroundDetailsInput] = None
    suggested_sd_prompt: Optional[str] = None
    error: Optional[str] = None


class StudioRegenerateRequest(BaseModel):
    job_id: str
    background_mode: Optional[BackgroundModeEnum] = None
    custom_prompt: Optional[str] = None
    background_details: Optional[BackgroundDetailsInput] = None


class StudioPublishRequest(BaseModel):
    job_id: str
    product_details: ProductDetailsInput
    selected_image_urls: Optional[List[str]] = None


class StudioPublishResponse(BaseModel):
    success: bool
    product_id: str
    message: str
