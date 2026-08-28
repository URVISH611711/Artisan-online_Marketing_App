from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_orders():
    return {"message": "Orders endpoint placeholder"}
