import os
import sys
import re
import logging
from pathlib import Path
from fastapi import FastAPI, APIRouter, Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

logger = logging.getLogger("finassist.api")

# Ensure both backend dir and project root are in sys.path
backend_dir = Path(__file__).resolve().parent
project_root = backend_dir.parent
for p in [str(project_root), str(backend_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from backend.routers import income, transactions, dashboard, predict, savings
    from backend.db.database import supabase
except ImportError:
    from routers import income, transactions, dashboard, predict, savings
    from db.database import supabase

app = FastAPI(
    title="Finassist API",
    description="Explainable AI personal finance copilot backend powered by FastAPI & Supabase",
    version="1.0.0",
)


def sanitize_error_text(text: str) -> str:
    """Ensure API keys and database secrets never leak in error messages."""
    if not isinstance(text, str):
        return str(text)
    supabase_key = os.getenv("SUPABASE_KEY", "")
    openrouter_key = os.getenv("OPENROUTER_API_KEY", "") or os.getenv("OPENROUTER_KEY", "")
    sanitized = text
    if supabase_key and len(supabase_key) > 8:
        sanitized = sanitized.replace(supabase_key, "[REDACTED_SECRET]")
    if openrouter_key and len(openrouter_key) > 8:
        sanitized = sanitized.replace(openrouter_key, "[REDACTED_SECRET]")
    sanitized = re.sub(r"eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+", "[REDACTED_JWT]", sanitized)
    sanitized = re.sub(r"sk-or-[A-Za-z0-9_-]+", "[REDACTED_API_KEY]", sanitized)
    return sanitized


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    clean_detail = sanitize_error_text(str(exc.detail))
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": clean_detail, "detail": clean_detail},
        headers=getattr(exc, "headers", None),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    msg = errors[0].get("msg", "Validation error") if errors else "Validation error"
    loc = errors[0].get("loc", ["field"])[-1] if errors else "field"
    clean_msg = sanitize_error_text(f"Invalid input for {loc}: {msg}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"error": clean_msg, "detail": errors},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "An internal server error occurred.",
            "detail": "An internal server error occurred."
        },
    )

# Enable CORS for frontend integration (supporting Vercel production, preview deployments, and local dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "https://finassist.vercel.app",
        "*",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API sub-router mounted under /api
api_router = APIRouter(prefix="/api")
api_router.include_router(income.router)
api_router.include_router(transactions.router)
api_router.include_router(dashboard.router)
api_router.include_router(predict.router)
api_router.include_router(savings.router)

# Mount both /api and root routes for maximum compatibility
app.include_router(api_router)
app.include_router(income.router)
app.include_router(transactions.router)
app.include_router(dashboard.router)
app.include_router(predict.router)
app.include_router(savings.router)

@app.get("/")
async def root():
    return {
        "app": "Finassist API",
        "status": "running",
        "docs": "/docs",
        "api_base": "/api"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
