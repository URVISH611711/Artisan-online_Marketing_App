from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta, timezone
import jwt
import os

import random
from typing import Dict

from app.database.connection import get_db
from app.models.user import User
from app.schemas.user import UserResponse
from app.services.email import send_otp_email

router = APIRouter()

# In-memory OTP store for prototype. In production, use Redis.
# Format: { "email@example.com": { "otp": "1234", "expires": datetime } }
OTP_STORE: Dict[str, dict] = {}

SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret_key_for_dev")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "43200"))

class LoginRequest(BaseModel):
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Initiates the login process by 'sending' an OTP to the user's email.
    """
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        # We allow sending OTP to non-existent users so they can register
        pass
        
    # Generate a random 4-digit OTP
    otp_code = str(random.randint(1000, 9999))
    
    # Store OTP with a 10-minute expiration
    OTP_STORE[request.email] = {
        "otp": otp_code,
        "expires": datetime.now(timezone.utc) + timedelta(minutes=10)
    }
    
    # Send the email
    email_sent = send_otp_email(request.email, otp_code)
    
    if not email_sent:
        # Fallback for dev mode if SMTP isn't configured yet
        print(f"[FALLBACK] Developer Mock OTP for {request.email} is {otp_code}")
    
    return {"message": "OTP sent successfully", "email": request.email}

@router.post("/verify-otp", response_model=Token)
def verify_otp(request: VerifyOTPRequest, db: Session = Depends(get_db)):
    """
    Verifies the OTP and returns a JWT access token.
    """
    # Retrieve OTP from store
    stored_data = OTP_STORE.get(request.email)
    
    if not stored_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP expired or never requested",
        )
        
    if datetime.now(timezone.utc) > stored_data["expires"]:
        del OTP_STORE[request.email]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired",
        )
        
    if request.otp != stored_data["otp"] and request.otp != "1234": # 1234 is universal fallback for dev
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid OTP code",
        )
        
    # OTP is valid, remove it from store
    del OTP_STORE[request.email]
        
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        # Auto-create user for seamless OTP flow
        import uuid
        from app.models.user import UserRole, AppLanguage
        user = User(
            id=uuid.uuid4(),
            email=request.email,
            name="New User",
            role=UserRole.ARTISAN,
            is_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    # Mark user as verified if they weren't already
    if not user.is_verified:
        user.is_verified = True
        db.commit()
        db.refresh(user)

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }
