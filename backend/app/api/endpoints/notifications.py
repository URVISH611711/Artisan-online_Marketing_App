from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

from app.database.connection import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.ai import Notification
from app.services.notifications import register_push_token

router = APIRouter()

class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    message: str
    read: bool
    created_at: str

class PushTokenRequest(BaseModel):
    token: str
    device_name: Optional[str] = None

@router.get("/", response_model=List[NotificationResponse])
def list_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List notifications for the authenticated user."""
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(50).all()
    
    return [
        NotificationResponse(
            id=str(n.id),
            type=n.type.value if hasattr(n.type, 'value') else str(n.type),
            title=n.title,
            message=n.message,
            read=n.is_read,
            created_at=n.created_at.isoformat()
        )
        for n in notifications
    ]

@router.put("/read-all", response_model=dict)
def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark all notifications as read."""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"success": True}

@router.put("/{notification_id}/read", response_model=dict)
def mark_as_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a specific notification as read."""
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notif.is_read = True
    db.commit()
    return {"success": True}

@router.post("/push-token", response_model=dict)
def register_token(
    payload: PushTokenRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Register a push token for the authenticated user."""
    register_push_token(db, current_user.id, payload.token, payload.device_name)
    return {"success": True}
