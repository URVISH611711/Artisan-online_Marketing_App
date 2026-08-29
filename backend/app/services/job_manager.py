"""
Background job tracking for AI processing tasks.
"""
import uuid
import time
from typing import Dict, Any, Optional
from enum import Enum
from pydantic import BaseModel


class JobStatus(str, Enum):
    UPLOADING = "UPLOADING"
    ANALYZING_PRODUCT = "ANALYZING_PRODUCT"
    ANALYZING = "ANALYZING"
    REMOVING_BACKGROUND = "REMOVING_BACKGROUND"
    PRODUCT_ISOLATED = "PRODUCT_ISOLATED"
    GENERATING_BACKGROUND = "GENERATING_BACKGROUND"
    COMPOSITING_PRODUCT = "COMPOSITING_PRODUCT"
    UPSCALING = "UPSCALING"
    SAVING = "SAVING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class Job(BaseModel):
    id: str
    user_id: str = ""
    status: JobStatus
    progress: int = 0
    message: str = ""
    error: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    created_at: float
    updated_at: float


_jobs: Dict[str, Job] = {}

# Prune jobs older than this many seconds (1 hour)
_PRUNE_MAX_AGE = 3600


def prune_jobs(max_age: int = _PRUNE_MAX_AGE) -> int:
    """Remove terminal jobs older than max_age seconds. Returns count pruned."""
    now = time.time()
    terminal = {JobStatus.COMPLETED, JobStatus.FAILED}
    to_delete = [
        jid for jid, j in _jobs.items()
        if j.status in terminal and (now - j.updated_at) > max_age
    ]
    for jid in to_delete:
        del _jobs[jid]
    return len(to_delete)


def create_job(user_id: str = "") -> str:
    prune_jobs()
    job_id = str(uuid.uuid4())
    now = time.time()
    _jobs[job_id] = Job(
        id=job_id,
        user_id=user_id,
        status=JobStatus.UPLOADING,
        created_at=now,
        updated_at=now,
    )
    return job_id


def get_job(job_id: str) -> Optional[Job]:
    return _jobs.get(job_id)


def update_job(
    job_id: str,
    status: JobStatus,
    progress: int = 0,
    message: str = "",
    result: Dict = None,
    error: str = None,
):
    job = _jobs.get(job_id)
    if job:
        job.status = status
        job.progress = progress
        job.message = message
        job.updated_at = time.time()
        if result is not None:
            job.result = result
        if error is not None:
            job.error = error


def mark_job_failed(job_id: str, error: str):
    update_job(job_id, JobStatus.FAILED, progress=0, message="Failed", error=error)
