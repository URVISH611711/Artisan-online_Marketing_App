from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

from app.database.connection import get_db
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


# Notifications are not yet stored in DB — return empty list.
# This provides a clean API contract so the mobile app can
# drop mockData immediately and show "No notifications" instead.

class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    message: str
    read: bool
    created_at: str


@router.get("/", response_model=List[NotificationResponse])
def list_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List notifications for the authenticated user.
    Returns empty list until a notifications table is created."""
    return []
