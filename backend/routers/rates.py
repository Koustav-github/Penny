import os

import httpx
from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user
import models

router = APIRouter(prefix="/rates", tags=["rates"])

# ExchangeRate-API v6. We use Token Bearer auth (key in the Authorization
# header, NOT in the URL) so the key never leaks into request logs.
EXCHANGERATE_BASE_URL = "https://v6.exchangerate-api.com/v6"


@router.get("/{base}/{target}")
async def get_rate(
    base: str,
    target: str,
    _user: models.User = Depends(get_current_user),
):
    """Fetch the latest conversion rate from `base` to `target` (e.g. USD -> INR)."""
    api_key = os.getenv("EXCHANGE_RATES_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="EXCHANGE_RATES_API_KEY is not configured")

    base = base.upper()
    target = target.upper()

    async with httpx.AsyncClient(timeout=10) as client:
        try:
            response = await client.get(
                f"{EXCHANGERATE_BASE_URL}/pair/{base}/{target}",
                headers={"Authorization": f"Bearer {api_key}"},
            )
        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail=f"Exchange rate service unreachable: {exc}")

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Exchange rate error: {response.text}")

    data = response.json()
    if data.get("result") != "success":
        raise HTTPException(status_code=502, detail=data.get("error-type", "unknown error"))

    return {
        "base": data["base_code"],
        "target": data["target_code"],
        "rate": data["conversion_rate"],
        "last_update": data.get("time_last_update_utc"),
    }
