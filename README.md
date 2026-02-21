# Virtual Try-On Application
## React + Vite Frontend & FastAPI Backend

A virtual try-on app with real-time pose detection that overlays clothing onto your live camera feed.

---

## Project Structure

```
Try-on Project/
├── frontend/                    # React 18 + Vite 5 app
│   ├── src/
│   │   ├── components/
│   │   │   ├── TryOnCanvas.jsx  # Core: camera, pose detection, clothing overlay
│   │   │   ├── TryOnCanvas.css
│   │   │   ├── Controls.jsx     # UI: shirt selector, upload, screenshot, debug
│   │   │   └── Controls.css
│   │   ├── api/
│   │   │   └── client.js        # API helper functions
│   │   ├── App.jsx              # Root: shirt upload logic, state management
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── netlify.toml
│   └── package.json
│
├── backend/                     # FastAPI app
│   ├── main.py                  # All API endpoints
│   ├── config.py                # Config constants
│   ├── models.py                # SQLAlchemy models (future use)
│   ├── requirements.txt
│   └── shirts/                  # Shirt PNG assets (served as static files)
│
└── README.md
```

---

## Quick Start

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173` — proxies API calls to the backend.

### Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
```

Runs at `http://localhost:8000`

---

## Features

### Frontend (React + Vite)
- **Real-time pose detection** via MediaPipe Pose (loaded from CDN)
- **Clothing overlay on canvas** — shirt drawn over the live video feed
- **3 clothing types**: Shirt, Pants, Jeans — each with independent scaling config
- **Shoulder-angle rotation** — overlay rotates to match body tilt
- **Exponential smoothing** (0.7/0.3 blend) on position and size for stable rendering
- **Custom shirt upload** — image sent to backend for background removal + cropping; returned proportions used to align the shirt to body landmarks
- **Preset shirts** — `shirt1.png`, `shirt2.png` fetched from backend
- **Screenshot** — canvas exported as PNG and saved via backend
- **Mobile-responsive** — fallback camera, touch-optimized controls, responsive layout

### Backend (FastAPI)
- Static file serving for shirt PNGs
- Custom shirt processing: white/light background removal + auto-crop
- Screenshot saving with UUID-based filenames
- Image enhancement endpoint (sharpness, brightness)
- Health check

---

## Clothing Type Configs

Defined in `TryOnCanvas.jsx`:

| Type   | Shoulder Scale | Length Ratio | Hip Spread | Start Y Offset |
|--------|---------------|--------------|------------|----------------|
| Shirt  | 1.4×          | 0.75         | 1.0×       | 15%            |
| Pants  | 1.1×          | 1.40         | 1.2×       | 28%            |
| Jeans  | 1.0×          | 1.45         | 1.15×      | 28%            |

---

## Custom Shirt Upload Pipeline

1. User selects an image via the **Upload Shirt** button
2. `App.jsx` reads the file as a Base64 Data URL
3. Sends to backend `POST /process-shirt`
4. Backend (PIL):
   - Converts image to RGBA
   - Makes white/light pixels transparent (R, G, B all > 200)
   - Crops to the bounding box of non-transparent pixels (+ 10px padding)
5. Backend returns the processed image + fixed `shirt_proportions` (relative neckline/shoulder positions)
6. `TryOnCanvas.jsx` uses the proportions to scale and align the shirt so its shoulder points match the detected body shoulder landmarks

---

## API Reference

Base URL: `http://localhost:8000` (dev) / `https://tryon-backend-ayjb.onrender.com` (prod)

> ⚠️ No `/api/` prefix — endpoints are at the root path.

| Method | Endpoint              | Description                                         |
|--------|-----------------------|-----------------------------------------------------|
| GET    | `/health`             | Health check                                        |
| GET    | `/shirts/{name}.png`  | Serve a preset shirt image                          |
| POST   | `/process-shirt`      | Remove background, crop, return proportions         |
| POST   | `/screenshot`         | Save a base64 PNG canvas image                      |
| GET    | `/screenshots`        | List all saved screenshots                          |
| POST   | `/process-image`      | Apply enhancement (sharpen / brightness) to image   |

### `POST /process-shirt` — Request/Response

**Request body:**
```json
{ "image": "data:image/png;base64,..." }
```

**Response:**
```json
{
  "status": "success",
  "image": "data:image/png;base64,...",
  "proportions": {
    "neckline_center":           { "x": 0.5,  "y": 0.12 },
    "left_shoulder":             { "x": 0.20, "y": 0.28 },
    "right_shoulder":            { "x": 0.80, "y": 0.28 },
    "shirt_width_at_shoulders":  0.60,
    "shirt_height_ratio":        0.75
  },
  "info": {
    "background_removed": true,
    "cropped": true,
    "original_dimensions": "600x800",
    "cropped_dimensions": "420x620",
    "processing_method": "PIL (lightweight)"
  }
}
```

---

## Tech Stack

| Layer            | Technology                       |
|------------------|----------------------------------|
| Frontend         | React 18, Vite 5, Axios          |
| Pose Detection   | MediaPipe Pose (CDN)             |
| Backend          | FastAPI, Uvicorn                 |
| Image Processing | Pillow (PIL), NumPy              |
| DB Models        | SQLAlchemy (defined, not active) |
| Frontend Deploy  | Netlify                          |
| Backend Deploy   | Render.com                       |

---

## Deployment

### Frontend (Netlify)
- Base directory: `frontend`
- Build command: `npm run build`
- Publish directory: `dist`
- Env var: `VITE_API_URL=https://tryon-backend-ayjb.onrender.com`

### Backend (Render.com)
- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

---

## Configuration

### Frontend (`netlify.toml` / `.env`)
```
VITE_API_URL=http://localhost:8000
```

### Backend (`config.py`)
- `MAX_FILE_SIZE` — max upload size (default 10MB)
- `ALLOWED_ORIGINS` — update for production domains
- `IMAGE_QUALITY` — PNG quality setting (default 95)

---

## Troubleshooting

| Issue | Fix |
|---|---|
| Camera not opening | Check browser permissions; use HTTPS in production |
| Poor pose detection | Ensure full upper body is in frame and well-lit; adjust `minDetectionConfidence` |
| Shirt not appearing | Check `backend/shirts/` for PNG files; verify backend is running |
| Custom shirt misaligned | Use a shirt image with a plain/white background for best background removal |
| Backend slow to respond | Render free tier spins down after 15 min inactivity — first request takes ~30s |

---

## Future Enhancements

- [ ] User authentication
- [ ] Shirt catalog database (SQLAlchemy models already defined)
- [ ] Improved background removal (non-white backgrounds)
- [ ] Social sharing
- [ ] Video recording
- [ ] Advanced body measurements

---

## License

MIT
