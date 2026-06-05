"""assets v2 and user currency

Revision ID: 95fe626bccef
Revises: 80a975002917
Create Date: 2026-06-03 02:03:27.807973

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '95fe626bccef'
down_revision: Union[str, Sequence[str], None] = '80a975002917'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
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
    """Downgrade schema."""
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
