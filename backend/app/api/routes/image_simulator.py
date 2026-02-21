"""
Image-based Environmental Impact Simulator
Upload before images, get matched after images showing environmental impact
"""
from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
from typing import List
import os
from pathlib import Path
from PIL import Image
import imagehash
from loguru import logger

router = APIRouter()

# Path to image simulator folder (absolute path from project root)
import os
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent.parent
IMAGE_FOLDER = PROJECT_ROOT / "image simulator"

# Pre-compute hashes for all "before" images
BEFORE_IMAGES = {
    "1": {"before": "1before.jpeg", "after": "1.1after.jpeg"},
    "2": {"before": "2before.jpeg", "after": "2after.jpeg"},
    "3": {"before": "3before.jpeg", "after": "3after.png"},
    "4": {"before": "4before.jpeg", "after": "4after.png"},
}

def compute_image_hash(image_path: Path):
    """Compute perceptual hash of an image"""
    try:
        img = Image.open(image_path)
        return imagehash.average_hash(img)
    except Exception as e:
        logger.error(f"Error computing hash for {image_path}: {e}")
        return None

def find_best_match(uploaded_image: Image.Image) -> str:
    """Find the best matching before image and return its ID"""
    uploaded_hash = imagehash.average_hash(uploaded_image)
    
    best_match = None
    min_distance = float('inf')
    
    for img_id, paths in BEFORE_IMAGES.items():
        before_path = IMAGE_FOLDER / paths["before"]
        if before_path.exists():
            before_hash = compute_image_hash(before_path)
            if before_hash:
                distance = uploaded_hash - before_hash
                if distance < min_distance:
                    min_distance = distance
                    best_match = img_id
    
    return best_match if min_distance < 15 else None  # Threshold for similarity

@router.post("/match-images")
async def match_images(files: List[UploadFile] = File(...)):
    """
    Upload one or more 'before' images and get matched 'after' images
    Returns list of matched after images with metadata
    """
    try:
        results = []
        
        for file in files:
            # Read uploaded image
            contents = await file.read()
            img = Image.open(io.BytesIO(contents))
            
            # Find best match
            match_id = find_best_match(img)
            
            if match_id:
                after_path = IMAGE_FOLDER / BEFORE_IMAGES[match_id]["after"]
                if after_path.exists():
                    results.append({
                        "uploaded_filename": file.filename,
                        "matched_id": match_id,
                        "before_image": BEFORE_IMAGES[match_id]["before"],
                        "after_image": BEFORE_IMAGES[match_id]["after"],
                        "after_image_url": f"/api/image-simulator/image/{BEFORE_IMAGES[match_id]['after']}",
                        "status": "matched"
                    })
                else:
                    results.append({
                        "uploaded_filename": file.filename,
                        "status": "no_after_image",
                        "error": "After image not found"
                    })
            else:
                results.append({
                    "uploaded_filename": file.filename,
                    "status": "no_match",
                    "error": "No similar before image found in database"
                })
        
        return {
            "total_uploaded": len(files),
            "total_matched": sum(1 for r in results if r["status"] == "matched"),
            "results": results
        }
    
    except Exception as e:
        logger.error(f"Image matching error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/image/{filename}")
async def get_image(filename: str):
    """Serve an image from the image simulator folder"""
    image_path = IMAGE_FOLDER / filename
    if not image_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(image_path)

@router.get("/available-pairs")
async def get_available_pairs():
    """Get list of available before/after image pairs"""
    pairs = []
    for img_id, paths in BEFORE_IMAGES.items():
        before_path = IMAGE_FOLDER / paths["before"]
        after_path = IMAGE_FOLDER / paths["after"]
        if before_path.exists() and after_path.exists():
            pairs.append({
                "id": img_id,
                "before_url": f"/api/image-simulator/image/{paths['before']}",
                "after_url": f"/api/image-simulator/image/{paths['after']}",
            })
    return {"pairs": pairs}

import io

@router.get("/ping")
async def ping():
    return {"router": "image_simulator", "status": "online"}
