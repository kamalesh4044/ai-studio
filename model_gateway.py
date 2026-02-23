import base64
import io
import os
from typing import List, Optional

import torch
from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer
from diffusers import StableDiffusionXLPipeline


# Defaults chosen for good quality vs. speed trade-off.
CHAT_MODEL_NAME = os.environ.get("CHAT_MODEL", "Qwen/Qwen2.5-3B-Instruct")
IMAGE_MODEL_NAME = os.environ.get("IMAGE_MODEL", "stabilityai/sdxl-turbo")

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
DTYPE = torch.float16 if DEVICE == "cuda" else torch.float32

print(f"[gateway] Using device={DEVICE}, dtype={DTYPE}")
print(f"[gateway] Loading chat model: {CHAT_MODEL_NAME}")
tokenizer = AutoTokenizer.from_pretrained(CHAT_MODEL_NAME, trust_remote_code=True)
chat_model = AutoModelForCausalLM.from_pretrained(
    CHAT_MODEL_NAME,
    trust_remote_code=True,
    torch_dtype=DTYPE,
    device_map="auto" if DEVICE == "cuda" else None,
)
if DEVICE != "cuda":
    chat_model = chat_model.to(DEVICE)
chat_model.eval()

print(f"[gateway] Loading image model: {IMAGE_MODEL_NAME}")
if DEVICE == "cuda":
    image_pipe = StableDiffusionXLPipeline.from_pretrained(
        IMAGE_MODEL_NAME,
        torch_dtype=torch.float16,
        variant="fp16",
    ).to("cuda")
else:
    image_pipe = StableDiffusionXLPipeline.from_pretrained(
        IMAGE_MODEL_NAME,
        torch_dtype=torch.float32,
    ).to("cpu")

image_pipe.set_progress_bar_config(disable=True)
if DEVICE == "cuda":
    image_pipe.enable_attention_slicing()


app = FastAPI(title="AI Studio Local Gateway")


class Msg(BaseModel):
    role: str
    content: str


class ChatReq(BaseModel):
    messages: List[Msg]
    model: Optional[str] = None
    max_tokens: int = 512
    temperature: float = 0.7


class ImgReq(BaseModel):
    prompt: str
    steps: int = 4
    model: Optional[str] = None


@app.get("/health")
def health():
    return {
        "ok": True,
        "device": DEVICE,
        "chat_model": CHAT_MODEL_NAME,
        "image_model": IMAGE_MODEL_NAME,
    }


@app.post("/chat")
def chat(req: ChatReq):
    messages = [{"role": m.role, "content": m.content} for m in req.messages]

    if hasattr(tokenizer, "apply_chat_template"):
        prompt = tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
    else:
        prompt = "\n".join([f"{m['role']}: {m['content']}" for m in messages]) + "\nassistant:"

    inputs = tokenizer(prompt, return_tensors="pt")
    inputs = {k: v.to(chat_model.device) for k, v in inputs.items()}

    with torch.no_grad():
        output = chat_model.generate(
            **inputs,
            max_new_tokens=min(max(req.max_tokens, 64), 1024),
            do_sample=True,
            temperature=max(req.temperature, 0.1),
            top_p=0.9,
            pad_token_id=tokenizer.eos_token_id,
        )

    new_tokens = output[0][inputs["input_ids"].shape[1] :]
    text = tokenizer.decode(new_tokens, skip_special_tokens=True).strip()
    return {"text": text}


@app.post("/generate-image")
def generate_image(req: ImgReq):
    result = image_pipe(
        prompt=req.prompt,
        num_inference_steps=max(1, min(req.steps, 8)),
        guidance_scale=0.0,
    )
    image = result.images[0]
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return {"image": f"data:image/png;base64,{b64}"}

