"""Shared asset/expense summary computations.

These are the single source of truth used by both the summary endpoints
(`routers/assets.py`, `routers/expenses.py`) and the AI-report snapshot builder,
so the numbers an LLM sees are exactly what the user sees on screen.
"""
from datetime import date

from sqlalchemy.orm import Session

import models
import schemas
from services import pricing, money

_AUTO = {"crypto", "stock", "gold"}


def _display_value(asset: models.Assets, user: models.User) -> float:
    """Asset value in the user's display currency: auto assets are already
    priced in display currency; manual ones are stored in base and converted."""
    if asset.category in _AUTO:
        return asset.value or 0.0
    return money.to_display(asset.value, user) or 0.0


def compute_asset_summary(db: Session, user: models.User) -> schemas.AssetSummary:
    rows = db.query(models.Assets).filter(models.Assets.user_id == user.id).all()
    pricing.price_assets(db, user, rows)  # refresh live crypto/stock/gold values
    # Loans are liabilities, not holdings: excluded from the asset total and the
    # allocation breakdown. Their EMIs are reported separately.
    holdings = [a for a in rows if a.category != "loan"]
    emi_total = sum((money.to_display(a.emi or 0.0, user) or 0.0) for a in rows if a.category == "loan")
    total = sum(_display_value(a, user) for a in holdings)
    buckets: dict[str, float] = {}
    for a in holdings:
        buckets[a.category] = buckets.get(a.category, 0.0) + _display_value(a, user)
    by_category = [
        schemas.CategorySummary(
            category=cat, total=round(amt, 2), pct=round((amt / total * 100), 2) if total else 0.0
        )
        for cat, amt in buckets.items()
    ]
    return schemas.AssetSummary(
        total=round(total, 2), currency=user.currency, by_category=by_category,
        emi_total=round(emi_total, 2),
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

    # Expenses are stored in base currency; convert each to the display currency.
    amt_of = {e.id: (money.to_display(e.amount, user) or 0.0) for e in rows}

    current_key = _month_key(today)
    current_rows = [e for e in rows if _month_key(e.spent_on) == current_key]
    total = sum(amt_of[e.id] for e in current_rows)

    buckets: dict[str, float] = {}
    for e in current_rows:
        buckets[e.category] = buckets.get(e.category, 0.0) + amt_of[e.id]
    by_category = [
        schemas.ExpenseCategorySummary(
            category=cat, total=round(amt, 2), pct=round((amt / total * 100), 2) if total else 0.0
        )
        for cat, amt in sorted(buckets.items(), key=lambda kv: kv[1], reverse=True)
    ]

    monthly_totals = {k: 0.0 for k in month_keys}
    for e in rows:
        key = _month_key(e.spent_on)
        if key in monthly_totals:
            monthly_totals[key] += amt_of[e.id]
    monthly = [schemas.MonthlySpend(month=k, total=round(monthly_totals[k], 2)) for k in month_keys]

    return schemas.ExpenseSummary(
        total=round(total, 2),
        currency=user.currency,
        count=len(current_rows),
        by_category=by_category,
        monthly=monthly,
    )
