# Assets Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let each user start at zero and manually enter assets (bank, cash, crypto, stock, gold, other) that persist per-user and drive a dashboard total + donut chart in their chosen currency.

**Architecture:** FastAPI + SQLAlchemy + Alembic own the data; a unified `assets` table holds all categories. A `get_current_user` dependency verifies the Clerk session JWT (via the already-installed `clerk-backend-api`) and scopes every request to its owner. The Next.js frontend fetches the API with the Clerk Bearer token (matching the existing `/users/sync` pattern) and renders totals + an SVG donut.

**Tech Stack:** FastAPI, SQLAlchemy 2, Alembic, `clerk-backend-api`, Pydantic v2, pytest (SQLite for tests), `uv`; Next.js (App Router), Clerk, Vitest + React Testing Library.

---

## File Structure

**Backend** (`backend/`)
- `models.py` — *modify*: extend `Assets`, add `User.currency`.
- `schemas.py` — *create*: Pydantic request/response models + `Category` enum.
- `auth.py` — *create*: `get_current_user` dependency (Clerk JWT → DB user).
- `routers/__init__.py`, `routers/assets.py`, `routers/users.py` — *create*: endpoints.
- `main.py` — *modify*: include routers (keep CORS + `/users/signout`).
- `alembic/versions/<rev>_assets_v2.py` — *create*: migration.
- `tests/conftest.py`, `tests/test_auth.py`, `tests/test_assets.py`, `tests/test_users.py` — *create*.

**Frontend** (`frontend/src/`)
- `lib/api.ts` — *create*: token-injecting fetch client.
- `lib/format.ts` — *create*: `formatCurrency`.
- `lib/assets.ts` — *create*: types + per-category field metadata.
- `components/CategoryDonut.tsx` — *create*: SVG donut.
- `components/AssetForm.tsx` — *create*: add/edit modal.
- `components/CurrencySelect.tsx` — *create*: currency picker.
- `app/assets/AssetsClient.tsx` — *create*; `app/assets/page.tsx` — *modify* to render it.
- `app/dashboard/DashboardClient.tsx` — *modify*: wire to real data.
- `vitest.config.ts`, `vitest.setup.ts`, `components/__tests__/AssetForm.test.tsx` — *create*.

---

## Phase 1 — Backend

### Task 1: Extend the data model

**Files:** Modify `backend/models.py`

- [ ] **Step 1: Replace the `Assets` class and add `currency` to `User`**

```python
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "user"

    id = Column(Integer, primary_key=True, unique=True, index=True)
    clerk_id = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    net_asset = Column(Float, default=0.0)  # legacy; no longer read/written
    currency = Column(String, nullable=False, server_default="INR")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    assets = relationship("Assets", back_populates="owner", cascade="all, delete-orphan")


class Assets(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False, index=True)
    category = Column(String, nullable=False)          # bank|cash|crypto|stock|gold|other
    name = Column(String, nullable=False)              # "SBI", "Bitcoin", "Nifty 50"
    subtype = Column(String, nullable=True)            # bank: "Savings"/"Current"
    quantity = Column(Float, nullable=True)            # crypto/stock/gold units
    value = Column(Float, nullable=False, default=0.0) # worth in user's currency
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    owner = relationship("User", back_populates="assets")
```

- [ ] **Step 2: Commit**

```bash
git add backend/models.py
git commit -m "feat(models): unified assets schema + user currency"
```

---

### Task 2: Alembic migration

**Files:** Create `backend/alembic/versions/<rev>_assets_v2.py`

> Existing asset rows are placeholder/dev data; renamed columns are handled as drop+add (data loss is acceptable here).

- [ ] **Step 1: Generate a blank revision**

Run (from `backend/`): `uv run alembic revision -m "assets v2 and user currency"`
Expected: a new file under `alembic/versions/`. Note its path.

- [ ] **Step 2: Write the migration body** (replace `upgrade`/`downgrade`)

