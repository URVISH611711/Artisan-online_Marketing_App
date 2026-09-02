import logging
import requests
import uuid
from sqlalchemy.orm import Session

from app.models.ai import Notification, NotificationType
from app.models.push_token import PushToken

logger = logging.getLogger(__name__)

EXPO_PUSH_API_URL = "https://exp.host/--/api/v2/push/send"

def register_push_token(db: Session, user_id: uuid.UUID, token: str, device_name: str = None):
    """
    Register a push token for a user. If the token already exists for this user, it updates it.
    """
    # Check if the exact token is already linked to this user
    existing_token = db.query(PushToken).filter(PushToken.token == token).first()
    
    if existing_token:
        if existing_token.user_id != user_id:
            # Token belongs to another user (e.g. logged out and logged in as different user)
            # Reassign it
            existing_token.user_id = user_id
            existing_token.device_name = device_name
            existing_token.is_active = True
        else:
            # Update device name and set active
            existing_token.device_name = device_name
            existing_token.is_active = True
    else:
        # Create new token
        new_token = PushToken(
            user_id=user_id,
            token=token,
            device_name=device_name,
            is_active=True
        )
        db.add(new_token)
    
    db.commit()

def send_notification(
    db: Session,
    user_id: uuid.UUID,
    type: NotificationType,
    title: str,
    message: str,
    related_entity_type: str = None,
    related_entity_id: str = None
):
    """
    Creates a notification in the database and pushes it to all active devices of the user.
    """
    # 1. Save to DB
    notif = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        related_entity_type=related_entity_type,
        related_entity_id=related_entity_id
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    
    # 2. Get active push tokens for this user
    push_tokens = db.query(PushToken).filter(
        PushToken.user_id == user_id, 
        PushToken.is_active == True
    ).all()
    
    if not push_tokens:
        return notif
        
    # 3. Send Push Notifications via Expo
    messages = []
    for pt in push_tokens:
        messages.append({
            "to": pt.token,
            "title": title,
            "body": message,
            "data": {
                "type": type.value,
                "related_entity_type": related_entity_type,
                "related_entity_id": related_entity_id
            }
        })
        
    try:
        response = requests.post(
            EXPO_PUSH_API_URL,
            json=messages,
            headers={
                "Accept": "application/json",
                "Accept-encoding": "gzip, deflate",
                "Content-Type": "application/json",
            },
            timeout=5
        )
        # We could parse the response to invalidate bad tokens, but we keep it simple for now.
        if response.status_code != 200:
            logger.warning(f"Expo push API returned {response.status_code}: {response.text}")
    except Exception as e:
        logger.error(f"Failed to send push notifications: {e}")
        
    return notif
