"""add expenses table

Revision ID: 7ac002b6ac0c
Revises: 95fe626bccef
Create Date: 2026-06-03 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7ac002b6ac0c'
down_revision: Union[str, Sequence[str], None] = '95fe626bccef'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "expenses",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("category", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False, server_default="0"),
        sa.Column("spent_on", sa.Date(), nullable=False),
        sa.Column("note", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_expenses_id", "expenses", ["id"])
    op.create_index("ix_expenses_user_id", "expenses", ["user_id"])
    # Drop the temporary server default only needed for any backfill.
    op.alter_column("expenses", "amount", server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_expenses_user_id", table_name="expenses")
    op.drop_index("ix_expenses_id", table_name="expenses")
    op.drop_table("expenses")
