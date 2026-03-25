"""
Plant Health AI — Flask ML Server
Primary model : HuggingFace MobileNetV2ForImageClassification
Secondary model: torchvision MobileNetV2 (plain .pth state dict)
Both models run in parallel on POST /predict.
"""

import io
import base64
import time
import logging
from concurrent.futures import ThreadPoolExecutor

import torch
import torch.nn as nn
import torchvision.models as tv_models
import torchvision.transforms as transforms
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import MobileNetV2ForImageClassification, MobileNetV2ImageProcessor

from class_labels import CLASS_LABELS

# ─── Config ───────────────────────────────────────────────────────────────────

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
NUM_CLASSES = len(CLASS_LABELS)  # 38

HF_MODEL_PATH = "../models/mobilenet_v2_1.0_224-plant-disease-identification"
TV_MODEL_PATH = "../models/mobilenetv2_plant.pth"

# ─── Torchvision transform (ImageNet normalisation) ───────────────────────────

TV_TRANSFORM = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225]),
])

# ─── Load primary model (HuggingFace) ─────────────────────────────────────────

log.info("Loading primary model (HuggingFace MobileNetV2) from %s …", HF_MODEL_PATH)
try:
    hf_processor = MobileNetV2ImageProcessor.from_pretrained(HF_MODEL_PATH, local_files_only=True)
    hf_model = MobileNetV2ForImageClassification.from_pretrained(
        HF_MODEL_PATH, local_files_only=True
    )
    hf_model.to(DEVICE).eval()
    PRIMARY_OK = True
    log.info("Primary model loaded successfully on %s.", DEVICE)
except Exception as _exc:
    log.error("Primary model (HuggingFace) failed to load: %s", _exc)
    hf_processor = None
    hf_model = None
    PRIMARY_OK = False

# ─── Load secondary model (torchvision) ───────────────────────────────────────

log.info("Loading secondary model (torchvision MobileNetV2) from %s …", TV_MODEL_PATH)
try:
    _tv_model = tv_models.mobilenet_v2(weights=None)
    _tv_model.classifier[1] = nn.Linear(_tv_model.last_channel, NUM_CLASSES)
    _state = torch.load(TV_MODEL_PATH, map_location=DEVICE, weights_only=False)

    # Support plain state_dict OR wrapped checkpoints
    if isinstance(_state, dict):
        _sd = _state.get("model_state_dict", _state.get("state_dict", _state))
        # Strip DataParallel "module." prefix if present
        _sd = {k.replace("module.", ""): v for k, v in _sd.items()}
        _tv_model.load_state_dict(_sd, strict=False)
    else:
        _tv_model = _state  # full model object saved directly

    _tv_model.to(DEVICE).eval()
    tv_model = _tv_model
    SECONDARY_OK = True
    log.info("Secondary model loaded successfully on %s.", DEVICE)
except Exception as _exc:
    log.error("Secondary model (torchvision) failed to load: %s", _exc)
    tv_model = None
    SECONDARY_OK = False

log.info(
    "Model loading complete — primary=%s  secondary=%s  device=%s",
    PRIMARY_OK, SECONDARY_OK, DEVICE,
)

# ─── Flask app ────────────────────────────────────────────────────────────────

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])
executor = ThreadPoolExecutor(max_workers=2)


# ─── Inference helpers ────────────────────────────────────────────────────────

def run_hf_inference(pil_image: Image.Image) -> dict:
    """Run the HuggingFace MobileNetV2 model and return label + confidence."""
    inputs = hf_processor(images=pil_image, return_tensors="pt")
    inputs = {k: v.to(DEVICE) for k, v in inputs.items()}
    with torch.no_grad():
        logits = hf_model(**inputs).logits
    probs = torch.softmax(logits, dim=1)[0]
    conf, idx = torch.max(probs, dim=0)
    label = hf_model.config.id2label[idx.item()]  # already human-readable
    return {"label": label, "confidence": round(conf.item(), 4)}


def run_tv_inference(pil_image: Image.Image) -> dict:
    """Run the torchvision MobileNetV2 model and return label + confidence."""
    tensor = TV_TRANSFORM(pil_image).unsqueeze(0).to(DEVICE)
    with torch.no_grad():
        logits = tv_model(tensor)
    probs = torch.softmax(logits, dim=1)[0]
    conf, idx = torch.max(probs, dim=0)
    label = CLASS_LABELS[idx.item()]
    return {"label": label, "confidence": round(conf.item(), 4)}


def decode_image(request_obj) -> Image.Image:
    """Accept multipart/form-data file upload OR JSON { image: base64 }."""
    if "image" in request_obj.files:
        return Image.open(request_obj.files["image"].stream).convert("RGB")

    data = request_obj.get_json(force=True, silent=True) or {}
    b64 = data.get("image", "")
    if not b64:
        raise ValueError("No image data found in request.")
    if b64.startswith("data:"):
        b64 = b64.split(",", 1)[1]
    return Image.open(io.BytesIO(base64.b64decode(b64))).convert("RGB")


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return jsonify({
        "status": "ok",
        "primary_loaded": PRIMARY_OK,
        "secondary_loaded": SECONDARY_OK,
        "device": str(DEVICE),
    })


@app.post("/predict")
def predict():
    t0 = time.perf_counter()

    # Decode image
    try:
        img = decode_image(request)
    except Exception as exc:
        return jsonify({"error": f"Could not decode image: {exc}"}), 400

    # Submit both models to the thread pool in parallel
    future_primary = executor.submit(run_hf_inference, img) if PRIMARY_OK else None
    future_secondary = executor.submit(run_tv_inference, img) if SECONDARY_OK else None

    # Collect primary result — mandatory
    primary_result = None
    if future_primary is not None:
        try:
            primary_result = future_primary.result(timeout=60)
        except Exception as exc:
            log.error("Primary inference failed: %s", exc)

    if primary_result is None:
        return jsonify({"error": "Primary model failed to run inference."}), 500

    # Collect secondary result — optional
    secondary_result = None
    if future_secondary is not None:
        try:
            secondary_result = future_secondary.result(timeout=60)
        except Exception as exc:
            log.warning("Secondary inference failed (non-fatal): %s", exc)

    elapsed_ms = round((time.perf_counter() - t0) * 1000)

    response: dict = {
        "primary": primary_result,
        "inference_time_ms": elapsed_ms,
    }
    if secondary_result is not None:
        response["secondary"] = secondary_result

    return jsonify(response)


# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=False)
