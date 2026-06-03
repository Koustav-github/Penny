"""add financial profile fields and reports table

Revision ID: 09995bc3a021
Revises: dbf12b560841
Create Date: 2026-06-04 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '09995bc3a021'
down_revision: Union[str, Sequence[str], None] = 'dbf12b560841'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("user", sa.Column("risk_appetite", sa.String(), nullable=True))
    op.add_column("user", sa.Column("monthly_savings_target", sa.Float(), nullable=True))
    op.add_column("user", sa.Column("time_horizon_years", sa.Integer(), nullable=True))
    op.add_column("user", sa.Column("dependents", sa.Integer(), nullable=True))
    op.add_column("user", sa.Column("goals", sa.JSON(), nullable=True))
    op.add_column("user", sa.Column("ai_consent_at", sa.DateTime(timezone=True), nullable=True))

    op.create_table(
        "reports",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("report_type", sa.String(), nullable=False),
        sa.Column("period", sa.String(), nullable=False),
        sa.Column("model", sa.String(), nullable=False),
        sa.Column("sections", sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_reports_id", "reports", ["id"])
    op.create_index("ix_reports_user_id", "reports", ["user_id"])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_reports_user_id", table_name="reports")
    op.drop_index("ix_reports_id", table_name="reports")
    op.drop_table("reports")
    op.drop_column("user", "ai_consent_at")
    op.drop_column("user", "goals")
    op.drop_column("user", "dependents")
    op.drop_column("user", "time_horizon_years")
    op.drop_column("user", "monthly_savings_target")
    op.drop_column("user", "risk_appetite")
