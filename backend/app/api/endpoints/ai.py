from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_ai():
    return {"message": "AI endpoint placeholder"}
