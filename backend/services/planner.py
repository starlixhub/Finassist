import logging
from collections import defaultdict
from typing import Dict, Any, List, Optional, Union

try:
    from backend.db.database import db_service
    from backend.services.ai_engine import explain_savings_plan
except ImportError:
    from db.database import db_service
    from services.ai_engine import explain_savings_plan

logger = logging.getLogger("finassist.planner")

# Inviolable constraint: categories that cannot be reduced
FIXED_CATEGORIES = ["rent", "utilities"]


class OptimizationResult(list):
    """
    Result wrapper for constraint-satisfaction optimization.
    Inherits from list to behave transparently as a list of suggested cuts for backward compatibility,
    while also providing dict-like access for constraint metadata (feasible, max_achievable_savings, gap).
    """
    def __init__(
        self,
        cuts: List[Dict[str, Any]],
        feasible: bool = True,
        max_achievable_savings: float = 0.0,
        gap: float = 0.0,
    ):
        super().__init__(cuts)
        self.feasible = feasible
        self.max_achievable_savings = max_achievable_savings
        self.gap = gap
        self._dict = {
            "feasible": feasible,
            "max_achievable_savings": max_achievable_savings,
            "gap": gap,
            "cuts": cuts,
            "suggested_cuts": cuts,
        }

    def __getitem__(self, item: Any) -> Any:
        if isinstance(item, str):
            return self._dict[item]
        return super().__getitem__(item)

    def get(self, key: str, default: Any = None) -> Any:
        return self._dict.get(key, default)

    def __contains__(self, item: Any) -> bool:
        if isinstance(item, str) and item in self._dict:
            return True
        return super().__contains__(item)


def optimize_savings_allocation(
    category_totals: Dict[str, float],
    required_monthly_savings: float = 0.0,
    gap: Optional[float] = None,
) -> Union[OptimizationResult, Dict[str, Any]]:
    """
    Constraint-satisfaction optimizer for discretionary budget cuts.
    Formalized as an explicit constraint-satisfaction optimization problem:
      - Objective: Allocate monthly savings target across discretionary spending categories.
      - Inviolable constraint: Fixed essential categories (rent, utilities) cannot be reduced.
      - Category constraint: Maximum reduction capped at 20% per discretionary category.
      - Target constraint: Allocate up to required_monthly_savings to bridge the savings gap.
      - Feasibility check: If total achievable cuts across all discretionary categories
        cannot satisfy required_monthly_savings, returns an explicit infeasibility status
        with max_achievable_savings and gap rather than silently returning a partial plan.
    """
    # Accept either parameter name for seamless caller flexibility
    if required_monthly_savings <= 0.0 and gap is not None and gap > 0.0:
        required_monthly_savings = gap

    # Explicit constraint variables defined per constraint-satisfaction specification
    MAX_CUT_PER_CATEGORY = 0.20    # 20% cap per category
    FIXED_CATEGORIES = ["rent", "utilities"]   # inviolable constraints
    TOTAL_TARGET = float(required_monthly_savings)    # optimization target

    if TOTAL_TARGET <= 0.0 or not category_totals:
        return OptimizationResult([], feasible=True, max_achievable_savings=0.0, gap=0.0)

    # Filter out fixed categories (inviolable constraints) and non-positive spends
    fixed_set = {c.lower().strip() for c in FIXED_CATEGORIES}
    discretionary = [
        {"category": cat, "amount": float(amt)}
        for cat, amt in category_totals.items()
        if cat.lower().strip() not in fixed_set and amt > 0.0
    ]

    # Rank discretionary categories by spend descending
    discretionary.sort(key=lambda c: c["amount"], reverse=True)

    # Calculate total achievable cuts across all discretionary categories
    max_achievable_savings = round(
        sum(round(item["amount"] * MAX_CUT_PER_CATEGORY, 2) for item in discretionary),
        2
    )

    # Feasibility check: if total possible cuts < required savings, return explicit infeasibility
    if max_achievable_savings < TOTAL_TARGET:
        gap_shortfall = round(TOTAL_TARGET - max_achievable_savings, 2)
        return {
            "feasible": False,
            "max_achievable_savings": max_achievable_savings,
            "gap": gap_shortfall,
        }

    cuts: List[Dict[str, Any]] = []
    remaining_gap = TOTAL_TARGET

    for item in discretionary:
        cat_name = item["category"]
        current_spend = item["amount"]

        # Cap cut at 20% of category spend
        max_cut = round(current_spend * MAX_CUT_PER_CATEGORY, 2)
        cut = min(max_cut, round(remaining_gap, 2))

        if cut > 0:
            suggested_spend = round(current_spend - cut, 2)
            cut_pct = round((cut / current_spend) * 100.0, 1)
            reason = f"{int(round(cut_pct))}% reduction in discretionary {cat_name} spend"

            cuts.append({
                "category": cat_name,
                "current": round(current_spend, 2),
                "suggested": suggested_spend,
                "cut_pct": cut_pct,
                "constraint_applied": "max_20pct_cap",
                "reason": reason,
            })
            remaining_gap -= cut

        if remaining_gap <= 0.01:
            break

    return OptimizationResult(
        cuts,
        feasible=True,
        max_achievable_savings=max_achievable_savings,
        gap=0.0,
    )


def suggest_cuts(
    category_totals: Dict[str, float],
    gap: float = 0.0,
    **kwargs
) -> Any:
    """
    Backward-compatibility alias for optimize_savings_allocation().
    """
    return optimize_savings_allocation(category_totals=category_totals, required_monthly_savings=gap, **kwargs)


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

    cuts: List[Dict[str, Any]] = []
    max_achievable: Optional[float] = None

    if not feasible and gap > 0:
        opt_res = optimize_savings_allocation(category_totals, required_monthly_savings=gap)
        if isinstance(opt_res, dict) and not opt_res.get("feasible", True):
            # Infeasible: total possible cuts < required savings gap
            feasible = False
            max_achievable = float(opt_res.get("max_achievable_savings", 0.0))
            cuts = []
        else:
            cuts = list(opt_res)
            max_achievable = getattr(opt_res, "max_achievable_savings", None)
            feasible = True
    else:
        max_achievable = None

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
        "max_achievable_savings": max_achievable,
        "gap": gap,
        "suggested_cuts": cuts,
        "explanation": explanation,
    }
