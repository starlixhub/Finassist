import logging
from datetime import datetime, date, timedelta
from typing import Dict, Any, Optional, List

try:
    from backend.db.database import db_service
    from backend.services.ai_engine import explain_shortage
except ImportError:
    from db.database import db_service
    from services.ai_engine import explain_shortage

logger = logging.getLogger("finassist.predictor")


def predict_balance(user_id: int, days_ahead: int = 30) -> Dict[str, Any]:
    """
    Calculate cash shortage projection based on historical spending.
    Exact formula per financial_logic.md:
      - daily_burn_rate = total_expenses_last_N_days / N (N = 14)
      - days_remaining = current_balance / daily_burn_rate
      - predicted_balance(d) = current_balance - (daily_burn_rate * d)
      - shortage_date = today + days_remaining (if days_remaining < days_ahead)
      - risk_level: < 7 days -> high, 7-21 days -> medium, > 21 days -> low
    """
    user = db_service.get_user(user_id)
    monthly_income = float(user.get("monthly_income", 0.0)) if user else 0.0

    transactions = db_service.get_transactions(user_id)

    # Compute current total expenses & current balance
    total_expenses = 0.0
    parsed_dates = []
    cat_totals: Dict[str, float] = {}

    for t in transactions:
        amt = float(t.get("amount", 0.0))
        if amt < 0:
            exp = abs(amt)
            total_expenses += exp
            c = (t.get("category") or "uncategorized").lower()
            cat_totals[c] = cat_totals.get(c, 0.0) + exp

        dt_str = t.get("date")
        if dt_str:
            try:
                parsed_dates.append(datetime.strptime(str(dt_str)[:10], "%Y-%m-%d").date())
            except Exception:
                pass

    current_balance = round(monthly_income - total_expenses, 2)
    today = max(parsed_dates) if parsed_dates else date.today()

    # Determine N-day window for daily burn rate calculation (default N=14)
    window_days = 14
    if parsed_dates:
        min_dt = min(parsed_dates)
        max_dt = max(parsed_dates)
        date_span = (max_dt - min_dt).days + 1
        window_days = max(14, date_span)

    # Calculate recent expenses within the window
    window_start = today - timedelta(days=window_days)
    recent_expenses = 0.0
    for t in transactions:
        amt = float(t.get("amount", 0.0))
        if amt < 0:
            dt_str = t.get("date")
            try:
                dt = datetime.strptime(str(dt_str)[:10], "%Y-%m-%d").date()
                if dt >= window_start:
                    recent_expenses += abs(amt)
            except Exception:
                recent_expenses += abs(amt)

    # Guard divide-by-zero burn rate
    daily_burn_rate = round(recent_expenses / max(window_days, 1), 2) if window_days > 0 else 0.0

    top_categories = [c for c, _ in sorted(cat_totals.items(), key=lambda x: x[1], reverse=True)[:3]]

    if daily_burn_rate == 0.0:
        return {
            "current_balance": current_balance,
            "predicted_balance": current_balance,
            "shortage_predicted": False,
            "shortage_date": None,
            "risk_level": "low",
            "explanation": explain_shortage(
                current_balance=current_balance,
                daily_burn_rate=0.0,
                top_categories=top_categories,
                shortage_date=None,
                days_ahead=days_ahead,
                shortage_predicted=False,
                predicted_balance=current_balance,
            ),
        }

    predicted_balance = round(current_balance - (daily_burn_rate * days_ahead), 2)

    # If already in deficit
    if current_balance <= 0:
        shortage_date_str = today.strftime("%Y-%m-%d")
        explanation = explain_shortage(
            current_balance=current_balance,
            daily_burn_rate=daily_burn_rate,
            top_categories=top_categories,
            shortage_date=shortage_date_str,
            days_ahead=days_ahead,
            shortage_predicted=True,
            predicted_balance=predicted_balance,
        )
        return {
            "current_balance": current_balance,
            "predicted_balance": predicted_balance,
            "shortage_predicted": True,
            "shortage_date": shortage_date_str,
            "risk_level": "high",
            "explanation": explanation,
        }

    # Days remaining before balance is zero
    days_remaining = current_balance / daily_burn_rate

    # Risk level thresholds per financial_logic.md
    if days_remaining < 7:
        risk_level = "high"
    elif 7 <= days_remaining <= 21:
        risk_level = "medium"
    else:
        risk_level = "low"

    shortage_predicted = days_remaining < days_ahead
    shortage_date_str = None

    if shortage_predicted:
        shortage_dt = today + timedelta(days=int(days_remaining))
        shortage_date_str = shortage_dt.strftime("%Y-%m-%d")

    explanation = explain_shortage(
        current_balance=current_balance,
        daily_burn_rate=daily_burn_rate,
        top_categories=top_categories,
        shortage_date=shortage_date_str,
        days_ahead=days_ahead,
        shortage_predicted=shortage_predicted,
        predicted_balance=predicted_balance,
    )

    return {
        "current_balance": current_balance,
        "predicted_balance": predicted_balance,
        "shortage_predicted": shortage_predicted,
        "shortage_date": shortage_date_str,
        "risk_level": risk_level,
        "explanation": explanation,
    }
