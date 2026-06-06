"""Shared asset/expense summary computations.

These are the single source of truth used by both the summary endpoints
(`routers/assets.py`, `routers/expenses.py`) and the AI-report snapshot builder,
so the numbers an LLM sees are exactly what the user sees on screen.
"""
from datetime import date

from sqlalchemy.orm import Session

import models
import schemas
from services import pricing


def compute_asset_summary(db: Session, user: models.User) -> schemas.AssetSummary:
    rows = db.query(models.Assets).filter(models.Assets.user_id == user.id).all()
    pricing.price_assets(db, user, rows)  # refresh live crypto/stock/gold values
    # Loans are liabilities, not holdings: excluded from the asset total and the
    # allocation breakdown. Their EMIs are reported separately.
    holdings = [a for a in rows if a.category != "loan"]
    emi_total = sum(a.emi or 0.0 for a in rows if a.category == "loan")
    total = sum(a.value for a in holdings)
    buckets: dict[str, float] = {}
    for a in holdings:
        buckets[a.category] = buckets.get(a.category, 0.0) + a.value
    by_category = [
        schemas.CategorySummary(
            category=cat, total=amt, pct=round((amt / total * 100), 2) if total else 0.0
        )
        for cat, amt in buckets.items()
    ]
    return schemas.AssetSummary(
        total=total, currency=user.currency, by_category=by_category, emi_total=emi_total
    )


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


def compute_expense_summary(db: Session, user: models.User) -> schemas.ExpenseSummary:
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
