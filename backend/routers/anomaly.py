import logging
from fastapi import APIRouter, HTTPException, Query, status

try:
    from backend.schemas.schemas import AnomalySpotlightResponse, ErrorResponse
    from backend.services.anomaly import find_anomaly_spotlight
except ImportError:
    from schemas.schemas import AnomalySpotlightResponse, ErrorResponse
    from services.anomaly import find_anomaly_spotlight

logger = logging.getLogger("finassist.anomaly_router")

router = APIRouter(tags=["Anomaly"])


@router.get(
    "/anomaly-spotlight",
    response_model=AnomalySpotlightResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"},
    },
    summary="Get single highest-deviation spending anomaly with AI explanation",
)
async def get_anomaly_spotlight(user_id: int = Query(1, description="User ID")):
    """
    Surface the single biggest spending anomaly prominently, AI-explained,
    as a standalone highlight.
    
    Response format:
    {
      "transaction": {
        "id": 19,
        "user_id": 1,
        "date": "2026-10-18",
        "description": "Emergency Laptop Motherboard Repair",
        "amount": -28500.0,
        "category": "uncategorized"
      },
      "deviation_pct": 6767.5,
      "explanation": "..."
    }
    """
    try:
        spotlight = find_anomaly_spotlight(user_id=user_id)
        return AnomalySpotlightResponse(
            transaction=spotlight.get("transaction"),
            deviation_pct=float(spotlight.get("deviation_pct", 0.0)),
            explanation=str(spotlight.get("explanation", "")),
        )
    except Exception as e:
        logger.error(f"Error finding anomaly spotlight for user {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate anomaly spotlight."
        )
