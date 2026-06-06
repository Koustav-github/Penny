from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_database
from auth import get_current_user
from services.summaries import compute_asset_summary
from services import pricing
import models
import schemas

router = APIRouter(prefix="/assets", tags=["assets"])


def _owned(db: Session, user: models.User, asset_id: int) -> models.Assets:
    asset = (
        db.query(models.Assets)
        .filter(models.Assets.id == asset_id, models.Assets.user_id == user.id)
        .first()
    )
    if asset is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


@router.get("/summary", response_model=schemas.AssetSummary)
def summary(db: Session = Depends(get_database), user: models.User = Depends(get_current_user)):
    return compute_asset_summary(db, user)


@router.get("/search/crypto", response_model=list[schemas.SymbolHit])
def search_crypto(q: str, _user: models.User = Depends(get_current_user)):
    return pricing.search_crypto(q)


@router.get("/search/stock", response_model=list[schemas.SymbolHit])
def search_stock(q: str, _user: models.User = Depends(get_current_user)):
    return pricing.search_stock(q)


@router.get("/quote")
def quote(
    category: str,
    quantity: float,
    symbol: str | None = None,
    user: models.User = Depends(get_current_user),
):
    """Live value preview: quantity x current price, in the user's currency."""
    cur = user.currency or "INR"
    price = None
    if category == "crypto" and symbol:
        price = pricing.get_crypto_prices([symbol], cur).get(symbol)
    elif category == "stock" and symbol:
        price = pricing.get_stock_price(symbol, cur)
    elif category == "gold":
        price = pricing.get_gold_price_per_gram(cur)
    if price is None:
        return {"value": None, "currency": cur, "priced": False}
    return {"value": round(quantity * price, 2), "currency": cur, "priced": True}


@router.get("", response_model=list[schemas.AssetOut])
def list_assets(db: Session = Depends(get_database), user: models.User = Depends(get_current_user)):
    rows = (
        db.query(models.Assets)
        .filter(models.Assets.user_id == user.id)
        .order_by(models.Assets.created_at.desc())
        .all()
    )
    pricing.price_assets(db, user, rows)  # refresh live crypto/stock/gold values
    return rows


@router.post("", response_model=schemas.AssetOut, status_code=status.HTTP_201_CREATED)
def create_asset(
    payload: schemas.AssetCreate,
    db: Session = Depends(get_database),
    user: models.User = Depends(get_current_user),
):
    asset = models.Assets(user_id=user.id, **payload.model_dump())
    asset.category = asset.category.value if hasattr(asset.category, "value") else asset.category
    db.add(asset)
    db.commit()
    db.refresh(asset)
    pricing.price_assets(db, user, [asset])  # populate live value before responding
    db.refresh(asset)
    return asset


@router.patch("/{asset_id}", response_model=schemas.AssetOut)
def update_asset(
    asset_id: int,
    payload: schemas.AssetUpdate,
    db: Session = Depends(get_database),
    user: models.User = Depends(get_current_user),
):
    asset = _owned(db, user, asset_id)
    data = payload.model_dump()
    data["category"] = data["category"].value if hasattr(data["category"], "value") else data["category"]
    for key, val in data.items():
        setattr(asset, key, val)
    db.commit()
    db.refresh(asset)
    pricing.price_assets(db, user, [asset])  # re-price after quantity/symbol change
    db.refresh(asset)
    return asset


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(
    asset_id: int,
    db: Session = Depends(get_database),
    user: models.User = Depends(get_current_user),
):
    asset = _owned(db, user, asset_id)
    db.delete(asset)
    db.commit()
