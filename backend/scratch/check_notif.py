from app.database.connection import SessionLocal
from app.models.ai import Notification
from app.models.order import Order

db = SessionLocal()
notifs = db.query(Notification).order_by(Notification.created_at.desc()).limit(10).all()
print("NOTIFICATIONS:", len(notifs))
for n in notifs:
    print(n.id, n.type, n.title, n.user_id, n.created_at)

orders = db.query(Order).order_by(Order.created_at.desc()).limit(5).all()
print("ORDERS:", len(orders))
for o in orders:
    print(o.id, o.order_number, o.created_at)
