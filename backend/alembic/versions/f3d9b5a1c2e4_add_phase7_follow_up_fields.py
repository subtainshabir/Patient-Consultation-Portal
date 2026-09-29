"""add phase 7 follow up fields to consultations

Revision ID: f3d9b5a1c2e4
Revises: e2c8a4f9b1d3
Create Date: 2026-09-29 04:20:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f3d9b5a1c2e4'
down_revision: Union[str, None] = 'e2c8a4f9b1d3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c["name"] for c in inspector.get_columns("consultations")]

    with op.batch_alter_table("consultations") as batch_op:
        if "follow_up_option_id" not in columns:
            batch_op.add_column(
                sa.Column("follow_up_option_id", sa.Integer(), sa.ForeignKey("follow_up_options.id", ondelete="SET NULL"), nullable=True)
            )
        if "follow_up_period" not in columns:
            batch_op.add_column(
                sa.Column("follow_up_period", sa.String(length=255), nullable=True)
            )
        if "follow_up_date" not in columns:
            batch_op.add_column(
                sa.Column("follow_up_date", sa.Date(), nullable=True)
            )
        if "follow_up_instructions" not in columns:
            batch_op.add_column(
                sa.Column("follow_up_instructions", sa.Text(), nullable=True)
            )
        if "follow_up_status" not in columns:
            batch_op.add_column(
                sa.Column("follow_up_status", sa.String(length=50), nullable=True, server_default="No Follow-Up")
            )


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c["name"] for c in inspector.get_columns("consultations")]

    with op.batch_alter_table("consultations") as batch_op:
        if "follow_up_status" in columns:
            batch_op.drop_column("follow_up_status")
        if "follow_up_instructions" in columns:
            batch_op.drop_column("follow_up_instructions")
        if "follow_up_date" in columns:
            batch_op.drop_column("follow_up_date")
        if "follow_up_period" in columns:
            batch_op.drop_column("follow_up_period")
        if "follow_up_option_id" in columns:
            batch_op.drop_column("follow_up_option_id")
