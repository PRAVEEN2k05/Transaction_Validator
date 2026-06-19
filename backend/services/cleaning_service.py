import os
import pandas as pd
from typing import Tuple
from backend.models.schemas import CleaningOptions, CleanResponse
from backend.utils.file_helpers import UPLOAD_DIR, OUTPUT_DIR
from backend.validators.rules import validate_date, ALLOWED_PAYMENT_MODES

def clean_dataset(file_path: str, ext: str, file_id: str, options: CleaningOptions) -> CleanResponse:
    # 1. Read original dataset
    if ext == ".csv":
        df = pd.read_csv(file_path)
    else:
        df = pd.read_excel(file_path, engine="openpyxl")
        
    original_rows = len(df)
    
    # Track metrics
    removed_duplicates = 0
    fixed_dates = 0
    fixed_nulls = 0
    
    # Helper to clean column strings for key mapping
    col_mapping = {col.lower().strip().replace(" ", "_"): col for col in df.columns}
    
    # 2. Whitespace trimming
    if options.remove_whitespace or options.auto_fix:
        for col in df.columns:
            if df[col].dtype == object:
                # Apply strip, ignoring non-string values
                df[col] = df[col].apply(lambda x: str(x).strip() if pd.notna(x) and isinstance(x, str) else x)

    # 3. Standardize dates
    if options.standardize_dates or options.auto_fix:
        date_col = None
        for alias in ["transaction_date", "transaction date", "date"]:
            alias_clean = alias.lower().strip().replace(" ", "_")
            if alias_clean in col_mapping:
                date_col = col_mapping[alias_clean]
                break
                
        if date_col:
            def fix_date(val):
                nonlocal fixed_dates
                if pd.isna(val) or str(val).strip() == "" or str(val).lower() == "nan":
                    return val
                is_ok, _, std_date = validate_date(val)
                if is_ok and std_date:
                    if str(val).strip() != std_date:
                        fixed_dates += 1
                    return std_date
                return val
            df[date_col] = df[date_col].apply(fix_date)

    # 4. Normalize payment modes
    if options.normalize_payment_modes or options.auto_fix:
        pay_col = None
        for alias in ["payment_mode", "payment mode", "payment", "mode"]:
            alias_clean = alias.lower().strip().replace(" ", "_")
            if alias_clean in col_mapping:
                pay_col = col_mapping[alias_clean]
                break
                
        if pay_col:
            mode_map = {
                "upi": "UPI",
                "credit card": "Credit Card",
                "creditcard": "Credit Card",
                "cc": "Credit Card",
                "debit card": "Debit Card",
                "debitcard": "Debit Card",
                "cash": "Cash",
                "net banking": "Net Banking",
                "netbanking": "Net Banking",
                "nb": "Net Banking"
            }
            def fix_pay_mode(val):
                if pd.isna(val) or str(val).strip() == "" or str(val).lower() == "nan":
                    return "Cash"
                val_clean = str(val).strip().lower()
                if val_clean in mode_map:
                    return mode_map[val_clean]
                return str(val).strip().title()
            df[pay_col] = df[pay_col].apply(fix_pay_mode)

    # 5. Replace null values
    if options.replace_null_values or options.auto_fix:
        # We fill null values based on identified columns
        for key, aliases in {
            "customer_name": ["customer_name", "customer name", "name", "customer"],
            "country": ["country", "nation"],
            "phone": ["phone", "phone_number", "phone number", "mobile", "contact"],
            "quantity": ["quantity", "qty", "count"],
            "price": ["price", "unit price", "cost"],
            "amount": ["amount", "value"],
            "currency": ["currency", "curr"]
        }.items():
            col_name = None
            for alias in aliases:
                alias_clean = alias.lower().strip().replace(" ", "_")
                if alias_clean in col_mapping:
                    col_name = col_mapping[alias_clean]
                    break
            if col_name:
                null_mask = df[col_name].isna() | (df[col_name].astype(str).str.strip() == "") | (df[col_name].astype(str).str.lower() == "nan")
                null_count = null_mask.sum()
                if null_count > 0:
                    fixed_nulls += int(null_count)
                    if key == "customer_name":
                        df.loc[null_mask, col_name] = "Unknown Customer"
                    elif key == "country":
                        df.loc[null_mask, col_name] = "Unknown"
                    elif key == "phone":
                        df.loc[null_mask, col_name] = "N/A"
                    elif key == "quantity":
                        df.loc[null_mask, col_name] = 1
                    elif key == "price":
                        df.loc[null_mask, col_name] = 0.0
                    elif key == "amount":
                        df.loc[null_mask, col_name] = 0.0
                    elif key == "currency":
                        df.loc[null_mask, col_name] = "USD"

    # 6. Remove text case formatting
    if options.convert_text_case != "none":
        for col in df.columns:
            if df[col].dtype == object:
                if options.convert_text_case == "upper":
                    df[col] = df[col].apply(lambda x: str(x).upper() if pd.notna(x) and isinstance(x, str) else x)
                elif options.convert_text_case == "lower":
                    df[col] = df[col].apply(lambda x: str(x).lower() if pd.notna(x) and isinstance(x, str) else x)
                elif options.convert_text_case == "title":
                    df[col] = df[col].apply(lambda x: str(x).title() if pd.notna(x) and isinstance(x, str) else x)

    # 7. Remove duplicate rows based on order_id
    if options.remove_duplicates or options.auto_fix:
        order_col = None
        for alias in ["order_id", "order id", "id"]:
            alias_clean = alias.lower().strip().replace(" ", "_")
            if alias_clean in col_mapping:
                order_col = col_mapping[alias_clean]
                break
        if order_col:
            rows_before = len(df)
            df = df.drop_duplicates(subset=[order_col], keep="first")
            removed_duplicates = rows_before - len(df)
        else:
            rows_before = len(df)
            df = df.drop_duplicates(keep="first")
            removed_duplicates = rows_before - len(df)

    # 8. Save cleaned CSV
    cleaned_filename = f"cleaned_{file_id}.csv"
    cleaned_file_path = os.path.join(OUTPUT_DIR, cleaned_filename)
    df.to_csv(cleaned_file_path, index=False)
    
    return CleanResponse(
        file_id=file_id,
        cleaned_file_path=cleaned_file_path,
        original_rows=original_rows,
        cleaned_rows=len(df),
        removed_duplicates=removed_duplicates,
        fixed_dates=fixed_dates,
        fixed_nulls=fixed_nulls
    )
