from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from datetime import datetime
import base64
from PIL import Image
from io import BytesIO
import uuid

app = FastAPI(title="Virtual Try-On Backend")

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create directories for images
SCREENSHOT_DIR = "screenshots"
SHIRT_DIR = "shirts"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)
os.makedirs(SHIRT_DIR, exist_ok=True)

# Serve static files
app.mount("/shirts", StaticFiles(directory=SHIRT_DIR), name="shirts")
app.mount("/screenshots", StaticFiles(directory=SCREENSHOT_DIR), name="screenshots")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "Virtual Try-On Backend"}


@app.post("/screenshot")
async def save_screenshot(payload: dict):
    """Save screenshot from canvas as image file"""
    try:
        # Extract base64 image data
        image_data = payload.get('image', '')
        
        if not image_data.startswith('data:image/png;base64,'):
            return JSONResponse(
                status_code=400,
                content={"error": "Invalid image format"}
            )
        
        # Decode base64
        base64_str = image_data.split(',')[1]
        image_bytes = base64.b64decode(base64_str)
        
        # Save image
        filename = f"screenshot_{uuid.uuid4().hex}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
        filepath = os.path.join(SCREENSHOT_DIR, filename)
        
        with open(filepath, 'wb') as f:
            f.write(image_bytes)
        
        return {
            "status": "success",
            "filename": filename,
            "url": f"/screenshots/{filename}",
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to save screenshot: {str(e)}"}
        )


@app.post("/process-image")
async def process_image(payload: dict):
    """Process image for advanced features (future expansion)"""
    try:
        image_data = payload.get('image', '')
        processing_type = payload.get('type', 'enhance')
        
        if not image_data.startswith('data:image/png;base64,'):
            return JSONResponse(
                status_code=400,
                content={"error": "Invalid image format"}
            )
        
        # Decode image
        base64_str = image_data.split(',')[1]
        image_bytes = base64.b64decode(base64_str)
        image = Image.open(BytesIO(image_bytes))
        
        # Simple image processing examples
        if processing_type == 'enhance':
            # Enhance image quality
            from PIL import ImageEnhance
            enhancer = ImageEnhance.Sharpness(image)
            processed = enhancer.enhance(1.5)
        elif processing_type == 'brightness':
            from PIL import ImageEnhance
            enhancer = ImageEnhance.Brightness(image)
            processed = enhancer.enhance(1.1)
        else:
            processed = image
        
        # Convert back to base64
        buffered = BytesIO()
        processed.save(buffered, format="PNG")
        processed_base64 = base64.b64encode(buffered.getvalue()).decode()
        
        return {
            "status": "success",
            "image": f"data:image/png;base64,{processed_base64}",
            "processing_type": processing_type
        }
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to process image: {str(e)}"}
        )


@app.get("/shirts/{shirt_name}")
async def get_shirt(shirt_name: str):
    """Get shirt image - serves from static directory"""
    filepath = os.path.join(SHIRT_DIR, shirt_name)
    if not os.path.exists(filepath):
        return JSONResponse(
            status_code=404,
            content={"error": f"Shirt '{shirt_name}' not found"}
        )
    from fastapi.responses import FileResponse
    return FileResponse(filepath)


@app.get("/screenshots")
async def list_screenshots():
    """List all saved screenshots"""
    try:
        files = os.listdir(SCREENSHOT_DIR)
        screenshots = [
            {
                "filename": f,
                "url": f"/screenshots/{f}",
                "size": os.path.getsize(os.path.join(SCREENSHOT_DIR, f))
            }
            for f in files if f.endswith('.png')
        ]
        return {
            "status": "success",
            "count": len(screenshots),
            "screenshots": screenshots
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
