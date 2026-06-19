from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class FileUploadResponse(BaseModel):
    file_id: str
    filename: str
    file_size: int
    total_rows: int
    columns: List[str]
    preview: List[Dict[str, Any]]

class ValidationErrorDetail(BaseModel):
    row: int
    status: str  # "Invalid" or "Warning"
    errors: List[str]
    suggestion: str

class ValidationRow(BaseModel):
    row_index: int
    status: str  # "Valid", "Invalid", "Warning"
    errors: List[str] = []
    suggestion: Optional[str] = None
    data: Dict[str, Any]

class ValidationStats(BaseModel):
    total_rows: int
    valid_records: int
    invalid_records: int
    countries_detected: int
    validation_accuracy: float  # (valid_records / total_rows) * 100

class ChartData(BaseModel):
    payment_mode_distribution: List[Dict[str, Any]]  # name, value
    transactions_by_country: List[Dict[str, Any]]   # country, count
    daily_orders: List[Dict[str, Any]]              # date, count
    error_distribution: List[Dict[str, Any]]        # name, value

class LiveActivity(BaseModel):
    timestamp: str
    message: str
    type: str  # "info", "warning", "success"

class ValidationResponse(BaseModel):
    file_id: str
    stats: ValidationStats
    charts: ChartData
    validation_results: List[ValidationRow]
    errors_summary: List[ValidationErrorDetail]

class CleaningOptions(BaseModel):
    auto_fix: bool = True
    remove_whitespace: bool = True
    convert_text_case: str = "none"  # "upper", "lower", "title", "none"
    remove_duplicates: bool = True
    standardize_dates: bool = True
    replace_null_values: bool = True
    normalize_payment_modes: bool = True

class CleanResponse(BaseModel):
    file_id: str
    cleaned_file_path: str
    original_rows: int
    cleaned_rows: int
    removed_duplicates: int
    fixed_dates: int
    fixed_nulls: int

class ChunkInfo(BaseModel):
    filename: str
    rows_count: int
    download_url: str

class SplitResponse(BaseModel):
    file_id: str
    is_split: bool
    total_chunks: int
    chunks: List[ChunkInfo]
    zip_download_url: str
