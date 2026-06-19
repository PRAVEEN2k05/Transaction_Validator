import os
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import Optional
from backend.models.schemas import FileUploadResponse
from backend.utils.file_helpers import (
    generate_file_id, get_file_paths, read_file_as_df, UPLOAD_DIR
)
import pandas as pd

router = APIRouter()

# Global variable to check if a demo file exists, if not we will create a mock demo dataset on startup
DEMO_FILENAME = "sample_data.csv"

def create_mock_demo_data():
    """Generates a rich, mock transaction dataset with errors for demonstration."""
    if os.path.exists(DEMO_FILENAME):
        return
        
    data = {
        "order_id": [
            "TXN001", "TXN002", "TXN003", "TXN004", "TXN005", 
            "TXN006", "TXN002", "TXN008", "TXN009", "TXN010",
            "TXN011", "TXN012", "TXN013", "TXN014", "TXN015"
        ],
        "customer_name": [
            "Aarav Sharma", "Chloe Tan", "John Smith", "Emma Watson", "Liam Neeson",
            "Sophia Muller", "Chloe Tan", "Oliver Twist", "Noah Ark", "James Bond",
            "  Priya Patel  ", "", "David Beckham", "Hans Schmidt", "Taylor Swift"
        ],
        "country": [
            "India", "Singapore", "USA", "UK", "Australia", 
            "Germany", "Singapore", "USA", "France", "UK",
            "India", "Singapore", "USA", "Germany", "Canada"
        ],
        "phone": [
            "+91 9876543210", "+65 81234567", "1234567890", "07700900077", "412345678",
            "015201234567", "+65 81234567", "123456789", "0612345678", "07700900077",
            "9876543210", "1234", "9876543210", "4915201234567", "1234567890"
        ],
        "transaction_date": [
            "19-06-2026", "2026-06-20", "06/21/2026", "22/06/2026", "2026-06-23",
            "31/02/2025", "20-06-2026", "2026-06-25", "2026-06-26", "2026-06-27",
            "28-06-2026", "2026-06-29", "2026-06-30", "01-07-2026", "2026-07-02"
        ],
        "transaction_time": [
            "14:35:22", "09:15", "18:45:00", "23:59", "08:30:15",
            "25:00", "09:15", "12:00:00", "15:30", "17:45:12",
            "19:30", "11:22:33", "23:45", "06:15:30", "12:00"
        ],
        "payment_mode": [
            "UPI", "Credit Card", "Debit Card", "Cash", "Net Banking",
            "PayPal", "Credit Card", "Debit Card", "UPI", "Cash",
            "upi", "Credit Card", "Net Banking", "Cash", "BitCoin"
        ],
        "amount": [
            1500.0, 85.50, 1200.0, 45.0, 250.0,
            -15.0, 85.50, 450.0, 99.0, 1000.0,
            350.0, 500.0, -100.0, 750.0, 120.0
        ],
        "price": [
            750.0, 42.75, 400.0, 15.0, 125.0,
            -5.0, 42.75, 150.0, 33.0, 200.0,
            175.0, 250.0, 50.0, 0.0, 40.0
        ],
        "quantity": [
            2, 2, 3, 3, 2,
            3, 2, 3, 3, 5,
            2, 2, -2, 4, 3
        ],
        "currency": [
            "INR", "SGD", "USD", "GBP", "AUD",
            "EUR", "SGD", "USD", "EUR", "GBP",
            "INR", "SGD", "USD", "EUR", "CAD"
        ],
        "email": [
            "aarav@gmail.com", "chloe@tan.sg", "john.smith@gmail.com", "watson@uk.co", "neeson@movies.au",
            "sophia@muller.de", "chloe@tan.sg", "oliver.twist", "noah@ark.fr", "bond@mi6.gov.uk",
            "priya@yahoo.in", "invalid-email@", "david@beckham.com", "hans@schmidt.de", "taylor@swift.ca"
        ]
    }
    df = pd.DataFrame(data)
    df.to_csv(DEMO_FILENAME, index=False)

# Ensure mock demo dataset is ready
create_mock_demo_data()

@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: Optional[UploadFile] = File(None),
    use_demo: bool = Form(False)
):
    file_id = generate_file_id()
    
    if use_demo:
        # Load demo file
        if not os.path.exists(DEMO_FILENAME):
            create_mock_demo_data()
        
        file_path = DEMO_FILENAME
        ext = ".csv"
        filename = DEMO_FILENAME
        
        # Save a copy in uploads directory for tracking
        upload_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")
        pd.read_csv(file_path).to_csv(upload_path, index=False)
        file_path = upload_path
    else:
        if not file or file.filename == "":
            raise HTTPException(status_code=400, detail="No file uploaded and demo flag is false.")
            
        filename = file.filename
        upload_path, ext = get_file_paths(file_id, filename)
        
        if ext not in [".csv", ".xlsx", ".xls"]:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload CSV or Excel.")
            
        try:
            with open(upload_path, "wb") as f:
                content = await file.read()
                f.write(content)
            file_path = upload_path
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save uploaded file: {str(e)}")

    try:
        # Read file attributes
        df, total_rows = read_file_as_df(file_path, ext)
        
        # Clean null values from preview to avoid JSON compliance errors
        preview_data = df.head(10).fillna("").to_dict(orient="records")
        # Ensure values are JSON serializable
        clean_preview = []
        for row in preview_data:
            clean_row = {}
            for k, v in row.items():
                if isinstance(v, (int, float, str, bool)):
                    clean_row[k] = v
                else:
                    clean_row[k] = str(v)
            clean_preview.append(clean_row)
            
        file_size = os.path.getsize(file_path)
        
        return FileUploadResponse(
            file_id=file_id,
            filename=filename,
            file_size=file_size,
            total_rows=total_rows,
            columns=list(df.columns),
            preview=clean_preview
        )
    except Exception as e:
        # Cleanup file in case of error
        if os.path.exists(upload_path) and not use_demo:
            os.remove(upload_path)
        raise HTTPException(status_code=500, detail=f"Error parsing uploaded file: {str(e)}")
