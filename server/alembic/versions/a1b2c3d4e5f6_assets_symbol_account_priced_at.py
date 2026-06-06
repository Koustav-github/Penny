"""add symbol, account, priced_at to assets for live pricing

Revision ID: a1b2c3d4e5f6
Revises: 09995bc3a021
Create Date: 2026-06-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '09995bc3a021'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("assets", sa.Column("symbol", sa.String(), nullable=True))
    op.add_column("assets", sa.Column("account", sa.String(), nullable=True))
    op.add_column("assets", sa.Column("priced_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("assets", "priced_at")
    op.drop_column("assets", "account")
    op.drop_column("assets", "symbol")
