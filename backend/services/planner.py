import logging
from collections import defaultdict
from typing import Dict, Any, List, Optional

try:
    from backend.db.database import db_service
    from backend.services.ai_engine import explain_savings_plan
except ImportError:
    from db.database import db_service
    from services.ai_engine import explain_savings_plan

logger = logging.getLogger("finassist.planner")

# Categories that cannot be reduced
FIXED_CATEGORIES = {"rent", "utilities", "bills", "insurance", "loan", "emi"}


def suggest_cuts(category_totals: Dict[str, float], gap: float) -> List[Dict[str, Any]]:
    """
    Generate suggested discretionary budget cuts to bridge the monthly savings gap.
    Algorithm per financial_logic.md:
      - Skip FIXED_CATEGORIES (rent, utilities)
      - Sort discretionary categories by amount descending
      - Cap cut at 20% of each category spend
    """
    if gap <= 0 or not category_totals:
        return []

    # Filter out fixed categories and zero spends
    discretionary = [
        {"category": cat, "amount": amt}
        for cat, amt in category_totals.items()
        if cat.lower() not in FIXED_CATEGORIES and amt > 0
    ]

    # Rank by spend descending
    discretionary.sort(key=lambda c: c["amount"], reverse=True)

    cuts = []
    remaining_gap = gap

    for item in discretionary:
        cat_name = item["category"]
        current_spend = item["amount"]
        
        # Cap cut at 20% of category spend
        max_cut = round(current_spend * 0.20, 2)
        cut = min(max_cut, round(remaining_gap, 2))

        if cut > 0:
            suggested_spend = round(current_spend - cut, 2)
            pct = int(round((cut / current_spend) * 100))
            reason = f"{pct}% reduction in discretionary {cat_name} spend"
            
            cuts.append({
                "category": cat_name,
                "current": round(current_spend, 2),
                "suggested": suggested_spend,
                "reason": reason
            })
            remaining_gap -= cut

        if remaining_gap <= 0.01:
            break

    return cuts


def build_savings_plan(
    user_id: int,
    target_amount: Optional[float] = None,
    target_months: Optional[int] = None
) -> Dict[str, Any]:
    """
    Calculate required monthly savings, evaluate feasibility, and propose cuts.
    Formula per financial_logic.md:
      - required_monthly_savings = target_amount / target_months
      - available_monthly = monthly_income - total_monthly_expenses
      - feasible = available_monthly >= required_monthly_savings
      - gap = required_monthly_savings - available_monthly (if not feasible)
    """
    # Fetch user goal if not explicitly passed
    if target_amount is None or target_months is None:
        goal = db_service.get_latest_goal(user_id)
        if goal:
            target_amount = float(goal.get("target_amount", 10000.0))
            target_months = int(goal.get("target_months", 5))
        else:
            target_amount = 10000.0
            target_months = 5

    # Guard target_months <= 0
    target_months = max(target_months, 1)
    target_amount = max(target_amount, 0.0)

    required_monthly_savings = round(target_amount / target_months, 2)

    # Fetch user financial stats
    user = db_service.get_user(user_id)
    monthly_income = float(user.get("monthly_income", 0.0)) if user else 0.0

    transactions = db_service.get_transactions(user_id)
    
    total_expenses = 0.0
    category_totals: Dict[str, float] = defaultdict(float)

    for t in transactions:
        amt = float(t.get("amount", 0.0))
        if amt < 0:
            expense = abs(amt)
            total_expenses += expense
            cat = (t.get("category") or "uncategorized").lower().strip()
            category_totals[cat] += expense

    available_monthly = round(monthly_income - total_expenses, 2)
    feasible = available_monthly >= required_monthly_savings
    gap = round(required_monthly_savings - available_monthly, 2) if not feasible else 0.0

    cuts = suggest_cuts(category_totals, gap)

    explanation = explain_savings_plan(
        target_amount=target_amount,
        target_months=target_months,
        required_monthly_savings=required_monthly_savings,
        category_breakdown=dict(category_totals),
        suggested_cuts=cuts,
        feasible=feasible,
        gap=gap,
    )

    return {
        "required_monthly_savings": required_monthly_savings,
        "feasible": feasible,
        "gap": gap,
        "suggested_cuts": cuts,
        "explanation": explanation,
    }
