# Backend Design — Finassist

## Stack

- **Framework:** FastAPI (Python) — async, auto docs (Swagger at `/docs`), fast to build
- **DB:** SQLite + SQLAlchemy ORM
- **AI:** OpenRouter API (HTTP calls, OpenAI-compatible format)
- **CSV parsing:** pandas

## Folder Structure

```
backend/
├── main.py                 # FastAPI app entrypoint
├── requirements.txt
├── .env                    # OPENROUTER_API_KEY etc (gitignored)
├── routers/
│   ├── income.py
│   ├── transactions.py
│   ├── dashboard.py
│   ├── predict.py
│   └── savings.py
├── services/
│   ├── categorizer.py      # CSV parse + categorize
│   ├── predictor.py        # cash shortage prediction
│   ├── planner.py          # savings plan logic
│   └── ai_engine.py        # OpenRouter calls, explanation gen
├── models/
│   └── db_models.py        # SQLAlchemy models
├── schemas/
│   └── schemas.py          # Pydantic request/response models
├── db/
│   └── database.py         # DB session setup
└── data/
    └── finassist.db        # SQLite file
```

## Design Principles

- **Routers thin, services fat.** Routers only validate + call service functions. All logic lives in `services/`.
- **Pydantic everywhere.** Every request and response has a schema — gives free validation + auto docs, and frontend teammate gets exact shapes from `/docs`.
- **Deterministic core, AI on top.** `predictor.py` and `planner.py` are pure math, no AI calls — testable without hitting OpenRouter. `ai_engine.py` consumes their output and adds natural-language explanation.
- **Env config.** OpenRouter key, model name, DB path all in `.env` — never hardcoded.

## Key Service Signatures (draft)

```python
# services/categorizer.py
def parse_csv(file_bytes: bytes, user_id: int) -> list[Transaction]: ...
def categorize(description: str, amount: float) -> str: ...

# services/predictor.py
def predict_balance(user_id: int, days_ahead: int = 30) -> PredictionResult: ...

# services/planner.py
def build_savings_plan(user_id: int, goal_amount: float, goal_months: int) -> SavingsPlan: ...

# services/ai_engine.py
def explain(context: dict) -> str: ...   # calls OpenRouter, returns explanation text
```

## Error Handling

- CSV parse failures → return 400 with row-level error detail, don't crash
- OpenRouter timeout/failure → fall back to template explanation, log error, return 200 (never block core numbers on AI failure)
- Missing income/goal → 422 with clear message

## Config (.env)

```
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet   # or cheaper model for speed
DATABASE_URL=sqlite:///./data/finassist.db
```