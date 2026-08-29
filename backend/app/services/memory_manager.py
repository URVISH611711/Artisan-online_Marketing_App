"""
GPU Memory Manager to enforce single-model execution on 4GB VRAM devices.
"""
import logging
import gc
try:
    import torch
except ImportError:
    torch = None

logger = logging.getLogger(__name__)

class MemoryManager:
    """
    Manages GPU memory by ensuring only one heavy model is active at a time.
    Provides utility to clear CUDA cache between pipeline stages.
    """
    @staticmethod
    def cleanup():
        """Aggressively clear GPU VRAM and run garbage collection."""
        logger.info("[MemoryManager] Running garbage collection and CUDA cache clear...")
        gc.collect()
        if torch is not None and torch.cuda.is_available():
            torch.cuda.empty_cache()
            
            # Print memory stats for debugging
            allocated = torch.cuda.memory_allocated() / (1024**2)
            reserved = torch.cuda.memory_reserved() / (1024**2)
            logger.info(f"[MemoryManager] VRAM Allocated: {allocated:.2f} MB, Reserved: {reserved:.2f} MB")

    @staticmethod
    def offload_model(model_ref):
        """Helper to delete a model reference and cleanup memory."""
        if model_ref is not None:
            del model_ref
            MemoryManager.cleanup()
            
memory_manager = MemoryManager()
