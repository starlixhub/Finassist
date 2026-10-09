# AI Recommendation Logic — Finassist

OpenRouter powers the **explanation layer** — turns deterministic numbers (from `financial_logic.md`) into clear, personalized natural-language reasoning. This is the "Explainable AI" feature — the judge-facing differentiator.

## Why AI Here, Not in Core Math

Core predictions/plans stay rule-based + deterministic (testable, fast, free, no hallucination risk on numbers). AI's job: **explain**, not **compute**. This also means AI outage never breaks core app — just falls back to template text.

## OpenRouter Setup

```python
import requests
import os

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = os.getenv("OPENROUTER_MODEL", "anthropic/claude-3.5-sonnet")

def call_openrouter(prompt: str) -> str:
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 300,
    }
    try:
        r = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=8)
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]
    except Exception as e:
        return fallback_explanation()   # never let this crash the request
```

**Never hardcode the key** — `.env` only, gitignored. Mention in README setup steps.

## Use Cases

### 1. Shortage prediction explanation

```
Prompt: "User has ₹{balance} remaining, spending ₹{daily_rate}/day on average
(top categories: {categories}). Predicted shortage on {date}. In 2 short
sentences, explain why this is happening and the single biggest driver.
Be direct, no fluff."
```

### 2. Savings plan explanation

```
Prompt: "User wants to save ₹{amount} in {months} months. Current spending:
{category_breakdown}. Required monthly savings: ₹{required}. Suggested cuts:
{cuts}. In 2-3 sentences, explain the plan and why these specific cuts were
chosen over others."
```

### 3. Anomaly explanation

```
Prompt: "This transaction is unusual: ₹{amount} on {category}, vs typical
₹{avg} for this category. In 1 sentence, flag why it stands out."
```

## Prompt Rules

- Always pass the **actual computed numbers** into the prompt — never ask the model to compute or guess values itself. Model explains, doesn't calculate.
- Keep prompts short, ask for short output (`max_tokens: 150-300`) — demo needs fast responses, not essays.
- Temperature low (0.3–0.5) — want consistent, factual tone, not creative variance.

## Fallback (mandatory)

```python
def fallback_explanation() -> str:
    return "Based on your spending pattern, this recommendation reflects your current balance and category trends."
```

Always return 200 with fallback text if OpenRouter fails/times out — never surface raw API errors to frontend.

## Stretch Goal: AI-assisted categorization

For `uncategorized` transactions, batch-send descriptions to OpenRouter asking for best-fit category from fixed list. Only do this if core features done early — rule-based categorizer is the safer bet for demo reliability.

## Cost/Latency Note

Set `max_tokens` low, use a fast/cheap model (e.g. `anthropic/claude-3-haiku` or similar) for demo responsiveness — OpenRouter supports model switching via the `model` field, swap without code change.