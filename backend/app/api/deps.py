from typing import Generator, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

from app.core.config import settings
from app.database.connection import SessionLocal
from app.models.user import User

security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)

# Read from pydantic-settings (which loads .env). os.getenv() does NOT see .env
# because nothing calls load_dotenv() — using it silently signed every JWT with
# the hardcoded fallback string.
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Extract user from JWT token. Use as a FastAPI dependency on protected routes."""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )
    return user


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Like get_current_user but never raises.

    Returns the authenticated user when a valid token is present, otherwise
    None. Used by endpoints that are usable anonymously but personalize their
    result for a signed-in user — e.g. the marketplace, which hides the
    viewer's OWN products so nobody is offered their own listing to buy.
    """
    if credentials is None:
        return None
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except jwt.InvalidTokenError:
        # ExpiredSignatureError is a subclass, so expired tokens land here too.
        return None
    if not user_id:
        return None
    return db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()


def ensure_artisan_profile(db: Session, user: User) -> "ArtisanProfile":
    """
    Idempotently guarantee an ArtisanProfile row exists for `user`, and return it.

    Product.artisan_id carries a FK to artisan_profiles.user_id, so a user with
    no row here cannot create ANY product — the INSERT dies with a foreign-key
    violation. Registration only ever created the `users` row, so this both
    fixes new signups and self-heals accounts created before the fix.

    business_name / craft_type / location / state are NOT NULL in the schema.
    We seed only what we actually know (the user's own name and address) and
    leave the rest as empty strings rather than inventing a craft or a state —
    the artisan fills those in via PUT /profile/.
    """
    from app.models.user import ArtisanProfile

    profile = (
        db.query(ArtisanProfile).filter(ArtisanProfile.user_id == user.id).first()
    )
    if profile is not None:
        return profile

    profile = ArtisanProfile(
        user_id=user.id,
        business_name=user.name,
        craft_type="",
        location=user.address or "",
        state="",
    )
    db.add(profile)
    try:
        db.commit()
    except IntegrityError:
        # A concurrent request won the race — adopt the row it created.
        db.rollback()
        profile = (
            db.query(ArtisanProfile).filter(ArtisanProfile.user_id == user.id).first()
        )
        if profile is None:
            raise
        return profile

    db.refresh(profile)
    return profile