```python
from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    op.add_column("user", sa.Column("currency", sa.String(), nullable=False, server_default="INR"))

    # Rebuild assets columns to the unified schema.
    op.drop_column("assets", "asset_type")
    op.drop_column("assets", "balance")
    op.add_column("assets", sa.Column("category", sa.String(), nullable=False, server_default="other"))
    op.add_column("assets", sa.Column("subtype", sa.String(), nullable=True))
    op.add_column("assets", sa.Column("quantity", sa.Float(), nullable=True))
    op.add_column("assets", sa.Column("value", sa.Float(), nullable=False, server_default="0"))
    op.add_column("assets", sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()))
    op.add_column("assets", sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()))
    op.alter_column("assets", "user_id", existing_type=sa.Integer(), nullable=False)
    op.create_index("ix_assets_user_id", "assets", ["user_id"])
    # Drop the temporary server defaults that were only needed to backfill existing rows.
    op.alter_column("assets", "category", server_default=None)
    op.alter_column("assets", "value", server_default=None)


def downgrade() -> None:
    op.drop_index("ix_assets_user_id", table_name="assets")
    op.drop_column("assets", "updated_at")
    op.drop_column("assets", "created_at")
    op.drop_column("assets", "value")
    op.drop_column("assets", "quantity")
    op.drop_column("assets", "subtype")
    op.drop_column("assets", "category")
    op.add_column("assets", sa.Column("balance", sa.Float(), nullable=True))
    op.add_column("assets", sa.Column("asset_type", sa.String(), nullable=True))
    op.drop_column("user", "currency")
```

- [ ] **Step 3: Apply it**

Run: `uv run alembic upgrade head`
Expected: "Running upgrade … assets v2 and user currency". No errors.

- [ ] **Step 4: Commit**

```bash
git add backend/alembic/versions/
git commit -m "feat(db): migrate assets to unified schema + user.currency"
```

---

### Task 3: Pydantic schemas

**Files:** Create `backend/schemas.py`

- [ ] **Step 1: Write schemas + category enum + validation**

```python
from enum import Enum
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, model_validator


class Category(str, Enum):
    bank = "bank"
    cash = "cash"
    crypto = "crypto"
    stock = "stock"
    gold = "gold"
    other = "other"


QUANTITY_CATEGORIES = {Category.crypto, Category.stock, Category.gold}


class AssetBase(BaseModel):
    category: Category
    name: str = Field(min_length=1, max_length=120)
    subtype: Optional[str] = Field(default=None, max_length=60)
    quantity: Optional[float] = Field(default=None, ge=0)
    value: float = Field(ge=0)

    @model_validator(mode="after")
    def check_category_fields(self):
        if self.category in QUANTITY_CATEGORIES and self.quantity is None:
            raise ValueError(f"quantity is required for {self.category.value}")
        if self.category != Category.bank:
            self.subtype = None
        return self


class AssetCreate(AssetBase):
    pass


class AssetUpdate(AssetBase):
    pass


class AssetOut(AssetBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CategorySummary(BaseModel):
    category: Category
    total: float
    pct: float


class AssetSummary(BaseModel):
    total: float
    currency: str
    by_category: list[CategorySummary]


class UserOut(BaseModel):
    id: int
    email: str
    currency: str

    model_config = {"from_attributes": True}


class CurrencyUpdate(BaseModel):
    currency: str = Field(pattern="^(INR|USD|EUR|GBP)$")
```

- [ ] **Step 2: Commit**

```bash
git add backend/schemas.py
git commit -m "feat(schemas): asset + user pydantic models"
```

---

### Task 4: Auth dependency

**Files:** Create `backend/auth.py`; create `backend/tests/conftest.py`; create `backend/tests/test_auth.py`

- [ ] **Step 1: Add pytest as a dev dependency**

Run (from `backend/`): `uv add --dev pytest`
Expected: pytest added to `pyproject.toml` `[dependency-groups]`/dev and installed.

- [ ] **Step 2: Write `backend/tests/conftest.py`** (SQLite test DB + app fixture)

```python
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
```

- [ ] **Step 3: Write the failing test `backend/tests/test_auth.py`**

```python
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
```

- [ ] **Step 4: Run it to verify it fails**

Run (from `backend/`): `uv run pytest tests/test_auth.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'auth'`.

- [ ] **Step 5: Implement `backend/auth.py`**

```python
import os
from typing import Optional
from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session
from clerk_backend_api.security.verifytoken import verify_token
from clerk_backend_api.security.types import VerifyTokenOptions
from database import get_database
import models

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")


def get_current_user(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_database),
) -> models.User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.removeprefix("Bearer ").strip()

    try:
        claims = verify_token(token, VerifyTokenOptions(secret_key=CLERK_SECRET_KEY))
    except Exception:
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
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `uv run pytest tests/test_auth.py -v`
Expected: 3 passed.

- [ ] **Step 7: Commit**

```bash
git add backend/auth.py backend/tests/ backend/pyproject.toml backend/uv.lock
git commit -m "feat(auth): clerk-verified get_current_user dependency"
```

---

### Task 5: Assets CRUD router

**Files:** Create `backend/routers/__init__.py` (empty), `backend/routers/assets.py`; create `backend/tests/test_assets.py`

- [ ] **Step 1: Write the failing tests `backend/tests/test_assets.py`**

```python
from conftest import make_user, auth_as


