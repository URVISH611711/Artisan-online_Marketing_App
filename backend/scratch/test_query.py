from sqlalchemy import select, func
from app.models.product import Product
from app.models.order import Order, OrderItem, OrderStatus
from app.database.connection import SessionLocal

db = SessionLocal()
# Currently it's mapped as an Integer column.
# Let's see what values we get for Product A.
products = db.query(Product).limit(5).all()
for p in products:
    print(f"Product: {p.name} - Orders: {p.orders}")
