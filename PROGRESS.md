# Project Progress — Finassist

## Block 1: Skeleton + Supabase DB Setup (Completed)

### 1. Folder Structure Created
```
backend/
├── main.py                 # FastAPI application with CORS & /api router mounting
├── requirements.txt        # fastapi, uvicorn, supabase, pandas, python-multipart, requests, python-dotenv
├── .env                    # SUPABASE_URL, SUPABASE_KEY, OPENROUTER_API_KEY (gitignored)
├── .env.example            # Environment template
├── routers/
│   ├── income.py           # POST /income
│   ├── transactions.py     # POST /transactions/upload
│   ├── dashboard.py        # GET /dashboard
│   ├── predict.py          # GET /predict
│   └── savings.py          # POST /savings-goal, GET /savings-plan
├── services/
│   ├── categorizer.py      # CSV parse + categorize engine
│   ├── predictor.py        # Cash shortage prediction engine
│   ├── planner.py          # Savings plan logic engine
│   └── ai_engine.py        # OpenRouter / AI explanation synthesis & safe fallback
├── models/
│   └── db_models.py        # Data models for User, Transaction, Goal, Prediction
├── schemas/
│   └── schemas.py          # Pydantic request/response validation schemas
└── db/
    ├── database.py         # Supabase client + resilient SQLite fallback
    └── schema.sql          # Postgres DDL schema for Supabase tables & RLS policies
```

### 2. Database Schema Adjustments (SQLite Spec -> Postgres / Supabase)
- **Primary Keys:** Changed `INTEGER PRIMARY KEY` to `SERIAL PRIMARY KEY` (Postgres sequence).
- **Amounts:** Changed `REAL` to `NUMERIC(12, 2)` for precision and avoiding floating-point rounding errors in currency calculations.
- **Timestamps:** Changed `TIMESTAMP` to `TIMESTAMPTZ DEFAULT NOW()` with timezone awareness.
- **Indexes:** Added indexes on `transactions(user_id, date)`, `transactions(user_id, category)`, `goals(user_id)`, and `predictions(user_id)`.
- **Row-Level Security:** Created RLS policies for hackathon public API access.

---

## Block 2: Transaction Ingest, Categorization & Dashboard Aggregation (Completed)

### 1. Components Implemented
1. **`services/categorizer.py`**:
   - `parse_csv()`: Robust CSV parsing using Pandas with multi-encoding fallback (`utf-8`, `latin1`).
   - Flexible header normalization (`desc`/`narration`/`particulars` -> `description`, `txn_date`/`value_date` -> `date`, `debit`/`credit` or `withdrawal`/`deposit` -> signed `amount`).
   - Multi-format date parser (`%d/%m/%Y`, `%Y-%m-%d`, `%d-%m-%Y`, `%d-%b-%Y`, `%m/%d/%Y`, `%Y/%m/%d`, `%d/%m/%y`, pandas fallback).
   - Amount sanitizer stripping currency symbols (`₹`, `$`, `Rs.`, `INR`, commas, whitespace).
   - Sign convention strictly enforced: `expense = negative`, `income = positive` (`amount = credit - debit`).
   - Keyword rule-based categorization per `dataprocessing.md` across 6 categories + `uncategorized`.
   - Row-by-row error handling: invalid rows do not crash parser and are recorded in `rows_failed`.

2. **`routers/income.py`**:
   - `POST /income` and `POST /api/income`: Validates and upserts user monthly income in the database.
   - Exact request/response contract matching `API.md`.

3. **`routers/transactions.py`**:
   - `POST /transactions/upload` and `POST /api/transactions/upload`: Accepts multipart CSV uploads, extracts rows, runs categorization, and saves batch records.
   - Returns `{ "rows_imported": 25, "rows_failed": 0, "categories_found": [...] }`.

4. **`routers/dashboard.py`**:
   - `GET /dashboard?user_id=1` and `GET /api/dashboard?user_id=1`: Fetches user income and transactions.
   - Aggregates expenses by category (`sum(abs(amount))` for negative transactions).
   - Computes `remaining_balance = monthly_income - total_expenses`.
   - Returns breakdown sorted descending by spend amount.

5. **`data/demo.csv`**:
   - 25 realistic transactions covering 7 categories (Food, Transport, Rent, Shopping, Subscriptions, Utilities, Uncategorized).
   - Contains a clear anomaly: ₹28,500 for emergency motherboard repair.

---

## Block 3: Prediction Engine & Savings Planner (Completed)

### 1. Exact Formulas Implemented (Pure Deterministic Math per `financial_logic.md`)
- **Daily Burn Rate:** `daily_burn_rate = total_expenses_last_N_days / N` (where `N = max(14, date_span)`).
- **Days Remaining:** `days_remaining = current_balance / daily_burn_rate`.
- **Predicted Balance:** `predicted_balance(d) = current_balance - (daily_burn_rate * d)` where `d = days_ahead`.
- **Shortage Date:** `shortage_date = today + days_remaining` (triggered if `days_remaining < days_ahead`).
- **Risk Level Thresholds:** `< 7` days $\rightarrow$ `"high"`, `7–21` days $\rightarrow$ `"medium"`, `> 21` days $\rightarrow$ `"low"`.
- **Savings Planner:** `required_monthly_savings = target_amount / target_months`, `feasible = available_monthly >= required_monthly_savings`.
- **Discretionary Cut Algorithm:** Skips `FIXED_CATEGORIES` (`rent`, `utilities`), caps at $20\%$ per category.

