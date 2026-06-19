import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from backend.utils.file_helpers import OUTPUT_DIR, REPORT_DIR, CHUNK_DIR

router = APIRouter()

@router.get("/download/cleaned")
async def download_cleaned(file_id: str):
    path = os.path.join(OUTPUT_DIR, f"cleaned_{file_id}.csv")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Cleaned CSV not found. Please clean the dataset first.")
    
    return FileResponse(
        path,
        media_type="text/csv",
        filename=f"cleaned_transactions_{file_id}.csv"
    )

@router.get("/download/errors")
async def download_errors(file_id: str):
    path = os.path.join(REPORT_DIR, f"errors_{file_id}.csv")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Error report not found. Please validate the dataset first.")
        
    return FileResponse(
        path,
        media_type="text/csv",
        filename=f"error_report_{file_id}.csv"
    )

@router.get("/download/report")
async def download_report(file_id: str):
    path = os.path.join(REPORT_DIR, f"report_{file_id}.csv")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Validation report not found. Please validate the dataset first.")
        
    return FileResponse(
        path,
        media_type="text/csv",
        filename=f"validation_report_{file_id}.csv"
    )

@router.get("/download/chunks")
async def download_chunks_zip(file_id: str):
    path = os.path.join(CHUNK_DIR, f"chunks_{file_id}.zip")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Chunks ZIP archive not found. Please split the dataset first.")
        
    return FileResponse(
        path,
        media_type="application/zip",
        filename=f"chunks_{file_id}.zip"
    )

# Direct support for individual chunk files (called from chunks table in UI)
@router.get("/download/chunks/{file_id}/{filename}")
async def download_individual_chunk(file_id: str, filename: str):
    # Sanitize filename to avoid directory traversal
    filename = os.path.basename(filename)
    path = os.path.join(CHUNK_DIR, file_id, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Requested chunk file not found.")
        
    return FileResponse(
        path,
        media_type="text/csv",
        filename=filename
    )

# Helper route matching the ZIP download URL from split schema
@router.get("/download/zip/{file_id}")
async def download_zip_alias(file_id: str):
    return await download_chunks_zip(file_id)
