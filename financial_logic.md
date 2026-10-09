# Financial Logic — Finassist

Deterministic math. No AI here — AI only narrates these results (see `ai_recommendation_logic.md`). Keep this layer pure/testable.

## Cash Shortage Prediction

### v1 — Simple burn rate (build this first)

```
daily_burn_rate = total_expenses_last_N_days / N        # N = 14 or 30
days_remaining = current_balance / daily_burn_rate
predicted_balance(d) = current_balance - (daily_burn_rate * d)
shortage_date = today + days_remaining   (if days_remaining < forecast_window)
```

### v2 — Weighted recent trend (upgrade if time allows)

Weight recent days higher (exponential moving average) so a recent spending spike shows up faster than a flat 30-day average would.

```
ema_burn_rate = alpha * today_spend + (1 - alpha) * yesterday_ema     # alpha ~0.3
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

### Suggested Cuts (when not feasible, or to accelerate goal)

1. Rank discretionary categories (food, shopping, subscriptions — NOT rent/utilities) by:
   - amount above 3-month average for that category, or
   - amount as % of total expenses
2. Suggest trimming top 1–2 categories by `gap` amount, proportionally
3. Never suggest cutting fixed costs (rent) — flag those as "fixed, cannot reduce"

```python
def suggest_cuts(categories: list, gap: float) -> list:
    discretionary = [c for c in categories if c.name not in FIXED_CATEGORIES]
    discretionary.sort(key=lambda c: c.amount, reverse=True)
    cuts = []
    remaining_gap = gap
    for cat in discretionary:
        cut = min(cat.amount * 0.2, remaining_gap)   # cap cut at 20% of category
        if cut > 0:
            cuts.append({"category": cat.name, "cut_amount": cut})
            remaining_gap -= cut
        if remaining_gap <= 0:
            break
    return cuts
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