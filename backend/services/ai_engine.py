import os
import logging
import requests
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
from pathlib import Path

logger = logging.getLogger("finassist.ai_engine")

# Load environment variables
env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENROUTER_KEY") or ""
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = os.getenv("OPENROUTER_MODEL", "anthropic/claude-3.5-sonnet")


def fallback_explanation(kind: str = "general", data: Optional[Dict[str, Any]] = None) -> str:
    """
    Deterministic rule-based fallback text referencing actual numbers when OpenRouter is offline or key is missing.
    """
    if not data:
        return "Based on your spending pattern, this recommendation reflects your current balance and category trends."

    if kind == "shortage":
        balance = data.get("current_balance", 0.0)
        burn_rate = data.get("daily_burn_rate", 0.0)
        shortage_date = data.get("shortage_date")
        days_ahead = data.get("days_ahead", 30)

        if burn_rate == 0.0:
            if balance > 0:
                return (
                    f"No expenses recorded yet. With zero daily burn rate, your balance of ₹{int(balance):,} "
                    f"is projected to remain stable over the next {days_ahead} days."
                )
            else:
                return (
                    f"No transactions or income recorded yet. Set your monthly income and upload "
                    f"a statement CSV to view your cash runway projections."
                )
        elif data.get("shortage_predicted") and shortage_date:
            return (
                f"Based on your average daily spend of ₹{int(burn_rate):,}, your current balance of ₹{int(balance):,} "
                f"is projected to deplete by {shortage_date}. Trimming discretionary spending will extend your runway."
            )
        elif balance <= 0:
            return (
                f"Your balance is currently in deficit (₹{int(balance):,}). At an average burn rate of ₹{int(burn_rate):,}/day, "
                f"immediate spending adjustments are required."
            )
        else:
            predicted = data.get("predicted_balance", balance)
            return (
                f"Based on your average daily spend of ₹{int(burn_rate):,} over recent days, "
                f"your balance is projected to remain stable at ₹{int(predicted):,} over the next {days_ahead} days."
            )

    elif kind == "savings_plan":
        target_amount = data.get("target_amount", 10000.0)
        target_months = data.get("target_months", 5)
        required_monthly = data.get("required_monthly_savings", 2000.0)
        feasible = data.get("feasible", True)
        gap = data.get("gap", 0.0)
        cuts = data.get("suggested_cuts", [])

        if feasible:
            return (
                f"To hit ₹{int(target_amount):,} in {target_months} months, you need to save ₹{int(required_monthly):,}/month. "
                f"Your current monthly surplus is on track to achieve this goal on schedule."
            )
        else:
            cut_cats = ", ".join([c.get("category", "") for c in cuts]) if cuts else "discretionary categories"
            return (
                f"To reach ₹{int(target_amount):,} in {target_months} months, you need to save ₹{int(required_monthly):,}/month. "
                f"Trimming ₹{int(gap):,}/month across flexible spending ({cut_cats}) will bridge the gap while protecting fixed essentials like rent."
            )

    elif kind == "anomaly":
        amount = data.get("amount", 0.0)
        desc = data.get("description", "transaction")
        category = data.get("category", "uncategorized")
        avg = data.get("category_avg", 0.0)
        dev = data.get("deviation_pct", 0.0)
        return (
            f"This ₹{int(abs(amount)):,} spend on {desc} stands out as it is {int(dev)}% above your "
            f"typical {category} baseline (₹{int(avg):,}), representing your single largest spending spike."
        )

    return "Based on your spending pattern, this recommendation reflects your current balance and category trends."


def call_openrouter(prompt: str, kind: str = "general", data: Optional[Dict[str, Any]] = None) -> str:
    """
    Call OpenRouter API to synthesize natural language explanation.
    Guaranteed never to crash: falls back to template text on timeout, network error, or missing key.
    """
    api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENROUTER_KEY") or OPENROUTER_API_KEY
    if not api_key or api_key.strip() == "" or api_key == "your_openrouter_api_key_here":
        logger.info("OPENROUTER_API_KEY not set or placeholder; using deterministic fallback explanation.")
        return fallback_explanation(kind=kind, data=data)

    model_name = os.getenv("OPENROUTER_MODEL", MODEL)
    headers = {
        "Authorization": f"Bearer {api_key.strip()}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://finassist.local",
        "X-Title": "Finassist",
    }
    payload = {
        "model": model_name,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 300,
        "temperature": 0.3,
    }

    try:
        r = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=8)
        r.raise_for_status()
        resp_json = r.json()
        content = resp_json["choices"][0]["message"]["content"]
        if content and content.strip():
            return content.strip()
        return fallback_explanation(kind=kind, data=data)
    except Exception as e:
        logger.warning(f"OpenRouter call failed or timed out ({e}); falling back to rule-based explanation.")
        return fallback_explanation(kind=kind, data=data)


