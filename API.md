# API Reference — Finassist

- **Live Render Base URL:** `https://finassist-backend.onrender.com/api` (Interactive Swagger Docs: `https://finassist-backend.onrender.com/docs`)
- **Local Dev Base URL:** `http://localhost:8000/api` (Local Swagger Docs: `http://localhost:8000/docs`)

All responses JSON. All errors return `{ "error": "message" }` with appropriate status code.

---

## POST /income

Set monthly income.

**Request**
```json
{ "user_id": 1, "monthly_income": 45000 }
```

**Response 200**
```json
{ "user_id": 1, "monthly_income": 45000 }
```

---

## POST /transactions/upload

Upload CSV, parse + categorize.

**Request:** multipart/form-data, field `file` (CSV), field `user_id`

**Response 200**
```json
{
  "rows_imported": 112,
  "rows_failed": 2,
  "categories_found": ["food", "rent", "transport", "shopping", "uncategorized"]
}
```

---

## GET /dashboard?user_id=1

**Response 200**
```json
{
  "monthly_income": 45000,
  "total_expenses": 38200,
  "remaining_balance": 6800,
  "by_category": [
    { "category": "rent", "amount": 15000 },
    { "category": "food", "amount": 9800 },
    { "category": "transport", "amount": 4200 }
  ]
}
```

---

## GET /predict?user_id=1&days_ahead=30

**Response 200**
```json
{
  "current_balance": 6800,
  "predicted_balance": -1200,
  "shortage_predicted": true,
  "shortage_date": "2026-11-18",
  "risk_level": "high",
  "explanation": "Based on your average daily spend of ₹1,268, your current balance of ₹6,800 is projected to deplete by 2026-11-18. Trimming discretionary spending will extend your runway.",
  "forecast_method": "EMA (alpha=0.3)",
  "data_points_used": 25,
  "confidence_level": "high"
}
```

---

## POST /savings-goal

**Request**
```json
{ "user_id": 1, "target_amount": 10000, "target_months": 5 }
```

**Response 200**
```json
{ "goal_id": 7, "required_monthly_savings": 2000, "feasible": true }
```

---

## GET /savings-plan?user_id=1

**Response 200 (Feasible Plan)**
```json
{
  "required_monthly_savings": 2000,
  "feasible": true,
  "max_achievable_savings": 3500,
  "gap": 0,
  "suggested_cuts": [
    {
      "category": "food",
      "current": 9800,
      "suggested": 8000,
      "cut_pct": 18.4,
      "constraint_applied": "max_20pct_cap",
      "reason": "18% reduction in discretionary food spend"
    },
    {
      "category": "shopping",
      "current": 5000,
      "suggested": 3500,
      "cut_pct": 20.0,
      "constraint_applied": "max_20pct_cap",
      "reason": "20% reduction in discretionary shopping spend"
    }
  ],
  "explanation": "To hit ₹10,000 in 5 months, you need to save ₹2,000/month. Your food spend is 23% above typical — trimming here is lowest-impact on lifestyle."
}
```

**Response 200 (Infeasible Plan — Explicit Shortfall Returned)**
```json
{
  "required_monthly_savings": 20000,
  "feasible": false,
  "max_achievable_savings": 4500,
  "gap": 8530,
  "suggested_cuts": [],
  "explanation": "To reach ₹100,000 in 5 months, you need to save ₹20,000/month. Even with the maximum 20% cut across discretionary spending, a gap of ₹8,530 remains."
}
```

---

## GET /anomaly-spotlight?user_id=1

Surface the single biggest spending anomaly prominently as a standalone AI-explained highlight.

**Response 200**
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

---

## POST /demo/load

1-Click demo seed endpoint for hackathon judges & frontend demo buttons — loads sample borrower data, sets income, and pre-configures financial state without requiring CSV upload.

**Request (Optional JSON or empty body)**
```json
{
  "user_id": 1,
  "monthly_income": 45000
}
```

**Response 200**
```json
{
  "status": "success",
  "message": "Sample borrower demo data loaded successfully! Financial dashboard, cash-flow forecast, and anomaly spotlight are ready.",
  "user_id": 1,
  "borrower_name": "Demo Borrower",
  "monthly_income": 45000.0,
  "rows_imported": 25,
  "rows_failed": 0,
  "categories_found": ["rent", "food", "transport", "shopping", "subscriptions", "utilities", "uncategorized"]
}
```

---

## Error Codes

| Code | Meaning |
|---|---|
| 400 | Malformed CSV / bad input |
| 404 | User/goal not found |
| 422 | Missing required field (e.g. income not set before upload) |
| 500 | Server error (AI call failure falls back, should not hit this) |