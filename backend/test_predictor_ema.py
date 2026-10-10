import os
import sys
from pathlib import Path
from datetime import datetime, date

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
project_root = backend_dir.parent
for p in [str(project_root), str(backend_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

sys.stdout.reconfigure(encoding="utf-8", line_buffering=True)

# Disable external network timeout for instant deterministic math tests
os.environ["OPENROUTER_API_KEY"] = ""
os.environ["OPENROUTER_KEY"] = ""

import backend.db.database as db_mod
db_mod.supabase = None

from backend.services.predictor import predict_balance
from backend.db.database import db_service
from backend.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

def insert_user_txns(user_id: int, txns: list):
    rows = [
        {
            "user_id": user_id,
            "date": t[0],
            "description": t[1],
            "amount": t[2],
            "category": t[3] if len(t) > 3 else "uncategorized",
            "raw_row": ""
        }
        for t in txns
    ]
    db_service.insert_transactions(rows)

def test_ema_time_series_forecasting():
    print("=" * 70)
    print("FINASSIST EMA TIME-SERIES FORECASTING SUITE")
    print("=" * 70)

    # -------------------------------------------------------------
    # TEST 1: Empty Transactions (0 transactions)
    # Expected: forecast_method = "simple_average (insufficient data)", data_points_used = 0
    # -------------------------------------------------------------
    print("\n--- Test 1: Empty User (0 transactions) ---")
    user_id_empty = 801
    db_service.clear_user_data(user_id_empty)
    db_service.upsert_user(user_id_empty, 50000.0)

    res_empty = predict_balance(user_id_empty)
    print(f"  Result: forecast_method='{res_empty['forecast_method']}', data_points_used={res_empty['data_points_used']}")
    assert res_empty["forecast_method"] == "simple_average (insufficient data)"
    assert res_empty["data_points_used"] == 0
    assert res_empty["shortage_predicted"] is False
    assert res_empty["risk_level"] == "low"
    print("  [PASS] 0-transaction empty user handled gracefully.")

    # -------------------------------------------------------------
    # TEST 2: 3-row CSV / Sparse Transactions (3 transactions fallback)
    # Expected: forecast_method = "simple_average (insufficient data)", data_points_used = 3
    # -------------------------------------------------------------
    print("\n--- Test 2: 3-row Sparse Data (< 5 txns fallback) ---")
    user_id_3 = 802
    db_service.clear_user_data(user_id_3)
    db_service.upsert_user(user_id_3, 30000.0)
    
    insert_user_txns(user_id_3, [
        ("2026-10-01", "Grocery Store", -1200.0, "food"),
        ("2026-10-02", "Metro Pass", -300.0, "transport"),
        ("2026-10-03", "Dinner Swiggy", -500.0, "food"),
    ])

    res_3 = predict_balance(user_id_3)
    print(f"  Result: forecast_method='{res_3['forecast_method']}', data_points_used={res_3['data_points_used']}")
    print(f"  Balance: {res_3['current_balance']}, Predicted: {res_3['predicted_balance']}")
    assert res_3["forecast_method"] == "simple_average (insufficient data)"
    assert res_3["data_points_used"] == 3
    print("  [PASS] 3-row dataset fell back to simple_average with data_points_used=3.")

    # -------------------------------------------------------------
    # TEST 3: 4 Transactions (Boundary Check: still fallback)
    # Expected: forecast_method = "simple_average (insufficient data)", data_points_used = 4
    # -------------------------------------------------------------
    print("\n--- Test 3: 4 Transactions (Boundary Check: still fallback) ---")
    user_id_4 = 803
    db_service.clear_user_data(user_id_4)
    db_service.upsert_user(user_id_4, 30000.0)
    insert_user_txns(user_id_4, [
        ("2026-10-01", "Txn 1", -1000.0, "shopping"),
        ("2026-10-02", "Txn 2", -500.0, "shopping"),
        ("2026-10-03", "Txn 3", -800.0, "shopping"),
        ("2026-10-04", "Txn 4", -700.0, "shopping"),
    ])

    res_4 = predict_balance(user_id_4)
    print(f"  Result: forecast_method='{res_4['forecast_method']}', data_points_used={res_4['data_points_used']}")
    assert res_4["forecast_method"] == "simple_average (insufficient data)"
    assert res_4["data_points_used"] == 4
    print("  [PASS] 4 transactions boundary test passed.")

    # -------------------------------------------------------------
    # TEST 4: Exactly 5 Transactions (Boundary Check: triggers EMA)
    # Expected: forecast_method = "EMA (alpha=0.3)", data_points_used = 5
    # -------------------------------------------------------------
    print("\n--- Test 4: Exactly 5 Transactions (Boundary Check: triggers EMA) ---")
    user_id_5 = 804
    db_service.clear_user_data(user_id_5)
    db_service.upsert_user(user_id_5, 30000.0)
    # Day 1: 1000, Day 2: 2000, Day 3: 3000 -> seed average = (1000+2000+3000)/3 = 2000
    # Day 4: 1000 -> ema = 0.3*1000 + 0.7*2000 = 300 + 1400 = 1700
    # Day 5: 1000 -> ema = 0.3*1000 + 0.7*1700 = 300 + 1190 = 1490
    insert_user_txns(user_id_5, [
        ("2026-10-01", "Txn 1", -1000.0, "food"),
        ("2026-10-02", "Txn 2", -2000.0, "food"),
        ("2026-10-03", "Txn 3", -3000.0, "food"),
        ("2026-10-04", "Txn 4", -1000.0, "food"),
        ("2026-10-05", "Txn 5", -1000.0, "food"),
    ])

    res_5 = predict_balance(user_id_5)
    print(f"  Result: forecast_method='{res_5['forecast_method']}', data_points_used={res_5['data_points_used']}")
    print(f"  Current Balance: {res_5['current_balance']}, Predicted: {res_5['predicted_balance']}")
    assert res_5["forecast_method"] == "EMA (alpha=0.3)"
    assert res_5["data_points_used"] == 5
    # Check predicted balance: current_balance = 30000 - 8000 = 22000. burn_rate = 1490.
    # predicted_balance(30) = 22000 - (1490 * 30) = 22000 - 44700 = -22700.
    assert res_5["predicted_balance"] == round(22000.0 - (1490.0 * 30), 2)
    print("  [PASS] Exactly 5 transactions correctly triggered EMA with exact math.")

    # -------------------------------------------------------------
    # TEST 5: demo.csv End-to-End Test (25 rows)
    # Expected: forecast_method = "EMA (alpha=0.3)", data_points_used = 25
    # -------------------------------------------------------------
    print("\n--- Test 5: demo.csv Full Dataset (25 transactions) ---")
    user_id_demo = 805
    db_service.clear_user_data(user_id_demo)
    db_service.upsert_user(user_id_demo, 45000.0)

    demo_csv_path = project_root / "data" / "demo.csv"
    with open(demo_csv_path, "rb") as f:
        res_upload = client.post(
            "/api/transactions/upload",
            files={"file": ("demo.csv", f, "text/csv")},
            data={"user_id": str(user_id_demo)}
        )
    assert res_upload.status_code == 200
    assert res_upload.json()["rows_imported"] == 25

    # Test GET /api/predict
    res_pred = client.get(f"/api/predict?user_id={user_id_demo}&days_ahead=30")
    assert res_pred.status_code == 200
    pred_data = res_pred.json()
    print(f"  GET /api/predict response:\n  {pred_data}")

    assert pred_data["forecast_method"] == "EMA (alpha=0.3)"
    assert pred_data["data_points_used"] == 25
    assert pred_data["confidence_level"] == "high"
    assert pred_data["shortage_predicted"] is True
    assert pred_data["risk_level"] == "high"
    assert "explanation" in pred_data
    print("  [PASS] demo.csv returned EMA (alpha=0.3) with 25 data points.")

    # -------------------------------------------------------------
    # TEST 6: Multiple Transactions On Same Day Aggregation
    # -------------------------------------------------------------
    print("\n--- Test 6: Multiple Transactions On Same Day Aggregation ---")
    user_id_same_day = 806
    db_service.clear_user_data(user_id_same_day)
    db_service.upsert_user(user_id_same_day, 50000.0)

    # Day 1: 500 + 500 = 1000
    # Day 2: 1000 + 1000 = 2000
    # Day 3: 1500 + 1500 = 3000 -> seed avg = 2000
    # Day 4: 1000 -> ema = 0.3*1000 + 0.7*2000 = 1700
    # Day 5: 1000 -> ema = 0.3*1000 + 0.7*1700 = 1490
    insert_user_txns(user_id_same_day, [
        ("2026-10-01", "Coffee", -500.0, "food"),
        ("2026-10-01", "Snack", -500.0, "food"),
        ("2026-10-02", "Lunch", -1000.0, "food"),
        ("2026-10-02", "Dinner", -1000.0, "food"),
        ("2026-10-03", "Shopping A", -1500.0, "shopping"),
        ("2026-10-03", "Shopping B", -1500.0, "shopping"),
        ("2026-10-04", "Groceries", -1000.0, "food"),
        ("2026-10-05", "Fuel", -1000.0, "transport"),
    ])

    res_same_day = predict_balance(user_id_same_day)
    print(f"  Result: forecast_method='{res_same_day['forecast_method']}', data_points_used={res_same_day['data_points_used']}")
    assert res_same_day["forecast_method"] == "EMA (alpha=0.3)"
    assert res_same_day["data_points_used"] == 8
    # Total expenses = 8000, current balance = 42000. burn_rate = 1490.
    # predicted_balance(30) = 42000 - (1490 * 30) = 42000 - 44700 = -2700.
    assert res_same_day["predicted_balance"] == round(42000.0 - (1490.0 * 30), 2)
    print("  [PASS] Same-day transaction aggregation correctly handled before EMA.")

    print("\n" + "=" * 70)
    print("ALL EMA TIME-SERIES FORECASTING TESTS PASSED (6/6)!")
    print("=" * 70)

if __name__ == "__main__":
    test_ema_time_series_forecasting()
