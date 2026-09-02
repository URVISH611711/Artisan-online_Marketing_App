from fastapi import APIRouter

from .endpoints import auth, products, orders, ai, profile, notifications, studio, catalog, smart_pricing

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(profile.router, prefix="/profile", tags=["Profile"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI & Automation"])
api_router.include_router(studio.router, prefix="/ai/studio", tags=["AI Studio"])
api_router.include_router(catalog.router, prefix="/ai/catalog", tags=["Auto-Cataloger"])
api_router.include_router(smart_pricing.router, prefix="/ai", tags=["AI & Automation"])
