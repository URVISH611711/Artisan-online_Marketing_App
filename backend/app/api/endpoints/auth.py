from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta, timezone
import jwt
import random
from typing import Dict

from app.core.config import settings
from app.database.connection import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserResponse, UserSignUp
from app.services.email import send_otp_email
from app.api.deps import get_current_user, ensure_artisan_profile
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def get_password_hash(password):
    return pwd_context.hash(password)


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


router = APIRouter()

# In-memory OTP store for prototype. In production, use Redis.
OTP_STORE: Dict[str, dict] = {}

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


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


# ─── GET /auth/me ────────────────────────────────────────────────
@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return current_user


# ─── POST /auth/login ───────────────────────────────────────────
@router.post("/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticates the user with email and password, returning a JWT token."""
    email = request.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found. Please sign up.",
        )

    if not user.hashed_password or not verify_password(
        request.password, user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role},
        expires_delta=access_token_expires,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


# ─── POST /auth/register ────────────────────────────────────────
@router.post("/register")
def register(request: UserSignUp, db: Session = Depends(get_db)):
    """Initiates the sign up process. Stores user details temporarily and sends OTP."""
    email = request.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account with this email already exists.",
        )

    # Check phone uniqueness
    if request.phone:
        phone_user = db.query(User).filter(User.phone == request.phone).first()
        if phone_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This mobile number is already registered. Please Log In.",
            )

    # Generate a random 4-digit OTP
    otp_code = str(random.randint(1000, 9999))

    signup_data = request.model_dump()
    signup_data["email"] = email

    # Store OTP and signup data with a 10-minute expiration
    OTP_STORE[email] = {
        "otp": otp_code,
        "signup_data": signup_data,
        "expires": datetime.now(timezone.utc) + timedelta(minutes=10),
    }

    # Send the email
    email_sent = send_otp_email(email, otp_code)

    if not email_sent:
        print(f"[FALLBACK] Developer Mock OTP for {email} is {otp_code}")

    return {"message": "OTP sent for registration", "email": email}


# ─── POST /auth/verify-otp ──────────────────────────────────────
@router.post("/verify-otp", response_model=Token)
def verify_otp(request: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Verifies the OTP and returns a JWT access token. Creates user if signing up."""
    email = request.email.lower().strip()
    stored_data = OTP_STORE.get(email)

    if not stored_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP expired or never requested",
        )

    if datetime.now(timezone.utc) > stored_data["expires"]:
        del OTP_STORE[email]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired",
        )

    if (
        request.otp != stored_data["otp"] and request.otp != "1234"
    ):  # 1234 is universal fallback for dev
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid OTP code",
        )

    # OTP is valid
    signup_data = stored_data.get("signup_data")
    del OTP_STORE[email]

    user = db.query(User).filter(User.email == email).first()

    # If this was a sign up flow, create the user
    if signup_data and not user:
        import uuid

        hashed_pw = get_password_hash(signup_data["password"])
        user = User(
            id=uuid.uuid4(),
            email=signup_data["email"],
            name=signup_data["name"],
            phone=signup_data["phone"],
            address=signup_data["address"],
            hashed_password=hashed_pw,
            role=UserRole.ARTISAN,
            is_verified=True,
        )
        db.add(user)
        try:
            db.commit()
            db.refresh(user)
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this mobile number or email already exists.",
            )
    elif not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Mark user as verified if they weren't already
    if not user.is_verified:
        user.is_verified = True
        db.commit()
        db.refresh(user)

    # Products FK to artisan_profiles.user_id, so an artisan without this row
    # cannot save a single product. Create it here (idempotent, so it also
    # backfills accounts registered before this was fixed).
    if user.role == UserRole.ARTISAN:
        ensure_artisan_profile(db, user)

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role},
        expires_delta=access_token_expires,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }
