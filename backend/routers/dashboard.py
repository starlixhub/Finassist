import logging
from collections import defaultdict
from fastapi import APIRouter, HTTPException, Query, status
from typing import Dict, List

try:
    from backend.schemas.schemas import DashboardResponse, CategorySpend, ErrorResponse
    from backend.db.database import db_service
except ImportError:
    from schemas.schemas import DashboardResponse, CategorySpend, ErrorResponse
    from db.database import db_service

logger = logging.getLogger("finassist.dashboard")

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get(
    "",
    response_model=DashboardResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        404: {"model": ErrorResponse, "description": "User not found"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"},
    },
    summary="Get aggregated financial dashboard for user",
)
async def get_dashboard(user_id: int = Query(1, description="User ID")):
    """
    Compute total expenses, remaining balance, and expense breakdown by category.
    
    Calculation rules per dataprocessing.md:
    - total_expenses = sum(abs(t.amount) for t in transactions if t.amount < 0)
    - by_category = grouped sum of expenses by category (sorted descending)
    - remaining_balance = monthly_income - total_expenses
    """
    try:
        user_info = db_service.get_user(user_id)
        monthly_income = float(user_info.get("monthly_income", 0.0)) if user_info else 0.0

        transactions = db_service.get_transactions(user_id)

        category_totals: Dict[str, float] = defaultdict(float)
        total_expenses = 0.0

        for tx in transactions:
            amt = float(tx.get("amount", 0.0))
            cat = tx.get("category") or "uncategorized"
            
            # Expenses are represented as negative amounts
            if amt < 0:
                expense_amt = abs(amt)
                total_expenses += expense_amt
                category_totals[cat] += expense_amt

        # Format by_category list sorted by spend amount descending
        by_category = [
            CategorySpend(category=cat, amount=round(spend, 2))
            for cat, spend in sorted(category_totals.items(), key=lambda x: x[1], reverse=True)
        ]

        remaining_balance = round(monthly_income - total_expenses, 2)

        return DashboardResponse(
            monthly_income=round(monthly_income, 2),
            total_expenses=round(total_expenses, 2),
            remaining_balance=remaining_balance,
            by_category=by_category
        )
    except Exception as e:
        logger.error(f"Error generating dashboard for user {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch dashboard data."
        )
