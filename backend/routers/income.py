import logging
from fastapi import APIRouter, HTTPException, status

try:
    from backend.schemas.schemas import IncomeRequest, IncomeResponse, ErrorResponse
    from backend.db.database import db_service
except ImportError:
    from schemas.schemas import IncomeRequest, IncomeResponse, ErrorResponse
    from db.database import db_service

logger = logging.getLogger("finassist.income")

router = APIRouter(prefix="/income", tags=["Income"])


@router.post(
    "",
    response_model=IncomeResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        422: {"model": ErrorResponse, "description": "Validation Error"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"},
    },
    summary="Set or update monthly income for a user",
)
async def set_income(payload: IncomeRequest):
    """
    Set or update monthly income in the database.
    Exact spec per API.md:
    Request: { "user_id": 1, "monthly_income": 45000 }
    Response 200: { "user_id": 1, "monthly_income": 45000 }
    """
    if payload.monthly_income <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Monthly income must be greater than zero."
        )

    try:
        updated = db_service.upsert_user(
            user_id=payload.user_id,
            monthly_income=float(payload.monthly_income)
        )
        return IncomeResponse(
            user_id=payload.user_id,
            monthly_income=float(updated["monthly_income"])
        )
    except Exception as e:
        logger.error(f"Error setting income for user {payload.user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error setting income: {str(e)}"
        )
