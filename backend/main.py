from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine, get_database, SessionLocal
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import models

Base.metadata.create_all(bind=engine)

app = FastAPI(title = "Penny Backend")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Your Next.js URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserSync(BaseModel):
    clerk_id: str
    email: EmailStr


def get_database():

    database= SessionLocal()
    try:
        yield database
    finally:
        database.close()

@app.post("/users/sync")
async def sync_user(user_data: UserSync, db: Session = Depends(get_database)):
    # Check if user already exists (to avoid duplicates)
    db_user = db.query(models.User).filter(models.User.clerk_id == user_data.clerk_id).first()
    
    if db_user:
        return {"message": "User already synced", "user_id": db_user.id}

    # Create new user in your database
    new_user = models.User(
        clerk_id=user_data.clerk_id,
        email=user_data.email,
        net_asset=0.0  # Initializing Penny's first balance!
    )
    
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return {"message": "User created successfully", "user_id": new_user.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)