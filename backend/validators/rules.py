import re
from datetime import datetime
from typing import Dict, Tuple, List, Optional, Any

# Supported Country Phone Length Rules
COUNTRY_PHONE_RULES = {
    "India": 10,
    "Singapore": 8,
    "USA": 10,
    "UK": 10,
    "Australia": 9,
    "Germany": 11
}

# Supported Payment Modes
ALLOWED_PAYMENT_MODES = {
    "upi", "credit card", "debit card", "cash", "net banking"
}

# Standard Date Formats
DATE_FORMATS = [
    "%d-%m-%Y",  # DD-MM-YYYY
    "%Y-%m-%d",  # YYYY-MM-DD
    "%m/%d/%Y",  # MM/DD/YYYY
    "%d/%m/%Y"   # DD/MM/YYYY
]

# Standard Time Formats
TIME_FORMATS = [
    "%H:%M:%S",
    "%H:%M"
]

# Email regex pattern
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

def validate_phone(phone_val: Any, country_val: Optional[str]) -> Tuple[bool, str]:
    """
    Validates phone number length based on country rules.
    """
    if not country_val or str(country_val).strip() == "" or str(country_val).lower() == "nan":
        return False, "Country is missing, cannot validate phone number."
    
    country = str(country_val).strip().title()
    if country not in COUNTRY_PHONE_RULES:
        return True, ""  # Country not in rules, skip length validation or warning
    
    required_len = COUNTRY_PHONE_RULES[country]
    
    # Strip non-digits
    phone_str = str(phone_val)
    digits = re.sub(r"\D", "", phone_str)
    
    if len(digits) == 0:
        return False, f"Phone number cannot be empty or non-numeric for {country}."
        
    # Check if number matches length, or length + country code (e.g. +91 10-digits = 12 digits)
    # Country codes: India (91), Singapore (65), USA (1), UK (44), Australia (61), Germany (49)
    cc_map = {
        "India": "91",
        "Singapore": "65",
        "USA": "1",
        "UK": "44",
        "Australia": "61",
        "Germany": "49"
    }
    
    cc = cc_map.get(country, "")
    if len(digits) == required_len:
        return True, ""
    elif cc and digits.startswith(cc) and len(digits) == required_len + len(cc):
        return True, ""
    else:
        return False, f"Phone number should contain {required_len} digits for {country}."

def validate_date(date_val: Any) -> Tuple[bool, str, Optional[str]]:
    """
    Validates date string against multiple allowed formats.
    Returns (is_valid, error_msg, standardized_date_str).
    """
    if date_val is None or str(date_val).strip() == "" or str(date_val).lower() == "nan":
        return False, "Date is missing.", None
    
    date_str = str(date_val).strip()
    
    # Try parsing using each format
    for fmt in DATE_FORMATS:
        try:
            parsed_date = datetime.strptime(date_str, fmt)
            # Successfully parsed, return standard YYYY-MM-DD
            return True, "", parsed_date.strftime("%Y-%m-%d")
        except ValueError:
            continue
            
    return False, f"Invalid date or unsupported format: '{date_str}'. Supported formats: DD-MM-YYYY, YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY.", None

def validate_time(time_val: Any) -> Tuple[bool, str, Optional[str]]:
    """
    Validates time string against HH:MM or HH:MM:SS.
    Returns (is_valid, error_msg, standardized_time_str).
    """
    if time_val is None or str(time_val).strip() == "" or str(time_val).lower() == "nan":
        return False, "Time is missing.", None
        
    time_str = str(time_val).strip()
    for fmt in TIME_FORMATS:
        try:
            parsed_time = datetime.strptime(time_str, fmt)
            return True, "", parsed_time.strftime(fmt)
        except ValueError:
            continue
            
    return False, f"Invalid time or unsupported format: '{time_str}'. Supported formats: HH:MM, HH:MM:SS.", None

def validate_email(email_val: Any) -> Tuple[bool, str]:
    """
    Validates email syntax.
    """
    if email_val is None or str(email_val).strip() == "" or str(email_val).lower() == "nan":
        return True, ""  # Email is optional in order details, skip if blank
        
    email_str = str(email_val).strip()
    if EMAIL_REGEX.match(email_str):
        return True, ""
    return False, f"Invalid email format: '{email_str}'."

