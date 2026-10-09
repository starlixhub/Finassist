import logging
from fastapi import APIRouter, HTTPException, Query, status

try:
    from backend.schemas.schemas import PredictResponse, ErrorResponse
    from backend.services.predictor import predict_balance
    from backend.db.database import db_service
except ImportError:
    from schemas.schemas import PredictResponse, ErrorResponse
    from services.predictor import predict_balance
    from db.database import db_service

logger = logging.getLogger("finassist.predict")

router = APIRouter(prefix="/predict", tags=["Predict"])


@router.get(
    "",
    response_model=PredictResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"},
    },
    summary="Predict cash shortage and future balance",
)
async def get_prediction(
    user_id: int = Query(1, description="User ID"),
    days_ahead: int = Query(30, ge=1, le=180, description="Forecast window in days"),
):
    """
    Project future account balance and calculate shortage risk based on historical burn rate.
    Exact spec per API.md & financial_logic.md.
    """
    try:
        prediction = predict_balance(user_id=user_id, days_ahead=days_ahead)

        # Cache prediction in the database
        db_service.insert_prediction(
            user_id=user_id,
            predicted_date=prediction.get("shortage_date"),
            predicted_balance=prediction.get("predicted_balance", 0.0),
            risk_level=prediction.get("risk_level", "low"),
        )

        return PredictResponse(
            current_balance=float(prediction["current_balance"]),
            predicted_balance=float(prediction["predicted_balance"]),
            shortage_predicted=bool(prediction["shortage_predicted"]),
            shortage_date=prediction.get("shortage_date"),
            risk_level=str(prediction["risk_level"]),
            explanation=str(prediction["explanation"]),
        )
    except Exception as e:
        logger.error(f"Error computing prediction for user {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate prediction.",
        )
