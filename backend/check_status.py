import sys
sys.path.append('.')
from app.api.deps import SessionLocal
from app.models.product import Product

db = SessionLocal()
p = db.query(Product).order_by(Product.created_at.desc()).first()
if p:
    print(f'Name: {p.name}')
    print(f'Status: {p.status}')
    print(f'Type: {type(p.status)}')
    if hasattr(p.status, "value"):
        print(f'Value: {p.status.value}')
else:
    print("No products found")
