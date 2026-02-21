"""
Configuration and constants for the Virtual Try-On backend
"""

import os
from pathlib import Path

# Directories
BASE_DIR = Path(__file__).parent
SCREENSHOT_DIR = BASE_DIR / "screenshots"
SHIRT_DIR = BASE_DIR / "shirts"
UPLOADS_DIR = BASE_DIR / "uploads"

# Create directories if they don't exist
SCREENSHOT_DIR.mkdir(exist_ok=True)
SHIRT_DIR.mkdir(exist_ok=True)
UPLOADS_DIR.mkdir(exist_ok=True)

# API Configuration
API_VERSION = "v1"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# CORS origins
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8000",
]

# Image processing settings
SUPPORTED_FORMATS = ["PNG", "JPG", "JPEG"]
IMAGE_QUALITY = 95
