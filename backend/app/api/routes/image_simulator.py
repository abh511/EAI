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

# Pre-compute hashes for all "before" images and their construction-specific "after" images
BEFORE_IMAGES = {
    "1": {
        "before": "1before.png",
        "after_by_construction": {
            "hospital": "1afterhospital.jpeg",
            "school": "1afterschool.jpeg",
            "factory": "1afterfactory.jpeg",
            "hotel": "1afterhotel.jpeg",
            "residential": "1afterresident.jpeg",
            "it_park": "1afteritcompany.jpeg",
            "old_age_home": "1afteroldagehome.png",
            "gym": "1aftergym.jpeg",
            "street_food": "1afterstreetfood.jpeg",
            "market": "1aftershopping.jpeg",
            "sports_complex": "1aftersports.jpeg",
            "parking": "1afterparking.jpeg",
        }
    },
    "2": {
        "before": "2before.png",  # Updated to .png
        "after_by_construction": {
            # Reusing the same after images as before image 1
            "hospital": "1afterhospital.jpeg",
            "school": "1afterschool.jpeg",
            "factory": "1afterfactory.jpeg",
            "hotel": "1afterhotel.jpeg",
            "residential": "1afterresident.jpeg",
            "it_park": "1afteritcompany.jpeg",
            "old_age_home": "1afteroldagehome.png",
            "gym": "1aftergym.jpeg",
            "street_food": "1afterstreetfood.jpeg",
            "market": "1aftershopping.jpeg",
            "sports_complex": "1aftersports.jpeg",
            "parking": "1afterparking.jpeg",
        }
    },
    # Add more before images here as you create them
    # "3": {
    #     "before": "3before.jpeg",
    #     "after_by_construction": {
    #         "hospital": "1afterhospital.jpeg",  # Can reuse same after images
    #         ...
    #     }
    # },
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
async def match_images(files: List[UploadFile] = File(...), construction_type: str = "residential"):
    """
    Upload one or more 'before' images and get matched 'after' images based on construction type
    Returns list of matched after images with metadata
    
    Parameters:
    - files: List of image files to match
    - construction_type: Type of construction (hospital, school, factory, etc.)
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
                # Get the construction-specific after image
                after_images = BEFORE_IMAGES[match_id].get("after_by_construction", {})
                after_image_name = after_images.get(construction_type)
                
                if after_image_name:
                    after_path = IMAGE_FOLDER / after_image_name
                    if after_path.exists():
                        results.append({
                            "uploaded_filename": file.filename,
                            "matched_id": match_id,
                            "construction_type": construction_type,
                            "before_image": BEFORE_IMAGES[match_id]["before"],
                            "after_image": after_image_name,
                            "after_image_url": f"/api/image-simulator/image/{after_image_name}",
                            "status": "matched"
                        })
                    else:
                        results.append({
                            "uploaded_filename": file.filename,
                            "status": "no_after_image",
                            "error": f"After image not found for {construction_type}"
                        })
                else:
                    results.append({
                        "uploaded_filename": file.filename,
                        "status": "no_construction_type",
                        "error": f"No after image available for construction type: {construction_type}"
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
            "construction_type": construction_type,
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
    """Get list of available before/after image pairs for all construction types"""
    pairs = []
    for img_id, data in BEFORE_IMAGES.items():
        before_path = IMAGE_FOLDER / data["before"]
        if before_path.exists():
            # Get all available construction types for this before image
            available_constructions = []
            for construction_type, after_image in data.get("after_by_construction", {}).items():
                after_path = IMAGE_FOLDER / after_image
                if after_path.exists():
                    available_constructions.append({
                        "construction_type": construction_type,
                        "after_url": f"/api/image-simulator/image/{after_image}",
                    })
            
            if available_constructions:
                pairs.append({
                    "id": img_id,
                    "before_url": f"/api/image-simulator/image/{data['before']}",
                    "available_constructions": available_constructions,
                    "total_construction_types": len(available_constructions)
                })
    
    return {"pairs": pairs, "total_before_images": len(pairs)}

import io

@router.get("/ping")
async def ping():
    return {"router": "image_simulator", "status": "online"}
