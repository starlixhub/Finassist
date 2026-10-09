# FinAssist — Frontend Application

Modern, responsive React + Vite frontend for **FinAssist**, an explainable AI personal finance assistant. Built with the approved fintech light theme, persistent demo data layer, deterministic calculation engine, and a clean API service layer architected for seamless integration with the FastAPI backend.

---

## Quick Start

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:5173`.

### 3. Production Build & Preview
```bash
npm run build
npm run preview
```

---

## Demo Credentials

- **Email:** `demo@finassist.in` or `kartik@example.com`
- **Password:** `Demo@123`
*(Or create a new account directly via the Register screen to experience the 4-step onboarding wizard).*

---

## Approved Design System Palette

- **App background:** `#F5F7FA`
- **Card background:** `#FFFFFF`
- **Primary text:** `#0F1B2D`
- **Secondary text:** `#52607A`
- **Borders:** `#D9E0E9`
- **Primary teal:** `#0B6E6E`
- **Soft teal:** `#E2F1F0`
- **Success green:** `#07704A`
- **Warning amber:** `#8F5200`
- **Danger red:** `#B42318`
- **Sidebar background:** `#0F1B2D` (Deep Navy)

---

## 7 Primary Application Destinations

1. **Dashboard** (`/dashboard`): 4 top-line financial summary metric cards (Monthly Income, Total Expenses, Net Cash Flow, Savings Rate), prominent Anomaly Spotlight banner, cash flow Recharts bar visualization, category donut breakdown, savings goal progress, and recent transactions.
2. **Transactions** (`/transactions`): Filterable transaction table with full search, date range picking, category selection, income/expense toggle, multi-column sorting (date/amount), pagination, and an interactive CSV upload modal with row preview, column detection, and auto-categorization matching `data/demo.csv`.
3. **AI Coach** (`/ai-coach`): Insights-only intelligence hub (strictly no chat windows or simulated chatbots). Features explainable spending observations, anomaly spotlight breakdown (highlighting the ₹28,500 emergency repair spike), actionable discretionary cuts, and runway cash flow risk forecasts.
4. **Savings Goals** (`/savings`): Complete goal tracker with modal forms to create, edit, and delete goals, target completion timelines, and visual progress bars.
5. **Budgets** (`/budgets`): Category spending limits dynamically compared against actual monthly transaction records, with visual status bars (green/amber/red) and overspending alerts.
6. **Reports & Analytics** (`/reports`): Multi-month trend comparisons (Aug, Sep, Oct 2026), monthly performance tables, category-wise expenditure bars, and historical savings rate analysis.
7. **Settings** (`/settings`): Profile info management, currency display preferences, demonstration security/password forms, live FastAPI backend health check ping, CSV data export, and demo-data reset with confirmation dialog.

---

## Backend Integration Architecture

The service layer is separated into `src/services/`:
- `src/services/apiService.js`: Typed HTTP client targeting live Render backend (`https://finassist-backend.onrender.com/api`) and local dev (`http://localhost:8000/api`).
- Contract endpoints supported:
  - `POST /api/income` — Upsert user income
  - `POST /api/transactions/upload` — Multipart form CSV statement upload
  - `GET /api/dashboard?user_id=1` — Aggregate financial summary
  - `GET /api/predict?user_id=1` — Daily burn rate & shortage projection
  - `POST /api/savings-goal` — Create savings target
  - `GET /api/savings-plan?user_id=1` — Discretionary spending cuts
  - `GET /api/anomaly-spotlight?user_id=1` — Single largest transaction deviation
