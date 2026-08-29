"""
ModelManager — centralized lifecycle wrapper for all local AI models.

Enforces the invariant: at most ONE model key resident in VRAM at any time.
Delegates to the existing get_*/unload_* functions — does not replace them.

Usage:
    with model_manager.using(ModelKey.RMBG):
        result = remove_background(image_bytes, mime)
"""
import gc
import logging
import torch
from contextlib import contextmanager
from enum import Enum
from typing import Optional

logger = logging.getLogger(__name__)


class ModelKey(str, Enum):
    RMBG = "RMBG"
    SD_INPAINT = "SD_INPAINT"
    WHISPER = "WHISPER"
    LLM_TEXT = "LLM_TEXT"


class ModelManager:
    def __init__(self):
        self._resident: Optional[ModelKey] = None

    # ── Internal helpers ──────────────────────────────────────────────

    def _unload(self, key: ModelKey):
        """Call the appropriate unload function for a key."""
        try:
            if key == ModelKey.RMBG:
                from app.services.rmbg_enhance import unload_rmbg_pipeline
                unload_rmbg_pipeline()
            elif key == ModelKey.SD_INPAINT:
                from app.services.sd_inpainting import unload_sd_pipeline
                unload_sd_pipeline()
            elif key == ModelKey.WHISPER:
                from app.services.voice_stt import unload_whisper_model
                unload_whisper_model()
            elif key == ModelKey.LLM_TEXT:
                from app.services.llm_prompt import unload_llm_pipeline
                unload_llm_pipeline()
        except Exception as e:
            logger.warning(f"[ModelManager] Error unloading {key}: {e}")

    def _cleanup(self):
        """Release GPU memory after unload."""
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            torch.cuda.synchronize()

    # ── Public API ────────────────────────────────────────────────────

    def acquire(self, key: ModelKey):
        """
        Ensure `key` is the only model resident. If a different model is
        currently loaded, unload it first.
        """
        if self._resident == key:
            return  # already resident, nothing to do
        if self._resident is not None:
            logger.info(f"[ModelManager] Evicting {self._resident} to load {key}")
            self._unload(self._resident)
            self._cleanup()
        self._resident = key
        logger.info(f"[ModelManager] Acquired slot for {key}")

    def release(self, key: ModelKey):
        """Unload `key` and free VRAM."""
        if self._resident != key:
            return
        logger.info(f"[ModelManager] Releasing {key}")
        self._unload(key)
        self._cleanup()
        self._resident = None

    def release_all(self):
        """Unload whatever model is resident."""
        if self._resident is not None:
            self.release(self._resident)

    def vram_report(self) -> dict:
        """Return current VRAM usage and resident model."""
        report = {"resident_model": self._resident}
        if torch.cuda.is_available():
            props = torch.cuda.get_device_properties(0)
            allocated = torch.cuda.memory_allocated(0)
            reserved = torch.cuda.memory_reserved(0)
            total = props.total_memory
            report.update({
                "gpu_name": props.name,
                "vram_total_mb": round(total / 1024 / 1024, 1),
                "vram_allocated_mb": round(allocated / 1024 / 1024, 1),
                "vram_reserved_mb": round(reserved / 1024 / 1024, 1),
                "vram_free_mb": round((total - reserved) / 1024 / 1024, 1),
            })
        else:
            report["gpu_name"] = "CPU only"
        return report

    @contextmanager
    def using(self, key: ModelKey):
        """
        Context manager: acquire → yield → release → cleanup.

        Example:
            with model_manager.using(ModelKey.RMBG):
                result = remove_background(img_bytes, mime)
        """
        self.acquire(key)
        try:
            yield
        finally:
            self.release(key)


# Singleton instance used throughout the backend
model_manager = ModelManager()
