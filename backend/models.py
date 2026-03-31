from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "user"

    id = Column(Integer, primary_key=True, unique=True, index=True)
    clerk_id = Column(Integer, primary_key=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    net_asset = Column(Float, default = 0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    assets = relationship("Assets", back_populates="owner")

class Assets(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)   # e.g., "HDFC Bank"
    asset_type = Column(String)              # e.g., "Bank", "Stock", "Crypto"
    balance = Column(Float, default=0.0)
    
    user_id = Column(Integer, ForeignKey("user.id"))
    owner = relationship("User", back_populates="assets")
