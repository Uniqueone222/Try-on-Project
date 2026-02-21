from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from datetime import datetime
import base64
from PIL import Image, ImageChops
from io import BytesIO
import uuid
import numpy as np

app = FastAPI(title="Virtual Try-On Backend")

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "https://tryon-backend-ayjb.onrender.com",
        "https://try-it-on-dude.netlify.app",  # Specific Netlify domain
        "https://*.netlify.app",  # All Netlify deployments (wildcard)
    ],
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


# OPTIONS preflight handler for CORS
@app.options("/{full_path:path}")
async def preflight_handler(full_path: str):
    """Handle CORS preflight requests"""
    return {}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "Virtual Try-On Backend"}


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "status": "running",
        "service": "Virtual Try-On Backend API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "screenshot": "/screenshot",
            "screenshots": "/screenshots",
            "process": "/process-image"
        }
    }


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


@app.post("/process-shirt")
async def process_shirt(payload: dict):
    """
    Process uploaded shirt image using PIL:
    - Remove background (white/light backgrounds)
    - Crop to shirt region
    - Return cleaned image + standard T-shirt proportions
    
    Mobile-friendly: Uses fixed proportions (no heavy processing on client)
    """
    try:
        image_data = payload.get('image', '')
        
        if not image_data.startswith('data:image'):
            return JSONResponse(
                status_code=400,
                content={"error": "Invalid image format"}
            )
        
        # Decode image
        base64_str = image_data.split(',')[1]
        image_bytes = base64.b64decode(base64_str)
        
        # Load image with PIL
        pil_image = Image.open(BytesIO(image_bytes))
        
        # Convert to RGBA for processing
        if pil_image.mode != 'RGBA':
            pil_image = pil_image.convert('RGBA')
        
        # Get image data as numpy array for easier processing
        img_array = np.array(pil_image)
        
        # Detect light backgrounds: R, G, B all > 200 (white/light gray)
        # Create mask where pixels are light (background)
        r, g, b, a = img_array[:, :, 0], img_array[:, :, 1], img_array[:, :, 2], img_array[:, :, 3]
        
        # Light pixels: high R, G, B values
        is_light = (r > 200) & (g > 200) & (b > 200)
        
        # Create new alpha channel: transparent where light, opaque elsewhere
        new_alpha = np.where(is_light, 0, a)
        
        # Update image array with new alpha
        img_array[:, :, 3] = new_alpha
        
        # Convert back to PIL image
        processed = Image.fromarray(img_array, 'RGBA')
        
        # Crop to content (remove transparent borders)
        # Find bounding box of non-transparent pixels
        alpha_channel = processed.split()[3]
        bbox = alpha_channel.getbbox()
        
        if bbox:
            # bbox is (left, top, right, bottom)
            # Add small padding
            left, top, right, bottom = bbox
            padding = 10
            left = max(0, left - padding)
            top = max(0, top - padding)
            right = min(processed.width, right + padding)
            bottom = min(processed.height, bottom + padding)
            
            cropped = processed.crop((left, top, right, bottom))
        else:
            # No non-transparent pixels found, return as-is
            cropped = processed
        
        original_w, original_h = pil_image.size
        cropped_w, cropped_h = cropped.size
        
        # Fixed T-shirt proportions (mobile-friendly, no processing needed)
        # These represent relative positions within the shirt image
        shirt_proportions = {
            "neckline_center": {
                "x": 0.5,   # Center horizontally
                "y": 0.12   # 12% from top (typical neckline position)
            },
            "left_shoulder": {
                "x": 0.20,  # 20% from left
                "y": 0.28   # 28% from top (shoulder position)
            },
            "right_shoulder": {
                "x": 0.80,  # 80% from left
                "y": 0.28   # Same height as left
            },
            "shirt_width_at_shoulders": 0.60,  # 60% of total shirt width
            "shirt_height_ratio": 0.75  # Shirt extends to ~75% of body length
        }
        
        # Convert to base64
        buffered = BytesIO()
        cropped.save(buffered, format="PNG")
        processed_base64 = base64.b64encode(buffered.getvalue()).decode()
        
        return {
            "status": "success",
            "image": f"data:image/png;base64,{processed_base64}",
            "proportions": shirt_proportions,
            "info": {
                "background_removed": True,
                "cropped": True,
                "original_dimensions": f"{original_w}x{original_h}",
                "cropped_dimensions": f"{cropped_w}x{cropped_h}",
                "processing_method": "PIL (lightweight)"
            }
        }
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to process shirt: {str(e)}"}
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
    import os
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
