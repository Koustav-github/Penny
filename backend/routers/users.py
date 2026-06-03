from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
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
    payload: schemas.CurrencyUpdate,
    db: Session = Depends(get_database),
    user: models.User = Depends(get_current_user),
):
    user.currency = payload.currency
    db.commit()
    db.refresh(user)
    return user
