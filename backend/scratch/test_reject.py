from app.database.connection import SessionLocal
from app.models.order import Order, OrderStatus
from app.models.product import Inventory

db = SessionLocal()
order = db.query(Order).order_by(Order.created_at.desc()).first()

print(f"Order: {order.order_number} Status: {order.status}")
for item in order.items:
    inv = db.query(Inventory).filter(Inventory.product_id == item.product_id).first()
    print(f"Item: {item.product_name_snapshot} Qty: {item.quantity} Inv Available: {inv.available_quantity if inv else 'N/A'}")

# Simulate reject
order.status = OrderStatus.REJECTED
for item in order.items:
    inv = db.query(Inventory).filter(Inventory.product_id == item.product_id).with_for_update().first()
    if inv:
        inv.available_quantity += item.quantity
        inv.sold_quantity -= item.quantity # Add this!

db.commit()

# Re-check
for item in order.items:
    inv = db.query(Inventory).filter(Inventory.product_id == item.product_id).first()
    print(f"AFTER REJECT - Item: {item.product_name_snapshot} Qty: {item.quantity} Inv Available: {inv.available_quantity if inv else 'N/A'}")
