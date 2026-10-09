import sys
from pathlib import Path
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware

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
