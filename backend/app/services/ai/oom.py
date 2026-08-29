import logging
from typing import Callable, Any

from app.services.memory_manager import memory_manager

logger = logging.getLogger(__name__)


def with_oom_ladder(
    func: Callable[..., Any],
    pipe: Any,
    original_kwargs: dict
) -> Any:
    """
    CUDA Out-Of-Memory degradation ladder.
    Wraps a diffusers pipeline call.
    
    1. First attempt at requested resolution.
    2. On OOM: memory_manager.cleanup(), retry.
    3. On OOM: Drop resolution step-by-step (e.g. 512 -> 448 -> 384)
    4. On OOM: Enable sequential CPU offload and retry once.
    5. On OOM: Raise RuntimeError so the caller can fall back to CLEAN_WHITE.
    """
    
    resolutions = [512, 448, 384]
    
    # 1. Base attempts at different resolutions
    for res in resolutions:
        try:
            logger.info(f"[OOM Ladder] Attempting SD generation at max resolution {res}...")
            # Adjust kwargs for current resolution
            kwargs = _resize_kwargs(original_kwargs, res)
            return func(**kwargs)
            
        except RuntimeError as e:
            if "out of memory" in str(e).lower() or "oom" in str(e).lower():
                logger.warning(f"[OOM Ladder] CUDA OOM at resolution {res}. Cleaning up memory...")
                memory_manager.cleanup()
            else:
                # Not an OOM error, re-raise
                raise e
    
    # 2. If we exhaust resolutions, force sequential CPU offload
    logger.warning("[OOM Ladder] Exhausted resolution ladder. Forcing sequential CPU offload...")
    try:
        if hasattr(pipe, "enable_sequential_cpu_offload"):
            pipe.enable_sequential_cpu_offload()
            
        # Try at the smallest resolution
        kwargs = _resize_kwargs(original_kwargs, 384)
        return func(**kwargs)
        
    except RuntimeError as e:
        if "out of memory" in str(e).lower() or "oom" in str(e).lower():
            logger.error("[OOM Ladder] CUDA OOM even after sequential CPU offload. Exhausted all options.")
            raise RuntimeError("OOM_EXHAUSTED") from e
        else:
            raise e
            

def _resize_kwargs(original_kwargs: dict, max_size: int) -> dict:
    """
    Helper to resize `image` and `mask_image` in kwargs to ensure their
    longest edge is `max_size`, maintaining aspect ratio.
    """
    kwargs = original_kwargs.copy()
    from PIL import Image
    
    for key in ["image", "mask_image"]:
        if key in kwargs and isinstance(kwargs[key], Image.Image):
            img = kwargs[key]
            w, h = img.size
            if max(w, h) > max_size:
                ratio = max_size / max(w, h)
                new_w, new_h = int(w * ratio), int(h * ratio)
                # SD requires dimensions to be multiples of 8
                new_w = (new_w // 8) * 8
                new_h = (new_h // 8) * 8
                kwargs[key] = img.resize((new_w, new_h), Image.LANCZOS)
                
    return kwargs
