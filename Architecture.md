# Architecture — Finassist

## High-Level Diagram

```
                    +------------------+
                    |   Frontend (UI)  |
                    +--------+---------+
                             | HTTP/JSON (REST)
                    +--------v---------+
                    |   Backend API    |  (FastAPI)
                    +--------+---------+
                             |
        +--------------------+--------------------+
        |            |                 |           |
  +-----v----+  +----v-----+   +-------v------+  +-v--------+
  |CSV Parser|  |Prediction|   |Savings Planner|  |AI Engine |
  |/Categor. |  |  Engine  |   |               |  |(OpenRouter)
  +-----+----+  +----+-----+   +-------+------+  +----+-----+
        |            |                 |              |
        +------------+--------+--------+--------------+
                               |
                        +------v------+
                        |  SQLite DB  |
                        +-------------+
```

## Layers

1. **API layer** — FastAPI routes, request validation, auth (if time allows)
2. **Service layer** — business logic: categorization, prediction, planning
3. **AI layer** — OpenRouter calls for explanation generation + anomaly narration
4. **Data layer** — SQLite, accessed via SQLAlchemy or raw queries

## Data Flow (end-to-end)

1. User sets income → stored in `users`
2. User uploads CSV → parsed → rows inserted into `transactions` with category tags
3. Dashboard endpoint aggregates `transactions` → totals by category
4. Prediction engine reads transaction history → computes burn rate → projects balance
5. User sets goal → stored in `goals`
6. Planner reads income, expenses, goal → computes required savings/cuts
7. AI layer takes planner output + prediction output → generates explanation text via OpenRouter
8. Response returned to frontend as structured JSON (numbers + explanation together)

## Why This Shape

- **Separation of concerns**: categorization, prediction, planning are independent modules — can be built/tested in parallel, and swapped (e.g. rule-based categorizer now, ML later) without touching the rest.
- **AI isolated to one layer**: OpenRouter calls only happen for *explanation generation*, not core math. Core math (prediction, planner) stays deterministic/testable — AI failure doesn't break core app.
- **SQLite for hackathon speed**: zero setup, file-based, swappable to Postgres post-hackathon without schema rewrite (same SQL).

## Non-Functional Notes

- API must return explanation + numbers in same response (no separate round-trip) — keeps frontend simple, keeps demo fast.
- OpenRouter calls should have timeout + fallback (canned explanation template) — never let AI latency break the demo.
- Keep CSV parser tolerant — malformed hackathon demo files kill live demos.