# Finassist

AI-powered financial assistant. Analyzes transactions, predicts cash shortages, builds personalized savings plans — with explainable reasoning behind every recommendation.

**Repo:** https://github.com/starlixhub/Finassist

## Problem

People don't see cash shortages coming until they hit. Generic budgeting apps show numbers, not *why* those numbers matter or what to do next.

## Solution

Upload transactions → auto-categorize → predict future balance → set savings goal → get a plan with explanations (not black-box numbers).

## Core Features

1. **Transaction Analyzer** — CSV upload, auto-categorization
2. **Financial Dashboard** — income, expenses, categories, balance
3. **Cash Shortage Prediction** — forecast + early warning
4. **Smart Savings Planner** — personalized plan from income/expenses/goal
5. **Explainable AI Insights** — every recommendation shows its reasoning

## Tech Stack

| Layer | Choice |
|---|---|
| Backend | Python (FastAPI) |
| AI | OpenRouter API (LLM for insights/explanations) |
| DB | SQLite (hackathon) |
| Frontend | owned by teammate — see `integration_guide.md` |

## Team Roles

- **Atharv** — system architecture, backend, data processing, financial logic, AI integration
- **Teammate** — frontend UI/UX

## Docs Index

| File | Covers |
|---|---|
| `architecture.md` | system design, data flow |
| `backend_design.md` | backend structure, modules |
| `api.md` | endpoints, request/response |
| `database_schema.md` | DB tables |
| `data_processing.md` | CSV parsing, categorization |
| `financial_logic.md` | prediction + savings math |
| `ai_recommendation_logic.md` | OpenRouter integration, prompts |
| `development_plan.md` | hackathon timeline |
| `integration_guide.md` | frontend ↔ backend contract |

## Quick Start (backend)

```bash
git clone https://github.com/starlixhub/Finassist.git
cd Finassist/backend
pip install -r requirements.txt
uvicorn main:app --reload
```

## Winning Angle

Judges see 50 "budget tracker" clones a year. Differentiator: **explainability** — every number comes with a reason, not just a chart. Lead pitch with that.