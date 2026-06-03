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


QUANTITY_CATEGORIES = {Category.crypto, Category.stock, Category.gold}


class AssetBase(BaseModel):
    category: Category
    name: str = Field(min_length=1, max_length=120)
    subtype: Optional[str] = Field(default=None, max_length=60)
    quantity: Optional[float] = Field(default=None, ge=0)
    value: float = Field(ge=0)
    emi: Optional[float] = Field(default=None, ge=0)  # loan: monthly installment

    @model_validator(mode="after")
    def check_category_fields(self):
        if self.category in QUANTITY_CATEGORIES and self.quantity is None:
            raise ValueError(f"quantity is required for {self.category.value}")
        if self.category == Category.loan and self.emi is None:
            raise ValueError("emi is required for loan")
        if self.category != Category.loan:
            self.emi = None
        if self.category != Category.bank:
            self.subtype = None
        return self


class AssetCreate(AssetBase):
    pass


class AssetUpdate(AssetBase):
    pass


class AssetOut(AssetBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


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
