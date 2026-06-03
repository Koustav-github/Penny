from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from database import get_database
from auth import get_current_user
import models
import schemas

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=schemas.UserOut)
def get_me(user: models.User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=schemas.UserOut)
def update_me(
    payload: schemas.UserUpdate,
    db: Session = Depends(get_database),
    user: models.User = Depends(get_current_user),
):
    if payload.currency is not None:
        user.currency = payload.currency
    if payload.monthly_salary is not None:
        user.monthly_salary = payload.monthly_salary
    db.commit()
    db.refresh(user)
    return user


def _profile_out(user: models.User) -> schemas.ProfileOut:
    return schemas.ProfileOut(
        risk_appetite=user.risk_appetite,
        monthly_savings_target=user.monthly_savings_target,
        time_horizon_years=user.time_horizon_years,
        dependents=user.dependents,
        goals=user.goals,
        ai_consent=user.ai_consent_at is not None,
    )


@router.get("/profile", response_model=schemas.ProfileOut)
def get_profile(user: models.User = Depends(get_current_user)):
    return _profile_out(user)


@router.put("/profile", response_model=schemas.ProfileOut)
def update_profile(
    payload: schemas.ProfileIn,
    db: Session = Depends(get_database),
    user: models.User = Depends(get_current_user),
):
    data = payload.model_dump(exclude_unset=True)
    if "risk_appetite" in data:
        ra = data["risk_appetite"]
        user.risk_appetite = ra.value if hasattr(ra, "value") else ra
    if "monthly_savings_target" in data:
        user.monthly_savings_target = data["monthly_savings_target"]
    if "time_horizon_years" in data:
        user.time_horizon_years = data["time_horizon_years"]
    if "dependents" in data:
        user.dependents = data["dependents"]
    if "goals" in data:
        user.goals = data["goals"]
    db.commit()
    db.refresh(user)
    return _profile_out(user)


@router.post("/ai-consent", response_model=schemas.ProfileOut)
def ai_consent(
    db: Session = Depends(get_database),
    user: models.User = Depends(get_current_user),
):
    if user.ai_consent_at is None:
        user.ai_consent_at = func.now()
        db.commit()
        db.refresh(user)
    return _profile_out(user)
