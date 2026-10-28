import base64
import io
import os
from typing import Optional

import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from ultralytics import YOLO
from PIL import Image
import numpy as np

app = FastAPI(
    title="ResQMeal Food Recognition",
    description="YOLO-based food image recognition service for ResQMeal.",
    version="1.0.0",
)

MODEL_PATH = os.environ.get("YOLO_MODEL_PATH", "yolov8n.pt")
CONFIDENCE_THRESHOLD = float(os.environ.get("YOLO_CONFIDENCE_THRESHOLD", "0.25"))

# Food-related labels we accept from the underlying COCO-classifier.
FOOD_KEYWORDS = [
    "pizza", "sandwich", "burger", "hot dog", "hotdog", "sandwich", "sandwhich",
    "donut", "doughnut", "cake", "cookie", "brownie", "ice cream", "icecream",
    "taco", "burrito", "salad", "salad", "bowl", "soup", "curry", "rice", "pasta",
    "noodle", "bread", "bun", "naan", "wrap", "tortilla", "wrap", "cheeseburger",
    "fries", "pretzel", "waffle", "pancake", "crepe", "omelette", "omelet", "stew",
    "chili", "casserole", "quiche", "meat", "chicken", "beef", "fish", "seafood",
    "vegetable", "veggie", "fruit", "fruit salad", "fruitcake", "kebab", "falafel",
    "hummus", "guacamole", "dip", "bruschetta", "pesto", "bbq", "barbecue", "grill",
    "leftovers", "leftover", "meal", "breakfast", "lunch", "dinner", "snack",
]

model = None


def get_model():
    global model
    if model is None:
        model = YOLO(MODEL_PATH)
    return model


class PredictRequest(BaseModel):
    imageBase64: str
    mimeType: str = "image/jpeg"
    filename: str = "food.jpg"


class Detection(BaseModel):
    label: str
    confidence: float
    bbox: dict


class PredictResponse(BaseModel):
    success: bool
    detected: bool
    food: Optional[str] = None
    confidence: Optional[float] = None
    bbox: Optional[dict] = None
    detections: list = []
    message: str = ""


def is_food_label(label: str) -> bool:
    normalized = label.lower().strip()
    for keyword in FOOD_KEYWORDS:
        if keyword in normalized:
            return True
    return normalized in {
        "pizza", "sandwich", "sandwhich", "sandwich", "sandwch", "burger", "hot dog", "hotdog",
        "donut", "doughnut", "cake", "cookie", "ice cream", "icecream", "taco", "burrito", "salad",
        "bowl", "soup", "curry", "rice", "pasta", "noodle", "bread", "bun", "naan", "wrap", "tortilla",
        "fries", "pretzel", "waffle", "pancake", "crepe", "omelette", "omelet", "stew", "chili",
        "casserole", "quiche", "chicken", "beef", "fish", "seafood", "vegetable", "veggie", "fruit",
        "kebab", "falafel", "hummus", "guacamole", "dip", "pesto", "meal", "breakfast", "lunch",
        "dinner", "snack", "milk", "cheese", "eggs", "egg", "butter", "cream", "yogurt", "yoghurt",
        "smoothie", "juice", "water", "bread", "tortilla", "muffin", "bagel", "croissant", "danishes",
    }
    return False


def run_inference(image_bytes: bytes) -> list:
    model = get_model()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    results = model.predict(source=np.array(image), conf=CONFIDENCE_THRESHOLD, verbose=False)
    detections = []
    for result in results:
        boxes = result.boxes
        if boxes is None or len(boxes) == 0:
            continue
        for box in boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            label = str(model.names[cls_id]) if hasattr(model, "names") else str(cls_id)
            if not is_food_label(label):
                continue
            xywh = box.xywh[0].tolist()
            xywhn = box.xywhn[0].tolist() if hasattr(box, "xywhn") and len(box.xywhn) > 0 else [c / (image.width if image.width else 1) for c in xywh]
            detections.append({
                "label": label.lower(),
                "confidence": conf,
                "bbox": {
                    "x": float(xywhn[0]),
                    "y": float(xywhn[1]),
                    "width": float(xywhn[2]),
                    "height": float(xywhn[3]),
                },
            })
    return detections


@app.on_event("startup")
def startup_event():
    get_model()
    print(f"✅ YOLO model loaded from {MODEL_PATH}")


@app.get("/health")
def health():
    return {"status": "ok", "service": "resqmeal-food-ai", "model": MODEL_PATH, "confidence_threshold": CONFIDENCE_THRESHOLD}


@app.post("/predict", response_model=PredictResponse)
async def predict(req: PredictRequest) -> PredictResponse:
    if not req.imageBase64:
        raise HTTPException(status_code=400, detail="imageBase64 is required")

    try:
        image_bytes = base64.b64decode(req.imageBase64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image data")

    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Corrupt or unsupported image file")

    if image.size[0] < 32 or image.size[1] < 32:
        raise HTTPException(status_code=400, detail="Image is too small to analyze")

    try:
        detections = run_inference(image_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model inference error: {str(e)}")

    if not detections:
        return PredictResponse(
            success=True,
            detected=False,
            detections=[],
            message="No supported food items were detected in this image. Try a clearer photo of the food.",
        )

    best = max(detections, key=lambda d: d["confidence"])
    return PredictResponse(
        success=True,
        detected=True,
        food=best["label"],
        confidence=best["confidence"],
        bbox=best["bbox"],
        detections=detections,
        message="Food detected successfully",
    )


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8000)), reload=False)
