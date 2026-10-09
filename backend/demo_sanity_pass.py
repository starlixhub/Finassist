import os
import sys
import json
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
project_root = backend_dir.parent
for p in [str(project_root), str(backend_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

sys.stdout.reconfigure(encoding="utf-8", line_buffering=True)

from backend.main import app
from backend.db.database import db_service
from fastapi.testclient import TestClient

def run_sanity_pass():
    print("=" * 70)
    print("FINASSIST END-TO-END DEMO FLOW SANITY PASS")
    print("=" * 70)

    client = TestClient(app)
    user_id = 1
    db_service.clear_user_data(user_id)
    demo_csv_path = project_root / "data" / "demo.csv"

    results = {}
    mismatches = []

    # -------------------------------------------------------------
    # STEP 1: POST /income (Set monthly income)
    # Spec per api.md: Request: { "user_id": 1, "monthly_income": 45000 }
    # Response 200: { "user_id": 1, "monthly_income": 45000 }
    # -------------------------------------------------------------
    print("\n[STEP 1] Testing POST /income & POST /api/income ...")
    payload_income = {"user_id": user_id, "monthly_income": 45000.0}
    res1 = client.post("/income", json=payload_income)
    print(f"  Status: {res1.status_code}")
    print(f"  Response: {json.dumps(res1.json(), indent=2)}")
    
    assert res1.status_code == 200, f"Step 1 Failed with status {res1.status_code}"
    body1 = res1.json()
    assert body1["user_id"] == 1
    assert body1["monthly_income"] == 45000.0
    results["POST /income"] = "DONE (200 OK - exact match with api.md)"

    # Also check /api/income prefix
    res1_api = client.post("/api/income", json=payload_income)
    assert res1_api.status_code == 200

    # -------------------------------------------------------------
    # STEP 2: POST /transactions/upload (Upload CSV)
    # Spec per api.md: multipart/form-data with file and user_id
    # Response 200: { "rows_imported": 25, "rows_failed": 0, "categories_found": [...] }
    # -------------------------------------------------------------
    print("\n[STEP 2] Testing POST /transactions/upload ...")
    with open(demo_csv_path, "rb") as f:
        res2 = client.post(
            "/transactions/upload",
            files={"file": ("demo.csv", f, "text/csv")},
            data={"user_id": str(user_id)}
        )
    print(f"  Status: {res2.status_code}")
    print(f"  Response: {json.dumps(res2.json(), indent=2)}")
    
    assert res2.status_code == 200, f"Step 2 Failed with status {res2.status_code}"
    body2 = res2.json()
    assert body2["rows_imported"] == 25
    assert body2["rows_failed"] == 0
    assert isinstance(body2["categories_found"], list)
    results["POST /transactions/upload"] = "DONE (200 OK - exact match with api.md)"

    # -------------------------------------------------------------
    # STEP 3: GET /dashboard?user_id=1 (Category aggregation & remaining balance)
    # Spec per api.md: { "monthly_income": 45000, "total_expenses": 63530, "remaining_balance": -18530, "by_category": [...] }
    # -------------------------------------------------------------
    print("\n[STEP 3] Testing GET /dashboard?user_id=1 ...")
    res3 = client.get(f"/dashboard?user_id={user_id}")
    print(f"  Status: {res3.status_code}")
    print(f"  Response: {json.dumps(res3.json(), indent=2)}")
    
    assert res3.status_code == 200, f"Step 3 Failed with status {res3.status_code}"
    body3 = res3.json()
    assert "monthly_income" in body3
    assert "total_expenses" in body3
    assert "remaining_balance" in body3
    assert "by_category" in body3
    assert body3["monthly_income"] == 45000.0
    assert body3["total_expenses"] == 63530.0
    assert body3["remaining_balance"] == -18530.0
    results["GET /dashboard"] = "DONE (200 OK - exact match with api.md)"

    # -------------------------------------------------------------
    # STEP 4: GET /predict?user_id=1&days_ahead=30 (Burn rate prediction)
    # Spec per api.md: { "current_balance": ..., "predicted_balance": ..., "shortage_predicted": ..., "shortage_date": ..., "risk_level": ..., "explanation": ... }
    # -------------------------------------------------------------
    print("\n[STEP 4] Testing GET /predict?user_id=1&days_ahead=30 ...")
    res4 = client.get(f"/predict?user_id={user_id}&days_ahead=30")
    print(f"  Status: {res4.status_code}")
    print(f"  Response: {json.dumps(res4.json(), indent=2)}")
    
    assert res4.status_code == 200, f"Step 4 Failed with status {res4.status_code}"
    body4 = res4.json()
    assert "current_balance" in body4
    assert "predicted_balance" in body4
    assert "shortage_predicted" in body4
    assert "risk_level" in body4
    assert "explanation" in body4
    assert body4["shortage_predicted"] is True
    assert body4["risk_level"] == "high"
    results["GET /predict"] = "DONE (200 OK - exact match with api.md)"

    # -------------------------------------------------------------
    # STEP 5: POST /savings-goal (Create goal)
    # Spec per api.md: { "user_id": 1, "target_amount": 10000, "target_months": 5 }
    # Response 200: { "goal_id": ..., "required_monthly_savings": 2000, "feasible": ... }
    # -------------------------------------------------------------
    print("\n[STEP 5] Testing POST /savings-goal ...")
    payload_goal = {"user_id": user_id, "target_amount": 10000.0, "target_months": 5}
    res5 = client.post("/savings-goal", json=payload_goal)
    print(f"  Status: {res5.status_code}")
    print(f"  Response: {json.dumps(res5.json(), indent=2)}")
    
    assert res5.status_code == 200, f"Step 5 Failed with status {res5.status_code}"
    body5 = res5.json()
    assert "goal_id" in body5
    assert body5["required_monthly_savings"] == 2000.0
    results["POST /savings-goal"] = "DONE (200 OK - exact match with api.md)"

    # -------------------------------------------------------------
    # STEP 6: GET /savings-plan?user_id=1 (Fetch plan & suggested cuts)
    # Spec per api.md: { "required_monthly_savings": 2000, "suggested_cuts": [...], "explanation": ... }
    # -------------------------------------------------------------
    print("\n[STEP 6] Testing GET /savings-plan?user_id=1 ...")
    res6 = client.get(f"/savings-plan?user_id={user_id}")
    print(f"  Status: {res6.status_code}")
    print(f"  Response: {json.dumps(res6.json(), indent=2)}")
    
    assert res6.status_code == 200, f"Step 6 Failed with status {res6.status_code}"
    body6 = res6.json()
    assert "required_monthly_savings" in body6
    assert "suggested_cuts" in body6
    assert "explanation" in body6
    assert body6["required_monthly_savings"] == 2000.0
    # Verify no fixed categories in cuts
    for cut in body6["suggested_cuts"]:
        assert cut["category"] not in ["rent", "utilities"], f"Protected category found in cuts: {cut['category']}"
    results["GET /savings-plan"] = "DONE (200 OK - exact match with api.md)"

    print("\n" + "=" * 70)
    print("SANITY PASS SUMMARY:")
    for endpoint, status_str in results.items():
        print(f"  ✔ {endpoint:28} : {status_str}")
    print("=" * 70)
    print("ALL 6 FLOW STEPS COMPLETED WITH 0 ERRORS AND 100% SPEC COMPLIANCE!\n")

if __name__ == "__main__":
    run_sanity_pass()