---

## Block 4: OpenRouter AI Explanation Layer & Safe Fallback (Completed)

### 1. Components Implemented
1. **`services/ai_engine.py`**:
   - `call_openrouter()`: Issues requests to OpenRouter completions endpoint with an 8-second timeout, `temperature=0.3`, `max_tokens=300`.
   - `explain_shortage()`: Uses prompt template from `ai_recommendation_logic.md` to explain shortage drivers and runway.
   - `explain_savings_plan()`: Uses savings plan prompt template to explain required monthly targets and rationale behind specific discretionary cuts.
   - `fallback_explanation()`: High-quality deterministic template dynamically embedding computed numbers.
   - Supports both `OPENROUTER_API_KEY` and `OPENROUTER_KEY` environment variables.

2. **Integration into Routers**:
   - `GET /predict` and `services/predictor.py` wire AI/fallback explanations into the response `explanation` field.
   - `GET /savings-plan` and `services/planner.py` wire AI/fallback explanations into the response `explanation` field.

3. **Environment Templates & Security**:
   - Root and `backend/` `.env.example` templates updated with `OPENROUTER_API_KEY=` and `OPENROUTER_MODEL=anthropic/claude-3.5-sonnet`.
   - `.gitignore` verified to protect all `.env` files from commits.

---

## Final Demo-Readiness Sanity Pass Summary

Executed the complete 6-step integration demo flow against [`data/demo.csv`](file:///c:/Users/ugale/OneDrive/Desktop/Finassist/data/demo.csv) via [`backend/demo_sanity_pass.py`](file:///c:/Users/ugale/OneDrive/Desktop/Finassist/backend/demo_sanity_pass.py):

| Flow Step | Endpoint | Method | State | Status Code | API.md Spec Match | Notes |
|---|---|---|---|---|---|---|
| **1. Set Income** | `/income` & `/api/income` | `POST` | **DONE** | `200 OK` | **100% Match** | Sets `monthly_income = 45000.0` |
| **2. Ingest CSV** | `/transactions/upload` | `POST` | **DONE** | `200 OK` | **100% Match** | 25 rows imported, 0 failed, 7 categories found |
| **3. Financial Dashboard** | `/dashboard?user_id=1` | `GET` | **DONE** | `200 OK` | **100% Match** | Expenses: ₹63,530.0, Remaining: -₹18,530.0 |
| **4. Shortage Prediction** | `/predict?user_id=1` | `GET` | **DONE** | `200 OK` | **100% Match** | High risk shortage detected by 2026-10-25 |
| **5. Create Savings Goal** | `/savings-goal` | `POST` | **DONE** | `200 OK` | **100% Match** | Goal ₹10,000 in 5mo $\rightarrow$ ₹2,000/mo required |
| **6. Savings Plan & Cuts** | `/savings-plan?user_id=1` | `GET` | **DONE** | `200 OK` | **100% Match** | Proposes 20% cuts on discretionary, preserves rent |

### Zero 500 Errors
- All 6 endpoints returned `HTTP 200 OK`.
- Resilient fallback activated during AI network latency/key unavailability without surfacing errors.

---

## Block 5: Deployment to Render & Vercel Integration Readiness (Completed)

### 1. Render Web Service Deployment Configuration
- **Repository:** `https://github.com/starlixhub/Finassist` (branch `main`)
- **Root Directory:** `backend/` (or root with `render.yaml`)
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Blueprint:** [`render.yaml`](file:///c:/Users/ugale/OneDrive/Desktop/Finassist/render.yaml) created for seamless deployment.
- **Render Live Base URL:** `https://finassist-backend.onrender.com`
- **Interactive Swagger Docs (Live):** `https://finassist-backend.onrender.com/docs`
- **API Base Route:** `https://finassist-backend.onrender.com/api`

### 2. Environment Variables Configured on Render (Names Only)
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL` (e.g. `anthropic/claude-3.5-sonnet`)

### 3. Frontend Vercel Integration & CORS Readiness
- **Frontend Deployment:** Deploys separately to Vercel (teammate's task).
- **CORS Configured in `backend/main.py`:**
  - Production Vercel domain: `https://finassist.vercel.app`
  - Preview deployments wildcard regex: `https://finassist-*.vercel.app` (`allow_origin_regex=r"https://.*\.vercel\.app"`)
  - Local dev origins: `http://localhost:3000`, `http://localhost:5173`, `http://127.0.0.1:3000`, `http://127.0.0.1:5173`, `*`
  - `allow_credentials=True`, `allow_methods=["*"]`, `allow_headers=["*"]`

### 4. Integration Verification
- Full 6-step flow verified with zero 500 errors:
  1. `POST /api/income` (200 OK)
  2. `POST /api/transactions/upload` (200 OK)
  3. `GET /api/dashboard?user_id=1` (200 OK)
  4. `GET /api/predict?user_id=1&days_ahead=30` (200 OK)
  5. `POST /api/savings-goal` (200 OK)
  6. `GET /api/savings-plan?user_id=1` (200 OK)
- [`API.md`](file:///c:/Users/ugale/OneDrive/Desktop/Finassist/API.md) and [`integration_guide.md`](file:///c:/Users/ugale/OneDrive/Desktop/Finassist/integration_guide.md) updated with live endpoints and Vercel configuration instructions.

