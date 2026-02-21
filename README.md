# Virtual Try-On Application
## Restructured as React+Vite Frontend & FastAPI Backend

A modern virtual try-on application with real-time pose detection for trying on different shirt styles using your device camera.

### Project Structure

```
Try-on Project/
├── frontend/                 # React + Vite application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .gitignore
│
├── backend/                  # FastAPI application
│   ├── main.py             # FastAPI app
│   ├── config.py           # Configuration
│   ├── models.py           # Database models
│   ├── requirements.txt
│   ├── shirts/             # Shirt image assets
│   ├── screenshots/        # Saved user screenshots
│   ├── uploads/            # Temporary uploads
│   └── .gitignore
│
└── README.md
```

## Quick Start

### Frontend Setup (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

The frontend will run at `http://localhost:5173` and proxies API calls to the backend.

### Backend Setup (FastAPI)

```bash
cd backend
pip install -r requirements.txt
python main.py
```

The backend will run at `http://localhost:8000`

## Features

### Frontend (React + Vite)
- ✅ Real-time camera feed integration
- ✅ MediaPipe Pose detection for body tracking
- ✅ Dynamic shirt overlay positioning
- ✅ Smooth animations and transitions
- ✅ Mobile-responsive design
- ✅ Touch-optimized controls
- ✅ Screenshot functionality

### Backend (FastAPI)
- ✅ Static file serving for shirt images
- ✅ Screenshot saving with UUID-based naming
- ✅ Image processing API (enhancement, brightness)
- ✅ CORS configured for cross-origin requests
- ✅ Health check endpoint
- ✅ Screenshot listing and retrieval
- ✅ Database models ready (SQLAlchemy)

## API Documentation

### Screenshots
- **POST** `/api/screenshot` - Save screenshot
- **GET** `/api/screenshots` - List all screenshots

### Image Processing
- **POST** `/api/process-image` - Apply filters/enhancement to image

### Static Files
- **GET** `/api/shirts/{shirt_name}` - Get shirt image

### Health
- **GET** `/health` - Backend health check

## Technology Stack

### Frontend
- React 18
- Vite 5
- MediaPipe Pose
- Axios for API calls

### Backend
- FastAPI
- Uvicorn
- Pillow for image processing
- SQLAlchemy for database (optional)

## Mobile Deployment (Netlify)

### Frontend
1. Connect frontend folder to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Set environment variable for API URL: `VITE_API_URL=your-api-domain.com`

### Backend
Deploy to:
- Heroku
- Railway
- PythonAnywhere
- AWS Lambda
- DigitalOcean

## Configuration Files

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000
```

### Backend (config.py)
- Adjust `ALLOWED_ORIGINS` for production
- Configure `MAX_FILE_SIZE` for uploads
- Modify image processing settings as needed

## Performance Notes

- Pose detection uses `modelComplexity: 1` (balanced performance)
- Shirt smoothing uses exponential moving average
- Canvas renders at full device resolution
- Optimized for mobile devices

## Future Enhancements

- [ ] User authentication
- [ ] Shirt catalog database
- [ ] Social sharing (Instagram, TikTok)
- [ ] Multiple users comparison
- [ ] Advanced body measurements
- [ ] AR effects and filters
- [ ] Video recording
- [ ] Database integration for user history

## Troubleshooting

### Camera not opening
- Check browser permissions
- Ensure HTTPS on production
- Use fallback front camera for mobile

### Poor pose detection
- Ensure adequate lighting
- Keep full body visible
- Try adjusting `minDetectionConfidence`

### Shirt not appearing
- Verify shirt files in `backend/shirts/`
- Check image format (PNG with transparency recommended)
- Verify API connection between frontend and backend

## License

MIT
