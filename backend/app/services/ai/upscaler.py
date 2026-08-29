import logging
from PIL import Image
from app.core.config import settings

logger = logging.getLogger(__name__)


def upscale_image(image: Image.Image, scale: int = 2) -> Image.Image:
    """
    Upscale an image.
    If ENABLE_UPSCALE is False, returns the image untouched.
    Currently uses Lanczos resampling as a lightweight CPU fallback.
    Real-ESRGAN can be integrated here if desired.
    """
    if not settings.ENABLE_UPSCALE:
        return image
        
    logger.info(f"[Upscaler] Upscaling image by {scale}x using CPU Lanczos...")
    w, h = image.size
    new_size = (w * scale, h * scale)
    
    # Real-ESRGAN integration placeholder:
    # return run_realesrgan(image, scale)
    
    return image.resize(new_size, Image.LANCZOS)
