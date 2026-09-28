"""add phase 6 prescription items

Revision ID: e2c8a4f9b1d3
Revises: d1b7a3e8c9f0
Create Date: 2026-09-29 03:55:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e2c8a4f9b1d3'
down_revision: Union[str, None] = 'd1b7a3e8c9f0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    # Create prescription_items table if not exists
    if "prescription_items" not in tables:
        op.create_table(
            "prescription_items",
            sa.Column("id", sa.Integer(), primary_key=True, index=True, nullable=False),
            sa.Column("consultation_id", sa.Integer(), sa.ForeignKey("consultations.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("medicine_id", sa.Integer(), sa.ForeignKey("medicines.id", ondelete="SET NULL"), nullable=True, index=True),
            sa.Column("medicine_name", sa.String(length=255), nullable=False),
            sa.Column("frequency_id", sa.Integer(), sa.ForeignKey("medicine_frequencies.id", ondelete="SET NULL"), nullable=True),
            sa.Column("frequency_name", sa.String(length=255), nullable=False),
            sa.Column("dosage", sa.String(length=100), nullable=False),
            sa.Column("duration_days", sa.Integer(), nullable=False),
            sa.Column("instruction_id", sa.Integer(), sa.ForeignKey("medicine_instructions.id", ondelete="SET NULL"), nullable=True),
            sa.Column("instruction_name", sa.String(length=255), nullable=True),
            sa.Column("custom_instruction", sa.Text(), nullable=True),
            sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        )


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "prescription_items" in tables:
        op.drop_table("prescription_items")
