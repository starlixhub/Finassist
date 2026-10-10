from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
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
    forecast_method: str = Field(default="EMA (alpha=0.3)", description="Forecasting algorithm used (EMA vs simple_average)")
    data_points_used: int = Field(default=0, description="Number of transaction data points used for prediction")
    confidence_level: str = Field(default="high", description="Data confidence level based on verified historical transactions (high, medium, low)")

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
    cut_pct: Optional[float] = Field(None, description="Percentage reduction applied to category")
    constraint_applied: Optional[str] = Field("max_20pct_cap", description="Constraint applied (e.g. max_20pct_cap)")
    reason: str

class SavingsPlanResponse(BaseModel):
    required_monthly_savings: float
    feasible: bool = Field(default=True, description="Whether the savings target is feasible")
    max_achievable_savings: Optional[float] = Field(None, description="Maximum achievable monthly savings under constraints")
    gap: Optional[float] = Field(0.0, description="Remaining shortfall or savings gap")
    suggested_cuts: List[SuggestedCut]
    explanation: str

# --- Anomaly Spotlight Schemas ---
class AnomalySpotlightResponse(BaseModel):
    transaction: Optional[Dict[str, Any]] = Field(None, description="The anomaly transaction object")
    deviation_pct: float = Field(0.0, description="Percentage deviation above category average")
    explanation: str = Field(..., description="Explainable AI narrative for the anomaly")

# --- Demo Loader Schemas ---
class DemoLoadRequest(BaseModel):
    user_id: int = Field(default=1, description="Target User ID for demo borrower")
    monthly_income: float = Field(default=45000.0, gt=0, description="Monthly income in INR")

class DemoLoadResponse(BaseModel):
    status: str = Field("success", description="Status of demo loading")
    message: str = Field(..., description="Human-readable status message")
    user_id: int = Field(1, description="User ID populated")
    borrower_name: str = Field("Demo Borrower", description="Name of borrower profile")
    monthly_income: float = Field(45000.0, description="Monthly income configured")
    rows_imported: int = Field(..., description="Number of sample transactions imported")
    rows_failed: int = Field(0, description="Number of failed rows")
    categories_found: List[str] = Field(..., description="List of unique categories identified")

# --- Error Schema ---
class ErrorResponse(BaseModel):
    error: str

