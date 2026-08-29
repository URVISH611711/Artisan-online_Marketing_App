import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Warm in-process cache keyed by job_id
_artifact_cache: Dict[str, Dict[str, Any]] = {}


def store_artifacts(job_id: str, artifacts: Dict[str, Any]):
    """
    Store artifacts in the warm cache for fast regeneration.
    Expected keys: 'transparent_bytes', 'sd_prompt', 'sd_negative'
    """
    _artifact_cache[job_id] = artifacts
    logger.info(f"[ArtifactCache] Stored artifacts for job {job_id}")


def get_artifacts(job_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve warm artifacts for a job.
    """
    artifacts = _artifact_cache.get(job_id)
    if artifacts:
        logger.info(f"[ArtifactCache] Cache HIT for job {job_id}")
    else:
        logger.info(f"[ArtifactCache] Cache MISS for job {job_id}")
    return artifacts


def clear_artifacts(job_id: str):
    """
    Clear artifacts from the warm cache.
    """
    if job_id in _artifact_cache:
        del _artifact_cache[job_id]
        logger.info(f"[ArtifactCache] Cleared artifacts for job {job_id}")
