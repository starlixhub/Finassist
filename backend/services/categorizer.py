import io
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
import pandas as pd


# Rule-based categorization dictionary per dataprocessing.md
CATEGORY_RULES: Dict[str, List[str]] = {
    "subscriptions": ["netflix", "spotify", "prime", "hotstar"],
    "food": ["zomato", "swiggy", "restaurant", "cafe", "eats", "groceries"],
    "transport": ["uber", "ola", "fuel", "petrol", "metro", "rapido", "cab"],
    "rent": ["rent", "landlord"],
    "shopping": ["amazon", "flipkart", "myntra", "zara", "ajio"],
    "utilities": ["electricity", "water bill", "recharge", "broadband", "wifi", "gas bill"],
}


def categorize(description: str, amount: Optional[float] = None) -> str:
    """
    Classify transaction description into category using keyword rules from data_processing.md.
    Case-insensitive keyword match; first match wins.
    """
    if not description or not isinstance(description, str):
        return "uncategorized"

    desc_clean = description.lower().strip()

    for category, keywords in CATEGORY_RULES.items():
        if any(kw in desc_clean for kw in keywords):
            return category

    return "uncategorized"


def _normalize_col_name(col: str) -> str:
    """Convert column headers to snake_case lowercase strings."""
    return re.sub(r"[^a-z0-9_]", "", str(col).strip().lower().replace(" ", "_"))


