# Artisan Vision Service

A standalone FastAPI service running on port 8001 that provides visual analysis of product images using the `SmolVLM-500M-Instruct` model.

## Why a separate service?
The primary backend (`backend/`) is locked to `transformers==4.39.3` to keep `diffusers==0.27.2` (and thus `sd_inpainting.py`) working without breaking due to `huggingface_hub` deprecated imports.

Vision-language models like SmolVLM and Qwen2.5-VL require newer versions of `transformers`. Running them in this separate virtual environment allows us to use the latest transformers version without breaking the main backend.

## Hardware Optimization
- The RTX 2050 has 4GB of VRAM.
- `SmolVLM-500M-Instruct` is incredibly lightweight and easily fits into VRAM at `bfloat16` precision without requiring 4-bit quantization.
- This service shares a file-based lock (`gpu_lock.py`) with the main backend to ensure only one heavy AI model is loaded into VRAM at a time.

## Endpoints
- `GET /health` - Check if the service is up.
- `POST /analyze` - Analyze an image and product details to return structured JSON.

## Running
```bash
# From within the vision_service directory
venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8001
```
