"""
AI endpoints for Artisan AI.

POST /ai/process  -- Start processing an AI enhancement job (Async)
GET /ai/status/{job_id}  -- Poll for job status
POST /ai/voice/transcribe -- Transcribe voice locally
"""
import logging
import time
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request, BackgroundTasks
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.image_enhance import validate_image, MAX_IMAGES
from app.services.rmbg_enhance import remove_background, unload_rmbg_pipeline
from app.services.llm_prompt import generate_sd_prompt, unload_llm_pipeline
from app.services.sd_inpainting import generate_background, unload_sd_pipeline
from app.services.voice_stt import transcribe_audio, unload_whisper_model
from app.services.storage import save_image, generate_session_id
from app.services.job_manager import create_job, get_job, update_job, mark_job_failed, JobStatus
from app.services.memory_manager import memory_manager

logger = logging.getLogger(__name__)
router = APIRouter()

def _ext_for_mime(mime: str) -> str:
    if "png" in mime:
        return "png"
    if "webp" in mime:
        return "webp"
    return "jpg"

def process_job_background(
    job_id: str, 
    user_id: str, 
    image_data_list: List[tuple],
    original_urls: List[str],
    product_details: dict,
    base_url: str
):
    try:
        update_job(job_id, JobStatus.ANALYZING, progress=10, message="Analyzing product details...")
        
        # 1. Analyze text & generate prompt using Local LLM
        prompt_data = generate_sd_prompt(product_details)
        sd_prompt = prompt_data["prompt"]
        sd_negative = prompt_data["negative_prompt"]
        
        # Unload LLM to free VRAM
        unload_llm_pipeline()
        
        enhanced_urls = []
        
        for i, (img_bytes, mime) in enumerate(image_data_list):
            logger.info(f"[Job {job_id}] Processing image {i+1}/{len(image_data_list)}")
            update_job(job_id, JobStatus.REMOVING_BACKGROUND, progress=20 + int(20 * (i/len(image_data_list))), message=f"Removing background ({i+1}/{len(image_data_list)})...")
            
            # 2. Remove background using RMBG-1.4
            rmbg_result = remove_background(img_bytes, mime)
            transparent_bytes = rmbg_result["enhanced_image_bytes"]
            
            # Unload RMBG model to free VRAM for SD
            unload_rmbg_pipeline()
            
            update_job(job_id, JobStatus.CREATING_BACKGROUND, progress=50 + int(30 * (i/len(image_data_list))), message=f"Generating professional background ({i+1}/{len(image_data_list)})...")
            
            # 3. Generate background using SD 1.5 Inpainting & composite
            sd_result = generate_background(
                transparent_png_bytes=transparent_bytes,
                prompt=sd_prompt,
                negative_prompt=sd_negative
            )
            final_bytes = sd_result["generated_image_bytes"]
            final_mime = sd_result["mime_type"]
            
            # Unload SD model to free VRAM for next iteration if there are multiple images
            unload_sd_pipeline()
            
            # Save enhanced image
            enhanced_filename = f"enhanced_{i+1}_{job_id}.{_ext_for_mime(final_mime)}"
            _, enhanced_url = save_image(
                user_id, job_id, final_bytes, enhanced_filename,
                subfolder="enhanced", content_type=final_mime, base_url=base_url,
            )
            enhanced_urls.append(enhanced_url)
        
        # Final cleanup just in case
        memory_manager.cleanup()
        
        update_job(job_id, JobStatus.COMPLETED, progress=100, message="Completed", result={
            "original_urls": original_urls,
            "enhanced_urls": enhanced_urls,
            "prompt_used": sd_prompt
        })
        
    except Exception as e:
        logger.error(f"[AI Worker] Job {job_id} failed: {e}", exc_info=True)
        # Ensure memory is freed even on failure
        memory_manager.cleanup()
        mark_job_failed(job_id, str(e))


@router.post("/process")
async def start_processing(
    request: Request,
    background_tasks: BackgroundTasks,
    images: List[UploadFile] = File(..., description="Product images (1-5)"),
    product_name: Optional[str] = Form(""),
    material: Optional[str] = Form(""),
    color: Optional[str] = Form(""),
    craft: Optional[str] = Form(""),
    style: Optional[str] = Form(""),
    background_style: Optional[str] = Form("Professional Studio"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Start asynchronous AI processing for product images."""
    user_id = str(current_user.id)
    job_id = create_job(user_id=user_id)
    base_url = str(request.base_url).rstrip("/")

    # Validate image count
    if not images or len(images) == 0:
        raise HTTPException(status_code=400, detail="At least one image is required.")
    if len(images) > MAX_IMAGES:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_IMAGES} images allowed.")

    image_data_list = []
    original_urls = []

    for idx, img_file in enumerate(images):
        content_type = img_file.content_type or "application/octet-stream"
        img_bytes = await img_file.read()
        size = len(img_bytes)

        error = validate_image(content_type, size, img_file.filename or f"image_{idx}")
        if error:
            raise HTTPException(status_code=400, detail=error)

        filename = f"original_{idx + 1}.{_ext_for_mime(content_type)}"
        _, orig_url = save_image(
            user_id, job_id, img_bytes, filename,
            subfolder="original", content_type=content_type, base_url=base_url,
        )
        original_urls.append(orig_url)
        image_data_list.append((img_bytes, content_type))

    product_details = {
        "name": product_name,
        "material": material,
        "color": color,
        "craft": craft,
        "style": style,
        "background_style": background_style
    }

    logger.info(f"[AI ENDPOINT] Job {job_id} started for user {user_id}")
    
    # Fire off background task
    background_tasks.add_task(
        process_job_background, 
        job_id, user_id, image_data_list, original_urls, product_details, base_url
    )

    return {
        "success": True,
        "job_id": job_id,
        "status": "UPLOADING",
        "message": "Processing started"
    }


@router.get("/status/{job_id}")
async def get_job_status(job_id: str, current_user: User = Depends(get_current_user)):
    """Poll for the status of an AI job."""
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    return {
        "success": True,
        "job_id": job.id,
        "status": job.status,
        "progress": job.progress,
        "message": job.message,
        "result": job.result,
        "error": job.error
    }


@router.post("/voice/transcribe")
async def process_voice(
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Transcribe voice locally using faster-whisper."""
    from app.services.ai.gpu_lock import gpu_lock
    from app.services.ai.model_manager import model_manager, ModelKey
    
    audio_bytes = await audio.read()
    
    try:
        with gpu_lock("backend-WHISPER"):
            with model_manager.using(ModelKey.WHISPER):
                result = transcribe_audio(audio_bytes)
                
        return {
            "success": True,
            "text": result["text"],
            "language": result["language"]
        }
    except Exception as e:
        logger.error(f"[Voice] Transcription failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Voice transcription failed")
