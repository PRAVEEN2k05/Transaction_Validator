import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.models.schemas import ValidationResponse
from backend.services.validation_service import run_validation
from backend.utils.file_helpers import UPLOAD_DIR

router = APIRouter()

class ValidationRequest(BaseModel):
    file_id: str

@router.post("/validate", response_model=ValidationResponse)
async def validate_file(request: ValidationRequest):
    file_id = request.file_id
    
    # Locate file in uploads directory (can be CSV or Excel)
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
        response = run_validation(target_file, target_ext, file_id)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation engine error: {str(e)}")
