from app.database.connection import SessionLocal
from sqlalchemy import text

db = SessionLocal()
new_types = [
    "ORDER_PLACED",
    "PAYMENT_CONFIRMED",
    "ORDER_ACCEPTED",
    "ORDER_SHIPPED",
    "ORDER_DELIVERED",
    "ORDER_CANCELLED",
    "ORDER_REFUND",
    "PAYMENT_RECEIVED",
    "OUT_OF_STOCK",
    "PRODUCT_PUBLISHED",
    "PROFILE_UPDATED",
    "SECURITY_ALERT"
]

for ntype in new_types:
    try:
        db.execute(text(f"ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS '{ntype}'"))
        db.commit()
        print(f"Added {ntype}")
    except Exception as e:
        db.rollback()
        print(f"Error adding {ntype}: {e}")

print("Done")