def test_create_and_list_asset(client, db):
    user = make_user(db)
    auth_as(user)
    resp = client.post("/assets", json={
        "category": "bank", "name": "SBI", "subtype": "Savings", "value": 5000,
    })
    assert resp.status_code == 201, resp.text
    assert resp.json()["name"] == "SBI"

    listed = client.get("/assets")
    assert listed.status_code == 200
    assert len(listed.json()) == 1


def test_quantity_required_for_crypto(client, db):
    auth_as(make_user(db))
    resp = client.post("/assets", json={"category": "crypto", "name": "BTC", "value": 100})
    assert resp.status_code == 422


def test_cannot_touch_another_users_asset(client, db):
    a = make_user(db, clerk_id="a", email="a@x.com")
    b = make_user(db, clerk_id="b", email="b@x.com")
    auth_as(a)
    created = client.post("/assets", json={"category": "cash", "name": "Wallet", "value": 50}).json()

    auth_as(b)
    assert client.patch(f"/assets/{created['id']}", json={
        "category": "cash", "name": "Hacked", "value": 0,
    }).status_code == 404
    assert client.delete(f"/assets/{created['id']}").status_code == 404
    assert client.get("/assets").json() == []


def test_update_and_delete(client, db):
    auth_as(make_user(db))
    created = client.post("/assets", json={"category": "cash", "name": "Wallet", "value": 50}).json()
    upd = client.patch(f"/assets/{created['id']}", json={
        "category": "cash", "name": "Wallet", "value": 75,
    })
    assert upd.status_code == 200 and upd.json()["value"] == 75
    assert client.delete(f"/assets/{created['id']}").status_code == 204
    assert client.get("/assets").json() == []
```

- [ ] **Step 2: Run to verify failure**

Run: `uv run pytest tests/test_assets.py -v`
Expected: FAIL — 404s (routes not registered yet).

- [ ] **Step 3: Implement `backend/routers/assets.py`**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_database
from auth import get_current_user
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


@router.get("", response_model=list[schemas.AssetOut])
def list_assets(db: Session = Depends(get_database), user: models.User = Depends(get_current_user)):
    return (
        db.query(models.Assets)
        .filter(models.Assets.user_id == user.id)
        .order_by(models.Assets.created_at.desc())
        .all()
    )


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
```

> Note: `payload.model_dump()` yields `category` as a `Category` enum; the `.value` guard stores the plain string. `response_model=AssetOut` re-coerces it back to the enum on the way out.

- [ ] **Step 4: Create empty `backend/routers/__init__.py`**

```python
```

- [ ] **Step 5: Register the router in `backend/main.py`** (add near app creation)

```python
from routers import assets as assets_router
app.include_router(assets_router.router)
```

- [ ] **Step 6: Run tests**

Run: `uv run pytest tests/test_assets.py -v`
Expected: 4 passed.

- [ ] **Step 7: Commit**

```bash
git add backend/routers/ backend/main.py backend/tests/test_assets.py
git commit -m "feat(assets): per-user CRUD with ownership enforcement"
```

---

### Task 6: Summary endpoint

**Files:** Modify `backend/routers/assets.py`; modify `backend/tests/test_assets.py`

- [ ] **Step 1: Add the failing summary test** (append to `test_assets.py`)

```python
def test_summary_totals_and_pct(client, db):
    auth_as(make_user(db))
    client.post("/assets", json={"category": "cash", "name": "Wallet", "value": 75})
    client.post("/assets", json={"category": "bank", "name": "SBI", "subtype": "Savings", "value": 25})
    s = client.get("/assets/summary").json()
    assert s["total"] == 100
    assert s["currency"] == "INR"
    by = {c["category"]: c for c in s["by_category"]}
    assert by["cash"]["total"] == 75 and by["cash"]["pct"] == 75.0
    assert by["bank"]["pct"] == 25.0


def test_summary_empty_is_zero(client, db):
    auth_as(make_user(db))
    s = client.get("/assets/summary").json()
    assert s["total"] == 0 and s["by_category"] == []
```

