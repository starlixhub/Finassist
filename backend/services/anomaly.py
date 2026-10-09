import logging
from collections import defaultdict
from typing import Dict, Any, Optional

try:
    from backend.db.database import db_service
    from backend.services.ai_engine import explain_anomaly
except ImportError:
    from db.database import db_service
    from services.ai_engine import explain_anomaly

logger = logging.getLogger("finassist.anomaly")


def find_anomaly_spotlight(user_id: int) -> Dict[str, Any]:
    """
    Identify and surface the single highest-deviation spending transaction for a user
    (amount vs category baseline average), complete with explainable AI narrative.
    
    Formula per financial_logic.md & ai_recommendation_logic.md:
      - is_anomaly = transaction.amount > (category_avg * 2)
      - deviation_pct = ((amount - category_avg) / category_avg) * 100
      - AI explanation synthesizes why it stands out and its budget impact
    
    Returns:
    {
        "transaction": {...},
        "deviation_pct": 134,
        "explanation": "..."
    }
    """
    transactions = db_service.get_transactions(user_id)
    
    # Filter expenses (negative amounts)
    expenses = [t for t in transactions if float(t.get("amount", 0.0)) < 0]
    
    if not expenses:
        return {
            "transaction": None,
            "deviation_pct": 0.0,
            "explanation": "No expense transactions recorded yet to analyze for spending anomalies."
        }

    # Group expenses by category
    category_expenses = defaultdict(list)
    for t in expenses:
        cat = (t.get("category") or "uncategorized").lower().strip()
        category_expenses[cat].append(t)

    all_amounts = [abs(float(t["amount"])) for t in expenses]
    overall_avg = sum(all_amounts) / len(all_amounts) if all_amounts else 0.0

    candidates = []

    for cat, txns in category_expenses.items():
        cat_amounts = [abs(float(t["amount"])) for t in txns]
        
        for t in txns:
            amt = abs(float(t["amount"]))
            
            # Category baseline: average of other transactions in this category
            other_amounts = [a for a in cat_amounts if a != amt]
            if other_amounts:
                baseline_avg = sum(other_amounts) / len(other_amounts)
            elif len(cat_amounts) > 1:
                baseline_avg = sum(cat_amounts) / len(cat_amounts)
            else:
                # Single transaction category: compare against overall average
                other_overall = [a for a in all_amounts if a != amt]
                baseline_avg = sum(other_overall) / len(other_overall) if other_overall else overall_avg

            if baseline_avg > 0:
                deviation_pct = round(((amt - baseline_avg) / baseline_avg) * 100, 1)
            else:
                deviation_pct = 0.0

            candidates.append({
                "transaction": {
                    "id": t.get("id"),
                    "user_id": user_id,
                    "date": str(t.get("date")),
                    "description": t.get("description", ""),
                    "amount": float(t.get("amount")),
                    "category": t.get("category", "uncategorized"),
                },
                "amount": amt,
                "category": cat,
                "category_avg": round(baseline_avg, 2),
                "deviation_pct": deviation_pct,
            })

    if not candidates:
        return {
            "transaction": None,
            "deviation_pct": 0.0,
            "explanation": "No spending anomalies detected across your transactions."
        }

    # Pick the single highest-deviation transaction
    spotlight = max(candidates, key=lambda c: c["deviation_pct"])

    explanation = explain_anomaly(
        amount=spotlight["amount"],
        description=spotlight["transaction"]["description"],
        category=spotlight["category"],
        category_avg=spotlight["category_avg"],
        deviation_pct=spotlight["deviation_pct"],
    )

    return {
        "transaction": spotlight["transaction"],
        "deviation_pct": spotlight["deviation_pct"],
        "explanation": explanation,
    }
