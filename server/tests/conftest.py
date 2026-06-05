import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("CLERK_SECRET_KEY", "sk_test_dummy")

from database import Base, get_database  # noqa: E402
import models  # noqa: E402,F401
import main  # noqa: E402
from auth import get_current_user  # noqa: E402

engine = create_engine(
    "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
)
TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)


@pytest.fixture()
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db):
    def override_db():
        yield db

    main.app.dependency_overrides[get_database] = override_db
    yield TestClient(main.app)
    main.app.dependency_overrides.clear()


def make_user(db, clerk_id="user_a", email="a@example.com"):
    u = models.User(clerk_id=clerk_id, email=email, currency="INR")
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


def auth_as(user):
    """Override get_current_user to return a specific user."""
    main.app.dependency_overrides[get_current_user] = lambda: user
