import io
import json
import logging
import asyncio
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from PIL import Image

from model import analyze_product, get_last_used, unload_model
from gpu_lock import gpu_lock

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Artisan Vision Service (SmolVLM)")

VISION_IDLE_TTL = 120  # Unload model after 2 minutes of inactivity


async def _idle_check():
    """Background task to unload model if idle."""
    while True:
        await asyncio.sleep(30)
        last_used = get_last_used()
        if last_used > 0:
            import time
            if time.time() - last_used > VISION_IDLE_TTL:
                logger.info(f"Idle for > {VISION_IDLE_TTL}s. Releasing model.")
                unload_model()


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(_idle_check())


@app.get("/health")
def health():
    return {"status": "ok", "service": "vision"}


@app.post("/analyze")
async def analyze_endpoint(
    image: UploadFile = File(...),
    product_name: str = Form(""),
    material: str = Form(""),
    color: str = Form(""),
    craft_type: str = Form(""),
    style: str = Form(""),
):
    try:
        img_bytes = await image.read()
        pil_img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {e}")

    details = {
        "name": product_name,
        "material": material,
        "color": color,
        "craft_type": craft_type,
        "style": style,
    }

    # Acquire the cross-process GPU lock before touching the model
    with gpu_lock("vision-SmolVLM", timeout=120) as acquired:
        if not acquired:
            raise HTTPException(status_code=503, detail="Could not acquire GPU lock (backend is busy).")
        
        try:
            raw_text = analyze_product(pil_img, details)
        except Exception as e:
            logger.error(f"Inference error: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    # Try to parse the output as JSON
    # Often models wrap JSON in markdown block: ```json ... ```
    cleaned_text = raw_text.strip()
    if cleaned_text.startswith("```json"):
        cleaned_text = cleaned_text[7:]
    if cleaned_text.startswith("```"):
        cleaned_text = cleaned_text[3:]
    if cleaned_text.endswith("```"):
        cleaned_text = cleaned_text[:-3]
    
    try:
        parsed = json.loads(cleaned_text.strip())
        return {"success": True, "analysis": parsed}
    except json.JSONDecodeError:
        logger.warning(f"Failed to parse model output as JSON: {raw_text}")
        # Return the raw text if parsing fails so the backend can still use it
        return {"success": True, "raw_text": raw_text, "analysis": None}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)
