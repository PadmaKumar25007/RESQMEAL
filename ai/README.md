# ResQMeal AI Service (YOLO Food Recognition)

Python + FastAPI + Ultralytics YOLO food recognition service.

## Setup

1. Install Python dependencies:

```bash
pip install -r requirements.txt
```

2. Download the YOLO model weights (cached locally on first run):

```bash
python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
```

Or simply let the service download automatically on startup.

3. Start the service:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Endpoints

### GET /health

Returns service health and model status.

```json
{ "status": "ok", "service": "resqmeal-food-ai", "model": "yolov8n.pt", "confidence_threshold": 0.25 }
```

### POST /predict

Accepts JSON body:

```json
{
  "imageBase64": "<base64 encoded image>",
  "mimeType": "image/jpeg",
  "filename": "food.jpg"
}
```

Returns detected food label(s), confidence scores and bounding boxes (normalized coordinates):

```json
{
  "success": true,
  "detected": true,
  "food": "sandwich",
  "confidence": 0.87,
  "bbox": { "x": 0.2, "y": 0.3, "width": 0.4, "height": 0.5 },
  "detections": [
    { "label": "sandwich", "confidence": 0.87, "bbox": { "x": 0.2, "y": 0.3, "width": 0.4, "height": 0.5 } }
  ],
  "message": "Food detected successfully"
}
```

If nothing supported is detected:

```json
{
  "success": true,
  "detected": false,
  "detections": [],
  "message": "No supported food items were detected in this image. Try a clearer photo of the food."
}
```

Errors (invalid base64 / corrupt image / inference failure) return non-2xx with a clear message.

## Configuration

- `YOLO_MODEL_PATH` — path to YOLO weights (default `yolov8n.pt`)
- `YOLO_CONFIDENCE_THRESHOLD` — minimum confidence for detections (default `0.25`)
- `PORT` — service port (default `8000`)

## Notes

- Uses real YOLO inference via Ultralytics (`yolov8n.pt` pretrained on COCO).
- Detections are filtered to food-related labels.
- Model is loaded once at startup and reused for every request.
