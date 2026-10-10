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
    Calculate cash shortage projection based on historical spending using
    Exponential Moving Average (EMA) time-series forecasting.

    Time-Series Forecasting Spec:
      - Daily Transaction Aggregation: spend_today = sum of expenses on that day
      - EMA Formula: ema_today = alpha * spend_today + (1 - alpha) * ema_yesterday
      - Alpha parameter: alpha = 0.3 (weights recent days higher to capture spending spikes)
      - Seeding: Initialized with the average daily spend over the first 3 days
      - Fallback: If fewer than 5 transactions, fall back to simple average
      - Downstream Projections:
          - predicted_balance(d) = current_balance - (daily_burn_rate * d)
          - shortage_date = today + (current_balance / daily_burn_rate)
          - risk_level: < 7 days -> high, 7-21 days -> medium, > 21 days -> low
    """
    user = db_service.get_user(user_id)
    monthly_income = float(user.get("monthly_income", 0.0)) if user else 0.0

    transactions = db_service.get_transactions(user_id)

    # Separate expense transactions and aggregate category totals
    expense_txns = []
    total_expenses = 0.0
    parsed_dates = []
    cat_totals: Dict[str, float] = {}

    for t in transactions:
        amt = float(t.get("amount", 0.0))
        if amt < 0:
            exp = abs(amt)
            total_expenses += exp
            expense_txns.append(t)
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
    top_categories = [c for c, _ in sorted(cat_totals.items(), key=lambda x: x[1], reverse=True)[:3]]
    data_points_used = len(expense_txns)

    # Empty state: No expense transactions recorded
    if not expense_txns:
        forecast_method = "simple_average (insufficient data)"
        return {
            "current_balance": current_balance,
            "predicted_balance": current_balance,
            "shortage_predicted": False,
            "shortage_date": None,
            "risk_level": "low",
            "forecast_method": forecast_method,
            "data_points_used": 0,
            "confidence_level": "low",
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

    # Explicit data confidence level based on verified transaction sample size
    if data_points_used >= 14:
        confidence_level = "high"
    elif data_points_used >= 5:
        confidence_level = "medium"
    else:
        confidence_level = "low"

    # Fallback vs EMA Time-Series Forecasting
    if data_points_used < 5:
        # Fallback: Simple average burn rate for sparse data (< 5 transactions)
        forecast_method = "simple_average (insufficient data)"
        min_dt = min(parsed_dates) if parsed_dates else today
        max_dt = max(parsed_dates) if parsed_dates else today
        date_span = (max_dt - min_dt).days + 1
        window_days = max(14, date_span)
        daily_burn_rate = round(total_expenses / max(window_days, 1), 2)
    else:
        # EMA Time-Series Forecast over daily transaction sums
        forecast_method = "EMA (alpha=0.3)"
        alpha = 0.3

        # Aggregate daily transaction sums (chronologically sorted)
        daily_spend: Dict[date, float] = {}
        for t in expense_txns:
            dt_str = t.get("date")
            try:
                dt = datetime.strptime(str(dt_str)[:10], "%Y-%m-%d").date()
            except Exception:
                dt = today
            daily_spend[dt] = daily_spend.get(dt, 0.0) + abs(float(t.get("amount", 0.0)))

        sorted_dates = sorted(daily_spend.keys())
        daily_totals = [daily_spend[d] for d in sorted_dates]

        # Seed EMA from first 3 days average
        if len(daily_totals) >= 3:
            ema = sum(daily_totals[:3]) / 3.0
            for spend_today in daily_totals[3:]:
                ema = alpha * spend_today + (1.0 - alpha) * ema
        else:
            # If >= 5 transactions occurred across 1 or 2 distinct calendar days
            ema = sum(daily_totals) / float(len(daily_totals))

        daily_burn_rate = round(ema, 2)

    # Guard divide-by-zero burn rate
    if daily_burn_rate == 0.0:
        return {
            "current_balance": current_balance,
            "predicted_balance": current_balance,
            "shortage_predicted": False,
            "shortage_date": None,
            "risk_level": "low",
            "forecast_method": forecast_method,
            "data_points_used": data_points_used,
            "confidence_level": confidence_level,
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
            "forecast_method": forecast_method,
            "data_points_used": data_points_used,
            "confidence_level": confidence_level,
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
        "forecast_method": forecast_method,
        "data_points_used": data_points_used,
        "confidence_level": confidence_level,
        "explanation": explanation,
    }
