"""add user.base_currency (storage denomination), backfill from currency

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-06-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("user", sa.Column("base_currency", sa.String(), nullable=False, server_default="INR"))
    # Existing stored amounts are denominated in each user's current display
    # currency, so treat that as their base — no value rewrite needed.
    op.execute('UPDATE "user" SET base_currency = currency')


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("user", "base_currency")
