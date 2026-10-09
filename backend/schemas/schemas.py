from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, datetime

# --- Income Schemas ---
class IncomeRequest(BaseModel):
    user_id: int = Field(default=1, description="User ID")
    monthly_income: float = Field(..., gt=0, description="Monthly income in INR")

class IncomeResponse(BaseModel):
    user_id: int
    monthly_income: float

# --- Transactions Schemas ---
class TransactionItem(BaseModel):
    id: Optional[int] = None
    user_id: int
    date: date
    description: str
    amount: float
    category: Optional[str] = "uncategorized"
    raw_row: Optional[str] = None

class UploadResponse(BaseModel):
    rows_imported: int
    rows_failed: int
    categories_found: List[str]

# --- Dashboard Schemas ---
class CategorySpend(BaseModel):
    category: str
    amount: float

class DashboardResponse(BaseModel):
    monthly_income: float
    total_expenses: float
    remaining_balance: float
    by_category: List[CategorySpend]

# --- Predict Schemas ---
class PredictResponse(BaseModel):
    current_balance: float
    predicted_balance: float
    shortage_predicted: bool
    shortage_date: Optional[str] = None
    risk_level: str
    explanation: str

# --- Savings Schemas ---
class SavingsGoalRequest(BaseModel):
    user_id: int = Field(default=1, description="User ID")
    target_amount: float = Field(..., gt=0, description="Target savings amount")
    target_months: int = Field(..., gt=0, description="Months to achieve goal")

class SavingsGoalResponse(BaseModel):
    goal_id: int
    required_monthly_savings: float
    feasible: bool

class SuggestedCut(BaseModel):
    category: str
    current: float
    suggested: float
    reason: str

class SavingsPlanResponse(BaseModel):
    required_monthly_savings: float
    suggested_cuts: List[SuggestedCut]
    explanation: str

# --- Error Schema ---
class ErrorResponse(BaseModel):
    error: str
