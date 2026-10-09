import time
import asyncio
from collections import defaultdict
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

# Rate limit tracking: max 20 uploads per minute per user_id
_upload_timestamps = defaultdict(list)
RATE_LIMIT_WINDOW = 60.0  # seconds
MAX_UPLOADS_PER_WINDOW = 20
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def check_rate_limit(user_id: int):
    now = time.time()
    valid_ts = [t for t in _upload_timestamps[user_id] if now - t < RATE_LIMIT_WINDOW]
    if len(valid_ts) >= MAX_UPLOADS_PER_WINDOW:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Upload rate limit exceeded. Please wait a moment before trying again."
        )
    valid_ts.append(now)
    _upload_timestamps[user_id] = valid_ts


@router.post(
    "/upload",
    response_model=UploadResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Malformed CSV / Bad Input"},
        422: {"model": ErrorResponse, "description": "Validation Error"},
        429: {"model": ErrorResponse, "description": "Too Many Requests"},
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
    
    Guards included:
    - Rate-limit per user (max 20 uploads / min)
    - 5MB maximum file size limit
    - 15-second parsing timeout guard
    - Graceful 400s on empty files or missing required columns
    - Sanitized error responses with zero secret leakage
    """
    check_rate_limit(user_id)

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
            detail="Could not read upload stream."
        )

    if not content or len(content.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded CSV file is empty."
        )

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 5MB limit. Please upload a smaller file."
        )

    try:
        # Run parsing in worker thread with 15s timeout guard
        valid_rows, rows_failed, categories_found = await asyncio.wait_for(
            asyncio.to_thread(parse_csv, content, user_id),
            timeout=15.0
        )

        # Store valid rows using db_service
        if valid_rows:
            db_service.insert_transactions(valid_rows)

        return UploadResponse(
            rows_imported=len(valid_rows),
            rows_failed=rows_failed,
            categories_found=categories_found
        )
    except asyncio.TimeoutError:
        logger.warning(f"CSV processing timed out for user {user_id}")
        raise HTTPException(
            status_code=status.HTTP_408_REQUEST_TIMEOUT,
            detail="CSV processing timed out. Please reduce file size and try again."
        )
    except ValueError as ve:
        # Catches missing columns, empty data rows, decode errors as graceful 400
        logger.info(f"CSV validation rejected: {ve}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing transaction upload: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process and store transactions."
        )

