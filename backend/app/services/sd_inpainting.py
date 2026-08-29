"""
Local Stable Diffusion 1.5 Inpainting.
Aggressively optimized for 4GB VRAM (RTX 2050).
"""
import io
import logging
import time
from typing import Dict, Any
from PIL import Image

import torch
from app.services.memory_manager import memory_manager

logger = logging.getLogger(__name__)

_sd_pipe = None

def get_sd_pipeline():
    global _sd_pipe
    if _sd_pipe is None:
        logger.info("[SD] Loading runwayml/stable-diffusion-inpainting...")
        from diffusers import StableDiffusionInpaintPipeline
        
        # Load in fp16 to save memory
        _sd_pipe = StableDiffusionInpaintPipeline.from_pretrained(
            "runwayml/stable-diffusion-inpainting",
            torch_dtype=torch.float16
        )
        
        # Aggressive memory optimizations for 4GB VRAM
        _sd_pipe.enable_model_cpu_offload() # Offload parts to CPU when not actively computing
        _sd_pipe.enable_attention_slicing(1)
        _sd_pipe.enable_vae_slicing()
        
        logger.info("[SD] SD Inpainting model loaded with memory optimizations.")
    return _sd_pipe

def unload_sd_pipeline():
    global _sd_pipe
    if _sd_pipe is not None:
        logger.info("[SD] Unloading SD model to free VRAM...")
        memory_manager.offload_model(_sd_pipe)
        _sd_pipe = None

def generate_background(
    transparent_png_bytes: bytes,
    prompt: str,
    negative_prompt: str
) -> Dict[str, Any]:
    """
    Generate a background using SD Inpainting.
    The transparent product image dictates the mask.
    """
    started_at = time.time()
    
    # 1. Prepare images
    original = Image.open(io.BytesIO(transparent_png_bytes)).convert("RGBA")
    
    # Create mask: White where we WANT to generate (background), Black where product is (protected)
    # The alpha channel of RMBG: 255 = product, 0 = background
    # So we invert the alpha channel to get the mask
    alpha = original.split()[-1]
    mask = Image.eval(alpha, lambda a: 255 - a).convert("RGB")
    
    # Create a base image (white background + product) for SD to start from
    base_image = Image.new("RGB", original.size, (255, 255, 255))
    base_image.paste(original, mask=alpha)
    
    # Downscale if image is too large (SD 1.5 prefers 512x512)
    # To keep aspect ratio, resize longest edge to 512
    max_size = 512
    w, h = base_image.size
    if max(w, h) > max_size:
        ratio = max_size / max(w, h)
        new_w, new_h = int(w * ratio), int(h * ratio)
        # Ensure dimensions are multiples of 8
        new_w = (new_w // 8) * 8
        new_h = (new_h // 8) * 8
        base_image = base_image.resize((new_w, new_h), Image.LANCZOS)
        mask = mask.resize((new_w, new_h), Image.LANCZOS)
    
    pipe = get_sd_pipeline()
    
    logger.info(f"[SD] Generating background with prompt: {prompt[:50]}...")
    
    # Run pipeline
    result = pipe(
        prompt=prompt,
        negative_prompt=negative_prompt,
        image=base_image,
        mask_image=mask,
        num_inference_steps=20, # Keep low for speed
        guidance_scale=7.5
    ).images[0]
    
    # Upscale back to original resolution if needed
    if result.size != original.size:
        result = result.resize(original.size, Image.LANCZOS)
    
    # VERY IMPORTANT: Composite the exact original product back on top to prevent artifacts
    final_composite = result.convert("RGBA")
    final_composite.paste(original, mask=alpha)
    final_composite = final_composite.convert("RGB")
    
    output_buffer = io.BytesIO()
    final_composite.save(output_buffer, format="JPEG", quality=95)
    
    elapsed = round(time.time() - started_at, 2)
    logger.info(f"[SD] Generation complete in {elapsed}s")
    
    return {
        "generated_image_bytes": output_buffer.getvalue(),
        "mime_type": "image/jpeg",
        "processing_time_seconds": elapsed
    }
