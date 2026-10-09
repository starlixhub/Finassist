# Development Plan — Finassist (Backend/Atharv side)

Assume typical hackathon window (adjust hours to actual). Priority order below — top items are demo-critical, bottom are stretch.

## Phase 1 — Foundation (first ~20%)

- [ ] Repo/branch setup, folder structure (`backend_design.md`)
- [ ] FastAPI skeleton, DB models + tables (`database_schema.md`)
- [ ] `/income` + `/transactions/upload` endpoints (no categorization yet, just storage)
- [ ] Lock API contract, share `api.md` with frontend teammate **early** — biggest integration risk is late contract changes

## Phase 2 — Core Logic (next ~35%)

- [ ] CSV normalization + categorization (`data_processing.md`)
- [ ] `/dashboard` endpoint, aggregation logic
- [ ] Prediction engine v1 (simple burn rate) + `/predict`
- [ ] Savings planner + `/savings-goal`, `/savings-plan`
- [ ] Prepare demo CSV dataset

## Phase 3 — AI Layer (next ~20%)

- [ ] OpenRouter integration, `.env` setup
- [ ] Explanation prompts for prediction + savings plan
- [ ] Fallback handling (AI failure doesn't break app)
- [ ] Wire explanation into existing endpoint responses

## Phase 4 — Polish + Integration (next ~15%)

- [ ] Full integration test with frontend
- [ ] Anomaly detection + explanation
- [ ] Error handling pass (bad CSV, missing data, etc.)
- [ ] CORS setup for frontend connection

## Phase 5 — Demo Prep (final ~10%)

- [ ] Rehearse demo flow end-to-end with real (seeded) data
- [ ] Pre-load demo CSV, don't risk live upload of unknown file
- [ ] One "wow" stat ready to point at (e.g. biggest anomaly, clear shortage date)
- [ ] Backup: screenshots/recording in case live demo breaks

## Parallel-Safe Work (can do anytime, no dependency)

- `architecture.md`, `database_schema.md` — do first, unblocks everything
- Demo data prep — do early, test categorizer against it as you build

## Cut List (drop these first if time runs short)

1. AI-assisted categorization (stretch)
2. v2 weighted prediction (ship v1 burn rate only)
3. Auth/login
4. Anomaly detection (nice-to-have, not core pitch)

## Risk Watch

- OpenRouter latency/rate limits during live demo — test beforehand, have fallback ready
- CSV format mismatch from unexpected teammate/judge test file — tolerant parser is non-negotiable
- Late API contract changes breaking frontend — lock `api.md` by end of Phase 1