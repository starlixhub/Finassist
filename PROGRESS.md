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
---

## Block 6: Robustness, Edge-Case Stress Testing & Security Audit (Completed)

### 1. Edge Cases Tested & Verified
All stress tests implemented and automated via [`backend/test_stress_edge_cases.py`](file:///c:/Users/ugale/OneDrive/Desktop/Finassist/backend/test_stress_edge_cases.py):

| Test Case | Input / Condition | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| **CSV Wrong Columns** | CSV with `name,age,department,salary` | `400 Bad Request` with clear missing column error | `400 Bad Request` | **PASS** |
| **CSV Empty File** | 0 bytes / empty whitespace file | `400 Bad Request` with "empty file" detail | `400 Bad Request` | **PASS** |
| **CSV Non-UTF8 Encoding** | ISO-8859-1 (Latin-1) accented characters (`Café`) | Decodes smoothly, `200 OK` | `200 OK` (2 imported) | **PASS** |
| **CSV Huge Numbers** | `amount = 1e30` or `999999999999999999999999999999` | Graceful row failure (`rows_failed=1`), `200 OK` (no 500) | `200 OK` | **PASS** |
| **CSV 5 Date Formats** | ISO, `DD/MM/YYYY`, `MM/DD/YYYY`, `DD-Mon-YYYY`, `DD.MM.YYYY` | `200 OK`, all 5 rows imported | `200 OK` (5 imported, 0 failed) | **PASS** |
| **Savings Goal Validation** | `target_months=0` or `target_amount=-5000` | `422 Unprocessable Entity`, no crash | `422 Unprocessable Entity` | **PASS** |
| **Predict New User** | `user_id` with 0 transactions & 0 income | `200 OK`, sane empty state, no division-by-zero | `200 OK`, clear explanation | **PASS** |
| **OpenRouter Down** | Invalidate/kill `OPENROUTER_API_KEY` | `200 OK`, deterministic rule-based explanation | `200 OK` | **PASS** |
| **File Size Guard** | Upload statement CSV > 5MB | `400 Bad Request` file size exceeds limit | `400 Bad Request` | **PASS** |
| **Secret Leak Check** | Probe all routes & 400/422/500 errors for keys/JWTs | Zero secrets or auth tokens leaked | **0 leaks detected** | **PASS** |

### 2. Bugs Found & Fixed
1. **Uninformative Upload Responses on Malformed Files:**
   - *Bug:* Uploading a CSV with wrong columns or empty content did not throw a 400 Bad Request, returning 0 rows imported silently.
   - *Fix:* Added column validation in `parse_csv` requiring `date` and `amount` (or `debit`/`credit`), throwing clean `ValueError` $\rightarrow$ `HTTPException(400)`.
2. **Huge Float / Number Overflow:**
   - *Bug:* Values $> 10^{12}$ or `NaN`/`Inf` could trigger calculation errors or Postgres numeric overflow.
   - *Fix:* Added sanity boundary checks in `clean_amount` marking such rows as failed gracefully.
3. **New User Empty-State Explanation Flaw:**
   - *Bug:* New users with ₹0 balance and 0 burn rate previously triggered the `balance <= 0` condition, generating confusing "Your balance is currently in deficit (₹0)" messages.
   - *Fix:* Reordered conditions in `fallback_explanation` and `explain_shortage` to prioritize `burn_rate == 0.0`, returning clear onboarding guidance ("No transactions or income recorded yet. Set monthly income and upload CSV...").
4. **Potential Error Secret Leakage:**
   - *Bug:* Handlers interpolating `{str(e)}` into client-facing `detail` could theoretically leak internal connection strings or tokens if a client library error occurred.
   - *Fix:* Sanitized all router error details to generic messages, and implemented global exception handlers with regex redaction for JWTs, OpenRouter keys, and Supabase credentials.

### 3. Demo-Day Avoidance & Operational Notes
- **File Size:** Keep uploaded bank statements under 5MB (the built-in guard will reject files $\ge 5$MB with 400).
- **User Onboarding Flow:** Always set income (`POST /api/income`) before requesting savings plans (`GET /api/savings-plan`) so the planner calculates feasible surplus targets rather than a deficit.
- **AI Latency:** In case of OpenRouter rate limits or transient network outages, the backend automatically falls back to rule-based explanations in $< 50$ms without surfacing any 500 errors.

---

## Block 7: Anomaly Spotlight — The Designated Demo "Wow Moment" (Completed)

### 1. Endpoint Confirmed Live
- **Endpoint:** `GET /anomaly-spotlight?user_id=1` & `GET /api/anomaly-spotlight?user_id=1`
- **Purpose:** Surfaces the single highest-deviation spending transaction prominently, AI-explained, as a standalone highlight banner/card rather than being buried in a list of transactions.
- **Contract:**
  ```json
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
    "explanation": "This ₹28,500 spend on Emergency Laptop Motherboard Repair stands out as it is 6767% above your typical uncategorized baseline (₹415), representing your single largest spending spike."
  }
  ```

### 2. Demo-Readiness Verification Against `data/demo.csv`
- Successfully identifies the planted emergency expenditure: **`Emergency Laptop Motherboard Repair` (₹28,500)**.
- Category baseline calculated: **₹415.0** (Hardware Store).
- Deviation percentage: **+6,767.5%**.
- AI Narrative: Sharp, single-sentence explanation flagging why it stands out and highlighting the spending spike.
- Empty User Handling: Returns `{"transaction": null, "deviation_pct": 0.0, "explanation": "No expense transactions recorded yet to analyze for spending anomalies."}` without error or crash.
- Designation: **Official demo "wow moment"** to present to hackathon judges to showcase explainable AI copilot capabilities.

---

## Block 8: Time-Series Cash-Flow Forecasting via Exponential Moving Average (EMA) (Completed)

### 1. Mathematical Formulation & Architecture
- **Requirement:** Upgrade cash shortage predictor from a flat burn rate to time-series forecasting to satisfy hackathon Problem Statement criteria.
- **Daily Spend Aggregation:** Expenses are aggregated into daily transaction sums ($S_t = \sum \text{expenses on day } t$) and sorted chronologically.
- **EMA Seeding:** Seeded with the average daily spend over the first 3 days:
  $$\text{EMA}_3 = \frac{S_1 + S_2 + S_3}{3}$$
- **Time-Series Recurrence Formula:**
  $$\text{EMA}_t = \alpha \cdot S_t + (1 - \alpha) \cdot \text{EMA}_{t-1}, \quad \text{with } \alpha = 0.3$$
- **Downstream Runway & Shortage Projection:**
  - $\text{predicted\_balance}(d) = \text{current\_balance} - (\text{EMA} \cdot d)$
  - $\text{days\_remaining} = \frac{\text{current\_balance}}{\text{EMA}}$
  - $\text{shortage\_date} = \text{today} + \text{days\_remaining}$ (if $\text{days\_remaining} < \text{days\_ahead}$)
  - $\text{risk\_level}$: $< 7$ days $\rightarrow$ `"high"`, $7–21$ days $\rightarrow$ `"medium"`, $> 21$ days $\rightarrow$ `"low"`.

### 2. Transparent Explainability Fields Added to `/predict`
- `"forecast_method"`: `"EMA (alpha=0.3)"` (or `"simple_average (insufficient data)"` on fallback).
- `"data_points_used"`: Number of historical transaction data points utilized ($N$).
- Judges and frontend clients can verify that real time-series forecasting is running under the hood.

### 3. Graceful Fallback Strategy Tested
- **Condition:** If fewer than 5 transactions are present ($N < 5$), the engine falls back to simple average burn rate ($N=14$ window) and flags `"forecast_method": "simple_average (insufficient data)"`.
- **Empty-state:** 0 transactions returns `"forecast_method": "simple_average (insufficient data)"` with `data_points_used = 0` and low risk without division-by-zero crash.

### 4. Automated Verification Suite (`backend/test_predictor_ema.py`)
All 6 test suites automated and verified:
1. **0 Transactions:** Handled gracefully, returns `"simple_average (insufficient data)"`, `data_points_used = 0`.
2. **3 Transactions (Sparse Fallback):** Falls back to simple average, returns `data_points_used = 3`.
3. **4 Transactions (Boundary Fallback):** Falls back to simple average, returns `data_points_used = 4`.
4. **5 Transactions (Boundary EMA Trigger):** Triggers `"EMA (alpha=0.3)"`, returns `data_points_used = 5` with exact recurrence match.
5. **Full `demo.csv` (25 Rows):** Returns `"forecast_method": "EMA (alpha=0.3)"`, `data_points_used = 25`, daily spend ₹1,268, high risk shortage by 2026-10-25.
6. **Multiple Transactions On Same Day:** Correctly sums daily spend before applying EMA recurrence.

---

## Block 9: Constraint-Satisfaction Savings Optimizer Refactor (Completed)

### 1. Architectural & Formalization Upgrade
- **Formalization:** Refactored `suggest_cuts()` into `optimize_savings_allocation()` formulated as an explicit constraint-satisfaction optimization problem.
- **Inviolable Constraints:** `FIXED_CATEGORIES = ["rent", "utilities"]` strictly protected from any reduction.
- **Category Bound Constraints:** `MAX_CUT_PER_CATEGORY = 0.20` enforces a 20% maximum reduction ceiling on discretionary spend.
- **Optimization Target:** `TOTAL_TARGET = required_monthly_savings` explicitly defined as variables at the top of the function.
- **Docstring:** Explicitly documents the problem as a "constraint-satisfaction optimizer for discretionary budget cuts."
- **Backward Compatibility:** `suggest_cuts` maintained as an alias, returning transparently compatible `OptimizationResult` objects.

### 2. Constraint Metadata Added
- Every cut in the response contains constraint audit metadata:
  ```json
  {
    "category": "food",
    "current": 9800.0,
    "suggested": 8000.0,
    "cut_pct": 18.4,
    "constraint_applied": "max_20pct_cap",
    "reason": "18% reduction in discretionary food spend"
  }
  ```

### 3. Infeasible Goal Handling
- Rather than silently returning an incomplete partial plan, when total possible cuts across all discretionary categories cannot reach the required savings target:
  ```json
  {
    "feasible": false,
    "max_achievable_savings": 3000.0,
    "gap": 2000.0
  }
  ```
- `/savings-plan` and `SavingsPlanResponse` updated with `feasible`, `max_achievable_savings`, and `gap` to clearly expose shortfalls to clients and judges.

### 4. Automated Verification Suite (`backend/test_planner_optimizer.py`)
All 6 tests automated and verified:
1. **Docstring Check:** Explicitly includes "constraint-satisfaction".
2. **Variable Definitions:** `MAX_CUT_PER_CATEGORY = 0.20`, `FIXED_CATEGORIES = ["rent", "utilities"]`, `TOTAL_TARGET = required_monthly_savings` verified via AST/source inspection.
3. **Cut Metadata:** Verifies `cut_pct=18.4`, `constraint_applied="max_20pct_cap"` on test category.
4. **Infeasible Case:** Verifies `{ "feasible": False, "max_achievable_savings": 3000.0, "gap": 2000.0 }`.
5. **suggest_cuts Alias:** Confirms exact backward-compatible behavior.
6. **API Integration (GET `/savings-plan`):** Feasible plan returns `constraint_applied` on all cuts; infeasible plan clearly returns `feasible=false`, `gap`, and `max_achievable_savings`.

---

## Block 10: 1-Click Demo Ingest & Explicit Data Confidence Level (Completed)

### 1. 1-Click Demo Seed Endpoint (`POST /api/demo/load` & `POST /demo/load`)
- **Purpose:** Solves the hackathon Problem Statement requirement for loading sample borrower data without requiring a manual CSV file upload step.
- **Workflow Executed:**
  1. Resets existing user data for `user_id` (defaults to 1).
  2. Sets sample monthly borrower income (`₹45,000`).
  3. Ingests all 25 pre-categorized transactions from `data/demo.csv` into the user account.
  4. Seeds a realistic default savings goal (`₹50,000` over `6` months).
- **Response Contract:**
  ```json
  {
    "status": "success",
    "message": "Sample borrower demo data loaded successfully! Financial dashboard, cash-flow forecast, and anomaly spotlight are ready.",
    "user_id": 1,
    "borrower_name": "Demo Borrower",
    "monthly_income": 45000.0,
    "rows_imported": 25,
    "rows_failed": 0,
    "categories_found": ["food", "rent", "shopping", "subscriptions", "transport", "uncategorized", "utilities"]
  }
  ```

### 2. Explicit Confidence Metric on `GET /predict`
- **Metric Added:** `"confidence_level": "high" | "medium" | "low"` in `GET /predict` and `GET /api/predict`.
- **Classification Thresholds (Based on `data_points_used`):**
  - $\ge 14$ transactions $\rightarrow$ `"high"` (captures standard 2-week/month runway cycle).
  - $5–13$ transactions $\rightarrow$ `"medium"` (sufficient for EMA time-series, moderate confidence).
  - $< 5$ transactions $\rightarrow$ `"low"` (insufficient data, triggers simple average fallback).
- **Exposed in Response:**
  ```json
  {
    "current_balance": -18530.0,
    "predicted_balance": -56576.3,
    "shortage_predicted": true,
    "shortage_date": "2026-10-25",
    "risk_level": "high",
    "explanation": "...",
    "forecast_method": "EMA (alpha=0.3)",
    "data_points_used": 25,
    "confidence_level": "high"
  }
  ```

### 3. Automated Verification Suite (`backend/test_demo_load.py`)
All 5 tests automated and verified:
1. `POST /api/demo/load` & `POST /demo/load` (25 rows imported, status 200).
2. `GET /api/dashboard` verification (balance, income, expenses reflect imported transactions).
3. `GET /api/predict` returns `confidence_level: "high"` with 25 transactions.
4. Confidence level boundary checks ($0 \rightarrow \text{low}, 3 \rightarrow \text{low}, 5 \rightarrow \text{medium}, 14 \rightarrow \text{high}$).
5. `GET /api/anomaly-spotlight` verification against loaded demo data.





