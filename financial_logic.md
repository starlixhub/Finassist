# Financial Logic — Finassist

Deterministic math. No AI here — AI only narrates these results (see `ai_recommendation_logic.md`). Keep this layer pure/testable.

## Cash Shortage Prediction

### Time-Series Forecasting: Exponential Moving Average (EMA) — Primary Model (v2)

For datasets with $\ge 5$ transactions, Finassist uses an Exponential Moving Average (EMA) time-series forecasting model ($\alpha = 0.3$) over daily transaction sums, seeded with the average daily spend of the first 3 days:

```
spend_today = sum of expenses on that calendar day
seed_ema = average(spend_day_1, spend_day_2, spend_day_3)
ema_today = alpha * spend_today + (1 - alpha) * ema_yesterday   # alpha = 0.3
daily_burn_rate = round(ema_today, 2)
forecast_method = "EMA (alpha=0.3)"
```

Weighting recent days higher ensures that recent spending spikes or lifestyle inflation are captured much faster than a flat average would, generating proactive cash shortage warnings.

### Fallback: Simple Average Burn Rate (< 5 transactions) (v1)

When transaction history is sparse ($< 5$ transactions), the engine automatically falls back to a simple average burn rate:

```
date_span = (max_date - min_date).days + 1
window_days = max(14, date_span)
daily_burn_rate = round(total_expenses / max(window_days, 1), 2)
forecast_method = "simple_average (insufficient data)"
```

### Downstream Projection Logic

```
predicted_balance(d) = current_balance - (daily_burn_rate * d)
days_remaining = current_balance / daily_burn_rate
shortage_date = today + days_remaining   (if days_remaining < forecast_window)
```

### Risk Levels

| days_remaining | risk_level |
|---|---|
| < 7 | high |
| 7–21 | medium |
| > 21 | low |

## Savings Planner

### Required Monthly Savings

```
required_monthly_savings = target_amount / target_months
```

### Feasibility Check

```
available_monthly = monthly_income - total_monthly_expenses
feasible = available_monthly >= required_monthly_savings
gap = required_monthly_savings - available_monthly   (if not feasible)
```

### Discretionary Cuts Optimizer (Constraint-Satisfaction Formulation)

Discretionary spending reduction is formalized as an explicit constraint-satisfaction optimization problem:
1. **Inviolable Constraints:** Never cut fixed essential categories (`FIXED_CATEGORIES = ["rent", "utilities"]`).
2. **Category Bounds:** Discretionary category reduction capped at 20% (`MAX_CUT_PER_CATEGORY = 0.20`).
3. **Optimization Target:** Bridge the required monthly savings target (`TOTAL_TARGET = required_monthly_savings`).
4. **Constraint Metadata:** Each cut returns constraint metadata (`cut_pct`, `constraint_applied = "max_20pct_cap"`).
5. **Infeasibility Handling:** If total achievable cuts across all discretionary categories cannot reach required savings, returns explicit infeasibility `{ "feasible": false, "max_achievable_savings": X, "gap": Y }` rather than silently returning a partial plan.

```python
def optimize_savings_allocation(
    category_totals: dict,
    required_monthly_savings: float = 0.0,
    gap: float = None
) -> dict:
    MAX_CUT_PER_CATEGORY = 0.20    # 20% cap per category
    FIXED_CATEGORIES = ["rent", "utilities"]   # inviolable constraints
    TOTAL_TARGET = required_monthly_savings    # optimization target

    discretionary = [c for c in categories if c.name.lower() not in FIXED_CATEGORIES]
    discretionary.sort(key=lambda c: c.amount, reverse=True)

    max_achievable_savings = sum(round(c.amount * MAX_CUT_PER_CATEGORY, 2) for c in discretionary)

    # Infeasibility check: cannot satisfy target under constraints
    if max_achievable_savings < TOTAL_TARGET:
        return {
            "feasible": False,
            "max_achievable_savings": max_achievable_savings,
            "gap": round(TOTAL_TARGET - max_achievable_savings, 2)
        }

    cuts = []
    remaining_gap = TOTAL_TARGET
    for cat in discretionary:
        max_cut = round(cat.amount * MAX_CUT_PER_CATEGORY, 2)
        cut = min(max_cut, round(remaining_gap, 2))
        if cut > 0:
            cuts.append({
                "category": cat.name,
                "current": cat.amount,
                "suggested": cat.amount - cut,
                "cut_pct": round((cut / cat.amount) * 100, 1),
                "constraint_applied": "max_20pct_cap",
                "reason": f"{int(round((cut / cat.amount) * 100))}% reduction in discretionary {cat.name} spend"
            })
            remaining_gap -= cut
        if remaining_gap <= 0.01:
            break
    return cuts

# suggest_cuts() is maintained as an alias for API compatibility
suggest_cuts = optimize_savings_allocation
```

## Anomaly Detection (feeds explainability)

```
is_anomaly = transaction.amount > (category_avg * 2)   # simple threshold
```

Flag anomalies, pass to AI layer for natural-language explanation ("this is 2.3x your usual grocery spend").

## Guardrails

- Guard divide-by-zero: if `daily_burn_rate == 0`, no shortage predicted — don't crash
- Guard `target_months <= 0` — reject at API validation layer
- Clamp `required_monthly_savings` display to 2 decimal places