"""List all Gemini models available for this API key and find ones that support image generation."""
from google import genai
import os
os.chdir(r"U:\a1\Artisan\backend")

from app.core.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)

print("=== ALL AVAILABLE MODELS ===")
for m in client.models.list():
    name = m.name
    # Check if it supports image output
    supported = getattr(m, 'supported_generation_methods', []) or []
    input_types = getattr(m, 'input_token_limit', 'N/A')
    print(f"  {name}")
    if hasattr(m, 'supported_generation_methods'):
        print(f"    methods: {m.supported_generation_methods}")