def parse_date(date_val: Any) -> Optional[str]:
    """
    Parse date from various formats and return ISO format 'YYYY-MM-DD'.
    Returns None if date parsing fails.
    """
    if pd.isna(date_val):
        return None

    if isinstance(date_val, (datetime, pd.Timestamp)):
        return date_val.strftime("%Y-%m-%d")

    val_str = str(date_val).strip()
    if not val_str:
        return None

    date_formats = [
        "%d/%m/%Y",
        "%Y-%m-%d",
        "%d-%m-%Y",
        "%d-%b-%Y",
        "%d-%B-%Y",
        "%m/%d/%Y",
        "%Y/%m/%d",
        "%d/%m/%y",
        "%d-%m-%y",
        "%m-%d-%Y",
        "%b %d, %Y",
        "%d %b %Y",
    ]

    for fmt in date_formats:
        try:
            dt = datetime.strptime(val_str, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue

    # Fallback to pandas with dayfirst=True
    try:
        dt = pd.to_datetime(val_str, dayfirst=True)
        if not pd.isna(dt):
            return dt.strftime("%Y-%m-%d")
    except Exception:
        pass

    return None


def clean_amount(val: Any) -> Optional[float]:
    """
    Clean currency string, remove symbols (₹, $, Rs, commas), and convert to float.
    """
    if pd.isna(val):
        return None
    if isinstance(val, (int, float)):
        return float(val)

    val_str = str(val).strip()
    # Check if negative formatted in parentheses e.g. (500)
    is_paren_negative = False
    if val_str.startswith("(") and val_str.endswith(")"):
        is_paren_negative = True
        val_str = val_str[1:-1]

    # Remove currency symbols, commas, spaces
    cleaned = re.sub(r"[₹$€£\s,]|(rs\.?)|(inr)", "", val_str, flags=re.IGNORECASE)
    if not cleaned or cleaned == "-":
        return None

    try:
        num = float(cleaned)
        return -num if is_paren_negative else num
    except ValueError:
        return None


def parse_csv(file_bytes: bytes, user_id: int = 1) -> Tuple[List[Dict[str, Any]], int, List[str]]:
    """
    Parse CSV file bytes using pandas and normalize into transaction records.
    
    Header mapping:
      - desc, narration, particulars, description, details, merchant -> description
      - txn_date, value_date, date, transaction_date -> date
      - debit, credit, withdrawal, deposit -> combined into signed amount
    
    Sign convention:
      expense = negative, income = positive.
      If source CSV has separate debit/credit columns: amount = credit - debit.
    
    Returns:
      (valid_rows, rows_failed, categories_found)
    """
    if not file_bytes:
        return [], 0, []

    # Read CSV
    try:
        df = pd.read_csv(io.BytesIO(file_bytes))
    except Exception:
        # If standard read fails, try with alternative encodings
        try:
            df = pd.read_csv(io.BytesIO(file_bytes), encoding="latin1")
        except Exception:
            return [], 1, []

    if df.empty:
        return [], 0, []

    # Drop rows that are completely empty
    df = df.dropna(how="all")

    # Map header variants
    col_map = {_normalize_col_name(c): c for c in df.columns}

    # Find description column
    desc_col = None
    desc_candidates = [
        "description", "desc", "narration", "particulars",
        "details", "merchant", "remarks", "payee", "title"
    ]
    for cand in desc_candidates:
        if cand in col_map:
            desc_col = col_map[cand]
            break

    # Find date column
    date_col = None
    date_candidates = [
        "date", "txn_date", "transaction_date", "value_date",
        "txndate", "trans_date", "posted_date"
    ]
    for cand in date_candidates:
        if cand in col_map:
            date_col = col_map[cand]
            break

    # Find amount columns
    debit_col = None
    credit_col = None
    amount_col = None
    type_col = None

    for cand in ["debit", "withdrawal", "dr", "debit_amount", "withdrawals"]:
        if cand in col_map:
            debit_col = col_map[cand]
            break

    for cand in ["credit", "deposit", "cr", "credit_amount", "deposits"]:
        if cand in col_map:
            credit_col = col_map[cand]
            break

    if not debit_col and not credit_col:
        for cand in ["amount", "txn_amount", "transaction_amount", "net_amount"]:
            if cand in col_map:
                amount_col = col_map[cand]
                break

    for cand in ["type", "txn_type", "transaction_type", "dr_cr", "drcr"]:
        if cand in col_map:
            type_col = col_map[cand]
            break

    # Category column (if present in CSV)
    cat_col = None
    for cand in ["category", "tag", "expense_type"]:
        if cand in col_map:
            cat_col = col_map[cand]
            break

    valid_rows: List[Dict[str, Any]] = []
    rows_failed = 0
    categories_set = set()

    for idx, row in df.iterrows():
        # Check if entire row is empty
        if row.isna().all():
            continue

        # Extract & parse date
        parsed_dt = None
        if date_col and date_col in row:
            parsed_dt = parse_date(row[date_col])

        if not parsed_dt:
            rows_failed += 1
            continue

        # Extract description
        raw_desc = ""
        if desc_col and desc_col in row and not pd.isna(row[desc_col]):
            raw_desc = str(row[desc_col]).strip()
        else:
            raw_desc = "Unknown transaction"

        # Calculate signed amount
        final_amount: Optional[float] = None

        if debit_col or credit_col:
            d_val = clean_amount(row[debit_col]) if debit_col and debit_col in row else None
            c_val = clean_amount(row[credit_col]) if credit_col and credit_col in row else None

            # amount = credit - debit (so debit/expense is negative)
            debit_num = d_val if d_val is not None else 0.0
            credit_num = c_val if c_val is not None else 0.0

            if d_val is None and c_val is None:
                rows_failed += 1
                continue

            final_amount = credit_num - debit_num
        elif amount_col and amount_col in row:
            raw_amt = clean_amount(row[amount_col])
            if raw_amt is None:
                rows_failed += 1
                continue

            # Check type column if present
            if type_col and type_col in row and not pd.isna(row[type_col]):
                t_str = str(row[type_col]).lower().strip()
                if t_str in ["debit", "dr", "withdrawal", "expense", "payment"]:
                    final_amount = -abs(raw_amt)
                elif t_str in ["credit", "cr", "deposit", "income"]:
                    final_amount = abs(raw_amt)
                else:
                    final_amount = raw_amt
            else:
                # If amount already signed or unsigned
                final_amount = raw_amt
        else:
            rows_failed += 1
            continue

        # Determine category
        category = "uncategorized"
        if cat_col and cat_col in row and not pd.isna(row[cat_col]):
            custom_cat = str(row[cat_col]).strip().lower()
            if custom_cat:
                category = custom_cat

        if category == "uncategorized":
            category = categorize(raw_desc, final_amount)

        categories_set.add(category)

        raw_row_str = row.to_json()

        valid_rows.append({
            "user_id": user_id,
            "date": parsed_dt,
            "description": raw_desc,
            "amount": round(final_amount, 2),
            "category": category,
            "raw_row": raw_row_str,
        })

    categories_found = sorted(list(categories_set))
    return valid_rows, rows_failed, categories_found