def check_row_integrity(row_idx: int, row_data: Dict[str, Any], duplicate_orders: set) -> Tuple[str, List[str], str]:
    """
    Performs comprehensive checks on row fields.
    Returns (status, errors_list, suggestion).
    """
    errors = []
    warnings = []
    
    # 1. Null Country
    country = row_data.get("country")
    if country is None or str(country).strip() == "" or str(country).lower() == "nan":
        errors.append("Country is missing or empty.")
    else:
        country_clean = str(country).strip()
        # Phone Validation
        phone = row_data.get("phone")
        if phone is not None and str(phone).strip() != "" and str(phone).lower() != "nan":
            phone_ok, phone_err = validate_phone(phone, country_clean)
            if not phone_ok:
                errors.append(phone_err)
        else:
            errors.append("Phone number is missing.")

    # 2. Blank Customer Names
    cust_name = row_data.get("customer_name")
    if cust_name is None or str(cust_name).strip() == "" or str(cust_name).lower() == "nan":
        errors.append("Customer name cannot be blank.")
        
    # 3. Duplicate Order IDs
    order_id = row_data.get("order_id")
    if order_id is None or str(order_id).strip() == "" or str(order_id).lower() == "nan":
        errors.append("Order ID is missing.")
    elif str(order_id).strip() in duplicate_orders:
        errors.append(f"Duplicate Order ID: '{str(order_id).strip()}'.")

    # 4. Dates
    date_val = row_data.get("transaction_date")
    if date_val is not None:
        date_ok, date_err, _ = validate_date(date_val)
        if not date_ok:
            errors.append(date_err)
    else:
        errors.append("Transaction date is missing.")

    # 5. Times
    time_val = row_data.get("transaction_time")
    if time_val is not None:
        time_ok, time_err, _ = validate_time(time_val)
        if not time_ok:
            errors.append(time_err)
            
    # 6. Negative quantities
    qty_val = row_data.get("quantity")
    if qty_val is not None:
        try:
            qty = float(qty_val)
            if qty < 0:
                errors.append("Quantity cannot be negative.")
        except (ValueError, TypeError):
            errors.append("Quantity must be a valid number.")
            
    # 7. Negative amount / price <= 0
    amt_val = row_data.get("amount")
    if amt_val is not None:
        try:
            amt = float(amt_val)
            if amt < 0:
                errors.append("Amount cannot be negative.")
        except (ValueError, TypeError):
            errors.append("Amount must be a valid number.")

    price_val = row_data.get("price")
    if price_val is not None:
        try:
            price = float(price_val)
            if price <= 0:
                errors.append("Product price must be greater than zero.")
        except (ValueError, TypeError):
            errors.append("Product price must be a valid number.")

    # 8. Invalid payment mode
    pay_mode = row_data.get("payment_mode")
    if pay_mode is None or str(pay_mode).strip() == "" or str(pay_mode).lower() == "nan":
        errors.append("Payment mode is missing.")
    elif str(pay_mode).strip().lower() not in ALLOWED_PAYMENT_MODES:
        errors.append(f"Invalid payment mode: '{str(pay_mode).strip()}'. Supported: UPI, Credit Card, Debit Card, Cash, Net Banking.")

    # 9. Email validation
    email_val = row_data.get("email")
    if email_val is not None and str(email_val).strip() != "":
        email_ok, email_err = validate_email(email_val)
        if not email_ok:
            errors.append(email_err)

    # 10. Currency validation & consistency
    currency_val = row_data.get("currency")
    if currency_val is None or str(currency_val).strip() == "" or str(currency_val).lower() == "nan":
        errors.append("Currency is missing.")
    else:
        # Check standard ISO codes (3 letters uppercase)
        curr_str = str(currency_val).strip()
        if not curr_str.isalpha() or len(curr_str) != 3:
            errors.append(f"Invalid currency ISO code: '{curr_str}'. Must be a 3-letter code.")

    # Whitespace warnings
    has_whitespace = False
    for k, v in row_data.items():
        if isinstance(v, str) and (v.startswith(" ") or v.endswith(" ")):
            has_whitespace = True
            break
    if has_whitespace:
        warnings.append("Row contains fields with leading or trailing whitespace.")

    # Resolve overall status
    if len(errors) > 0:
        status = "Invalid"
        # Compose AI suggestion
        suggestion = compose_suggestion(errors)
        return status, errors, suggestion
    elif len(warnings) > 0:
        status = "Warning"
        return status, warnings, "Apply auto-fix to trim whitespaces."
    else:
        return "Valid", [], "Record is valid."

def compose_suggestion(errors: List[str]) -> str:
    """
    Creates human-like suggestions based on row errors.
    """
    suggestions = []
    phone_err = any("Phone number" in e for e in errors)
    amt_err = any("Amount cannot be negative" in e or "amount" in e.lower() for e in errors)
    qty_err = any("Quantity" in e for e in errors)
    price_err = any("price" in e for e in errors)
    date_err = any("date" in e.lower() for e in errors)
    time_err = any("time" in e.lower() for e in errors)
    name_err = any("Customer name" in e for e in errors)
    country_err = any("Country is missing" in e for e in errors)
    dup_err = any("Duplicate" in e for e in errors)
    pay_err = any("payment mode" in e.lower() for e in errors)
    email_err = any("email" in e.lower() for e in errors)
    curr_err = any("currency" in e.lower() for e in errors)

    if phone_err:
        suggestions.append("correct the phone number length according to country rules")
    if amt_err:
        suggestions.append("provide a positive non-negative amount")
    if qty_err:
        suggestions.append("ensure quantity is non-negative")
    if price_err:
        suggestions.append("ensure price is greater than zero")
    if date_err:
        suggestions.append("provide date in supported formats (DD-MM-YYYY, YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY)")
    if time_err:
        suggestions.append("provide time in HH:MM or HH:MM:SS format")
    if name_err:
        suggestions.append("fill in the customer name")
    if country_err:
        suggestions.append("specify the transaction country")
    if dup_err:
        suggestions.append("ensure Order ID is unique")
    if pay_err:
        suggestions.append("use supported payment modes (UPI, Credit Card, Debit Card, Cash, Net Banking)")
    if email_err:
        suggestions.append("correct the email format")
    if curr_err:
        suggestions.append("provide a valid 3-letter currency code")

    if not suggestions:
        return "Fix data format issues in the highlighted columns."

    # Join nicely
    if len(suggestions) == 1:
        return "Please " + suggestions[0] + "."
    elif len(suggestions) == 2:
        return "Please " + suggestions[0] + " and " + suggestions[1] + "."
    else:
        return "Please " + ", ".join(suggestions[:-1]) + ", and " + suggestions[-1] + "."
