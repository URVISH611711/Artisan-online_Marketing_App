from fastapi import APIRouter

from .endpoints import auth, products, orders, ai

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI & Automation"])
