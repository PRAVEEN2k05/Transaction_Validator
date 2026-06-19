import os
import zipfile
import pandas as pd
from typing import List
from backend.models.schemas import SplitResponse, ChunkInfo
from backend.utils.file_helpers import CHUNK_DIR

def split_dataset(file_path: str, ext: str, file_id: str, chunk_size: int = 10000) -> SplitResponse:
    # 1. Read the dataset
    if ext == ".csv":
        df = pd.read_csv(file_path)
    else:
        df = pd.read_excel(file_path, engine="openpyxl")
        
    total_rows = len(df)
    is_split = total_rows > chunk_size
    
    # We will create a subdirectory for the chunks of this file
    file_chunks_dir = os.path.join(CHUNK_DIR, file_id)
    os.makedirs(file_chunks_dir, exist_ok=True)
    
    chunks: List[ChunkInfo] = []
    chunk_index = 1
    
    # Split the dataframe
    for i in range(0, total_rows, chunk_size):
        chunk_df = df.iloc[i:i + chunk_size]
        chunk_filename = f"chunk_{chunk_index}.csv"
        chunk_path = os.path.join(file_chunks_dir, chunk_filename)
        chunk_df.to_csv(chunk_path, index=False)
        
        # Build chunk download url
        download_url = f"/download/chunks/{file_id}/{chunk_filename}"
        
        chunks.append(
            ChunkInfo(
                filename=chunk_filename,
                rows_count=len(chunk_df),
                download_url=download_url
            )
        )
        chunk_index += 1
        
    # 2. Package chunks into a ZIP archive
    zip_filename = f"chunks_{file_id}.zip"
    zip_path = os.path.join(CHUNK_DIR, zip_filename)
    
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for chunk in chunks:
            file_to_zip = os.path.join(file_chunks_dir, chunk.filename)
            zipf.write(file_to_zip, arcname=chunk.filename)
            
    zip_download_url = f"/download/zip/{file_id}"
    
    return SplitResponse(
        file_id=file_id,
        is_split=is_split,
        total_chunks=len(chunks),
        chunks=chunks,
        zip_download_url=zip_download_url
    )
