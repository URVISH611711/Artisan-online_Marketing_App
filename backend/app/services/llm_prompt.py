"""
Local Text LLM for understanding product details and generating Stable Diffusion prompts.
Uses a lightweight local model like Qwen2.5-0.5B-Instruct.
"""
import logging
import json
from app.services.memory_manager import memory_manager

logger = logging.getLogger(__name__)

_llm_pipe = None

def get_llm_pipeline():
    global _llm_pipe
    if _llm_pipe is None:
        logger.info("[LLM] Loading local text model Qwen/Qwen2.5-0.5B-Instruct...")
        from transformers import pipeline
        _llm_pipe = pipeline(
            "text-generation",
            model="Qwen/Qwen2.5-0.5B-Instruct",
            device_map="auto"
        )
        logger.info("[LLM] Text model loaded successfully.")
    return _llm_pipe

def unload_llm_pipeline():
    global _llm_pipe
    if _llm_pipe is not None:
        logger.info("[LLM] Unloading text model to free VRAM...")
        memory_manager.offload_model(_llm_pipe)
        _llm_pipe = None

def generate_sd_prompt(product_details: dict) -> dict:
    """
    Generate an SD prompt and negative prompt based on product details.
    """
    logger.info("[LLM] Generating prompt from product details...")
    
    product_desc = ", ".join([f"{k}: {v}" for k, v in product_details.items() if v])
    
    # Simple heuristic fallback if model fails
    default_prompt = f"Professional e-commerce product photography of {product_details.get('name', 'a product')}, placed naturally on a clean premium neutral studio surface, soft diffused lighting, subtle realistic contact shadow, elegant warm neutral environment, realistic materials, sharp product, clean composition. {product_desc}"
    default_negative = "distorted product, changed product shape, different product, extra objects, fake logo, text, watermark, oversaturated, blurry, floating product, unrealistic shadow, deformed object"
    
    try:
        pipe = get_llm_pipeline()
        
        system_msg = "You are a professional product photography prompt generator. Respond ONLY with a JSON object containing 'prompt' and 'negative_prompt'."
        user_msg = f"Generate a Stable Diffusion 1.5 prompt for this product: {product_desc}. Make the environment match the product's style."
        
        messages = [
            {"role": "system", "content": system_msg},
            {"role": "user", "content": user_msg},
        ]
        
        out = pipe(messages, max_new_tokens=200, return_full_text=False)
        text_out = out[0]['generated_text'].strip()
        
        # Try to parse JSON
        # Very brittle if model hallucinates, so we have a fallback
        if "```json" in text_out:
            text_out = text_out.split("```json")[1].split("```")[0].strip()
        
        parsed = json.loads(text_out)
        return {
            "prompt": parsed.get("prompt", default_prompt),
            "negative_prompt": parsed.get("negative_prompt", default_negative)
        }
    except Exception as e:
        logger.error(f"[LLM] Failed to generate prompt using LLM, using fallback: {e}")
        return {
            "prompt": default_prompt,
            "negative_prompt": default_negative
        }
