import logging
from fastapi import APIRouter, HTTPException, Query, status
from typing import Dict, Any

try:
    from backend.schemas.schemas import (
        SavingsGoalRequest,
        SavingsGoalResponse,
        SavingsPlanResponse,
        SuggestedCut,
        ErrorResponse,
    )
    from backend.services.planner import build_savings_plan
    from backend.db.database import db_service
except ImportError:
    from schemas.schemas import (
        SavingsGoalRequest,
        SavingsGoalResponse,
        SavingsPlanResponse,
        SuggestedCut,
        ErrorResponse,
    )
    from services.planner import build_savings_plan
    from db.database import db_service

logger = logging.getLogger("finassist.savings")

router = APIRouter(tags=["Savings"])


@router.post(
    "/savings-goal",
    response_model=SavingsGoalResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        422: {"model": ErrorResponse, "description": "Validation Error"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"},
    },
    summary="Create or update a savings goal",
)
async def create_savings_goal(payload: SavingsGoalRequest):
    """
    Set a target savings goal for the user and determine immediate feasibility.
    Exact spec per API.md:
    Request: { "user_id": 1, "target_amount": 10000, "target_months": 5 }
    Response 200: { "goal_id": 1, "required_monthly_savings": 2000, "feasible": true }
    """
    if payload.target_amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target amount must be greater than zero."
        )

    if payload.target_months <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target months must be at least 1 month."
        )

    try:
        # Save goal to database
        goal_record = db_service.upsert_goal(
            user_id=payload.user_id,
            target_amount=float(payload.target_amount),
            target_months=int(payload.target_months)
        )

        goal_id = goal_record.get("id") or goal_record.get("goal_id", 1)

        # Evaluate plan with current income and spend
        plan = build_savings_plan(
            user_id=payload.user_id,
            target_amount=float(payload.target_amount),
            target_months=int(payload.target_months)
        )

        return SavingsGoalResponse(
            goal_id=int(goal_id),
            required_monthly_savings=float(plan["required_monthly_savings"]),
            feasible=bool(plan["feasible"])
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating savings goal for user {payload.user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create savings goal."
        )


@router.get(
    "/savings-plan",
    response_model=SavingsPlanResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"},
    },
    summary="Get optimized savings plan and discretionary spending cuts",
)
async def get_savings_plan(user_id: int = Query(1, description="User ID")):
    """
    Generate actionable savings plan with suggested cuts to reach target goal.
    Exact spec per API.md:
    Response 200:
    {
      "required_monthly_savings": 2000,
      "suggested_cuts": [...],
      "explanation": "..."
    }
    """
    try:
        plan = build_savings_plan(user_id=user_id)

        cuts = [
            SuggestedCut(
                category=c["category"],
                current=float(c["current"]),
                suggested=float(c["suggested"]),
                cut_pct=float(c["cut_pct"]) if c.get("cut_pct") is not None else None,
                constraint_applied=str(c.get("constraint_applied", "max_20pct_cap")),
                reason=str(c["reason"]),
            )
            for c in plan.get("suggested_cuts", [])
        ]

        return SavingsPlanResponse(
            required_monthly_savings=float(plan["required_monthly_savings"]),
            feasible=bool(plan.get("feasible", True)),
            max_achievable_savings=float(plan["max_achievable_savings"]) if plan.get("max_achievable_savings") is not None else None,
            gap=float(plan.get("gap", 0.0)),
            suggested_cuts=cuts,
            explanation=str(plan["explanation"]),
        )
    except Exception as e:
        logger.error(f"Error generating savings plan for user {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate savings plan."
        )
