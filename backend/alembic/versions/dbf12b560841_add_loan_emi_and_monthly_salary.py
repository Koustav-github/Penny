"""add loan emi and monthly salary

Revision ID: dbf12b560841
Revises: 7ac002b6ac0c
Create Date: 2026-06-03 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dbf12b560841'
down_revision: Union[str, Sequence[str], None] = '7ac002b6ac0c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("assets", sa.Column("emi", sa.Float(), nullable=True))
    op.add_column(
        "user",
        sa.Column("monthly_salary", sa.Float(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("user", "monthly_salary")
    op.drop_column("assets", "emi")
