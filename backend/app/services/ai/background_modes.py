"""
background_modes.py — registry of all supported background modes.

Each mode maps to:
  - uses_diffusion : bool  — if False, SD must NEVER be loaded for this mode
  - prompt_template: str   — SD prompt template (unused when uses_diffusion=False)
  - light_dir      : str   — shadow light direction for image_compositor
  - surface        : str   — surface material hint for prompt
  - description    : str   — user-facing display text

Phase 2 implements CLEAN_WHITE only. All other modes are registered and
will route through the SD pipeline once Phase 4 is implemented.
"""
from dataclasses import dataclass
from enum import Enum
from typing import Optional


class BackgroundMode(str, Enum):
    CLEAN_WHITE = "CLEAN_WHITE"
    STUDIO_GREY = "STUDIO_GREY"
    NATURAL_LIGHT = "NATURAL_LIGHT"
    LIFESTYLE = "LIFESTYLE"
    OUTDOOR = "OUTDOOR"
    FESTIVE = "FESTIVE"
    CUSTOM = "CUSTOM"


@dataclass
class ModeConfig:
    uses_diffusion: bool
    prompt_template: str
    light_dir: str          # "top-left" | "top" | "top-right" | "none"
    surface: str
    description: str
    negative_prompt: str = (
        "text, watermark, logo, signature, low quality, blurry, "
        "distorted, ugly, deformed product, extra limbs"
    )


MODE_REGISTRY: dict[BackgroundMode, ModeConfig] = {
    BackgroundMode.CLEAN_WHITE: ModeConfig(
        uses_diffusion=False,
        prompt_template="",  # SD never invoked
        light_dir="top-left",
        surface="white seamless paper",
        description="Clean white studio background",
    ),
    BackgroundMode.STUDIO_GREY: ModeConfig(
        uses_diffusion=True,
        prompt_template=(
            "professional product photography, seamless grey gradient background, "
            "soft diffused studio lighting, {product_hint}, high-end commercial"
        ),
        light_dir="top",
        surface="grey seamless studio paper",
        description="Professional grey studio",
    ),
    BackgroundMode.NATURAL_LIGHT: ModeConfig(
        uses_diffusion=True,
        prompt_template=(
            "product photography on light wood surface, natural window light, "
            "bokeh background, warm tones, {product_hint}, lifestyle commercial"
        ),
        light_dir="top-left",
        surface="light wood",
        description="Natural window light",
    ),
    BackgroundMode.LIFESTYLE: ModeConfig(
        uses_diffusion=True,
        prompt_template=(
            "lifestyle product photography, cozy home interior, soft blurred background, "
            "{product_hint}, warm ambient lighting, editorial quality"
        ),
        light_dir="top",
        surface="interior surface",
        description="Lifestyle home setting",
    ),
    BackgroundMode.OUTDOOR: ModeConfig(
        uses_diffusion=True,
        prompt_template=(
            "outdoor product photography, natural outdoor setting, dappled sunlight, "
            "garden or market stall backdrop, {product_hint}, vibrant colors"
        ),
        light_dir="top-right",
        surface="natural outdoor",
        description="Outdoor natural setting",
    ),
    BackgroundMode.FESTIVE: ModeConfig(
        uses_diffusion=True,
        prompt_template=(
            "festive product photography, traditional Indian decor, diyas and flowers, "
            "rich warm colors, celebratory backdrop, {product_hint}, premium quality"
        ),
        light_dir="top-left",
        surface="decorative festive surface",
        description="Indian festive backdrop",
    ),
    BackgroundMode.CUSTOM: ModeConfig(
        uses_diffusion=True,
        prompt_template="{custom_prompt}, product photography, professional lighting, high quality",
        light_dir="top",
        surface="",
        description="Custom background prompt",
    ),
}


def get_mode(mode: BackgroundMode) -> ModeConfig:
    return MODE_REGISTRY[mode]


def build_prompt(mode: BackgroundMode, product_hint: str = "", custom_prompt: str = "") -> str:
    """Return the final SD prompt for a mode."""
    config = get_mode(mode)
    if not config.uses_diffusion:
        return ""
    tmpl = config.prompt_template
    return tmpl.format(product_hint=product_hint, custom_prompt=custom_prompt)
