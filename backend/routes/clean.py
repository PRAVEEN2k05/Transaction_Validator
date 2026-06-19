import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.models.schemas import CleaningOptions, CleanResponse
from backend.services.cleaning_service import clean_dataset
from backend.utils.file_helpers import UPLOAD_DIR

router = APIRouter()

class CleanRequest(BaseModel):
    file_id: str
    options: CleaningOptions

@router.post("/clean", response_model=CleanResponse)
async def clean_file(request: CleanRequest):
    file_id = request.file_id
    
    # Locate file in uploads directory
    target_file = None
    target_ext = None
    
    for ext in [".csv", ".xlsx", ".xls"]:
        path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")
        if os.path.exists(path):
            target_file = path
            target_ext = ext
            break
            
    if not target_file:
        raise HTTPException(status_code=404, detail=f"Uploaded file with ID {file_id} not found.")
        
    try:
        response = clean_dataset(target_file, target_ext, file_id, request.options)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleaning engine error: {str(e)}")
