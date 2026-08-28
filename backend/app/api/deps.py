from typing import Generator
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal

def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
