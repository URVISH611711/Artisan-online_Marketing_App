from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "Artisan-AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/artisan_ai"

    # Security
    SECRET_KEY: str = "fallback_secret_key_for_development_only"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200

    # Supabase (for storage)
    SUPABASE_URL: Optional[str] = None
    SUPABASE_SERVICE_KEY: Optional[str] = None

    # Email / SMTP
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None

    # NVIDIA API (legacy — kept for reference)
    NVIDIA_API_KEY: Optional[str] = None

    # Gemini API (Google AI Studio)
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-3-flash-preview"

    # Local uploads fallback
    UPLOADS_DIR: str = "uploads"

    # ── Local AI settings ────────────────────────────────────────────
    # Directory containing manually-downloaded model weights (e.g. *.ckpt).
    # Relative paths are resolved from the CWD where uvicorn is started —
    # always launch from backend/ so this resolves correctly.
    MODEL_DIR: str = "models"

    # "auto" picks CUDA if available, else CPU. Override with "cuda" or "cpu".
    DEVICE: str = "auto"

    # Maximum edge length (px) before images are resized before SD inference.
    IMAGE_MAX_SIZE: int = 512

    # Maximum number of product images accepted per request.
    MAX_PRODUCT_IMAGES: int = 5

    # Stable Diffusion inference parameters.
    SD_STEPS: int = 20
    SD_GUIDANCE: float = 7.5

    # NVIDIA API key (legacy)
    NVIDIA_API_KEY: str = "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"

    # Gemini API key (primary AI vision provider)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3-flash-preview"

    # Whether to run Real-ESRGAN upscaling after compositing (CPU, slow).
    ENABLE_UPSCALE: bool = False

    # How long (seconds) the GPU lock file is considered valid before it can
    # be stolen by another process (handles crashes that leave a stale lock).
    GPU_LOCK_TTL: int = 300

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
