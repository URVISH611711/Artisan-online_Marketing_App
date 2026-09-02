from sqlalchemy import select, func
from sqlalchemy.orm import column_property
from app.models.product import Product
from app.models.order import Order, OrderItem, OrderStatus
from app.database.connection import SessionLocal

Product.orders = column_property(
    select(func.count(func.distinct(OrderItem.order_id)))
    .join(Order, Order.id == OrderItem.order_id)
    .where(
        OrderItem.product_id == Product.id,
        Order.status.not_in([OrderStatus.CANCELLED, OrderStatus.REJECTED]),
        Order.deleted_at.is_(None)
    )
    .correlate_except(OrderItem)
    .scalar_subquery()
)

db = SessionLocal()
products = db.query(Product).limit(5).all()
for p in products:
    print(f"Product: {p.name} - Orders: {p.orders}")
