import os
import sys
import inspect
from pathlib import Path

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

from backend.services.planner import (
    optimize_savings_allocation,
    suggest_cuts,
    build_savings_plan,
    FIXED_CATEGORIES,
)
from backend.db.database import db_service
from backend.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


def test_planner_constraint_satisfaction():
    print("=" * 70)
    print("FINASSIST CONSTRAINT-SATISFACTION OPTIMIZER TEST SUITE")
    print("=" * 70)

    # -------------------------------------------------------------
    # TEST 1: Docstring Check
    # Done-Condition: Docstring uses term "constraint-satisfaction"
    # -------------------------------------------------------------
    print("\n--- Test 1: Docstring Verification ---")
    doc = optimize_savings_allocation.__doc__ or ""
    print(f"  Docstring preview: {doc.strip()[:100]}...")
    assert "constraint-satisfaction" in doc.lower(), "Docstring must contain 'constraint-satisfaction'"
    print("  [PASS] optimize_savings_allocation docstring explicitly uses 'constraint-satisfaction'.")

    # -------------------------------------------------------------
    # TEST 2: Source Code Variables Check
    # Action 2: Defined constraints as variables at top:
    # MAX_CUT_PER_CATEGORY = 0.20, FIXED_CATEGORIES = ["rent", "utilities"], TOTAL_TARGET = required_monthly_savings
    # -------------------------------------------------------------
    print("\n--- Test 2: Source Variable Definitions ---")
    source = inspect.getsource(optimize_savings_allocation)
    assert "MAX_CUT_PER_CATEGORY = 0.20" in source or "MAX_CUT_PER_CATEGORY = 0.2" in source
    assert 'FIXED_CATEGORIES = ["rent", "utilities"]' in source or "FIXED_CATEGORIES = ['rent', 'utilities']" in source
    assert "TOTAL_TARGET" in source
    print("  [PASS] Constraint variables explicitly defined at top of function.")

    # -------------------------------------------------------------
    # TEST 3: Metadata on Each Cut
    # Action 3: { category, current, suggested, cut_pct, constraint_applied, reason }
    # E.g. food: current: 9800, suggested: 8000, cut_pct: 18.4, constraint_applied: "max_20pct_cap"
    # -------------------------------------------------------------
    print("\n--- Test 3: Constraint Metadata on Cuts ---")
    # Category total: food 9800, required savings = 1800 -> 1800 cut
    category_totals = {
        "rent": 15000.0,
        "utilities": 3000.0,
        "food": 9800.0,
    }
    cuts = optimize_savings_allocation(category_totals, required_monthly_savings=1800.0)
    print(f"  Cuts returned: {cuts}")
    assert len(cuts) == 1
    cut = cuts[0]
    assert cut["category"] == "food"
    assert cut["current"] == 9800.0
    assert cut["suggested"] == 8000.0
    assert cut["cut_pct"] == 18.4
    assert cut["constraint_applied"] == "max_20pct_cap"
    assert "reason" in cut
    print("  [PASS] Exact metadata match: cut_pct=18.4, constraint_applied='max_20pct_cap'.")

    # -------------------------------------------------------------
    # TEST 4: Infeasible Case
    # Action 4: If total possible cuts < required savings (infeasible), return:
    # { "feasible": false, "max_achievable_savings": X, "gap": Y }
    # instead of silently returning partial plan
    # -------------------------------------------------------------
    print("\n--- Test 4: Infeasible Goal Handling ---")
    # Discretionary: shopping 10000 (max cut 2000), food 5000 (max cut 1000) -> total max cuts = 3000
    # Required savings = 5000 -> 3000 < 5000 (Infeasible!)
    cat_infeasible = {
        "rent": 20000.0,
        "utilities": 4000.0,
        "shopping": 10000.0,
        "food": 5000.0,
    }
    infeasible_res = optimize_savings_allocation(cat_infeasible, required_monthly_savings=5000.0)
    print(f"  Infeasible result: {infeasible_res}")
    assert isinstance(infeasible_res, dict), "Infeasible result must be a dictionary"
    assert infeasible_res["feasible"] is False
    assert infeasible_res["max_achievable_savings"] == 3000.0
    assert infeasible_res["gap"] == 2000.0  # 5000 - 3000 = 2000 remaining gap
    print("  [PASS] Infeasible case returned explicit failure with max_achievable_savings and gap.")

    # -------------------------------------------------------------
    # TEST 5: suggest_cuts() Backward Compatibility Alias
    # Action 1: suggest_cuts() maintained as alias
    # -------------------------------------------------------------
    print("\n--- Test 5: suggest_cuts() Alias Verification ---")
    alias_res = suggest_cuts(category_totals, gap=1800.0)
    assert len(alias_res) == 1
    assert alias_res[0]["category"] == "food"
    assert alias_res[0]["cut_pct"] == 18.4
    assert alias_res[0]["constraint_applied"] == "max_20pct_cap"
    print("  [PASS] suggest_cuts() works as an exact compatible alias.")

    # -------------------------------------------------------------
    # TEST 6: API Integration Test GET /savings-plan
    # Done-Condition: /savings-plan response includes constraint_applied per cut,
    # and infeasible case returns gap clearly.
    # -------------------------------------------------------------
    print("\n--- Test 6: API GET /savings-plan Contract ---")
    user_id = 890
    db_service.clear_user_data(user_id)
    db_service.upsert_user(user_id, monthly_income=50000.0)

    # Insert transactions: rent 20000, utilities 4000, shopping 10000, food 5000 -> total spend = 39000
    # Net available = 50000 - 39000 = 11000
    rows = [
        {"user_id": user_id, "date": "2026-10-01", "description": "Rent", "amount": -20000.0, "category": "rent", "raw_row": ""},
        {"user_id": user_id, "date": "2026-10-02", "description": "Power", "amount": -4000.0, "category": "utilities", "raw_row": ""},
        {"user_id": user_id, "date": "2026-10-03", "description": "Mall", "amount": -10000.0, "category": "shopping", "raw_row": ""},
        {"user_id": user_id, "date": "2026-10-04", "description": "Dining", "amount": -5000.0, "category": "food", "raw_row": ""},
    ]
    db_service.insert_transactions(rows)

    # 6.1 Feasible Goal: Target 60000 in 5 months -> required 12000/mo.
    # Available = 11000. Gap = 1000.
    # Max achievable cuts = 20% of (10000 + 5000) = 3000 >= 1000 -> Feasible with cuts!
    client.post("/api/savings-goal", json={"user_id": user_id, "target_amount": 60000.0, "target_months": 5})
    res_plan = client.get(f"/api/savings-plan?user_id={user_id}")
    assert res_plan.status_code == 200
    plan_data = res_plan.json()
    print(f"  GET /api/savings-plan (Feasible):\n  {plan_data}")
    assert plan_data["feasible"] is True
    assert len(plan_data["suggested_cuts"]) > 0
    for cut in plan_data["suggested_cuts"]:
        assert "constraint_applied" in cut
        assert cut["constraint_applied"] == "max_20pct_cap"
        assert "cut_pct" in cut
        assert cut["category"] not in ["rent", "utilities"]
    print("  [PASS] Feasible /savings-plan includes constraint_applied and cut_pct.")

    # 6.2 Infeasible Goal: Target 100000 in 5 months -> required 20000/mo.
    # Available = 11000. Gap = 9000.
    # Max achievable cuts = 3000 < 9000 (Infeasible!)
    client.post("/api/savings-goal", json={"user_id": user_id, "target_amount": 100000.0, "target_months": 5})
    res_infeasible = client.get(f"/api/savings-plan?user_id={user_id}")
    assert res_infeasible.status_code == 200
    infeasible_data = res_infeasible.json()
    print(f"  GET /api/savings-plan (Infeasible):\n  {infeasible_data}")
    assert infeasible_data["feasible"] is False
    assert infeasible_data["gap"] == 9000.0
    assert infeasible_data["max_achievable_savings"] == 3000.0
    print("  [PASS] Infeasible /savings-plan returns feasible=false, gap, and max_achievable_savings clearly.")

    print("\n" + "=" * 70)
    print("ALL CONSTRAINT-SATISFACTION OPTIMIZER TESTS PASSED (6/6)!")
    print("=" * 70)


if __name__ == "__main__":
    test_planner_constraint_satisfaction()
