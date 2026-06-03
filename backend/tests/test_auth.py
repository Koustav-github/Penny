import pytest
import auth
import models
from auth import get_current_user
from fastapi import HTTPException


def test_get_current_user_creates_on_first_sight(db, monkeypatch):
    monkeypatch.setattr(
        auth, "verify_token",
        lambda token, options: {"sub": "user_new", "email": "new@example.com"},
    )
    user = get_current_user(authorization="Bearer faketoken", db=db)
    assert user.clerk_id == "user_new"
    assert db.query(models.User).filter_by(clerk_id="user_new").count() == 1


def test_get_current_user_rejects_missing_header(db):
    with pytest.raises(HTTPException) as exc:
        get_current_user(authorization=None, db=db)
    assert exc.value.status_code == 401


def test_get_current_user_rejects_bad_token(db, monkeypatch):
    def boom(token, options):
        raise Exception("bad signature")
    monkeypatch.setattr(auth, "verify_token", boom)
    with pytest.raises(HTTPException) as exc:
        get_current_user(authorization="Bearer x", db=db)
    assert exc.value.status_code == 401


def test_get_current_user_is_idempotent(db, monkeypatch):
    monkeypatch.setattr(
        auth, "verify_token",
        lambda token, options: {"sub": "user_same", "email": "same@example.com"},
    )
    u1 = get_current_user(authorization="Bearer x", db=db)
    u2 = get_current_user(authorization="Bearer x", db=db)
    assert u1.id == u2.id
    assert db.query(models.User).filter_by(clerk_id="user_same").count() == 1


def test_get_current_user_rejects_missing_subject(db, monkeypatch):
    monkeypatch.setattr(auth, "verify_token", lambda token, options: {"email": "x@example.com"})
    with pytest.raises(HTTPException) as exc:
        get_current_user(authorization="Bearer x", db=db)
    assert exc.value.status_code == 401
