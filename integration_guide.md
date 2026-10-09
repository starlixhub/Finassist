# Integration Guide — Backend ↔ Frontend

For teammate building UI/UX.

## Base Setup

- **Live Render Backend:** `https://finassist-backend.onrender.com`
- **Live API Base URL:** `https://finassist-backend.onrender.com/api`
- **Interactive Swagger Docs (Live):** `https://finassist-backend.onrender.com/docs`
- **Local Dev URL:** `http://localhost:8000` (Docs at `http://localhost:8000/docs`)
- **CORS Configured For:**
  - Vercel production frontend: `https://finassist.vercel.app`
  - Vercel preview deployments: `https://finassist-*.vercel.app` (`allow_origin_regex`)
  - Local frontend dev: `http://localhost:3000`, `http://localhost:5173`, etc.

## Contract

Full endpoint list + request/response shapes: see `api.md`. That file is the source of truth — if backend changes a response shape, `api.md` gets updated same commit.

## Demo User

Single hardcoded `user_id=1` for hackathon — no login flow needed. Frontend can hardcode this too.

## Recommended Frontend Flow

1. On load: call `GET /dashboard?user_id=1` — if income not set, prompt for it first (`POST /income`)
2. Upload screen: `POST /transactions/upload` (multipart form), show `rows_imported`/`rows_failed` as feedback
3. Dashboard screen: render `by_category` as chart, show `remaining_balance` prominently
4. Prediction screen: `GET /predict` — show `explanation` text next to the number, not just the number alone (this is the differentiator, don't bury it)
5. Goal screen: `POST /savings-goal` then `GET /savings-plan` — render `suggested_cuts` as a list with each `reason` visible

## Key UX Note

Every AI-backed response includes an `explanation` field (plain text). **Always display this near its number** — that's the core "explainable AI" pitch. A dashboard that hides the explanation in a tooltip undersells the feature to judges.

## Integration & Deployment Checklist

- [ ] Backend deployed to Render (`https://finassist-backend.onrender.com`)
- [ ] Frontend `.env` points to `VITE_API_BASE=https://finassist-backend.onrender.com/api` (or `http://localhost:8000/api` for local)
- [ ] Test one full flow together before demo day: income → upload → dashboard → predict → goal → plan
- [ ] Agree on loading states — AI explanation call can take 1-3s, frontend needs a spinner/skeleton for that gap

## Who to Ping

Backend/API issues → Atharv. Keep `api.md` as single source of truth — if something's unclear there, flag it rather than guessing the shape.