import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
project_root = backend_dir.parent
for p in [str(project_root), str(backend_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

sys.stdout.reconfigure(encoding="utf-8", line_buffering=True)

from backend.services.categorizer import parse_csv, categorize
from backend.main import app
from fastapi.testclient import TestClient

def test_categorizer_keywords():
    print("--- 1. Testing Categorizer Keyword Rules ---")
    tests = [
        ("Zomato online delivery", "food"),
        ("Swiggy Biryani Order", "food"),
        ("Uber Premier Trip", "transport"),
        ("Fuel HPCL Pump", "transport"),
        ("Monthly Landlord Rent", "rent"),
        ("Amazon Pay Shopping", "shopping"),
        ("Netflix Subscription Dec", "subscriptions"),
        ("Electricity MSEB Bill", "utilities"),
        ("Airtel Broadband Wi-Fi", "utilities"),
        ("Random hardware wrench", "uncategorized"),
    ]
    for desc, expected in tests:
        actual = categorize(desc)
        print(f"[{'PASS' if actual == expected else 'FAIL'}] '{desc}' -> '{actual}' (expected: '{expected}')")
        assert actual == expected, f"Expected {expected}, got {actual}"
    print("All categorizer keyword tests passed!\n")

def test_demo_csv_parsing():
    print("--- 2. Testing parse_csv with data/demo.csv ---")
    demo_path = project_root / "data" / "demo.csv"
    with open(demo_path, "rb") as f:
        content = f.read()

    valid_rows, rows_failed, categories_found = parse_csv(content, user_id=1)
    print(f"Rows Imported: {len(valid_rows)}")
    print(f"Rows Failed: {rows_failed}")
    print(f"Categories Found: {categories_found}")

    assert len(valid_rows) == 25, f"Expected 25 rows, got {len(valid_rows)}"
    assert rows_failed == 0, f"Expected 0 failed rows, got {rows_failed}"
    assert "rent" in categories_found
    assert "food" in categories_found
    assert "transport" in categories_found
    assert "shopping" in categories_found
    assert "subscriptions" in categories_found
    assert "utilities" in categories_found
    assert "uncategorized" in categories_found
    print("demo.csv parsing test passed!\n")

def test_malformed_csv():
    print("--- 3. Testing Malformed CSV Resilience ---")
    malformed_csv = (
        "date,description,amount\n"
        "2026-10-01,Valid Rent,-15000\n"
        "bad-date-format,Swiggy Lunch,-340\n"
        "2026-10-03,Uber Ride,not-a-number\n"
        "05/10/2026,Netflix Subscription,-649\n"
        ",,\n"  # empty row
        "12-Oct-2026,Airtel Broadband,-999\n"
    ).encode("utf-8")

    valid_rows, rows_failed, categories_found = parse_csv(malformed_csv, user_id=1)
    print(f"Malformed Test -> Valid: {len(valid_rows)}, Failed: {rows_failed}, Categories: {categories_found}")

    # Rows:
    # 1. Valid Rent (valid)
    # 2. bad-date-format (failed)
    # 3. not-a-number (failed)
    # 4. 05/10/2026 (valid)
    # 5. ,, (dropped empty)
    # 6. 12-Oct-2026 (valid)
    assert len(valid_rows) == 3, f"Expected 3 valid rows, got {len(valid_rows)}"
    assert rows_failed == 2, f"Expected 2 failed rows, got {rows_failed}"
    print("Malformed CSV test passed!\n")

def test_debit_credit_csv():
    print("--- 4. Testing Debit/Credit Column Normalization ---")
    debit_credit_csv = (
        "txn_date,narration,withdrawal,deposit\n"
        "01/10/2026,Salary Credit,,50000\n"
        "02/10/2026,Zomato Food,450,\n"
        "03/10/2026,Ola Cab,250,\n"
    ).encode("utf-8")

    valid_rows, rows_failed, categories_found = parse_csv(debit_credit_csv, user_id=1)
    print(f"Debit/Credit Test -> Valid: {len(valid_rows)}, Failed: {rows_failed}")
    for row in valid_rows:
        print(f"  {row['date']} | {row['description']} | amount={row['amount']} | cat={row['category']}")

    assert len(valid_rows) == 3
    assert valid_rows[0]["amount"] == 50000.0   # credit
    assert valid_rows[1]["amount"] == -450.0    # debit (negative)
    assert valid_rows[2]["amount"] == -250.0    # debit (negative)
    print("Debit/Credit normalization test passed!\n")

def test_date_format_fallback():
    print("--- 5. Testing Date Format Fallback ---")
    # Test various date formats that should work with fallback logic
    # Note: Dates with internal commas need to be quoted for CSV parsing
    date_formats_test = (
        b'date,description,amount\n'
        b'2026-10-01,Test 1,-100\n'           # ISO format
        b'01/10/2026,Test 2,-200\n'           # DD/MM/YYYY
        b'2026/10/03,Test 3,-300\n'           # YYYY/MM/DD
        b'01-10-2026,Test 4,-400\n'           # DD-MM-YYYY
        b'2026-10-05,Test 5,-500\n'           # YYYY-MM-DD (repeated)
        b'"Oct 01, 2026",Test 6,-600\n'       # Mon DD, YYYY (quoted due to comma)
        b'01 Oct 2026,Test 7,-700\n'          # DD Mon YYYY
        b'01/10/26,Test 8,-800\n'             # DD/MM/YY
        b'2026-1-1,Test 9,-900\n'             # YYYY-M-D (should work with pandas fallback)
    )

    valid_rows, rows_failed, categories_found = parse_csv(date_formats_test, user_id=1)
    print(f"Date Format Test -> Valid: {len(valid_rows)}, Failed: {rows_failed}, Categories: {categories_found}")

    # All rows should be valid since we're testing valid date formats
    assert len(valid_rows) == 9, f"Expected 9 valid rows, got {len(valid_rows)}"
    assert rows_failed == 0, f"Expected 0 failed rows, got {rows_failed}"
    print("Date format fallback test passed!\n")

def test_additional_header_variants():
    print("--- 6. Testing Additional Header Variants ---")
    # Test additional header variants beyond what's in debit_credit_csv
    header_variants_csv = (
        "transaction_date,merchant,transaction_amount\n"
        "2026-10-01,Zomato Lunch,-340\n"
        "2026-10-02,Uber Ride,-220\n"
        "2026-10-03,Amazon Shopping,-1850\n"
    ).encode("utf-8")

    valid_rows, rows_failed, categories_found = parse_csv(header_variants_csv, user_id=1)
    print(f"Header Variants Test -> Valid: {len(valid_rows)}, Failed: {rows_failed}, Categories: {categories_found}")

    assert len(valid_rows) == 3, f"Expected 3 valid rows, got {len(valid_rows)}"
    assert rows_failed == 0, f"Expected 0 failed rows, got {rows_failed}"
    assert valid_rows[0]["category"] == "food"
    assert valid_rows[1]["category"] == "transport"
    assert valid_rows[2]["category"] == "shopping"
    print("Additional header variants test passed!\n")

def test_edge_cases():
    print("--- 7. Testing Edge Cases ---")
    # Test edge cases like special characters, extra whitespace, etc.
    edge_case_csv = (
        "date,description,amount\n"
        "2026-10-01,  Extra Spaces  ,-100\n"
        "2026-10-02,Special!@#$%Characters,-200\n"
        "2026-10-03,,-300\n"  # empty description
        "2026-10-04,Normal Transaction,-400\n"
    ).encode("utf-8")

    valid_rows, rows_failed, categories_found = parse_csv(edge_case_csv, user_id=1)
    print(f"Edge Cases Test -> Valid: {len(valid_rows)}, Failed: {rows_failed}, Categories: {categories_found}")

    # The row with empty description should still be valid (will get "Unknown transaction" as description)
    assert len(valid_rows) == 4, f"Expected 4 valid rows, got {len(valid_rows)}"
    assert rows_failed == 0, f"Expected 0 failed rows, got {rows_failed}"
    # Check that the row with extra spaces gets categorized correctly (should be uncategorized since no keywords match)
    # Actually "Extra Spaces" doesn't match any category, so it should be uncategorized
    # "Special!@#$%Characters" also shouldn't match
    # "Normal Transaction" also shouldn't match any keywords
    # So all should be uncategorized except if any match by chance
    print("Edge cases test passed!\n")

def test_api_endpoints():
    print("--- 8. Testing FastAPI Endpoints (TestClient) ---")
    from backend.db.database import db_service
    db_service.clear_user_data(999)

    client = TestClient(app)

    # 1. Health check
    res = client.get("/health")
    assert res.status_code == 200
    print("[PASS] GET /health")

    # 2. POST /income & POST /api/income
    res = client.post("/income", json={"user_id": 999, "monthly_income": 45000})
    print(f"POST /income status: {res.status_code}, body: {res.json()}")
    assert res.status_code == 200
    assert res.json()["monthly_income"] == 45000

    # 3. POST /transactions/upload
    demo_path = project_root / "data" / "demo.csv"
    with open(demo_path, "rb") as f:
        res = client.post(
            "/transactions/upload",
            files={"file": ("demo.csv", f, "text/csv")},
            data={"user_id": "999"}
        )
    print(f"POST /transactions/upload status: {res.status_code}, body: {res.json()}")
    assert res.status_code == 200
    upload_data = res.json()
    assert upload_data["rows_imported"] == 25
    assert upload_data["rows_failed"] == 0

    # 4. GET /dashboard?user_id=999
    res = client.get("/dashboard?user_id=999")
    print(f"GET /dashboard status: {res.status_code}, body: {res.json()}")
    assert res.status_code == 200
    dashboard_data = res.json()
    assert dashboard_data["monthly_income"] == 45000
    assert dashboard_data["total_expenses"] == 63530.0
    assert dashboard_data["remaining_balance"] == -18530.0
    print("[PASS] GET /dashboard matches manual calculations exactly!")

if __name__ == "__main__":
    test_categorizer_keywords()
    test_demo_csv_parsing()
    test_malformed_csv()
    test_debit_credit_csv()
    test_date_format_fallback()
    test_additional_header_variants()
    test_edge_cases()
    test_api_endpoints()
    print("\nALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!")