import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.models.schemas import SplitResponse
from backend.services.chunking_service import split_dataset
from backend.utils.file_helpers import UPLOAD_DIR, OUTPUT_DIR

router = APIRouter()

class SplitRequest(BaseModel):
    file_id: str
    chunk_size: Optional[int] = 10000

@router.post("/split", response_model=SplitResponse)
async def split_file(request: SplitRequest):
    file_id = request.file_id
    chunk_size = request.chunk_size or 10000
    
    # Prefer cleaned dataset, fallback to uploaded
    target_file = None
    target_ext = None
    
    cleaned_path = os.path.join(OUTPUT_DIR, f"cleaned_{file_id}.csv")
    if os.path.exists(cleaned_path):
        target_file = cleaned_path
        target_ext = ".csv"
    else:
        for ext in [".csv", ".xlsx", ".xls"]:
            path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")
            if os.path.exists(path):
                target_file = path
                target_ext = ext
                break
                
    if not target_file:
        raise HTTPException(status_code=404, detail=f"Dataset with ID {file_id} not found for splitting.")
        
    try:
        response = split_dataset(target_file, target_ext, file_id, chunk_size)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chunking engine error: {str(e)}")