- [ ] **Step 2: Run to verify failure**

Run: `uv run pytest tests/test_assets.py -k summary -v`
Expected: FAIL — 404 (no summary route). Define it **before** `/{asset_id}` is irrelevant (different path), but place it above for clarity.

- [ ] **Step 3: Implement the summary route** (add to `assets.py`, above `list_assets`)

```python
@router.get("/summary", response_model=schemas.AssetSummary)
def summary(db: Session = Depends(get_database), user: models.User = Depends(get_current_user)):
    rows = db.query(models.Assets).filter(models.Assets.user_id == user.id).all()
    total = sum(a.value for a in rows)
    buckets: dict[str, float] = {}
    for a in rows:
        buckets[a.category] = buckets.get(a.category, 0.0) + a.value
    by_category = [
        schemas.CategorySummary(
            category=cat, total=amt, pct=round((amt / total * 100), 2) if total else 0.0
        )
        for cat, amt in buckets.items()
    ]
    return schemas.AssetSummary(total=total, currency=user.currency, by_category=by_category)
```

- [ ] **Step 4: Run tests**

Run: `uv run pytest tests/test_assets.py -v`
Expected: all passed (6).

- [ ] **Step 5: Commit**

```bash
git add backend/routers/assets.py backend/tests/test_assets.py
git commit -m "feat(assets): summary endpoint with per-category totals"
```

---

### Task 7: Users /me router

**Files:** Create `backend/routers/users.py`; create `backend/tests/test_users.py`; modify `backend/main.py`

- [ ] **Step 1: Write failing test `backend/tests/test_users.py`**

```python
from conftest import make_user, auth_as


def test_get_me(client, db):
    auth_as(make_user(db, email="me@x.com"))
    r = client.get("/users/me")
    assert r.status_code == 200
    assert r.json()["email"] == "me@x.com"
    assert r.json()["currency"] == "INR"


def test_update_currency(client, db):
    auth_as(make_user(db))
    r = client.patch("/users/me", json={"currency": "USD"})
    assert r.status_code == 200 and r.json()["currency"] == "USD"


def test_reject_bad_currency(client, db):
    auth_as(make_user(db))
    assert client.patch("/users/me", json={"currency": "XYZ"}).status_code == 422
```

- [ ] **Step 2: Run to verify failure**

Run: `uv run pytest tests/test_users.py -v`
Expected: FAIL — 404.

- [ ] **Step 3: Implement `backend/routers/users.py`**

```python
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
```

- [ ] **Step 4: Register in `backend/main.py`**

```python
from routers import users as users_router
app.include_router(users_router.router)
```

- [ ] **Step 5: Run all backend tests**

Run: `uv run pytest -v`
Expected: all pass (auth 3 + assets 6 + users 3 = 12).

- [ ] **Step 6: Commit**

```bash
git add backend/routers/users.py backend/main.py backend/tests/test_users.py
git commit -m "feat(users): /users/me get + currency update"
```

---

## Phase 2 — Frontend

### Task 8: API client, formatter, asset metadata

**Files:** Create `frontend/src/lib/api.ts`, `frontend/src/lib/format.ts`, `frontend/src/lib/assets.ts`

- [ ] **Step 1: `frontend/src/lib/assets.ts`** (types + per-category field metadata)

```ts
export type Category = 'bank' | 'cash' | 'crypto' | 'stock' | 'gold' | 'other'

export interface Asset {
  id: number
  category: Category
  name: string
  subtype: string | null
  quantity: number | null
  value: number
  created_at: string
  updated_at: string
}

export interface CategorySummary { category: Category; total: number; pct: number }
export interface AssetSummary { total: number; currency: string; by_category: CategorySummary[] }

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'bank', label: 'Bank' },
  { value: 'cash', label: 'Cash' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'stock', label: 'Stocks' },
  { value: 'gold', label: 'Gold' },
  { value: 'other', label: 'Other' },
]

export const QUANTITY_CATEGORIES: Category[] = ['crypto', 'stock', 'gold']

export const CATEGORY_COLORS: Record<Category, string> = {
  bank: '#3b82f6',
  cash: '#a855f7',
  crypto: '#f97316',
  stock: '#10b981',
  gold: '#eab308',
  other: '#64748b',
}
```

- [ ] **Step 2: `frontend/src/lib/format.ts`**

