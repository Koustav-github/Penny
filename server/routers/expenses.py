from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_database
from auth import get_current_user
from services.summaries import compute_expense_summary
from services import money
import models
import schemas

router = APIRouter(prefix="/expenses", tags=["expenses"])


def _to_out(e: models.Expense, user: models.User) -> schemas.ExpenseOut:
    """Serialize an expense with its amount in the user's display currency
    (stored in base currency)."""
    return schemas.ExpenseOut(
        id=e.id,
        category=e.category,
        name=e.name,
        amount=money.to_display(e.amount, user) or 0.0,
        spent_on=e.spent_on,
        note=e.note,
        created_at=e.created_at,
    )


def _owned(db: Session, user: models.User, expense_id: int) -> models.Expense:
    expense = (
        db.query(models.Expense)
        .filter(models.Expense.id == expense_id, models.Expense.user_id == user.id)
        .first()
    )
    if expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@router.get("/summary", response_model=schemas.ExpenseSummary)
def summary(db: Session = Depends(get_database), user: models.User = Depends(get_current_user)):
    return compute_expense_summary(db, user)


@router.get("", response_model=list[schemas.ExpenseOut])
def list_expenses(db: Session = Depends(get_database), user: models.User = Depends(get_current_user)):
    rows = (
        db.query(models.Expense)
        .filter(models.Expense.user_id == user.id)
        .order_by(models.Expense.spent_on.desc(), models.Expense.id.desc())
        .all()
    )
    return [_to_out(e, user) for e in rows]


@router.post("", response_model=schemas.ExpenseOut, status_code=status.HTTP_201_CREATED)
def create_expense(
    payload: schemas.ExpenseCreate,
    db: Session = Depends(get_database),
    user: models.User = Depends(get_current_user),
):
    data = payload.model_dump()
    data["category"] = data["category"].value if hasattr(data["category"], "value") else data["category"]
    expense = models.Expense(user_id=user.id, **data)
    expense.amount = money.to_base(expense.amount, user)  # entered in display -> store base
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return _to_out(expense, user)


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
    expense.amount = money.to_base(expense.amount, user)  # entered in display -> store base
    db.commit()
    db.refresh(expense)
    return _to_out(expense, user)


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_database),
    user: models.User = Depends(get_current_user),
):
    expense = _owned(db, user, expense_id)
    db.delete(expense)
    db.commit()
