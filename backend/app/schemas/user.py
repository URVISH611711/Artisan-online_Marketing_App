from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from app.models.user import UserRole, AppLanguage

class UserBase(BaseModel):
    name: str = Field(..., max_length=255)
    phone: str = Field(..., max_length=20)
    email: Optional[EmailStr] = None
    role: UserRole = UserRole.ARTISAN
    preferred_language: AppLanguage = AppLanguage.EN
    voice_language: AppLanguage = AppLanguage.EN

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserResponse(UserBase):
    id: UUID
    is_verified: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ArtisanProfileBase(BaseModel):
    business_name: str = Field(..., max_length=255)
    craft_type: str = Field(..., max_length=100)
    location: str = Field(..., max_length=255)
    city: Optional[str] = None
    state: str = Field(..., max_length=100)
    bio: Optional[str] = None
    craft_story: Optional[str] = None
    years_experience: Optional[int] = None
    profile_image: Optional[str] = None

class ArtisanProfileCreate(ArtisanProfileBase):
    pass

class ArtisanProfileResponse(ArtisanProfileBase):
    user_id: UUID
    products_count: int
    orders_count: int
    rating: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class BuyerProfileBase(BaseModel):
    company_name: str = Field(..., max_length=255)
    company_type: Optional[str] = None
    location: str = Field(..., max_length=255)
    city: Optional[str] = None
    state: Optional[str] = None
    gst_number: Optional[str] = None
    business_description: Optional[str] = None

class BuyerProfileCreate(BuyerProfileBase):
    pass

class BuyerProfileResponse(BuyerProfileBase):
    user_id: UUID
    orders_completed: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
