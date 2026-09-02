from app.database.connection import SessionLocal
from app.models.ai import Notification, NotificationType
from app.models.user import User

db = SessionLocal()
user = db.query(User).first()
if user:
    notif = Notification(
        user_id=user.id,
        type=NotificationType.ORDER_PLACED,
        title="Test",
        message="Test"
    )
    try:
        db.add(notif)
        db.commit()
        print("Success")
    except Exception as e:
        print("Error:", e)
else:
    print("No user")
