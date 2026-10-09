import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from typing import List

try:
    from backend.schemas.schemas import UploadResponse, ErrorResponse
    from backend.services.categorizer import parse_csv
    from backend.db.database import db_service
except ImportError:
    from schemas.schemas import UploadResponse, ErrorResponse
    from services.categorizer import parse_csv
    from db.database import db_service

logger = logging.getLogger("finassist.transactions")

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.post(
    "/upload",
    response_model=UploadResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Malformed CSV / Bad Input"},
        422: {"model": ErrorResponse, "description": "Validation Error"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"},
    },
    summary="Upload and categorize CSV transactions",
)
async def upload_transactions(
    file: UploadFile = File(..., description="CSV bank or card statement file"),
    user_id: int = Form(1, description="User ID for transaction ownership"),
):
    """
    Ingest CSV transactions, normalize headers, parse multi-format dates,
    categorize using explainable rule-based logic, and store into Supabase/DB.
    
    Returns:
    - rows_imported: Count of successfully imported transactions
    - rows_failed: Count of unparseable or invalid rows
    - categories_found: List of unique categories identified
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided in upload."
        )

    if not file.filename.lower().endswith((".csv", ".txt")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload a CSV file."
        )

    try:
        content = await file.read()
    except Exception as e:
        logger.error(f"Failed to read uploaded file: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not read upload stream: {str(e)}"
        )

    if not content or len(content.strip()) == 0:
        return UploadResponse(
            rows_imported=0,
            rows_failed=0,
            categories_found=[]
        )

    try:
        # Parse CSV content into normalized rows
        valid_rows, rows_failed, categories_found = parse_csv(content, user_id=user_id)

        # Store valid rows using db_service
        if valid_rows:
            db_service.insert_transactions(valid_rows)

        return UploadResponse(
            rows_imported=len(valid_rows),
            rows_failed=rows_failed,
            categories_found=categories_found
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing transaction upload: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process and store transactions: {str(e)}"
        )
