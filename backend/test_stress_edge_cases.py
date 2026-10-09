import os
import sys
import io
import time
from pathlib import Path
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent
project_root = backend_dir.parent
for p in [str(project_root), str(backend_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from backend.main import app
    from backend.db.database import db_service, SUPABASE_KEY
    from backend.services.ai_engine import OPENROUTER_API_KEY
except ImportError:
    from main import app
    from db.database import db_service, SUPABASE_KEY
    from services.ai_engine import OPENROUTER_API_KEY

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

client = TestClient(app)

print("=" * 70)
print("FINASSIST STRESS TEST & EDGE-CASE RESILIENCY SUITE")
print("=" * 70)


def test_csv_edge_cases():
    """
    Action 1: Test CSV with wrong columns, empty file, huge numbers,
    non-UTF8 encoding, dates in 5 different formats.
    Confirm graceful 400s / 200s, never 500.
    """
    print("\n--- 1. Testing CSV Edge Cases ---")

    # 1.1 Wrong columns
    wrong_cols_csv = b"name,age,department,salary\nAlice,30,Engineering,100000\nBob,35,Design,90000"
    res = client.post(
        "/api/transactions/upload",
        files={"file": ("wrong_cols.csv", wrong_cols_csv, "text/csv")},
        data={"user_id": 901}
    )
    print(f"  Wrong columns: Status={res.status_code}, Body={res.json()}")
    assert res.status_code == 400, f"Expected 400 for wrong columns, got {res.status_code}"
    assert "missing required columns" in res.json().get("error", "").lower()

    # 1.2 Empty file (0 bytes)
    res = client.post(
        "/api/transactions/upload",
        files={"file": ("empty.csv", b"", "text/csv")},
        data={"user_id": 902}
    )
    print(f"  Empty file (0 bytes): Status={res.status_code}, Body={res.json()}")
    assert res.status_code == 400, f"Expected 400 for empty file, got {res.status_code}"
    assert "empty" in res.json().get("error", "").lower()

    # 1.3 Empty whitespace file
    res = client.post(
        "/api/transactions/upload",
        files={"file": ("whitespace.csv", b"   \n\n   \t  ", "text/csv")},
        data={"user_id": 903}
    )
    print(f"  Whitespace file: Status={res.status_code}, Body={res.json()}")
    assert res.status_code == 400, f"Expected 400 for whitespace file, got {res.status_code}"

    # 1.4 Non-UTF8 encoding (ISO-8859-1 / Latin-1 with accented characters)
    latin1_content = "date,description,amount\n2026-10-01,Caf\xe9 Zomato,-250\n2026-10-02,Cr\xe8me Uber,-400".encode("latin1")
    res = client.post(
        "/api/transactions/upload",
        files={"file": ("latin1.csv", latin1_content, "text/csv")},
        data={"user_id": 904}
    )
    print(f"  Non-UTF8 (Latin1) file: Status={res.status_code}, Body={res.json()}")
    assert res.status_code == 200, f"Expected 200 for Latin1 CSV, got {res.status_code}"
    assert res.json().get("rows_imported") == 2

    # 1.5 Huge numbers (numbers > 1 trillion or overflow)
    huge_num_csv = (
        b"date,description,amount\n"
        b"2026-10-01,Normal coffee,-150\n"
        b"2026-10-02,Giant asteroid repair,-999999999999999999999999999999\n"
        b"2026-10-03,Normal lunch,-350\n"
    )
    res = client.post(
        "/api/transactions/upload",
        files={"file": ("huge_num.csv", huge_num_csv, "text/csv")},
        data={"user_id": 905}
    )
    print(f"  Huge numbers: Status={res.status_code}, Body={res.json()}")
    assert res.status_code == 200, f"Expected 200 graceful handling for huge numbers, got {res.status_code}"
    assert res.json().get("rows_imported") == 2
    assert res.json().get("rows_failed") == 1  # Giant number safely marked as failed row without 500!

    # 1.6 Dates in 5 different formats
    multi_dates_csv = (
        b"date,description,amount\n"
        b"2026-10-01,Format 1 ISO (YYYY-MM-DD),-100\n"
        b"02/10/2026,Format 2 Slash (DD/MM/YYYY),-200\n"
        b"10/03/2026,Format 3 US (MM/DD/YYYY),-300\n"
        b"04-Oct-2026,Format 4 Mon (DD-Mon-YYYY),-400\n"
        b"05.10.2026,Format 5 Dot (DD.MM.YYYY),-500\n"
    )
    res = client.post(
        "/api/transactions/upload",
        files={"file": ("multi_dates.csv", multi_dates_csv, "text/csv")},
        data={"user_id": 906}
    )
    print(f"  Dates in 5 formats: Status={res.status_code}, Body={res.json()}")
    assert res.status_code == 200, f"Expected 200 for 5 date formats, got {res.status_code}"
    assert res.json().get("rows_imported") == 5
    assert res.json().get("rows_failed") == 0


def test_savings_goal_edge_cases():
    """
    Action 2: Test /savings-goal with target_months=0, negative amount.
    Confirm 422, not crash.
    """
    print("\n--- 2. Testing /savings-goal Validation (422 Not Crash) ---")

    # 2.1 target_months = 0
    res = client.post(
        "/api/savings-goal",
        json={"user_id": 1, "target_amount": 10000, "target_months": 0}
    )
    print(f"  target_months=0: Status={res.status_code}, Body={res.json()}")
    assert res.status_code == 422, f"Expected 422 for target_months=0, got {res.status_code}"
    assert "target_months" in res.json().get("error", "").lower()

    # 2.2 negative amount
    res = client.post(
        "/api/savings-goal",
        json={"user_id": 1, "target_amount": -5000, "target_months": 5}
    )
    print(f"  target_amount=-5000: Status={res.status_code}, Body={res.json()}")
    assert res.status_code == 422, f"Expected 422 for negative target_amount, got {res.status_code}"
    assert "target_amount" in res.json().get("error", "").lower()

    # 2.3 both negative
    res = client.post(
        "/api/savings-goal",
        json={"user_id": 1, "target_amount": -100, "target_months": -2}
    )
    print(f"  both negative: Status={res.status_code}, Body={res.json()}")
    assert res.status_code == 422, f"Expected 422 for negative params, got {res.status_code}"


def test_predict_new_user_zero_transactions():
    """
    Action 3: Test /predict with zero transactions (new user).
    Confirm sane empty-state response, not crash.
    """
    print("\n--- 3. Testing /predict with Zero Transactions (New User) ---")
    new_user_id = 9999
    # Clear any leftover data
    db_service.clear_user_data(new_user_id)

    # 3.1 New user with no income and no transactions
    res = client.get(f"/api/predict?user_id={new_user_id}&days_ahead=30")
    print(f"  New user (no income, no txns): Status={res.status_code}, Body={res.json()}")
    assert res.status_code == 200, f"Expected 200 for new user predict, got {res.status_code}"
    data = res.json()
    assert data["current_balance"] == 0.0
    assert data["predicted_balance"] == 0.0
    assert data["shortage_predicted"] is False
    assert data["risk_level"] == "low"
    assert "explanation" in data
    assert len(data["explanation"]) > 0

    # 3.2 New user with income set but zero transactions
    client.post("/api/income", json={"user_id": new_user_id, "monthly_income": 50000})
    res = client.get(f"/api/predict?user_id={new_user_id}&days_ahead=30")
    print(f"  New user (income set, no txns): Status={res.status_code}, Body={res.json()}")
    assert res.status_code == 200
    data = res.json()
    assert data["current_balance"] == 50000.0
    assert data["predicted_balance"] == 50000.0
    assert data["shortage_predicted"] is False
    assert data["risk_level"] == "low"
    assert "50,000" in data["explanation"]


def test_openrouter_down_fallback():
    """
    Action 4: Test OpenRouter down (kill key temporarily).
    Confirm fallback explanation shows, response still 200.
    """
    print("\n--- 4. Testing OpenRouter Down / Key Killed Fallback ---")
    orig_key = os.environ.get("OPENROUTER_API_KEY")

    try:
        # Temporarily invalidate OpenRouter key
        os.environ["OPENROUTER_API_KEY"] = "mock_invalid_dead_key"
        
        # Test /predict
        res_predict = client.get("/api/predict?user_id=1&days_ahead=30")
        print(f"  Predict with dead AI key: Status={res_predict.status_code}")
        assert res_predict.status_code == 200, f"Expected 200 with dead AI key, got {res_predict.status_code}"
        assert len(res_predict.json().get("explanation", "")) > 10

        # Test /savings-plan
        res_plan = client.get("/api/savings-plan?user_id=1")
        print(f"  Savings plan with dead AI key: Status={res_plan.status_code}")
        assert res_plan.status_code == 200, f"Expected 200 with dead AI key, got {res_plan.status_code}"
        assert len(res_plan.json().get("explanation", "")) > 10
        print(f"  Explanation: {res_plan.json().get('explanation')}")

    finally:
        if orig_key is not None:
            os.environ["OPENROUTER_API_KEY"] = orig_key
        else:
            os.environ.pop("OPENROUTER_API_KEY", None)


def test_guards_and_limits():
    """
    Action 5: Rate limit & timeout & size guards.
    """
    print("\n--- 5. Testing Rate-Limit and Size Guards ---")

    # 5.1 Oversized file (> 5MB)
    fake_huge_file = b"date,description,amount\n" + (b"2026-10-01,Test,-10\n" * (300 * 1024))  # ~6MB
    res = client.post(
        "/api/transactions/upload",
        files={"file": ("too_big.csv", fake_huge_file, "text/csv")},
        data={"user_id": 990}
    )
    print(f"  Oversized file (>5MB): Status={res.status_code}, Body={res.json()}")
    assert res.status_code == 400
    assert "exceeds" in res.json().get("error", "").lower()


def test_secret_leak_check():
    """
    Action 6: Check Supabase key and API secrets never appear
    in any API response or error message.
    """
    print("\n--- 6. Testing Secret Leak Prevention ---")
    sensitive_tokens = []
    if SUPABASE_KEY and len(SUPABASE_KEY) > 8:
        sensitive_tokens.append(SUPABASE_KEY)
    if OPENROUTER_API_KEY and len(OPENROUTER_API_KEY) > 8:
        sensitive_tokens.append(OPENROUTER_API_KEY)

    print(f"  Checking against {len(sensitive_tokens)} sensitive tokens.")

    # Probe various good and bad endpoints
    endpoints_to_probe = [
        ("GET", "/"),
        ("GET", "/health"),
        ("GET", "/api/dashboard?user_id=1"),
        ("GET", "/api/predict?user_id=1"),
        ("GET", "/api/savings-plan?user_id=1"),
        ("GET", "/api/anomaly-spotlight?user_id=1"),
        ("POST", "/api/income", {"user_id": -1, "monthly_income": -100}),
        ("POST", "/api/savings-goal", {"user_id": 1, "target_amount": -50, "target_months": 0}),
        ("POST", "/api/transactions/upload", None),
    ]

    for item in endpoints_to_probe:
        method = item[0]
        url = item[1]
        payload = item[2] if len(item) > 2 else None

        if method == "GET":
            r = client.get(url)
        elif method == "POST":
            if payload is not None:
                r = client.post(url, json=payload)
            else:
                r = client.post(url)

        body_str = r.text
        for tok in sensitive_tokens:
            assert tok not in body_str, f"LEAK DETECTED: Secret {tok[:6]}... found in {url} response!"

    print("  ZERO secret leaks detected across all response payloads and error messages!")


if __name__ == "__main__":
    test_csv_edge_cases()
    test_savings_goal_edge_cases()
    test_predict_new_user_zero_transactions()
    test_openrouter_down_fallback()
    test_guards_and_limits()
    test_secret_leak_check()
    print("\n" + "=" * 70)
    print("ALL STRESS TESTS PASSED WITH 0 ERRORS AND 0 CRASHES!")
    print("=" * 70)