def explain_shortage(
    current_balance: float,
    daily_burn_rate: float,
    top_categories: List[str],
    shortage_date: Optional[str],
    days_ahead: int = 30,
    shortage_predicted: bool = False,
    predicted_balance: float = 0.0,
) -> str:
    """
    Generate natural-language explanation for cash shortage prediction.
    Template per ai_recommendation_logic.md.
    """
    categories_str = ", ".join(top_categories) if top_categories else "general spending"
    
    if shortage_predicted and shortage_date:
        prompt = (
            f"User has ₹{int(current_balance):,} remaining, spending ₹{int(daily_burn_rate):,}/day on average "
            f"(top categories: {categories_str}). Predicted shortage on {shortage_date}. In 2 short "
            f"sentences, explain why this is happening and the single biggest driver. Be direct, no fluff."
        )
    elif current_balance <= 0:
        prompt = (
            f"User's balance is currently negative (₹{int(current_balance):,}), spending ₹{int(daily_burn_rate):,}/day on average "
            f"(top categories: {categories_str}). In 2 short sentences, explain why immediate action is needed and highlight the top spending drivers. Be direct, no fluff."
        )
    elif daily_burn_rate == 0.0:
        if current_balance > 0:
            prompt = (
                f"User has ₹{int(current_balance):,} remaining balance with zero recorded daily expenses. "
                f"In 2 short sentences, explain that their balance is intact with zero daily burn rate."
            )
        else:
            prompt = (
                f"User is a new user with zero balance and no transactions yet. "
                f"In 2 short sentences, encourage them to set monthly income and upload transaction statements to view predictions."
            )
    else:
        prompt = (
            f"User has ₹{int(current_balance):,} remaining, spending ₹{int(daily_burn_rate):,}/day on average "
            f"(top categories: {categories_str}). Projected balance in {days_ahead} days is ₹{int(predicted_balance):,}. "
            f"In 2 short sentences, summarize their financial runway and positive outlook. Be direct, no fluff."
        )

    fallback_data = {
        "current_balance": current_balance,
        "daily_burn_rate": daily_burn_rate,
        "shortage_date": shortage_date,
        "days_ahead": days_ahead,
        "shortage_predicted": shortage_predicted,
        "predicted_balance": predicted_balance,
    }
    return call_openrouter(prompt, kind="shortage", data=fallback_data)


def explain_savings_plan(
    target_amount: float,
    target_months: int,
    required_monthly_savings: float,
    category_breakdown: Dict[str, float],
    suggested_cuts: List[Dict[str, Any]],
    feasible: bool = True,
    gap: float = 0.0,
) -> str:
    """
    Generate natural-language explanation for savings plan.
    Template per ai_recommendation_logic.md.
    """
    cat_str = ", ".join([f"{cat}: ₹{int(amt):,}" for cat, amt in category_breakdown.items() if amt > 0])
    cuts_str = (
        ", ".join([f"{c.get('category')}: reduce to ₹{int(c.get('suggested', 0)):,}" for c in suggested_cuts])
        if suggested_cuts
        else "no cuts needed"
    )

    prompt = (
        f"User wants to save ₹{int(target_amount):,} in {target_months} months. Current spending: "
        f"{cat_str}. Required monthly savings: ₹{int(required_monthly_savings):,}. Suggested cuts: "
        f"{cuts_str}. In 2-3 sentences, explain the plan and why these specific cuts were chosen over others (e.g. protecting fixed essentials like rent)."
    )

    fallback_data = {
        "target_amount": target_amount,
        "target_months": target_months,
        "required_monthly_savings": required_monthly_savings,
        "category_breakdown": category_breakdown,
        "suggested_cuts": suggested_cuts,
        "feasible": feasible,
        "gap": gap,
    }
    return call_openrouter(prompt, kind="savings_plan", data=fallback_data)


def explain_anomaly(
    amount: float,
    description: str,
    category: str,
    category_avg: float,
    deviation_pct: float,
) -> str:
    """
    Generate natural-language explanation for spending anomaly.
    Template per ai_recommendation_logic.md.
    """
    prompt = (
        f"This transaction is unusual: ₹{int(abs(amount)):,} on {description} ({category}), "
        f"vs typical ₹{int(category_avg):,} for this category (+{int(deviation_pct)}% deviation). "
        f"In 1 sharp, direct sentence, flag why it stands out."
    )
    fallback_data = {
        "amount": amount,
        "description": description,
        "category": category,
        "category_avg": category_avg,
        "deviation_pct": deviation_pct,
    }
    return call_openrouter(prompt, kind="anomaly", data=fallback_data)


def explain(context: Dict[str, Any]) -> str:
    """
    General explain dispatcher based on context kind.
    """
    kind = context.get("type", "general")
    if kind == "shortage":
        return explain_shortage(
            current_balance=context.get("current_balance", 0.0),
            daily_burn_rate=context.get("daily_burn_rate", 0.0),
            top_categories=context.get("top_categories", []),
            shortage_date=context.get("shortage_date"),
            days_ahead=context.get("days_ahead", 30),
            shortage_predicted=context.get("shortage_predicted", False),
            predicted_balance=context.get("predicted_balance", 0.0),
        )
    elif kind == "savings_plan":
        return explain_savings_plan(
            target_amount=context.get("target_amount", 10000.0),
            target_months=context.get("target_months", 5),
            required_monthly_savings=context.get("required_monthly_savings", 2000.0),
            category_breakdown=context.get("category_breakdown", {}),
            suggested_cuts=context.get("suggested_cuts", []),
            feasible=context.get("feasible", True),
            gap=context.get("gap", 0.0),
        )
    elif kind == "anomaly":
        return explain_anomaly(
            amount=context.get("amount", 0.0),
            description=context.get("description", ""),
            category=context.get("category", "uncategorized"),
            category_avg=context.get("category_avg", 0.0),
            deviation_pct=context.get("deviation_pct", 0.0),
        )
    return fallback_explanation(kind=kind, data=context)
