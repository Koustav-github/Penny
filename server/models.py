from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Date, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "user"

    id = Column(Integer, primary_key=True, unique=True, index=True)
    clerk_id = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    net_asset = Column(Float, default=0.0)  # legacy; no longer read/written
    currency = Column(String, nullable=False, server_default="INR")
    monthly_salary = Column(Float, nullable=False, server_default="0")  # monthly income
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Financial profile (for AI Reports)
    risk_appetite = Column(String, nullable=True)            # conservative|balanced|aggressive
    monthly_savings_target = Column(Float, nullable=True)
    time_horizon_years = Column(Integer, nullable=True)
    dependents = Column(Integer, nullable=True)
    goals = Column(JSON, nullable=True)                      # list[str], 1-3 goals
    ai_consent_at = Column(DateTime(timezone=True), nullable=True)

    assets = relationship("Assets", back_populates="owner", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="owner", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="owner", cascade="all, delete-orphan")


class Assets(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False, index=True)
    category = Column(String, nullable=False)          # bank|cash|crypto|stock|gold|loan|other
    name = Column(String, nullable=False)              # "SBI", "Bitcoin", "Reliance"
    subtype = Column(String, nullable=True)            # bank: "Savings"/"Current"
    symbol = Column(String, nullable=True)             # API id: CoinGecko id / TwelveData ticker
    account = Column(String, nullable=True)            # stock/gold: free-text demat/bank label
    quantity = Column(Float, nullable=True)            # crypto/stock/gold units (gold: grams)
    value = Column(Float, nullable=False, default=0.0) # worth; auto cats: cached last-known
    emi = Column(Float, nullable=True)                 # loan: monthly installment
    priced_at = Column(DateTime(timezone=True), nullable=True)  # last successful live price
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    owner = relationship("User", back_populates="assets")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False, index=True)
    category = Column(String, nullable=False)          # food|transport|groceries|...|other
    name = Column(String, nullable=False)              # "Swiggy", "Uber"
    amount = Column(Float, nullable=False, default=0.0)  # spent, in user's currency
    spent_on = Column(Date, nullable=False)            # date of the expense
    note = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="expenses")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    report_type = Column(String, nullable=False)       # spending|networth|savings|investing
    period = Column(String, nullable=False)            # selected period label
    model = Column(String, nullable=False)             # LLM model id (or "heuristic")
    sections = Column(JSON, nullable=False)            # list[{key,title,body,bullets[]}]

    owner = relationship("User", back_populates="reports")
