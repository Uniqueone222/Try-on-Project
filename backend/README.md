# Virtual Try-On Backend - API Documentation

## Setup Instructions

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the Backend
```bash
python main.py
```

The backend will start at `http://localhost:8000`

### 3. API Endpoints

#### Health Check
- **GET** `/health` - Check if backend is running

#### Screenshot Management
- **POST** `/screenshot` - Save screenshot from canvas
  - Payload: `{"image": "data:image/png;base64,..."}`
  - Returns: `{filename, url, timestamp}`

- **GET** `/screenshots` - List all saved screenshots

#### Image Processing
- **POST** `/process-image` - Process image with filters
  - Payload: `{"image": "data:image/png;base64,...", "type": "enhance|brightness"}`
  - Returns: `{processed image as base64}`

#### Static Files
- **GET** `/shirts/{shirt_name}` - Get shirt image
  - Example: `/shirts/shirt1.png`

### 4. Directory Structure

```
backend/
├── main.py              # FastAPI application
├── config.py            # Configuration settings
├── models.py            # Database models
├── requirements.txt     # Python dependencies
├── shirts/              # Shirt image assets
├── screenshots/         # Saved user screenshots
└── uploads/             # Temporary uploads
```

### 5. Features

- ✅ Screenshot saving with UUID-based naming
- ✅ Image processing (enhancement, brightness adjustment)
- ✅ Static file serving for shirt images
- ✅ CORS configured for frontend communication
- ✅ Comprehensive error handling
- ✅ Database models ready (SQLAlchemy)

### 6. Future Enhancements

- Database integration for user data
- Advanced image processing (filters, effects)
- Shirt catalog management
- User authentication
- Analytics tracking
