import os
import json
from fastapi import APIRouter, HTTPException
from backend.utils.file_helpers import REPORT_DIR

router = APIRouter()

@router.get("/analytics")
async def get_analytics(file_id: str):
    path = os.path.join(REPORT_DIR, f"analytics_{file_id}.json")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Analytics data not found. Please validate the file first.")
        
    try:
        with open(path, "r") as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read analytics file: {str(e)}")
