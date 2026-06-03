from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Date
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
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    assets = relationship("Assets", back_populates="owner", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="owner", cascade="all, delete-orphan")


class Assets(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False, index=True)
    category = Column(String, nullable=False)          # bank|cash|crypto|stock|gold|other
    name = Column(String, nullable=False)              # "SBI", "Bitcoin", "Nifty 50"
    subtype = Column(String, nullable=True)            # bank: "Savings"/"Current"
    quantity = Column(Float, nullable=True)            # crypto/stock/gold units
    value = Column(Float, nullable=False, default=0.0) # worth in user's currency
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
