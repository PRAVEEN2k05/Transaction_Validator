import os
import uuid
import polars as pl
import pandas as pd
from typing import Tuple, List, Dict, Any

# Ensure folders exist
UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"
CHUNK_DIR = "chunks"
REPORT_DIR = "reports"

for folder in [UPLOAD_DIR, OUTPUT_DIR, CHUNK_DIR, REPORT_DIR]:
    os.makedirs(folder, exist_ok=True)

def generate_file_id() -> str:
    return str(uuid.uuid4())

def get_file_paths(file_id: str, filename: str) -> Tuple[str, str]:
    ext = os.path.splitext(filename)[1].lower()
    upload_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")
    return upload_path, ext

def read_file_as_df(file_path: str, ext: str) -> Tuple[pd.DataFrame, int]:
    """
    Reads CSV using Polars (for speed) or XLSX using Pandas.
    Returns a unified Pandas DataFrame (which is easy for row-by-row iteration) and rows count.
    """
    if ext == ".csv":
        # Polars read
        try:
            pl_df = pl.read_csv(file_path, ignore_errors=True)
            df = pl_df.to_pandas()
        except Exception:
            # Fallback to pandas
            df = pd.read_csv(file_path)
    elif ext in [".xlsx", ".xls"]:
        df = pd.read_excel(file_path, engine="openpyxl")
    else:
        raise ValueError(f"Unsupported file format: {ext}")
        
    return df, len(df)
