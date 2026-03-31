from fastapi import FastAPI, Depends, Header, HTTPException
from database import Base, engine, get_database
from sqlalchemy.orm import Session
import models

Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.post("/api/users/sync")
def sync_user(
    clerk_id: str = Header(...), 
    email: str = Header(...), 
    db: Session = Depends(get_database)
):
    # 1. Check if user already exists
    existing_user = db.query(models.User).filter(models.User.clerk_id == clerk_id).first()

    if existing_user:
        return {"message": "User already exists", "user_id": existing_user.id}

    # 2. Persist new user
    new_user = models.User(clerk_id=clerk_id, email=email)
    db.add(new_user)
    db.commit() # This sends the data to Neon
    db.refresh(new_user) # This gets the auto-generated ID back

    return {"message": "User persisted", "user_id": new_user.id}