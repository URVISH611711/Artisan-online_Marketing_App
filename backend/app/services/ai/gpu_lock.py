"""
Cross-process GPU mutex using a file-based lock.

Prevents the main backend (port 8000) and the vision sidecar (port 8001)
from loading models into VRAM simultaneously on the RTX 2050 (4 GB).

Features
--------
- Stale-lock recovery: if the holding PID is dead OR the timestamp
  exceeds GPU_LOCK_TTL seconds, the lock is stolen automatically.
- acquire(timeout) returns False on timeout instead of raising —
  callers should degrade gracefully rather than crash.
- Thread-safe within a single process via a threading.Lock on the file.

Usage
-----
    with gpu_lock("backend-RMBG"):
        result = remove_background(...)

    # or non-context:
    if gpu_lock.acquire("backend-SD", timeout=60):
        try:
            ...
        finally:
            gpu_lock.release()
"""
import json
import logging
import os
import sys
import tempfile
import time
import threading
from contextlib import contextmanager
from pathlib import Path
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

_LOCK_PATH = Path(tempfile.gettempdir()) / "artisan_gpu.lock"
_thread_lock = threading.Lock()


def _pid_alive(pid: int) -> bool:
    """Return True if the process with `pid` is running."""
    try:
        os.kill(pid, 0)
        return True
    except (OSError, ProcessLookupError):
        return False


def _read_lock() -> Optional[dict]:
    try:
        return json.loads(_LOCK_PATH.read_text())
    except Exception:
        return None


def _write_lock(owner: str):
    payload = {"pid": os.getpid(), "model": owner, "acquired_at": time.time()}
    _LOCK_PATH.write_text(json.dumps(payload))


def _is_stale(data: dict) -> bool:
    if not _pid_alive(data.get("pid", -1)):
        return True
    age = time.time() - data.get("acquired_at", 0)
    return age > settings.GPU_LOCK_TTL


class _GpuLock:
    def acquire(self, owner: str, timeout: int = 120) -> bool:
        """
        Try to acquire the GPU lock for `owner`.
        Returns True on success, False if timeout exceeded.
        """
        deadline = time.time() + timeout
        while time.time() < deadline:
            with _thread_lock:
                data = _read_lock()
                if data is None or _is_stale(data):
                    _write_lock(owner)
                    logger.info(f"[GpuLock] Acquired by {owner} (pid={os.getpid()})")
                    return True
                if data.get("pid") == os.getpid():
                    # This process already holds the lock
                    return True
            time.sleep(0.5)
        logger.warning(f"[GpuLock] Timeout waiting for lock (owner={owner})")
        return False

    def release(self):
        """Release the lock if held by this process."""
        with _thread_lock:
            data = _read_lock()
            if data and data.get("pid") == os.getpid():
                try:
                    _LOCK_PATH.unlink()
                    logger.info("[GpuLock] Released")
                except FileNotFoundError:
                    pass

    @contextmanager
    def __call__(self, owner: str, timeout: int = 120):
        """
        Context manager: acquire → yield → release.

        If acquisition fails (timeout), still yields but logs a warning.
        The caller continues — degradation is preferred over crashing.
        """
        acquired = self.acquire(owner, timeout=timeout)
        if not acquired:
            logger.warning(f"[GpuLock] Could not acquire lock for {owner} — proceeding anyway")
        try:
            yield acquired
        finally:
            if acquired:
                self.release()


# Singleton
gpu_lock = _GpuLock()
