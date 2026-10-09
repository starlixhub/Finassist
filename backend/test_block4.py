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

from backend.services.ai_engine import call_openrouter, explain_shortage, explain_savings_plan, fallback_explanation
from backend.services.predictor import predict_balance
from backend.services.planner import build_savings_plan
from backend.db.database import db_service
from backend.main import app
from fastapi.testclient import TestClient


def test_ai_explanation_live_and_fallback():
    print("--- 1. Testing OpenRouter Live Call & Fallback ---")
    
    # Live call test
    prompt = (
        "User has ₹11,470 remaining, spending ₹2,541/day on average (top categories: uncategorized, shopping, food). "
        "Predicted shortage on 2026-10-29. In 2 short sentences, explain why this is happening and the single biggest driver. Be direct, no fluff."
    )
    
    explanation = call_openrouter(prompt, kind="shortage", data={"current_balance": 11470, "daily_burn_rate": 2541, "shortage_date": "2026-10-29", "shortage_predicted": True})
    print(f"Generated Explanation:\n  \"{explanation}\"\n")
    assert explanation and len(explanation) > 10, "Explanation should not be empty."

    # Fallback test (with dummy/invalid key)
    orig_key = os.environ.get("OPENROUTER_API_KEY")
    orig_key2 = os.environ.get("OPENROUTER_KEY")
    try:
        os.environ["OPENROUTER_API_KEY"] = "invalid_mock_key_for_testing"
        os.environ["OPENROUTER_KEY"] = "invalid_mock_key_for_testing"
        fallback_res = call_openrouter(
            prompt,
            kind="shortage",
            data={
                "current_balance": 11470,
                "daily_burn_rate": 2541,
                "shortage_date": "2026-10-29",
                "shortage_predicted": True,
            }
        )
        print(f"Fallback Explanation (with invalid key):\n  \"{fallback_res}\"\n")
        assert fallback_res and len(fallback_res) > 10
        assert "11,470" in fallback_res or "2,541" in fallback_res or "2026-10-29" in fallback_res
        print("[PASS] Fallback explanation correctly references calculated numbers without crashing.")
    finally:
        if orig_key:
            os.environ["OPENROUTER_API_KEY"] = orig_key
        else:
            os.environ.pop("OPENROUTER_API_KEY", None)
        if orig_key2:
            os.environ["OPENROUTER_KEY"] = orig_key2
        else:
            os.environ.pop("OPENROUTER_KEY", None)


def test_api_endpoints_with_ai_explanations():
    print("--- 2. Testing /predict and /savings-plan API Endpoints with Explanations ---")
    client = TestClient(app)
    user_id = 960
    db_service.clear_user_data(user_id)

    # 1. Setup user with demo.csv
    client.post("/income", json={"user_id": user_id, "monthly_income": 75000.0})
    demo_path = project_root / "data" / "demo.csv"
    with open(demo_path, "rb") as f:
        client.post(
            "/transactions/upload",
            files={"file": ("demo.csv", f, "text/csv")},
            data={"user_id": str(user_id)}
        )

    # 2. Test GET /predict
    res_pred = client.get(f"/predict?user_id={user_id}&days_ahead=30")
    assert res_pred.status_code == 200
    pred_data = res_pred.json()
    print(f"GET /predict explanation:\n  \"{pred_data['explanation']}\"\n")
    assert pred_data["explanation"] and len(pred_data["explanation"]) > 10

    # 3. Test POST /savings-goal & GET /savings-plan
    client.post("/savings-goal", json={"user_id": user_id, "target_amount": 100000, "target_months": 5})
    res_plan = client.get(f"/savings-plan?user_id={user_id}")
    assert res_plan.status_code == 200
    plan_data = res_plan.json()
    print(f"GET /savings-plan explanation:\n  \"{plan_data['explanation']}\"\n")
    assert plan_data["explanation"] and len(plan_data["explanation"]) > 10

    # 4. Outage resilience test on API (Simulate network failure / bad key -> Must return 200, never 500)
    print("--- 3. Testing Outage / Bad Key Resilience (Must return 200, never 500) ---")
    orig_key = os.environ.get("OPENROUTER_API_KEY")
    orig_key2 = os.environ.get("OPENROUTER_KEY")
    try:
        os.environ["OPENROUTER_API_KEY"] = "mock_bad_key"
        os.environ["OPENROUTER_KEY"] = "mock_bad_key"

        res_pred_fallback = client.get(f"/predict?user_id={user_id}&days_ahead=30")
        assert res_pred_fallback.status_code == 200, f"Expected 200, got {res_pred_fallback.status_code}"
        assert res_pred_fallback.json()["explanation"] != ""

        res_plan_fallback = client.get(f"/savings-plan?user_id={user_id}")
        assert res_plan_fallback.status_code == 200, f"Expected 200, got {res_plan_fallback.status_code}"
        assert res_plan_fallback.json()["explanation"] != ""

        print("[PASS] Both /predict and /savings-plan returned HTTP 200 with fallback explanations when AI service failed.")
    finally:
        if orig_key:
            os.environ["OPENROUTER_API_KEY"] = orig_key
        else:
            os.environ.pop("OPENROUTER_API_KEY", None)
        if orig_key2:
            os.environ["OPENROUTER_KEY"] = orig_key2
        else:
            os.environ.pop("OPENROUTER_KEY", None)

    # Cleanup
    db_service.clear_user_data(user_id)
    print("\nALL BLOCK 4 AI & FALLBACK TESTS PASSED!")


if __name__ == "__main__":
    test_ai_explanation_live_and_fallback()
    test_api_endpoints_with_ai_explanations()
