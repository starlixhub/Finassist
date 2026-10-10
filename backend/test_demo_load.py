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

# Disable external network timeout for instant deterministic tests
os.environ["OPENROUTER_API_KEY"] = ""
os.environ["OPENROUTER_KEY"] = ""

import backend.db.database as db_mod
db_mod.supabase = None

from backend.db.database import db_service
from backend.services.predictor import predict_balance
from backend.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


def test_demo_load_and_confidence_metrics():
    print("=" * 70)
    print("FINASSIST 1-CLICK DEMO LOAD & DATA CONFIDENCE LEVEL TEST SUITE")
    print("=" * 70)

    # -------------------------------------------------------------
    # TEST 1: POST /api/demo/load (1-Click Sample Borrower Ingest)
    # -------------------------------------------------------------
    print("\n--- Test 1: POST /api/demo/load & POST /demo/load ---")
    user_id = 1
    db_service.clear_user_data(user_id)

    res_demo = client.post("/api/demo/load", json={"user_id": user_id, "monthly_income": 45000.0})
    print(f"  POST /api/demo/load status: {res_demo.status_code}")
    print(f"  Response: {res_demo.json()}")
    assert res_demo.status_code == 200
    demo_data = res_demo.json()
    assert demo_data["status"] == "success"
    assert demo_data["rows_imported"] == 25
    assert demo_data["rows_failed"] == 0
    assert demo_data["monthly_income"] == 45000.0
    assert "rent" in demo_data["categories_found"]
    assert "food" in demo_data["categories_found"]
    print("  [PASS] 1-Click sample borrower demo data seeded successfully without CSV upload.")

    # Also test /demo/load route alias
    res_alias = client.post(f"/demo/load?user_id=2")
    assert res_alias.status_code == 200
    assert res_alias.json()["rows_imported"] == 25
    print("  [PASS] /demo/load route alias verified.")

    # -------------------------------------------------------------
    # TEST 2: Dashboard Verification Post-Demo Load
    # -------------------------------------------------------------
    print("\n--- Test 2: GET /api/dashboard Verification ---")
    res_dash = client.get(f"/api/dashboard?user_id={user_id}")
    assert res_dash.status_code == 200
    dash_data = res_dash.json()
    assert dash_data["monthly_income"] == 45000.0
    assert dash_data["total_expenses"] == 63530.0
    assert dash_data["remaining_balance"] == -18530.0
    print("  [PASS] Dashboard reflects loaded demo borrower data.")

    # -------------------------------------------------------------
    # TEST 3: Confidence Level on Full Dataset (25 txns -> "high")
    # -------------------------------------------------------------
    print("\n--- Test 3: Confidence Level on Full Demo Dataset ---")
    res_pred = client.get(f"/api/predict?user_id={user_id}&days_ahead=30")
    assert res_pred.status_code == 200
    pred_data = res_pred.json()
    print(f"  GET /api/predict response:\n  {pred_data}")
    assert "confidence_level" in pred_data
    assert pred_data["confidence_level"] == "high"
    assert pred_data["data_points_used"] == 25
    assert pred_data["forecast_method"] == "EMA (alpha=0.3)"
    print("  [PASS] 25 transactions yields confidence_level='high'.")

    # -------------------------------------------------------------
    # TEST 4: Confidence Level Boundary Tests (low, medium, high)
    # -------------------------------------------------------------
    print("\n--- Test 4: Confidence Level Boundary Checks ---")
    
    # 4.1 Empty User (0 txns) -> "low"
    res_0 = predict_balance(user_id=7701)
    assert res_0["confidence_level"] == "low"
    assert res_0["data_points_used"] == 0

    # 4.2 Sparse User (3 txns) -> "low"
    db_service.clear_user_data(7702)
    db_service.upsert_user(7702, 30000.0)
    db_service.insert_transactions([
        {"user_id": 7702, "date": "2026-10-01", "description": "T1", "amount": -100.0, "category": "food", "raw_row": ""},
        {"user_id": 7702, "date": "2026-10-02", "description": "T2", "amount": -200.0, "category": "food", "raw_row": ""},
        {"user_id": 7702, "date": "2026-10-03", "description": "T3", "amount": -300.0, "category": "food", "raw_row": ""},
    ])
    res_3 = predict_balance(user_id=7702)
    assert res_3["confidence_level"] == "low"
    assert res_3["data_points_used"] == 3

    # 4.3 Moderate User (5 txns) -> "medium"
    db_service.clear_user_data(7703)
    db_service.upsert_user(7703, 30000.0)
    db_service.insert_transactions([
        {"user_id": 7703, "date": f"2026-10-0{i+1}", "description": f"T{i+1}", "amount": -100.0, "category": "food", "raw_row": ""}
        for i in range(5)
    ])
    res_5 = predict_balance(user_id=7703)
    assert res_5["confidence_level"] == "medium"
    assert res_5["data_points_used"] == 5

    # 4.4 High Confidence User (14 txns) -> "high"
    db_service.clear_user_data(7704)
    db_service.upsert_user(7704, 30000.0)
    db_service.insert_transactions([
        {"user_id": 7704, "date": f"2026-10-{i+1:02d}", "description": f"T{i+1}", "amount": -100.0, "category": "food", "raw_row": ""}
        for i in range(14)
    ])
    res_14 = predict_balance(user_id=7704)
    assert res_14["confidence_level"] == "high"
    assert res_14["data_points_used"] == 14

    print("  [PASS] Confidence boundaries verified (0: low, 3: low, 5: medium, 14: high).")

    # -------------------------------------------------------------
    # TEST 5: Anomaly Spotlight on Loaded Demo Data
    # -------------------------------------------------------------
    print("\n--- Test 5: GET /api/anomaly-spotlight Verification ---")
    res_anomaly = client.get(f"/api/anomaly-spotlight?user_id={user_id}")
    assert res_anomaly.status_code == 200
    anomaly_data = res_anomaly.json()
    assert anomaly_data["transaction"]["description"] == "Emergency Laptop Motherboard Repair"
    assert anomaly_data["transaction"]["amount"] == -28500.0
    assert anomaly_data["deviation_pct"] > 1000.0
    print("  [PASS] Anomaly spotlight instantly surfaces planted emergency spend from loaded demo data.")

    print("\n" + "=" * 70)
    print("ALL 1-CLICK DEMO LOAD & DATA CONFIDENCE TESTS PASSED (5/5)!")
    print("=" * 70)


if __name__ == "__main__":
    test_demo_load_and_confidence_metrics()
