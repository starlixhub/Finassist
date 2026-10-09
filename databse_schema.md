# Database Schema — Finassist

SQLite. SQLAlchemy models mirror below 1:1.

## users

| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| name | TEXT | optional for hackathon |
| monthly_income | REAL | set via POST /income |
| created_at | TIMESTAMP | default now |

## transactions

| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| user_id | INTEGER FK → users.id | |
| date | DATE | from CSV |
| description | TEXT | raw CSV description |
| amount | REAL | negative = expense, positive = income (or separate `type` col — decide + lock early) |
| category | TEXT | assigned by categorizer |
| raw_row | TEXT | original CSV row, for debug/audit |

## goals

| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| user_id | INTEGER FK → users.id | |
| target_amount | REAL | |
| target_months | INTEGER | |
| created_at | TIMESTAMP | |

## predictions

| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| user_id | INTEGER FK → users.id | |
| predicted_date | DATE | shortage date if any |
| predicted_balance | REAL | |
| risk_level | TEXT | low / medium / high |
| created_at | TIMESTAMP | cache predictions, don't recompute every call if time-pressed |

## Indexes

- `transactions(user_id, date)` — speeds dashboard + prediction queries
- `transactions(user_id, category)` — speeds category aggregation

## Notes

- Keep `amount` sign convention consistent everywhere (decide: negative=expense). Lock this in `data_processing.md` and don't deviate — mismatched sign conventions are the #1 silent bug in finance apps.
- No auth table for hackathon — single `user_id=1` demo user is fine. Add `password_hash` only if time allows + judges expect login.