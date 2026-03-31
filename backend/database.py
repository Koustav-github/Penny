from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from pathlib import Path
import os

load_dotenv()
DB = os.getenv("DATABASE_URL")

if not DB:
    raise ValueError("DATABASE_URL not found in .env file")

engine = create_engine(DB, echo=True)
print("Engine created successfully !!")

SessionLocal = sessionmaker(autocommit = False, autoflush= False, bind=engine)

Base = declarative_base()

def get_database():

    database= SessionLocal()
    try:
        yield database
    finally:
        database.close()