```ts
export function formatCurrency(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${currency} ${value.toFixed(2)}`
  }
}
```

- [ ] **Step 3: `frontend/src/lib/api.ts`** (token-injecting client)

```ts
import type { Asset, AssetSummary, Category } from './assets'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

type TokenGetter = () => Promise<string | null>

export interface AssetInput {
  category: Category
  name: string
  subtype?: string | null
  quantity?: number | null
  value: number
}

async function req<T>(getToken: TokenGetter, path: string, init?: RequestInit): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`API ${res.status}: ${body}`)
  }
  return (res.status === 204 ? (undefined as T) : await res.json()) as T
}

export const api = {
  listAssets: (g: TokenGetter) => req<Asset[]>(g, '/assets'),
  summary: (g: TokenGetter) => req<AssetSummary>(g, '/assets/summary'),
  createAsset: (g: TokenGetter, body: AssetInput) =>
    req<Asset>(g, '/assets', { method: 'POST', body: JSON.stringify(body) }),
  updateAsset: (g: TokenGetter, id: number, body: AssetInput) =>
    req<Asset>(g, `/assets/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteAsset: (g: TokenGetter, id: number) =>
    req<void>(g, `/assets/${id}`, { method: 'DELETE' }),
  me: (g: TokenGetter) => req<{ id: number; email: string; currency: string }>(g, '/users/me'),
  updateCurrency: (g: TokenGetter, currency: string) =>
    req<{ id: number; email: string; currency: string }>(g, '/users/me', {
      method: 'PATCH',
      body: JSON.stringify({ currency }),
    }),
}
```

- [ ] **Step 4: Typecheck + commit**

Run (from `frontend/`): `node_modules/.bin/tsc --noEmit`
Expected: exit 0.

```bash
git add frontend/src/lib/
git commit -m "feat(web): api client, currency formatter, asset metadata"
```

---

### Task 9: CategoryDonut (SVG)

**Files:** Create `frontend/src/components/CategoryDonut.tsx`

- [ ] **Step 1: Implement the donut**

```tsx
import type { CategorySummary } from '@/lib/assets'
import { CATEGORY_COLORS, CATEGORIES } from '@/lib/assets'

interface Props { data: CategorySummary[]; size?: number; stroke?: number }

export default function CategoryDonut({ data, size = 180, stroke = 22 }: Props) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const total = data.reduce((s, d) => s + d.total, 0)

  let offset = 0
  const segments = total > 0 ? data.filter((d) => d.total > 0) : []

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}
          />
          {segments.map((d) => {
            const len = (d.total / total) * circumference
            const seg = (
              <circle
                key={d.category}
                cx={size / 2} cy={size / 2} r={radius}
                fill="none"
                stroke={CATEGORY_COLORS[d.category]}
                strokeWidth={stroke}
                strokeDasharray={`${len} ${circumference - len}`}
                strokeDashoffset={-offset}
              />
            )
            offset += len
            return seg
          })}
        </g>
      </svg>
      <div className="flex flex-col gap-2">
        {data.filter((d) => d.total > 0).map((d) => {
          const label = CATEGORIES.find((c) => c.value === d.category)?.label ?? d.category
          return (
            <div key={d.category} className="flex items-center gap-2 text-sm">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLORS[d.category] }} />
              <span className="text-white/60">{label}</span>
              <span className="text-white/80 font-medium">{d.pct}%</span>
            </div>
          )
        })}
        {total === 0 && <span className="text-sm text-white/40">No assets yet</span>}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck + commit**

Run (from `frontend/`): `node_modules/.bin/tsc --noEmit`
Expected: exit 0.

```bash
git add frontend/src/components/CategoryDonut.tsx
git commit -m "feat(web): SVG category donut chart"
```

---

### Task 10: AssetForm modal

**Files:** Create `frontend/src/components/AssetForm.tsx`

- [ ] **Step 1: Implement the form** (category-adaptive fields)

```tsx
'use client'

import { useState } from 'react'
import { CATEGORIES, QUANTITY_CATEGORIES, type Asset, type Category } from '@/lib/assets'
import type { AssetInput } from '@/lib/api'

interface Props {
  initial?: Asset
  onSubmit: (input: AssetInput) => Promise<void>
  onClose: () => void
}

export default function AssetForm({ initial, onSubmit, onClose }: Props) {
  const [category, setCategory] = useState<Category>(initial?.category ?? 'bank')
  const [name, setName] = useState(initial?.name ?? '')
  const [subtype, setSubtype] = useState(initial?.subtype ?? 'Savings')
  const [quantity, setQuantity] = useState(initial?.quantity?.toString() ?? '')
  const [value, setValue] = useState(initial?.value?.toString() ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const showQuantity = QUANTITY_CATEGORIES.includes(category)
  const showSubtype = category === 'bank'

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await onSubmit({
        category,
        name: name.trim(),
        subtype: showSubtype ? subtype : null,
        quantity: showQuantity ? Number(quantity) : null,
        value: Number(value),
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl bg-[#0c0c0c] border border-white/10 p-6 flex flex-col gap-4"
      >
        <h2 className="text-lg font-semibold text-white">{initial ? 'Edit asset' : 'Add asset'}</h2>
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-white/55">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value} className="bg-[#0c0c0c]">{c.label}</option>
            ))}
          </select>
        </label>

        <Input label="Name" value={name} onChange={setName} placeholder="e.g. SBI, Bitcoin, Nifty 50" required />

        {showSubtype && (
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] text-white/55">Account type</span>
            <select
              value={subtype}
              onChange={(e) => setSubtype(e.target.value)}
              className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none"
            >
              <option className="bg-[#0c0c0c]">Savings</option>
              <option className="bg-[#0c0c0c]">Current</option>
            </select>
          </label>
        )}

        {showQuantity && (
          <Input label="Quantity" type="number" value={quantity} onChange={setQuantity} placeholder="0.5" required />
        )}

        <Input label="Current value" type="number" value={value} onChange={setValue} placeholder="0.00" required />

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-sm text-white/70">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-black font-semibold text-sm disabled:opacity-60">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Input({
  label, value, onChange, ...rest
}: { label: string; value: string; onChange: (v: string) => void } &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] text-white/55">{label}</span>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-primary/50"
      />
    </label>
  )
}
```

- [ ] **Step 2: Typecheck + commit**

Run (from `frontend/`): `node_modules/.bin/tsc --noEmit` → exit 0.

```bash
git add frontend/src/components/AssetForm.tsx
git commit -m "feat(web): category-adaptive asset form modal"
```

---

### Task 11: Assets page wired to the API

**Files:** Create `frontend/src/app/assets/AssetsClient.tsx`; modify `frontend/src/app/assets/page.tsx`

- [ ] **Step 1: `AssetsClient.tsx`** (fetch, list, empty state, add/edit/delete)

```tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { api, type AssetInput } from '@/lib/api'
import { formatCurrency } from '@/lib/format'
import { CATEGORIES, type Asset, type AssetSummary } from '@/lib/assets'
import AssetForm from '@/components/AssetForm'
import CategoryDonut from '@/components/CategoryDonut'

export default function AssetsClient() {
  const { getToken } = useAuth()
  const [assets, setAssets] = useState<Asset[]>([])
  const [summary, setSummary] = useState<AssetSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Asset | undefined>()

  const load = useCallback(async () => {
    setError(null)
    try {
      const [a, s] = await Promise.all([api.listAssets(getToken), api.summary(getToken)])
      setAssets(a)
      setSummary(s)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load assets')
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => { load() }, [load])

  const handleSubmit = async (input: AssetInput) => {
    if (editing) await api.updateAsset(getToken, editing.id, input)
    else await api.createAsset(getToken, input)
    await load()
  }

  const handleDelete = async (id: number) => {
    await api.deleteAsset(getToken, id)
    await load()
  }

  const currency = summary?.currency ?? 'INR'

  return (
    <div className="flex-1 px-8 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white/50 uppercase tracking-widest">Total</p>
          <p className="text-4xl font-bold text-white">{formatCurrency(summary?.total ?? 0, currency)}</p>
        </div>
        <button
          onClick={() => { setEditing(undefined); setFormOpen(true) }}
          className="px-4 py-2 rounded-full bg-primary text-black text-sm font-semibold"
        >
          + Add Asset
        </button>
      </div>

      {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-300">{error}</div>}

      {!loading && summary && summary.total > 0 && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/8 p-6">
          <CategoryDonut data={summary.by_category} />
        </div>
      )}

      {loading ? (
        <p className="text-white/40 text-sm">Loading…</p>
      ) : assets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
          <p className="text-white/60">No assets yet — add your first to see it on your dashboard.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white/[0.03] border border-white/8 divide-y divide-white/5">
          {assets.map((a) => {
            const label = CATEGORIES.find((c) => c.value === a.category)?.label ?? a.category
            return (
              <div key={a.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-white/90">{a.name}</p>
                  <p className="text-xs text-white/40">
                    {label}{a.subtype ? ` · ${a.subtype}` : ''}{a.quantity != null ? ` · ${a.quantity}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-white">{formatCurrency(a.value, currency)}</span>
                  <button onClick={() => { setEditing(a); setFormOpen(true) }} className="text-xs text-white/40 hover:text-white/80">Edit</button>
                  <button onClick={() => handleDelete(a.id)} className="text-xs text-red-400/70 hover:text-red-400">Delete</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {formOpen && (
        <AssetForm initial={editing} onSubmit={handleSubmit} onClose={() => setFormOpen(false)} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Modify `frontend/src/app/assets/page.tsx`** to render the client (keep auth guard + sidebar)

```tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/AppSidebar'
import AssetsClient from './AssetsClient'

export default async function AssetsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  return (
    <div className="min-h-screen bg-black flex">
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary/10 blur-[180px] rounded-full pointer-events-none -z-0" />
      <AppSidebar active="assets" />
      <main className="flex-1 flex flex-col min-h-screen relative z-10">
        <header className="flex items-center justify-between px-8 py-5 border-b border-white/5">
          <div>
            <h1 className="text-xl font-semibold text-white">Assets</h1>
            <p className="text-sm text-white/40 mt-0.5">Track and manage all your holdings</p>
          </div>
        </header>
        <AssetsClient />
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Typecheck + commit**

Run (from `frontend/`): `node_modules/.bin/tsc --noEmit` → exit 0.

```bash
git add frontend/src/app/assets/
git commit -m "feat(web): assets page wired to API with add/edit/delete + empty state"
```

---

### Task 12: Dashboard wired to real data

**Files:** Modify `frontend/src/app/dashboard/DashboardClient.tsx`

- [ ] **Step 1: Replace placeholder data with fetched summary/assets**

Replace the hardcoded `netWorth`/`assets`/`monthlyChange` block and the net-worth + assets render with live data. Add near the other hooks:

```tsx
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/format'
import { CATEGORIES, type Asset, type AssetSummary } from '@/lib/assets'
import CategoryDonut from '@/components/CategoryDonut'

// inside the component, after existing hooks:
const [summary, setSummary] = useState<AssetSummary | null>(null)
const [assetList, setAssetList] = useState<Asset[]>([])

useEffect(() => {
  if (!isLoaded || !isSignedIn) return
  ;(async () => {
    try {
      const [s, a] = await Promise.all([api.summary(getToken), api.listAssets(getToken)])
      setSummary(s)
      setAssetList(a)
    } catch (e) {
      console.error('Failed to load dashboard data', e)
    }
  })()
}, [isLoaded, isSignedIn, getToken])

const currency = summary?.currency ?? 'INR'
const netWorth = summary?.total ?? 0
```

- [ ] **Step 2: Replace the net-worth number render** to use `formatCurrency(netWorth, currency)`, remove the `monthlyChange` badge, and replace the placeholder assets grid with `assetList` (empty state when `assetList.length === 0`: "Add assets to get started."). Add the donut where the change badge was:

```tsx
{summary && summary.total > 0 && (
  <div className="mt-6"><CategoryDonut data={summary.by_category} /></div>
)}
```

For the assets grid, map `assetList` (use `formatCurrency(asset.value, currency)` and the `CATEGORIES` label) instead of the old static array; when empty render:

```tsx
<div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
  <p className="text-white/60">Add assets to get started.</p>
</div>
```

- [ ] **Step 3: Delete the now-unused `assets`, `netWorth`, `monthlyChange`, `assetTypeColors` constants.**

- [ ] **Step 4: Typecheck + commit**

Run (from `frontend/`): `node_modules/.bin/tsc --noEmit` → exit 0.

```bash
git add frontend/src/app/dashboard/DashboardClient.tsx
git commit -m "feat(web): dashboard shows real net worth + donut, empty state"
```

---

### Task 13: Currency selector

**Files:** Create `frontend/src/components/CurrencySelect.tsx`; render it in `AssetsClient.tsx`

- [ ] **Step 1: Implement `CurrencySelect.tsx`**

```tsx
'use client'

import { useAuth } from '@clerk/nextjs'
import { api } from '@/lib/api'

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP']

export default function CurrencySelect({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const { getToken } = useAuth()
  return (
    <select
      value={value}
      onChange={async (e) => {
        const c = e.target.value
        onChange(c)
        try { await api.updateCurrency(getToken, c) } catch (err) { console.error(err) }
      }}
      className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none"
    >
      {CURRENCIES.map((c) => <option key={c} value={c} className="bg-[#0c0c0c]">{c}</option>)}
    </select>
  )
}
```

- [ ] **Step 2: Render it in the Assets header area in `AssetsClient.tsx`** (beside Add Asset), wiring `value={currency}` and updating local summary on change:

```tsx
<CurrencySelect
  value={currency}
  onChange={(c) => setSummary((s) => (s ? { ...s, currency: c } : s))}
/>
```

- [ ] **Step 3: Typecheck + commit**

Run (from `frontend/`): `node_modules/.bin/tsc --noEmit` → exit 0.

```bash
git add frontend/src/components/CurrencySelect.tsx frontend/src/app/assets/AssetsClient.tsx
git commit -m "feat(web): currency selector persisted to backend"
```

---

### Task 14: Frontend tests (Vitest + RTL)

**Files:** Create `frontend/vitest.config.ts`, `frontend/vitest.setup.ts`, `frontend/src/components/__tests__/AssetForm.test.tsx`; modify `frontend/package.json`

- [ ] **Step 1: Install dev deps**

Run (from `frontend/`): `npm i -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom`
Expected: packages added.

- [ ] **Step 2: `frontend/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', setupFiles: ['./vitest.setup.ts'], globals: true },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
})
```

- [ ] **Step 3: `frontend/vitest.setup.ts`**

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 4: Add a test script to `frontend/package.json`**

```json
"test": "vitest run"
```

- [ ] **Step 5: Write `frontend/src/components/__tests__/AssetForm.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import AssetForm from '../AssetForm'

describe('AssetForm', () => {
  it('shows the bank account-type field for bank and hides quantity', () => {
    render(<AssetForm onSubmit={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Account type')).toBeInTheDocument()
    expect(screen.queryByText('Quantity')).not.toBeInTheDocument()
  })

  it('shows quantity for crypto and hides account type', async () => {
    render(<AssetForm onSubmit={vi.fn()} onClose={vi.fn()} />)
    await userEvent.selectOptions(screen.getByDisplayValue('Bank'), 'crypto')
    expect(screen.getByText('Quantity')).toBeInTheDocument()
    expect(screen.queryByText('Account type')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Run tests**

Run (from `frontend/`): `npm run test`
Expected: 2 passed.

- [ ] **Step 7: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vitest.config.ts frontend/vitest.setup.ts frontend/src/components/__tests__/
git commit -m "test(web): vitest setup + AssetForm conditional-field tests"
```

---

### Task 15: Manual end-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Start backend** — `cd backend && uv run uvicorn main:app --reload` (serves :8000).
- [ ] **Step 2: Start frontend** — `cd frontend && npm run dev` (serves :3000).
- [ ] **Step 3: Sign in, open `/assets`.** Confirm empty state and total = currency-formatted 0.
- [ ] **Step 4: Add one of each: a bank (subtype), a crypto (quantity), a stock.** Confirm they list, the donut renders, and the total sums correctly.
- [ ] **Step 5: Open `/dashboard`.** Confirm net worth + donut reflect the assets; with no assets it shows "Add assets to get started."
- [ ] **Step 6: Change currency** in the selector; confirm symbol/formatting updates and persists across reload.
- [ ] **Step 7: Edit and delete an asset;** confirm totals/donut update.

---

## Self-Review Notes

- **Spec coverage:** start-at-zero (empty states, Tasks 11–12) ✓; manual CRUD (Tasks 5, 10–11) ✓; six categories + per-type fields (Tasks 3, 8, 10) ✓; Clerk-verified auth + ownership (Tasks 4–5) ✓; currency preference (Tasks 7, 13) ✓; donut (Tasks 9, 11–12) ✓; summary math (Task 6) ✓; tests (Tasks 4–7, 14) ✓; change% removed (Task 12) ✓.
- **Type consistency:** `Category`, `Asset`, `AssetSummary`, `AssetInput`, `api.*` names are used identically across frontend tasks; backend `schemas.*` names match router usage.
- **Out of scope (unchanged):** live rates, FX conversion, monthly income/expenses, history.
- **Pre-existing risk (not in this plan):** `backend/alembic.ini` contains a committed Neon DB credential — rotate and move to env separately.
```
