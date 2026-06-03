from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_database
from auth import get_current_user
import models
import schemas

router = APIRouter(prefix="/expenses", tags=["expenses"])


def _owned(db: Session, user: models.User, expense_id: int) -> models.Expense:
    expense = (
        db.query(models.Expense)
        .filter(models.Expense.id == expense_id, models.Expense.user_id == user.id)
        .first()
    )
    if expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


def _month_key(d: date) -> str:
    return f"{d.year:04d}-{d.month:02d}"


def _last_six_month_keys(today: date) -> list[str]:
    """Oldest-first list of the last 6 month keys, including the current month."""
    keys: list[str] = []
    year, month = today.year, today.month
    for _ in range(6):
        keys.append(f"{year:04d}-{month:02d}")
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    return list(reversed(keys))


@router.get("/summary", response_model=schemas.ExpenseSummary)
def summary(db: Session = Depends(get_database), user: models.User = Depends(get_current_user)):
    today = date.today()
    month_keys = _last_six_month_keys(today)
    window_start = date(int(month_keys[0][:4]), int(month_keys[0][5:7]), 1)

    rows = (
        db.query(models.Expense)
        .filter(models.Expense.user_id == user.id, models.Expense.spent_on >= window_start)
        .all()
    )

    current_key = _month_key(today)
    current_rows = [e for e in rows if _month_key(e.spent_on) == current_key]
    total = sum(e.amount for e in current_rows)

    buckets: dict[str, float] = {}
    for e in current_rows:
        buckets[e.category] = buckets.get(e.category, 0.0) + e.amount
    by_category = [
        schemas.ExpenseCategorySummary(
            category=cat, total=amt, pct=round((amt / total * 100), 2) if total else 0.0
        )
        for cat, amt in sorted(buckets.items(), key=lambda kv: kv[1], reverse=True)
    ]

    monthly_totals = {k: 0.0 for k in month_keys}
    for e in rows:
        key = _month_key(e.spent_on)
        if key in monthly_totals:
            monthly_totals[key] += e.amount
    monthly = [schemas.MonthlySpend(month=k, total=monthly_totals[k]) for k in month_keys]

    return schemas.ExpenseSummary(
        total=total,
        currency=user.currency,
        count=len(current_rows),
        by_category=by_category,
        monthly=monthly,
    )


@router.get("", response_model=list[schemas.ExpenseOut])
def list_expenses(db: Session = Depends(get_database), user: models.User = Depends(get_current_user)):
    return (
        db.query(models.Expense)
        .filter(models.Expense.user_id == user.id)
        .order_by(models.Expense.spent_on.desc(), models.Expense.id.desc())
        .all()
    )


@router.post("", response_model=schemas.ExpenseOut, status_code=status.HTTP_201_CREATED)
def create_expense(
    payload: schemas.ExpenseCreate,
    db: Session = Depends(get_database),
    user: models.User = Depends(get_current_user),
):
    data = payload.model_dump()
    data["category"] = data["category"].value if hasattr(data["category"], "value") else data["category"]
    expense = models.Expense(user_id=user.id, **data)
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.patch("/{expense_id}", response_model=schemas.ExpenseOut)
def update_expense(
    expense_id: int,
    payload: schemas.ExpenseUpdate,
    db: Session = Depends(get_database),
    user: models.User = Depends(get_current_user),
):
    expense = _owned(db, user, expense_id)
    data = payload.model_dump()
    data["category"] = data["category"].value if hasattr(data["category"], "value") else data["category"]
    for key, val in data.items():
        setattr(expense, key, val)
    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_database),
    user: models.User = Depends(get_current_user),
):
    expense = _owned(db, user, expense_id)
    db.delete(expense)
    db.commit()
