import json
import logging
import os
import time
import threading
import tempfile
from contextlib import contextmanager
from pathlib import Path

logger = logging.getLogger(__name__)

_LOCK_PATH = Path(tempfile.gettempdir()) / "artisan_gpu.lock"
_thread_lock = threading.Lock()

# 5 minutes TTL
GPU_LOCK_TTL = 300


def _pid_alive(pid: int) -> bool:
    try:
        os.kill(pid, 0)
        return True
    except (OSError, ProcessLookupError):
        return False


def _read_lock() -> dict | None:
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
    return age > GPU_LOCK_TTL


class _GpuLock:
    def acquire(self, owner: str, timeout: int = 120) -> bool:
        deadline = time.time() + timeout
        while time.time() < deadline:
            with _thread_lock:
                data = _read_lock()
                if data is None or _is_stale(data):
                    _write_lock(owner)
                    logger.info(f"[GpuLock] Acquired by {owner} (pid={os.getpid()})")
                    return True
                if data.get("pid") == os.getpid():
                    return True
            time.sleep(0.5)
        logger.warning(f"[GpuLock] Timeout waiting for lock (owner={owner})")
        return False

    def release(self):
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
        acquired = self.acquire(owner, timeout=timeout)
        if not acquired:
            logger.warning(f"[GpuLock] Could not acquire lock for {owner} — proceeding anyway")
        try:
            yield acquired
        finally:
            if acquired:
                self.release()

gpu_lock = _GpuLock()
