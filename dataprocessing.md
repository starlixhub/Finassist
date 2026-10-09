# Data Processing — Finassist

## CSV Ingest

Expected columns (flexible matching, case-insensitive): `date`, `description`, `amount` — plus optional `type` (credit/debit).

### Normalization Steps

1. Load CSV with pandas, infer headers
2. Map common header variants → standard names:
   - `desc`, `narration`, `particulars` → `description`
   - `txn_date`, `value_date` → `date`
   - `debit`, `credit`, `withdrawal`, `deposit` → combine into signed `amount`
3. Parse dates — try multiple formats (`%d/%m/%Y`, `%Y-%m-%d`, `%d-%b-%Y`), fail row-by-row not whole-file
4. Coerce amount to float, strip currency symbols (₹, commas)
5. Drop fully-empty rows, flag unparseable rows (return in `rows_failed` count, don't silently drop)

### Sign Convention

**Lock this:** expense = negative, income = positive. If source CSV has separate debit/credit columns, convert: `amount = credit - debit`.

## Categorization

Rule-based (fast, good enough for hackathon, explainable — bonus for judges since it's inherently "explainable AI" without even needing the LLM for this step):

```python
CATEGORY_RULES = {
    "food": ["zomato", "swiggy", "restaurant", "cafe"],
    "transport": ["uber", "ola", "fuel", "petrol", "metro"],
    "rent": ["rent", "landlord"],
    "shopping": ["amazon", "flipkart", "myntra"],
    "subscriptions": ["netflix", "spotify", "prime"],
    "utilities": ["electricity", "water bill", "recharge", "broadband"],
}

def categorize(description: str) -> str:
    desc = description.lower()
    for category, keywords in CATEGORY_RULES.items():
        if any(kw in desc for kw in keywords):
            return category
    return "uncategorized"
```

- Case-insensitive keyword match, first match wins
- `uncategorized` bucket always shown on dashboard — don't hide it, builds trust
- Stretch goal: send `uncategorized` descriptions to OpenRouter for AI-guess categorization (see `ai_recommendation_logic.md`)

## Aggregation (for dashboard)

```python
total_expenses = sum(abs(t.amount) for t in transactions if t.amount < 0)
by_category = groupby(transactions, key='category').sum('amount')
remaining_balance = income - total_expenses
```

## Demo Data

Prepare a clean, realistic sample CSV (20–30 rows, mixed categories, one clear anomaly like an unusually large one-off expense) — use this for live demo, don't rely on live upload of unknown data mid-presentation.