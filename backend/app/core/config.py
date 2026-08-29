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

    # Vision sidecar (Qwen2.5-VL — separate venv on port 8001).
    VISION_SERVICE_URL: str = "http://127.0.0.1:8001"
    VISION_TIMEOUT: int = 120  # seconds to wait for /analyze response

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
