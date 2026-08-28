import sys
import os
import uuid
import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database.connection import SessionLocal, engine
from app.models import Base, User, ArtisanProfile, BuyerProfile, Category, Product, ProductImage, Inventory
from app.models.user import UserRole, AppLanguage
from app.models.product import ProductStatus

def seed_database():
    print("Creating tables if they don't exist...")
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        # Check if users already exist
        if db.query(User).first():
            print("Database already seeded. Aborting.")
            return

        print("Seeding Users...")
        admin = User(
            id=uuid.uuid4(),
            email="admin@artisan-ai.com",
            phone="+919999999999",
            name="System Admin",
            role=UserRole.ADMIN,
            is_verified=True
        )
        
        artisan_user = User(
            id=uuid.uuid4(),
            email="ramesh@artisan.local",
            phone="+919876543210",
            name="Ramesh Bhai",
            role=UserRole.ARTISAN,
            preferred_language=AppLanguage.GU,
            is_verified=True
        )
        
        buyer_user = User(
            id=uuid.uuid4(),
            email="priya@buyer.local",
            name="Priya Sharma",
            role=UserRole.BUYER,
            preferred_language=AppLanguage.EN,
            is_verified=True
        )
        
        db.add_all([admin, artisan_user, buyer_user])
        db.flush()

        print("Seeding Profiles...")
        artisan_profile = ArtisanProfile(
            user_id=artisan_user.id,
            business_name="Ramesh Handicrafts",
            craft_type="Pottery",
            location="Bhuj, Gujarat",
            city="Bhuj",
            state="Gujarat",
            bio="3rd generation potter from Bhuj.",
            years_experience=15,
            rating=4.8
        )
        
        buyer_profile = BuyerProfile(
            user_id=buyer_user.id,
            company_name="FabIndia Sourcing",
            company_type="Retailer",
            location="Mumbai, Maharashtra",
            city="Mumbai",
            state="Maharashtra"
        )
        
        db.add_all([artisan_profile, buyer_profile])
        db.flush()

        print("Seeding Categories...")
        pottery = Category(id=uuid.uuid4(), name="Pottery", slug="pottery")
        textiles = Category(id=uuid.uuid4(), name="Textiles", slug="textiles")
        wood = Category(id=uuid.uuid4(), name="Wood Crafts", slug="wood-crafts")
        
        db.add_all([pottery, textiles, wood])
        db.flush()

        print("Seeding Products...")
        product1 = Product(
            id=uuid.uuid4(),
            artisan_id=artisan_user.id,
            category_id=pottery.id,
            name="Blue Pottery Vase",
            description="Hand-painted blue pottery vase using traditional Jaipur techniques.",
            short_description="Traditional hand-painted vase",
            material="Ceramic",
            craft_type="Blue Pottery",
            color="Blue",
            origin="Rajasthan",
            price=1250.00,
            status=ProductStatus.PUBLISHED,
            views=145,
            orders=12
        )
        
        db.add(product1)
        db.flush()

        print("Seeding Product Images...")
        img1 = ProductImage(
            id=uuid.uuid4(),
            product_id=product1.id,
            url="https://example.com/vase-front.jpg",
            is_enhanced=True,
            sort_order=0
        )
        db.add(img1)
        
        print("Seeding Inventory...")
        inv1 = Inventory(
            product_id=product1.id,
            available_quantity=45,
            reserved_quantity=5,
            sold_quantity=12
        )
        db.add(inv1)

        db.commit()
        print("Seed data successfully inserted!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
