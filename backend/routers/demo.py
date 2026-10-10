import logging
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status

try:
    from backend.schemas.schemas import DemoLoadRequest, DemoLoadResponse, ErrorResponse
    from backend.services.categorizer import parse_csv
    from backend.db.database import db_service
except ImportError:
    from schemas.schemas import DemoLoadRequest, DemoLoadResponse, ErrorResponse
    from services.categorizer import parse_csv
    from db.database import db_service

logger = logging.getLogger("finassist.demo")

router = APIRouter(prefix="/demo", tags=["Demo"])

# Locate demo.csv in data/ directory
project_root = Path(__file__).resolve().parent.parent.parent
demo_csv_path = project_root / "data" / "demo.csv"
if not demo_csv_path.exists():
    # Fallback to backend sibling or current dir
    demo_csv_path = Path(__file__).resolve().parent.parent / "data" / "demo.csv"


@router.post(
    "/load",
    response_model=DemoLoadResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"},
    },
    summary="1-Click Load Sample Borrower Demo Data (No CSV upload needed)",
)
async def load_sample_borrower_data(
    payload: Optional[DemoLoadRequest] = None,
    user_id: Optional[int] = Query(None, description="Optional user ID override"),
):
    """
    1-Click Demo Seed Endpoint for Hackathon Judges & Frontend Demos:
      - Sets baseline monthly income (₹45,000)
      - Ingests all 25 sample transactions from demo.csv (with categories & anomaly)
      - Pre-configures a standard savings goal (₹10,000 in 5 months)
      - Allows judges and frontend users to test the full system without manually finding and uploading a CSV.
    """
    target_user_id = user_id if user_id is not None else (payload.user_id if payload else 1)
    target_income = payload.monthly_income if payload else 45000.0

    if not demo_csv_path.exists():
        logger.error(f"Demo CSV file not found at {demo_csv_path}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Sample demo data file not found on server."
        )

    try:
        with open(demo_csv_path, "rb") as f:
            csv_bytes = f.read()

        # 1. Parse and categorize sample transactions
        valid_rows, rows_failed, categories_found = parse_csv(csv_bytes, target_user_id)

        # 2. Reset previous data for clean demo state
        db_service.clear_user_data(target_user_id)

        # 3. Configure user profile & monthly income
        db_service.upsert_user(
            user_id=target_user_id,
            monthly_income=target_income,
            name="Demo Borrower"
        )

        # 4. Insert transactions batch
        if valid_rows:
            db_service.insert_transactions(valid_rows)

        # 5. Seed default savings goal (₹10,000 in 5 months)
        db_service.upsert_goal(
            user_id=target_user_id,
            target_amount=10000.0,
            target_months=5
        )

        logger.info(f"Loaded {len(valid_rows)} sample transactions for user {target_user_id}")

        return DemoLoadResponse(
            status="success",
            message="Sample borrower demo data loaded successfully! Financial dashboard, cash-flow forecast, and anomaly spotlight are ready.",
            user_id=target_user_id,
            borrower_name="Demo Borrower",
            monthly_income=target_income,
            rows_imported=len(valid_rows),
            rows_failed=rows_failed,
            categories_found=categories_found,
        )
    except Exception as e:
        logger.error(f"Failed to load sample borrower demo data: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load sample borrower demo data."
        )
