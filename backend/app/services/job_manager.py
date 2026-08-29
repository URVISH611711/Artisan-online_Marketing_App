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
    ANALYZING = "ANALYZING"
    REMOVING_BACKGROUND = "REMOVING_BACKGROUND"
    CREATING_BACKGROUND = "CREATING_BACKGROUND"
    COMPOSITING = "COMPOSITING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class Job(BaseModel):
    id: str
    status: JobStatus
    progress: int = 0
    message: str = ""
    error: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    created_at: float
    updated_at: float

_jobs: Dict[str, Job] = {}

def create_job() -> str:
    job_id = str(uuid.uuid4())
    now = time.time()
    _jobs[job_id] = Job(
        id=job_id,
        status=JobStatus.UPLOADING,
        created_at=now,
        updated_at=now
    )
    return job_id

def get_job(job_id: str) -> Optional[Job]:
    return _jobs.get(job_id)

def update_job(job_id: str, status: JobStatus, progress: int = 0, message: str = "", result: Dict = None, error: str = None):
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
