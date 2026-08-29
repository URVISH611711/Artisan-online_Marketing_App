import os
import torch
import time
import logging
from PIL import Image
from transformers import AutoProcessor, AutoModelForImageTextToText

logger = logging.getLogger(__name__)

model_id = os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend/models/SmolVLM-500M-Instruct"))
_processor = None
_model = None
_last_used = 0

def load_model():
    global _processor, _model, _last_used
    if _model is None:
        logger.info(f"Loading {model_id}...")
        _processor = AutoProcessor.from_pretrained(model_id)
        # Using bfloat16 to fit comfortably in 4GB VRAM
        _model = AutoModelForImageTextToText.from_pretrained(
            model_id,
            torch_dtype=torch.bfloat16,
            device_map="auto"
        )
        logger.info(f"{model_id} loaded successfully.")
    
    _last_used = time.time()
    return _processor, _model


def unload_model():
    global _processor, _model
    if _model is not None:
        logger.info(f"Unloading {model_id} to free VRAM...")
        del _model
        del _processor
        _model = None
        _processor = None
        
        import gc
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            torch.cuda.synchronize()


def get_last_used():
    return _last_used


def analyze_product(image: Image.Image, product_details: dict) -> str:
    """
    Given an image and user-provided details (which might be sparse),
    generate a comprehensive JSON analysis of the product.
    """
    global _last_used
    processor, model = load_model()
    _last_used = time.time()
    
    # We ask it to output JSON directly
    system_prompt = (
        "You are an expert e-commerce cataloger. Analyze the provided product image and "
        "user-provided details. Return a JSON object with strictly these keys: "
        "'name', 'description', 'material', 'color', 'style', 'key_features', 'target_customer'. "
        "For each field, incorporate user details if provided, otherwise infer visually. "
        "Never hallucinate facts you cannot see or know. Use 'null' if unsure. "
        "Return ONLY valid JSON."
    )
    
    user_context = (
        f"User provided details: Name={product_details.get('name', 'Unknown')}, "
        f"Material={product_details.get('material', 'Unknown')}, "
        f"Color={product_details.get('color', 'Unknown')}, "
        f"Craft={product_details.get('craft_type', 'Unknown')}, "
        f"Style={product_details.get('style', 'Unknown')}"
    )

    messages = [
        {
            "role": "user",
            "content": [
                {"type": "image"},
                {"type": "text", "text": f"{system_prompt}\n\n{user_context}"}
            ]
        }
    ]
    
    prompt = processor.apply_chat_template(messages, add_generation_prompt=True)
    inputs = processor(text=prompt, images=[image], return_tensors="pt")
    inputs = inputs.to(model.device)
    
    generated_ids = model.generate(**inputs, max_new_tokens=500)
    
    # The output includes the prompt, so we must slice it out
    generated_ids_trimmed = [
        out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
    ]
    
    generated_text = processor.batch_decode(
        generated_ids_trimmed,
        skip_special_tokens=True,
    )[0]
    
    return generated_text.strip()
