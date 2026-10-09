import os
import sys
from pathlib import Path
from datetime import date, timedelta

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
project_root = backend_dir.parent
for p in [str(project_root), str(backend_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

sys.stdout.reconfigure(encoding="utf-8", line_buffering=True)

from backend.services.predictor import predict_balance
from backend.services.planner import build_savings_plan, suggest_cuts, FIXED_CATEGORIES
from backend.services.categorizer import parse_csv
from backend.db.database import db_service
from backend.main import app
from fastapi.testclient import TestClient


def test_predictor_math_and_edge_cases():
    print("--- 1. Testing Predictor Math & Edge Cases ---")
    test_uid = 801
    db_service.clear_user_data(test_uid)

    # Edge Case 1: Zero expenses (Divide by zero burn rate guard)
    db_service.upsert_user(test_uid, monthly_income=50000.0)
    pred_zero = predict_balance(test_uid, days_ahead=30)
    print(f"Zero expense test: current_balance={pred_zero['current_balance']}, shortage_predicted={pred_zero['shortage_predicted']}, risk_level={pred_zero['risk_level']}")
    assert pred_zero["shortage_predicted"] is False
    assert pred_zero["risk_level"] == "low"
    assert pred_zero["shortage_date"] is None

    # Case 2: High risk shortage
    # Daily burn rate ~ 2000, balance = 6000 -> 3 days remaining (< 7 days -> high risk)
    txs = [
        {"user_id": test_uid, "date": "2026-10-01", "description": "Expense 1", "amount": -14000.0, "category": "shopping"},
        {"user_id": test_uid, "date": "2026-10-07", "description": "Expense 2", "amount": -14000.0, "category": "shopping"},
        {"user_id": test_uid, "date": "2026-10-14", "description": "Expense 3", "amount": -16000.0, "category": "shopping"},
    ]
    # Total expense: 44,000, income: 50,000 -> balance: 6,000
    # Over 14 days, burn rate = 44000 / 14 = 3142.85/day -> days remaining = 6000 / 3142.85 = ~1.9 days (< 7 days)
    db_service.insert_transactions(txs)
    pred_high = predict_balance(test_uid, days_ahead=30)
    print(f"High risk test: current={pred_high['current_balance']}, predicted={pred_high['predicted_balance']}, risk={pred_high['risk_level']}, shortage_date={pred_high['shortage_date']}")
    assert pred_high["shortage_predicted"] is True
    assert pred_high["risk_level"] == "high"
    assert pred_high["shortage_date"] is not None

    db_service.clear_user_data(test_uid)
    print("Predictor unit tests passed!\n")


def test_predictor_comprehensive():
    print("--- 2. Testing Predictor Comprehensive (Burn Rate, Boundaries, Guards) ---")
    test_uid = 802
    db_service.clear_user_data(test_uid)

    # Test Case 1: Burn rate calculation accuracy
    print("\n2.1 Testing burn rate calculation...")
    # Create transactions over exactly 14 days with known total
    txs_burn_rate = []
    base_date = date(2026, 10, 1)
    for i in range(14):
        txs_burn_rate.append({
            "user_id": test_uid,
            "date": base_date + timedelta(days=i),
            "description": f"Expense day {i+1}",
            "amount": -100.0,  # Each day -100
            "category": "food"
        })
    # Total expenses = 14 * -100 = -1400 over 14 days
    # Daily burn rate should be 100.0
    db_service.insert_transactions(txs_burn_rate)
    db_service.upsert_user(test_uid, monthly_income=5000.0)  # Balance = 5000 - 1400 = 3600

    result = predict_balance(test_uid, days_ahead=30)
    expected_daily_burn = 100.0
    expected_predicted_balance = 3600.0 - (100.0 * 30)  # = 600.0
    expected_days_remaining = 3600.0 / 100.0  # = 36.0

    print(f"Burn rate test: daily_burn_rate should be ~{expected_daily_burn}")
    print(f"Predicted balance: expected {expected_predicted_balance}, got {result['predicted_balance']}")
    print(f"Days remaining: expected {expected_days_remaining}, risk level should be 'low' (>21 days)")

    # Since we can't directly access daily_burn_rate from the result, we'll verify through predicted balance
    assert abs(result['predicted_balance'] - expected_predicted_balance) < 1.0, f"Predicted balance mismatch: expected ~{expected_predicted_balance}, got {result['predicted_balance']}"
    assert result['risk_level'] == "low", f"Expected low risk for 36 days remaining, got {result['risk_level']}"
    assert result['shortage_predicted'] is False, "Should not predict shortage with 36 days remaining"

    db_service.clear_user_data(test_uid)

    # Test Case 2: Divide-by-zero guard (zero expenses)
    print("\n2.2 Testing divide-by-zero guard...")
    db_service.upsert_user(test_uid, monthly_income=3000.0)
    # No transactions = zero expenses
    result_zero = predict_balance(test_uid, days_ahead=30)
    assert result_zero["predicted_balance"] == result_zero["current_balance"], "Zero expenses should result in zero burn rate"
    assert result_zero["shortage_predicted"] is False, "Zero expenses should not predict shortage"
    assert result_zero["risk_level"] == "low", "Zero expenses should be low risk"
    print("Divide-by-zero guard test passed!")

    db_service.clear_user_data(test_uid)

    # Test Case 3: Risk level threshold boundaries
    print("\n2.3 Testing risk level threshold boundaries...")

    # Boundary 1: days_remaining = 6.999 (should be high risk)
    # We need: current_balance / daily_burn_rate = 6.999
    # Let's use daily_burn_rate = 100, then current_balance = 699.9
    txs_high_risk = []
    base_date = date(2026, 10, 1)
    for i in range(14):
        txs_high_risk.append({
            "user_id": test_uid,
            "date": base_date + timedelta(days=i),
            "description": f"Expense day {i+1}",
            "amount": -100.0,  # Daily burn rate = 100
            "category": "food"
        })
    db_service.insert_transactions(txs_high_risk)
    # Set income so that balance = 699.9
    # If expenses = 1400 over 14 days, we need income = 1400 + 699.9 = 2099.9
    db_service.upsert_user(test_uid, monthly_income=2099.9)

    result_high = predict_balance(test_uid, days_ahead=30)
    print(f"High risk boundary test (6.999 days): risk_level={result_high['risk_level']}, shortage_predicted={result_high['shortage_predicted']}")
    assert result_high["risk_level"] == "high", f"Expected high risk at ~6.999 days remaining, got {result_high['risk_level']}"
    assert result_high["shortage_predicted"] is True, "Should predict shortage when days_remaining < days_ahead"

    db_service.clear_user_data(test_uid)

    # Boundary 2: days_remaining = 7.000 (should be medium risk)
    txs_medium_low = []
    base_date = date(2026, 10, 1)
    for i in range(14):
        txs_medium_low.append({
            "user_id": test_uid,
            "date": base_date + timedelta(days=i),
            "description": f"Expense day {i+1}",
            "amount": -100.0,  # Daily burn rate = 100
            "category": "food"
        })
    db_service.insert_transactions(txs_medium_low)
    # For 7.0 days remaining: current_balance = 700.0
    # Income = expenses + balance = 1400 + 700 = 2100
    db_service.upsert_user(test_uid, monthly_income=2100.0)

    result_medium_low = predict_balance(test_uid, days_ahead=30)
    print(f"Medium risk boundary test (7.000 days): risk_level={result_medium_low['risk_level']}")
    assert result_medium_low["risk_level"] == "medium", f"Expected medium risk at 7.000 days remaining, got {result_medium_low['risk_level']}"

    db_service.clear_user_data(test_uid)

    # Boundary 3: days_remaining = 21.000 (should be medium risk)
    txs_medium_high = []
    base_date = date(2026, 10, 1)
    for i in range(14):
        txs_medium_high.append({
            "user_id": test_uid,
            "date": base_date + timedelta(days=i),
            "description": f"Expense day {i+1}",
            "amount": -100.0,  # Daily burn rate = 100
            "category": "food"
        })
    db_service.insert_transactions(txs_medium_high)
    # For 21.0 days remaining: current_balance = 2100.0
    # Income = expenses + balance = 1400 + 2100 = 3500
    db_service.upsert_user(test_uid, monthly_income=3500.0)

    result_medium_high = predict_balance(test_uid, days_ahead=30)
    print(f"Medium risk boundary test (21.000 days): risk_level={result_medium_high['risk_level']}")
    assert result_medium_high["risk_level"] == "medium", f"Expected medium risk at 21.000 days remaining, got {result_medium_high['risk_level']}"

    db_service.clear_user_data(test_uid)

    # Boundary 4: days_remaining = 22.000 (should be low risk)
    txs_low_risk = []
    base_date = date(2026, 10, 1)
    for i in range(14):
        txs_low_risk.append({
            "user_id": test_uid,
            "date": base_date + timedelta(days=i),
            "description": f"Expense day {i+1}",
            "amount": -100.0,  # Daily burn rate = 100
            "category": "food"
        })
    db_service.insert_transactions(txs_low_risk)
    # For 22.0 days remaining: current_balance = 2200.0
    # Income = expenses + balance = 1400 + 2200 = 3600
    db_service.upsert_user(test_uid, monthly_income=3600.0)

    result_low = predict_balance(test_uid, days_ahead=30)
    print(f"Low risk boundary test (22.000 days): risk_level={result_low['risk_level']}")
    assert result_low["risk_level"] == "low", f"Expected low risk at 22.000 days remaining, got {result_low['risk_level']}"
    assert result_low["shortage_predicted"] is False, "Should not predict shortage when days_remaining > days_ahead"

    db_service.clear_user_data(test_uid)

    # Test Case 4: Already in deficit (current_balance <= 0)
    print("\n2.4 Testing already in deficit case...")
    txs_deficit = []
    base_date = date(2026, 10, 1)
    for i in range(14):
        txs_deficit.append({
            "user_id": test_uid,
            "date": base_date + timedelta(days=i),
            "description": f"Expense day {i+1}",
            "amount": -100.0,
            "category": "food"
        })
    db_service.insert_transactions(txs_deficit)
    # Set income less than expenses to create deficit
    # Expenses = 1400, set income = 1000 -> balance = -400
    db_service.upsert_user(test_uid, monthly_income=1000.0)

    result_deficit = predict_balance(test_uid, days_ahead=30)
    print(f"Deficit test: current_balance={result_deficit['current_balance']}, shortage_predicted={result_deficit['shortage_predicted']}, risk_level={result_deficit['risk_level']}")
    assert result_deficit["shortage_predicted"] is True, "Should predict shortage when already in deficit"
    assert result_deficit["risk_level"] == "high", "Deficit should be high risk"
    assert result_deficit["shortage_date"] is not None, "Should have a shortage date when in deficit"
    # Note: We can't easily test the exact date without mocking date.today(), but we know it should be set

    db_service.clear_user_data(test_uid)

    print("\nAll predictor comprehensive tests passed!")


def test_planner_math_and_cut_rules():
    print("--- 3. Testing Planner Math & Cut Rules ---")

    # Verify FIXED_CATEGORIES protection
    assert "rent" in FIXED_CATEGORIES
    assert "utilities" in FIXED_CATEGORIES

    category_spends = {
        "rent": 15000.0,
        "utilities": 3000.0,
        "shopping": 10000.0,
        "food": 5000.0,
        "subscriptions": 2000.0,
    }

    # Gap of 3000
    # Discretionary: shopping (10k, max 20% = 2000), food (5k, max 20% = 1000), subscriptions (2k, max 20% = 400)
    # Cuts should be:
    # 1. Shopping: cut 2000 (remaining gap = 1000)
    # 2. Food: cut 1000 (remaining gap = 0)
    # 3. Subscriptions: cut 0 (gap already fulfilled)
    # Rent and utilities MUST NEVER be cut!
    cuts = suggest_cuts(category_spends, gap=3000.0)
    print("Generated Cuts for gap=3000:")
    for c in cuts:
        print(f"  Category: {c['category']}, Current: {c['current']}, Suggested: {c['suggested']}, Reason: {c['reason']}")

    cut_categories = [c["category"] for c in cuts]
    assert "rent" not in cut_categories, "CRITICAL ERROR: Rent was included in suggested cuts!"
    assert "utilities" not in cut_categories, "CRITICAL ERROR: Utilities was included in suggested cuts!"
    assert cut_categories == ["shopping", "food"]
    assert cuts[0]["suggested"] == 8000.0  # 10000 - 2000
    assert cuts[1]["suggested"] == 4000.0  # 5000 - 1000

    print("Planner unit tests passed!\n")


def test_api_demo_data_end_to_end():
    print("--- 4. Testing Full API End-to-End with demo.csv ---")
    client = TestClient(app)
    user_id = 950
    db_service.clear_user_data(user_id)

    # 1. Set Income = 75,000
    res = client.post("/income", json={"user_id": user_id, "monthly_income": 75000.0})
    assert res.status_code == 200

    # 2. Upload demo.csv
    demo_path = project_root / "data" / "demo.csv"
    with open(demo_path, "rb") as f:
        res = client.post(
            "/transactions/upload",
            files={"file": ("demo.csv", f, "text/csv")},
            data={"user_id": str(user_id)}
        )
    assert res.status_code == 200
    assert res.json()["rows_imported"] == 25

    # 3. GET /dashboard
    # Total expenses = 63,530. Income = 75,000 -> Remaining = 11,470
    res = client.get(f"/dashboard?user_id={user_id}")
    assert res.status_code == 200
    dash = res.json()
    print(f"Dashboard: income={dash['monthly_income']}, expenses={dash['total_expenses']}, remaining={dash['remaining_balance']}")
    assert dash["total_expenses"] == 63530.0
    assert dash["remaining_balance"] == 11470.0

    # 4. GET /predict?user_id=950&days_ahead=30
    res = client.get(f"/predict?user_id={user_id}&days_ahead=30")
    print(f"GET /predict status: {res.status_code}, body: {res.json()}")
    assert res.status_code == 200
    pred = res.json()
    assert pred["current_balance"] == 11470.0
    assert "risk_level" in pred
    assert pred["risk_level"] in ["low", "medium", "high"]
    assert "explanation" in pred
    print(f"[PASS] /predict returned: risk_level={pred['risk_level']}, shortage_predicted={pred['shortage_predicted']}, shortage_date={pred['shortage_date']}")

    # 5. POST /savings-goal
    # Goal: Target 10,000 in 5 months -> required_monthly_savings = 2,000
    # Net available = 11,470 >= 2,000 -> feasible = True
    res = client.post("/savings-goal", json={"user_id": user_id, "target_amount": 10000, "target_months": 5})
    print(f"POST /savings-goal status: {res.status_code}, body: {res.json()}")
    assert res.status_code == 200
    goal_res = res.json()
    assert goal_res["required_monthly_savings"] == 2000.0
    assert goal_res["feasible"] is True

    # 6. GET /savings-plan?user_id=950
    res = client.get(f"/savings-plan?user_id={user_id}")
    print(f"GET /savings-plan status: {res.status_code}, body: {res.json()}")
    assert res.status_code == 200
    plan_res = res.json()
    assert plan_res["required_monthly_savings"] == 2000.0
    for cut in plan_res["suggested_cuts"]:
        assert cut["category"] not in ["rent", "utilities"], f"Cut suggested on protected category: {cut['category']}"

    # 7. Test Infeasible Goal
    # Set ambitious goal: Target 100,000 in 5 months -> required_monthly_savings = 20,000
    # Net available = 11,470 < 20,000 -> feasible = False, gap = 8,530
    res = client.post("/savings-goal", json={"user_id": user_id, "target_amount": 100000, "target_months": 5))
    assert res.status_code == 200
    infeasible_goal = res.json()
    assert infeasible_goal["required_monthly_savings"] == 20000.0
    assert infeasible_goal["feasible"] is False

    res = client.get(f"/savings-plan?user_id={user_id}")
    assert res.status_code == 200
    infeasible_plan = res.json()
    assert infeasible_plan["required_monthly_savings"] == 20000.0
    print("Infeasible Plan Cuts:")
    for cut in infeasible_plan["suggested_cuts"]:
        print(f"  {cut['category']}: current ₹{cut['current']} -> suggested ₹{cut['suggested']} ({cut['reason']})")
        assert cut["category"] not in ["rent", "utilities"]

    # 8. Validation Guardrails (target_months <= 0)
    res = client.post("/savings-goal", json={"user_id": user_id, "target_amount": 10000, "target_months": 0})
    assert res.status_code in [400, 422]
    print("[PASS] target_months <= 0 correctly rejected.")

    res = client.post("/savings-goal", json={"user_id": user_id, "target_amount": -500, "target_months": 5})
    assert res.status_code in [400, 422]
    print("[PASS] target_amount <= 0 correctly rejected.")

    # Cleanup
    db_service.clear_user_data(user_id)
    print("\nALL BLOCK 3 TESTS PASSED PERFECTLY!")


if __name__ == "__main__":
    test_predictor_math_and_edge_cases()
    test_predictor_comprehensive()
    test_planner_math_and_cut_rules()
    test_api_demo_data_end_to_end()