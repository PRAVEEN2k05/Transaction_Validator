import os
import json
import pandas as pd
import polars as pl
from typing import Dict, Any, List, Tuple
from backend.models.schemas import (
    ValidationResponse, ValidationStats, ChartData, 
    ValidationRow, ValidationErrorDetail
)
from backend.validators.rules import check_row_integrity

def run_validation(file_path: str, ext: str, file_id: str) -> ValidationResponse:
    # 1. Read the dataset
    df, total_rows = read_dataset_safely(file_path, ext)
    
    # Pre-clean columns by lowercasing/stripping whitespace just for key mapping
    col_mapping = {col.lower().strip().replace(" ", "_"): col for col in df.columns}
    
    # Map required columns: order_id, customer_name, country, phone, transaction_date, transaction_time, payment_mode, amount, currency, price, quantity
    # We will look for approximate column names
    standard_fields = {
        "order_id": ["order_id", "order id", "id"],
        "customer_name": ["customer_name", "customer name", "name", "customer"],
        "country": ["country", "nation"],
        "phone": ["phone", "phone_number", "phone number", "mobile", "contact"],
        "transaction_date": ["transaction_date", "transaction date", "date"],
        "transaction_time": ["transaction_time", "transaction time", "time"],
        "payment_mode": ["payment_mode", "payment mode", "payment", "mode"],
        "amount": ["amount", "value"],
        "currency": ["currency", "curr"],
        "price": ["price", "unit price", "cost"],
        "quantity": ["quantity", "qty", "count"]
    }
    
    mapped_df = pd.DataFrame()
    
    # Map input dataframe columns to standard keys
    for std_key, aliases in standard_fields.items():
        found = False
        for alias in aliases:
            # check direct lower match
            alias_clean = alias.lower().strip().replace(" ", "_")
            if alias_clean in col_mapping:
                mapped_df[std_key] = df[col_mapping[alias_clean]]
                found = True
                break
        if not found:
            # Put None if not found, we will catch it in integrity check
            mapped_df[std_key] = None
            
    # Include other extra columns just in case
    for col in df.columns:
        clean_col = col.lower().strip().replace(" ", "_")
        is_mapped = False
        for std_key, aliases in standard_fields.items():
            if clean_col in [a.lower().strip().replace(" ", "_") for a in aliases]:
                is_mapped = True
                break
        if not is_mapped:
            mapped_df[col] = df[col]

    # 2. Extract duplicate Order IDs
    duplicate_orders = set()
    if "order_id" in mapped_df.columns:
        order_ids_cleaned = mapped_df["order_id"].dropna().astype(str).str.strip()
        duplicate_orders = set(order_ids_cleaned[order_ids_cleaned.duplicated()].tolist())

    validation_results = []
    errors_summary = []
    valid_count = 0
    invalid_count = 0
    warning_count = 0
    countries_set = set()
    
    payment_modes_count = {}
    countries_count = {}
    daily_orders_count = {}
    
    # Error classification counters for Donut Chart
    error_cats = {
        "Phone Format": 0,
        "Date Format": 0,
        "Time Format": 0,
        "Negative/Invalid Values": 0,
        "Missing Data": 0,
        "Duplicate Order ID": 0,
        "Invalid Payment Mode": 0,
        "Email Format": 0,
        "Currency Format": 0,
        "Whitespace/Formatting": 0
    }

    # 3. Iterate row by row and validate
    for idx, row in mapped_df.iterrows():
        row_dict = row.to_dict()
        row_index = idx + 1
        
        # Track countries
        country_val = row_dict.get("country")
        if country_val and str(country_val).strip() != "" and str(country_val).lower() != "nan":
            countries_set.add(str(country_val).strip().title())
            c_name = str(country_val).strip().title()
            countries_count[c_name] = countries_count.get(c_name, 0) + 1
            
        # Track payment mode for charts
        pay_mode_val = row_dict.get("payment_mode")
        if pay_mode_val and str(pay_mode_val).strip() != "" and str(pay_mode_val).lower() != "nan":
            p_name = str(pay_mode_val).strip().title()
            payment_modes_count[p_name] = payment_modes_count.get(p_name, 0) + 1
            
        # Track dates for timeline charts
        date_val = row_dict.get("transaction_date")
        if date_val and str(date_val).strip() != "" and str(date_val).lower() != "nan":
            # Just count counts by string value or standardized date
            date_str = str(date_val).strip()
            daily_orders_count[date_str] = daily_orders_count.get(date_str, 0) + 1

        # Perform checking
        status, errors, suggestion = check_row_integrity(row_index, row_dict, duplicate_orders)
        
        if status == "Valid":
            valid_count += 1
        elif status == "Warning":
            warning_count += 1
            error_cats["Whitespace/Formatting"] += 1
        else:
            invalid_count += 1
            # Classify errors
            for err in errors:
                if "Phone" in err:
                    error_cats["Phone Format"] += 1
                elif "date" in err.lower():
                    error_cats["Date Format"] += 1
                elif "time" in err.lower():
                    error_cats["Time Format"] += 1
                elif "negative" in err.lower() or "greater than zero" in err.lower() or "number" in err.lower():
                    error_cats["Negative/Invalid Values"] += 1
                elif "missing" in err.lower() or "blank" in err.lower() or "empty" in err.lower():
                    error_cats["Missing Data"] += 1
                elif "Duplicate" in err:
                    error_cats["Duplicate Order ID"] += 1
                elif "payment mode" in err.lower():
                    error_cats["Invalid Payment Mode"] += 1
                elif "email" in err.lower():
                    error_cats["Email Format"] += 1
                elif "currency" in err.lower():
                    error_cats["Currency Format"] += 1
                else:
                    error_cats["Whitespace/Formatting"] += 1
                    
            errors_summary.append(
                ValidationErrorDetail(
                    row=row_index,
                    status=status,
                    errors=errors,
                    suggestion=suggestion
                )
            )

        # Append row results
        # We will expose standard columns plus status
        validation_results.append(
            ValidationRow(
                row_index=row_index,
                status=status,
                errors=errors,
                suggestion=suggestion if status == "Invalid" else None,
                data={k: (str(v) if pd.notna(v) else "") for k, v in row_dict.items()}
            )
        )

    # 4. Save validation reports
    # Let's save a full report as CSV in reports/report_{file_id}.csv
    df_report = df.copy()
    df_report["Validation_Status"] = [r.status for r in validation_results]
    df_report["Validation_Errors"] = ["; ".join(r.errors) for r in validation_results]
    df_report["Validation_Suggestions"] = [r.suggestion or "" for r in validation_results]
    df_report.to_csv(f"reports/report_{file_id}.csv", index=False)
    
    # Let's save an errors-only report in reports/errors_{file_id}.csv
    df_errors = df_report[df_report["Validation_Status"] == "Invalid"]
    df_errors.to_csv(f"reports/errors_{file_id}.csv", index=False)

    # 5. Format stats and charts
    accuracy = (valid_count / total_rows * 100) if total_rows > 0 else 100.0
    stats = ValidationStats(
        total_rows=total_rows,
        valid_records=valid_count,
        invalid_records=invalid_count,
        countries_detected=len(countries_set),
        validation_accuracy=round(accuracy, 2)
    )

    # Pie Chart
    payment_mode_dist = [{"name": k, "value": v} for k, v in payment_modes_count.items()]
    
    # Bar Chart (Limit to top 10 for readability)
    country_dist = sorted([{"country": k, "count": v} for k, v in countries_count.items()], key=lambda x: x["count"], reverse=True)[:10]
    
    # Line Chart (Sort by date string)
    daily_orders = sorted([{"date": k, "count": v} for k, v in daily_orders_count.items()], key=lambda x: x["date"])[:15]
    
    # Donut Chart
    error_dist = [{"name": k, "value": v} for k, v in error_cats.items() if v > 0]
    if not error_dist:
        # Avoid empty donut chart
        error_dist = [{"name": "No Errors Detected", "value": 0}]

    charts = ChartData(
        payment_mode_distribution=payment_mode_dist,
        transactions_by_country=country_dist,
        daily_orders=daily_orders,
        error_distribution=error_dist
    )

    # Cache analytics report in reports/analytics_{file_id}.json for endpoint retrieval
    analytics_payload = {
        "stats": stats.dict(),
        "charts": charts.dict(),
        "errors_summary": [err.dict() for err in errors_summary]
    }
    with open(f"reports/analytics_{file_id}.json", "w") as f:
        json.dump(analytics_payload, f, indent=2)

    return ValidationResponse(
        file_id=file_id,
        stats=stats,
        charts=charts,
        validation_results=validation_results,
        errors_summary=errors_summary
    )

def read_dataset_safely(file_path: str, ext: str) -> Tuple[pd.DataFrame, int]:
    if ext == ".csv":
        try:
            pl_df = pl.read_csv(file_path, ignore_errors=True)
            df = pd.DataFrame(pl_df.to_dicts())
        except Exception:
            df = pd.read_csv(file_path)
    else:
        df = pd.read_excel(file_path, engine="openpyxl")
    return df, len(df)
