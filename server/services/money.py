"""Currency conversion at the read/write boundary.

All monetary amounts are stored in the user's ``base_currency`` (set once and
never rewritten). They are converted to the user's ``currency`` (display) on the
way out, and from display back to base on the way in — so changing the display
currency is a lossless view change with exact round-trips.
"""
from typing import Optional

from fastapi import HTTPException

import models
from services import pricing


def _rate(frm: str, to: str) -> Optional[float]:
    if frm == to:
        return 1.0
    return pricing.get_fx_rate(frm, to)


def to_display(amount: Optional[float], user: models.User) -> Optional[float]:
    """Stored base-currency amount -> display currency. Best effort: if no FX
    rate is available, return the amount unconverted rather than erroring a read."""
    if not amount:  # None or 0 — nothing to convert
        return amount
    base = user.base_currency or "INR"
    disp = user.currency or base
    if base == disp:
        return amount
    rate = _rate(base, disp)
    return round(amount * rate, 2) if rate is not None else amount


def to_base(amount: Optional[float], user: models.User) -> Optional[float]:
    """User-entered display-currency amount -> stored base currency. Requires a
    rate (raises 502 if unavailable) so we never store a wrong denomination."""
    if not amount:  # None or 0 — nothing to convert
        return amount
    base = user.base_currency or "INR"
    disp = user.currency or base
    if base == disp:
        return amount
    rate = _rate(disp, base)
    if rate is None:
        raise HTTPException(status_code=502, detail="Conversion rate unavailable. Please try again.")
    return round(amount * rate, 2)
