import logging
import os
from typing import Optional
from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session
from clerk_backend_api.security.verifytoken import verify_token
from clerk_backend_api.security.types import VerifyTokenOptions
from database import get_database
import models

logger = logging.getLogger(__name__)

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
if not CLERK_SECRET_KEY:
    raise RuntimeError("CLERK_SECRET_KEY environment variable is required")


def get_current_user(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_database),
) -> models.User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.removeprefix("Bearer ").strip()

    try:
        claims = verify_token(token, VerifyTokenOptions(secret_key=CLERK_SECRET_KEY))
    except Exception as exc:
        logger.warning("Clerk token verification failed: %s", exc)
        raise HTTPException(status_code=401, detail="Invalid token")

    clerk_id = claims.get("sub")
    if not clerk_id:
        raise HTTPException(status_code=401, detail="Token missing subject")

    user = db.query(models.User).filter(models.User.clerk_id == clerk_id).first()
    if user is None:
        user = models.User(
            clerk_id=clerk_id,
            email=claims.get("email") or f"{clerk_id}@placeholder.local",
            currency="INR",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user
