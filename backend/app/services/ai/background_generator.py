import logging
import time
from typing import Tuple
from PIL import Image

from app.services.sd_inpainting import get_sd_pipeline
from app.services.ai.oom import with_oom_ladder
from app.core.config import settings

logger = logging.getLogger(__name__)


def generate_diffusion_background(
    cutout: Image.Image,
    mask: Image.Image,
    prompt: str,
    negative_prompt: str
) -> Image.Image:
    """
    Generates a background plate using Stable Diffusion Inpainting, wrapped
    in the OOM degradation ladder.
    
    Returns an RGB background image. Compositing happens elsewhere.
    """
    started_at = time.time()
    
    # 1. Create a base image (white background + product) for SD to start from
    # This guides the lighting and shadow generation since it can "see" the product.
    base_image = Image.new("RGB", cutout.size, (255, 255, 255))
    base_image.paste(cutout, mask=cutout.split()[-1])
    
    # 2. Invert the mask for inpainting
    # In diffusers inpainting: white (255) is what to generate, black (0) is what to keep.
    # The passed `mask` has 255 for the product. We want to generate the background,
    # so we need 255 for the background and 0 for the product.
    inpaint_mask = Image.eval(mask, lambda m: 255 - m).convert("RGB")
    
    # 3. Get pipeline
    pipe = get_sd_pipeline()
    
    kwargs = {
        "prompt": prompt,
        "negative_prompt": negative_prompt,
        "image": base_image,
        "mask_image": inpaint_mask,
        "num_inference_steps": settings.SD_STEPS,
        "guidance_scale": settings.SD_GUIDANCE,
    }
    
    logger.info(f"[SD Gen] Starting background generation with prompt: {prompt[:50]}...")
    
    # Run through the OOM ladder
    try:
        result_image = with_oom_ladder(pipe, pipe, kwargs).images[0]
        
        # Scale back to original resolution if the OOM ladder reduced it
        if result_image.size != cutout.size:
            result_image = result_image.resize(cutout.size, Image.LANCZOS)
            
        elapsed = round(time.time() - started_at, 2)
        logger.info(f"[SD Gen] Generation completed in {elapsed}s")
        
        return result_image.convert("RGB")
        
    except RuntimeError as e:
        if str(e) == "OOM_EXHAUSTED":
            logger.error("[SD Gen] OOM Exhausted. Falling back to CLEAN_WHITE in studio pipeline.")
            raise e
        raise e
