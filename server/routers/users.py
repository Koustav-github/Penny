from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from database import get_database
from auth import get_current_user
from services import pricing
import models
import schemas

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=schemas.UserOut)
def get_me(user: models.User = Depends(get_current_user)):
    return user


def _convert_currency(db: Session, user: models.User, old: str, new: str) -> None:
    """Convert every stored amount (asset values + EMIs, expenses, salary) from
    `old` to `new` so the user's money is actually re-denominated, not relabelled.
    Aborts (502) if no FX rate is available, leaving amounts consistent."""
    rate = pricing.get_fx_rate(old, new)
    if rate is None:
        raise HTTPException(status_code=502, detail="Conversion rate unavailable. Please try again.")
    for a in db.query(models.Assets).filter(models.Assets.user_id == user.id).all():
        if a.value is not None:
            a.value = round(a.value * rate, 2)
        if a.emi is not None:
            a.emi = round(a.emi * rate, 2)
    for e in db.query(models.Expense).filter(models.Expense.user_id == user.id).all():
        e.amount = round(e.amount * rate, 2)
    if user.monthly_salary:
        user.monthly_salary = round(user.monthly_salary * rate, 2)
    user.currency = new


@router.patch("/me", response_model=schemas.UserOut)
def update_me(
    payload: schemas.UserUpdate,
    db: Session = Depends(get_database),
    user: models.User = Depends(get_current_user),
):
    if payload.currency is not None and payload.currency != user.currency:
        _convert_currency(db, user, user.currency, payload.currency)
    if payload.monthly_salary is not None:
        user.monthly_salary = payload.monthly_salary
    db.commit()
    db.refresh(user)
    return user


def _normalize_goals(raw) -> list[dict] | None:
    """Tolerate legacy goals stored as plain strings (term defaults to short)."""
    if not raw:
        return None
    out: list[dict] = []
    for g in raw:
        if isinstance(g, str):
            out.append({"text": g, "term": "short"})
        elif isinstance(g, dict) and g.get("text"):
            out.append({"text": g["text"], "term": g.get("term", "short")})
    return out or None


def _profile_out(user: models.User) -> schemas.ProfileOut:
    return schemas.ProfileOut(
        risk_appetite=user.risk_appetite,
        monthly_savings_target=user.monthly_savings_target,
        time_horizon_years=user.time_horizon_years,
        dependents=user.dependents,
        goals=_normalize_goals(user.goals),
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
        user.goals = (
            [{"text": g.text, "term": g.term.value} for g in payload.goals]
            if payload.goals
            else payload.goals
        )
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
