from dataclasses import dataclass
from typing import Optional
from datetime import date, datetime

@dataclass
class User:
    id: Optional[int]
    name: Optional[str]
    monthly_income: Optional[float]
    created_at: Optional[datetime] = None

@dataclass
class Transaction:
    id: Optional[int]
    user_id: int
    date: str
    description: str
    amount: float
    category: Optional[str]
    raw_row: Optional[str] = None

@dataclass
class Goal:
    id: Optional[int]
    user_id: int
    target_amount: float
    target_months: int
    created_at: Optional[datetime] = None

@dataclass
class Prediction:
    id: Optional[int]
    user_id: int
    predicted_date: Optional[str]
    predicted_balance: float
    risk_level: str
    created_at: Optional[datetime] = None
