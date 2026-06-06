from enum import Enum
from typing import Optional
from datetime import datetime, date
from pydantic import BaseModel, Field, model_validator


class Category(str, Enum):
    bank = "bank"
    cash = "cash"
    crypto = "crypto"
    stock = "stock"
    gold = "gold"
    loan = "loan"
    other = "other"


# Categories whose value is computed live from a price API (not user-entered).
QUANTITY_CATEGORIES = {Category.crypto, Category.stock, Category.gold}
AUTO_CATEGORIES = QUANTITY_CATEGORIES
SYMBOL_CATEGORIES = {Category.crypto, Category.stock}


class AssetIn(BaseModel):
    """Create/update payload. For auto categories the client omits `value`
    (server computes it from the price API); for manual categories it's required."""

    category: Category
    name: str = Field(default="", max_length=120)
    subtype: Optional[str] = Field(default=None, max_length=60)
    symbol: Optional[str] = Field(default=None, max_length=60)
    account: Optional[str] = Field(default=None, max_length=120)
    quantity: Optional[float] = Field(default=None, ge=0)
    value: Optional[float] = Field(default=None, ge=0)
    emi: Optional[float] = Field(default=None, ge=0)  # loan: monthly installment

    @model_validator(mode="after")
    def check_category_fields(self):
        cat = self.category
        # Cash is auto-named; everything else needs a name.
        if cat == Category.cash and not (self.name and self.name.strip()):
            self.name = "Cash"
        if not self.name or not self.name.strip():
            raise ValueError("name is required")

        if cat in AUTO_CATEGORIES and self.quantity is None:
            raise ValueError(f"quantity is required for {cat.value}")
        if cat in SYMBOL_CATEGORIES and not (self.symbol and self.symbol.strip()):
            raise ValueError(f"symbol is required for {cat.value}")
        if cat == Category.loan and self.emi is None:
            raise ValueError("emi is required for loan")
        if cat not in AUTO_CATEGORIES and self.value is None:
            raise ValueError("value is required")
        if cat in AUTO_CATEGORIES:
            self.value = self.value or 0.0  # server prices it; 0 is a placeholder cache

        # Strip fields that don't belong to this category.
        if cat != Category.loan:
            self.emi = None
        if cat != Category.bank:
            self.subtype = None
        if cat not in SYMBOL_CATEGORIES:
            self.symbol = None
        if cat not in {Category.stock, Category.gold}:
            self.account = None
        return self


class AssetCreate(AssetIn):
    pass


class AssetUpdate(AssetIn):
    pass


class AssetOut(BaseModel):
    id: int
    category: Category
    name: str
    subtype: Optional[str] = None
    symbol: Optional[str] = None
    account: Optional[str] = None
    quantity: Optional[float] = None
    value: float
    emi: Optional[float] = None
    priced_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SymbolHit(BaseModel):
    """One autocomplete match for crypto/stock symbol search."""

    symbol: str
    name: str
    exchange: Optional[str] = None


class CategorySummary(BaseModel):
    category: Category
    total: float
    pct: float


class AssetSummary(BaseModel):
    total: float                  # sum of non-loan asset values
    currency: str
    by_category: list[CategorySummary]
    emi_total: float = 0.0        # sum of monthly EMIs across loans


class ExpenseCategory(str, Enum):
    food = "food"
    transport = "transport"
    groceries = "groceries"
    subscriptions = "subscriptions"
    utilities = "utilities"
    shopping = "shopping"
    health = "health"
    entertainment = "entertainment"
    other = "other"


class ExpenseBase(BaseModel):
    category: ExpenseCategory
    name: str = Field(min_length=1, max_length=120)
    amount: float = Field(ge=0)
    spent_on: date
    note: Optional[str] = Field(default=None, max_length=200)


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(ExpenseBase):
    pass


class ExpenseOut(ExpenseBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ExpenseCategorySummary(BaseModel):
    category: ExpenseCategory
    total: float
    pct: float


class MonthlySpend(BaseModel):
    month: str  # "YYYY-MM"
    total: float


class ExpenseSummary(BaseModel):
    total: float                       # current calendar month
    currency: str
    count: int                         # transactions this month
    by_category: list[ExpenseCategorySummary]
    monthly: list[MonthlySpend]        # last 6 months, oldest first


class UserOut(BaseModel):
    id: int
    email: str
    currency: str
    monthly_salary: float

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    currency: Optional[str] = Field(default=None, pattern="^(INR|USD|EUR|GBP)$")
    monthly_salary: Optional[float] = Field(default=None, ge=0)


# --- AI Reports ---

class RiskAppetite(str, Enum):
    conservative = "conservative"
    balanced = "balanced"
    aggressive = "aggressive"


class ReportType(str, Enum):
    spending = "spending"
    networth = "networth"
    savings = "savings"
    investing = "investing"


class GoalTerm(str, Enum):
    short = "short"
    long = "long"


class Goal(BaseModel):
    text: str = Field(min_length=1, max_length=120)
    term: GoalTerm = GoalTerm.short


class ProfileIn(BaseModel):
    risk_appetite: Optional[RiskAppetite] = None
    monthly_savings_target: Optional[float] = Field(default=None, ge=0)
    time_horizon_years: Optional[int] = Field(default=None, ge=0, le=100)
    dependents: Optional[int] = Field(default=None, ge=0, le=50)
    goals: Optional[list[Goal]] = None  # capped to 10 in the validator below

    @model_validator(mode="after")
    def cap_goals(self):
        if self.goals is not None:
            self.goals = [g for g in self.goals if g.text.strip()][:10]
        return self


class ProfileOut(BaseModel):
    risk_appetite: Optional[RiskAppetite] = None
    monthly_savings_target: Optional[float] = None
    time_horizon_years: Optional[int] = None
    dependents: Optional[int] = None
    goals: Optional[list[Goal]] = None
    ai_consent: bool = False

    model_config = {"from_attributes": True}


class ReportSection(BaseModel):
    key: str = Field(description="one of: summary, overspending, cut_costs, grow_savings")
    title: str = Field(description="short human-readable section title")
    body: str = Field(description="2-4 sentence writeup grounded in the user's real numbers")
    bullets: list[str] = Field(default_factory=list, description="concrete, actionable points")


class ReportPayload(BaseModel):
    """Structured output schema the LLM must return."""

    sections: list[ReportSection] = Field(
        description="exactly four sections in order: summary, overspending, cut_costs, grow_savings"
    )


class ReportGenerateIn(BaseModel):
    report_type: ReportType
    period: str = Field(min_length=1, max_length=60)


class ReportOut(BaseModel):
    id: int
    created_at: datetime
    report_type: str
    period: str
    model: str
    sections: list[ReportSection]
    disclaimer: str

    model_config = {"from_attributes": True}
