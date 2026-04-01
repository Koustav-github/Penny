from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine, get_database, SessionLocal
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import models
import os
import httpx
from dotenv import load_dotenv

load_dotenv()
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")

Base.metadata.create_all(bind=engine)

app = FastAPI(title = "Penny Backend")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserSync(BaseModel):
    clerk_id: str
    email: EmailStr


def get_database():
    database = SessionLocal()
    try:
        yield database
    finally:
        database.close()

@app.post("/users/sync")
async def sync_user(user_data: UserSync, db: Session = Depends(get_database)):
    db_user = db.query(models.User).filter(models.User.clerk_id == user_data.clerk_id).first()

    if db_user:
        return {"message": "User already synced", "user_id": db_user.id}

    new_user = models.User(
        clerk_id=user_data.clerk_id,
        email=user_data.email,
        net_asset=0.0
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return {"message": "User created successfully", "user_id": new_user.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/users/signout")
async def signout(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization.removeprefix("Bearer ")

    # Decode session ID (sid) from the JWT payload
    try:
        import base64, json
        payload_part = token.split(".")[1]
        payload_part += "=" * (4 - len(payload_part) % 4)
        payload = json.loads(base64.urlsafe_b64decode(payload_part))
        session_id = payload.get("sid")
    except Exception:
        raise HTTPException(status_code=401, detail="Could not decode token")

    if not session_id:
        raise HTTPException(status_code=401, detail="No session ID in token")

    # Revoke the session via Clerk Backend API
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://api.clerk.com/v1/sessions/{session_id}/revoke",
            headers={"Authorization": f"Bearer {CLERK_SECRET_KEY}"},
        )
        if response.status_code not in (200, 204):
            raise HTTPException(status_code=502, detail=f"Clerk error: {response.text}")

    return {"message": "Signed out successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
