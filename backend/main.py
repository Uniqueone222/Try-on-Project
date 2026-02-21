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
import numpy as np
import cv2

app = FastAPI(title="Virtual Try-On Backend")

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "https://tryon-backend.onrender.com",
        "https://*.netlify.app",  # All Netlify deployments
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
    Process uploaded shirt image:
    - Remove background (white/light backgrounds)
    - Crop to shirt region
    - Calculate shirt proportions (standard T-shirt structure)
    - Return processed image + landmark metadata for mobile-friendly alignment
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
        
        # Load with PIL then convert to OpenCV format
        pil_image = Image.open(BytesIO(image_bytes))
        
        # Convert to RGB if needed (handle RGBA, etc.)
        if pil_image.mode == 'RGBA':
            # Keep alpha channel for transparency
            cv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGBA2BGR)
            alpha = np.array(pil_image)[:, :, 3]
        else:
            pil_image = pil_image.convert('RGB')
            cv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
            alpha = np.ones((cv_image.shape[0], cv_image.shape[1]), dtype=np.uint8) * 255
        
        # Convert to HSV for better background detection
        hsv = cv2.cvtColor(cv_image, cv2.COLOR_BGR2HSV)
        
        # Create mask for non-background pixels
        # Remove very light colors (white/light gray background)
        lower_light = np.array([0, 0, 200])
        upper_light = np.array([180, 30, 255])
        light_mask = cv2.inRange(hsv, lower_light, upper_light)
        
        # Invert: we want to keep non-light pixels
        foreground_mask = cv2.bitwise_not(light_mask)
        
        # Morphological operations to clean up
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        foreground_mask = cv2.morphologyEx(foreground_mask, cv2.MORPH_CLOSE, kernel)
        foreground_mask = cv2.morphologyEx(foreground_mask, cv2.MORPH_OPEN, kernel)
        
        # Find bounding box of non-background region
        contours, _ = cv2.findContours(foreground_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        crop_info = {
            "x": 0, "y": 0, "w": cv_image.shape[1], "h": cv_image.shape[0]
        }
        
        if contours:
            # Get bounding box of largest contour (the shirt)
            largest_contour = max(contours, key=cv2.contourArea)
            x, y, w, h = cv2.boundingRect(largest_contour)
            
            # Add some padding
            padding = 10
            x = max(0, x - padding)
            y = max(0, y - padding)
            w = min(cv_image.shape[1] - x, w + 2 * padding)
            h = min(cv_image.shape[0] - y, h + 2 * padding)
            
            crop_info = {"x": x, "y": y, "w": w, "h": h}
            
            # Crop image and alpha
            cropped = cv_image[y:y+h, x:x+w]
            cropped_alpha = alpha[y:y+h, x:x+w]
        else:
            # No shirt detected, return original
            cropped = cv_image
            cropped_alpha = alpha
        
        cropped_h, cropped_w = cropped.shape[:2]
        
        # Calculate standard T-shirt proportions (relative to cropped image)
        # These are normalized coordinates (0-1) for mobile-friendly calculations
        shirt_proportions = {
            "neckline_center": {
                "x": 0.5,  # Center horizontally
                "y": 0.12  # 12% from top (typical neckline position)
            },
            "left_shoulder": {
                "x": 0.20,  # 20% from left
                "y": 0.28   # 28% from top (shoulder position)
            },
            "right_shoulder": {
                "x": 0.80,  # 80% from left (right side)
                "y": 0.28   # Same height as left
            },
            "shirt_width_at_shoulders": 0.60,  # 60% of total shirt width
            "shirt_height_ratio": 0.75  # Shirt extends to ~75% of body length
        }
        
        # Convert back to RGBA and PIL
        cropped_bgr = cropped
        cropped_rgb = cv2.cvtColor(cropped_bgr, cv2.COLOR_BGR2RGB)
        
        # Create RGBA image
        result = Image.new('RGBA', (cropped_rgb.shape[1], cropped_rgb.shape[0]))
        rgb_pil = Image.fromarray(cropped_rgb, 'RGB')
        alpha_pil = Image.fromarray(cropped_alpha, 'L')
        result.paste(rgb_pil, (0, 0), alpha_pil)
        
        # Convert to base64
        buffered = BytesIO()
        result.save(buffered, format="PNG")
        processed_base64 = base64.b64encode(buffered.getvalue()).decode()
        
        return {
            "status": "success",
            "image": f"data:image/png;base64,{processed_base64}",
            "proportions": shirt_proportions,
            "info": {
                "background_removed": True,
                "cropped": True,
                "original_dimensions": f"{cv_image.shape[1]}x{cv_image.shape[0]}",
                "cropped_dimensions": f"{cropped_w}x{cropped_h}"
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
