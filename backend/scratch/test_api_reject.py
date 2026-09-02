import requests
from app.database.connection import SessionLocal
from app.models.user import User

db = SessionLocal()
user = db.query(User).filter(User.role == "buyer").first()

token = user.email # Fake token or need login?
print(user.email)
