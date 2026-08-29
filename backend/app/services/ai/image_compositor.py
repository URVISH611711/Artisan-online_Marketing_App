"""
image_compositor.py — background compositing and CLEAN_WHITE generation.

All compositing passes through here so SD-generated plates and the
simple white-background path share identical product-pasting logic.

Product pixels are NEVER modified — only the background layer changes.
"""
import io
import logging
from typing import Tuple

from PIL import Image, ImageFilter

logger = logging.getLogger(__name__)

# Try to import opencv for high-quality blur; fall back to Pillow.
try:
    import cv2
    import numpy as np
    _HAS_CV2 = True
except ImportError:
    _HAS_CV2 = False
    logger.warning("[Compositor] opencv not available — using Pillow blur fallback")


def split_cutout(transparent_png: bytes) -> Tuple[Image.Image, Image.Image]:
    """
    Split a transparent PNG into:
      - cutout  : RGBA image with product pixels intact
      - mask    : L-mode image (255=product, 0=background)

    Raises ValueError if the input is not RGBA or if the alpha channel
    is degenerate (all-zero or all-255 — indicates RMBG returned a bad mask).
    """
    img = Image.open(io.BytesIO(transparent_png)).convert("RGBA")
    r, g, b, a = img.split()

    # Validate alpha channel
    alpha_arr = list(a.getdata())
    unique = set(alpha_arr)
    if unique == {0}:
        raise ValueError(
            "RMBG produced a fully-transparent mask (alpha all-zero). "
            "The model may have returned a grayscale mask instead of RGBA — "
            "check rmbg_enhance.py output handling."
        )
    if unique == {255}:
        raise ValueError(
            "RMBG produced a fully-opaque mask (alpha all-255). "
            "Background was not removed — check RMBG model output."
        )

    mask = a.convert("L")
    return img, mask


def make_contact_shadow(
    mask: Image.Image,
    light_dir: str = "top-left",
    blur_radius: int = 18,
    opacity: float = 0.35,
    squash: float = 0.18,
) -> Image.Image:
    """
    Generate a soft contact shadow RGBA image the same size as `mask`.

    Parameters
    ----------
    mask        : L-mode product mask (255 = product pixels)
    light_dir   : "top-left" | "top" | "top-right" | "none"
    blur_radius : Gaussian blur radius in pixels
    opacity     : shadow opacity 0–1
    squash      : vertical squash factor (0.18 = shadow is 18% of product height)
    """
    w, h = mask.size

    # Squash mask downward
    shadow_h = max(1, int(h * squash))
    squashed = mask.resize((w, shadow_h), Image.LANCZOS)

    # Offset direction
    offsets = {
        "top-left": (8, 4),
        "top": (0, 6),
        "top-right": (-8, 4),
        "none": (0, 0),
    }
    ox, oy = offsets.get(light_dir, (8, 4))

    # Paste squashed shadow at bottom of a full-size canvas, with offset
    shadow_canvas = Image.new("L", (w, h), 0)
    paste_y = h - shadow_h + oy
    paste_x = ox
    shadow_canvas.paste(squashed, (paste_x, paste_y))

    # Blur
    if _HAS_CV2:
        arr = np.array(shadow_canvas)
        ksize = blur_radius * 2 + 1
        arr = cv2.GaussianBlur(arr, (ksize, ksize), 0)
        shadow_canvas = Image.fromarray(arr, mode="L")
    else:
        shadow_canvas = shadow_canvas.filter(ImageFilter.GaussianBlur(radius=blur_radius))

    # Convert to RGBA with opacity
    alpha_val = int(255 * opacity)
    shadow_rgba = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    shadow_rgba.paste((0, 0, 0, alpha_val), mask=shadow_canvas)
    return shadow_rgba


def composite(
    background: Image.Image,
    cutout: Image.Image,
    mask: Image.Image,
    *,
    shadow: bool = True,
    light_dir: str = "top-left",
) -> Image.Image:
    """
    Paste `cutout` (RGBA) onto `background` (RGB), optionally with a shadow.

    Product pixels are bit-identical to the RMBG cutout — only the
    background layer changes.
    """
    bg = background.convert("RGBA").resize(cutout.size, Image.LANCZOS)

    if shadow:
        shadow_layer = make_contact_shadow(mask, light_dir=light_dir)
        bg = Image.alpha_composite(bg, shadow_layer)

    bg = Image.alpha_composite(bg, cutout)
    return bg.convert("RGB")


def clean_white(
    cutout: Image.Image,
    mask: Image.Image,
    *,
    pad: float = 0.08,
    shadow: bool = True,
    light_dir: str = "top-left",
) -> bytes:
    """
    Generate a CLEAN_WHITE result: product on pure white with a contact shadow.
    No Stable Diffusion is used — this mode must NEVER load SD.

    Returns JPEG bytes of the final composite.
    """
    w, h = cutout.size
    pad_px = int(max(w, h) * pad)

    # Padded canvas
    canvas_w = w + pad_px * 2
    canvas_h = h + pad_px * 2
    background = Image.new("RGB", (canvas_w, canvas_h), (255, 255, 255))

    # Resize cutout+mask to fit in padded canvas
    cutout_r = cutout.resize((w, h), Image.LANCZOS)
    mask_r = mask.resize((w, h), Image.LANCZOS)

    # Paste product onto full canvas
    full_cutout = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    full_cutout.paste(cutout_r, (pad_px, pad_px))

    full_mask = Image.new("L", (canvas_w, canvas_h), 0)
    full_mask.paste(mask_r, (pad_px, pad_px))

    result = composite(background, full_cutout, full_mask, shadow=shadow, light_dir=light_dir)

    buf = io.BytesIO()
    result.save(buf, format="JPEG", quality=95)
    return buf.getvalue()
