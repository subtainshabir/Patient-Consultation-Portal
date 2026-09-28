"""add phase 5 diagnostic tests and clinical assessment

Revision ID: d1b7a3e8c9f0
Revises: a1e6b2f4a5b2
Create Date: 2026-09-29 03:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd1b7a3e8c9f0'
down_revision: Union[str, None] = 'a1e6b2f4a5b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    # 1. Add Phase 5 columns to consultations table if not already present
    if "consultations" in tables:
        consultation_cols = [c["name"] for c in inspector.get_columns("consultations")]
        
        if "clinical_description" not in consultation_cols:
            op.add_column("consultations", sa.Column("clinical_description", sa.Text(), nullable=True))
            
        if "additional_examination" not in consultation_cols:
            op.add_column("consultations", sa.Column("additional_examination", sa.Text(), nullable=True))
            
        if "treatment_plan" not in consultation_cols:
            op.add_column("consultations", sa.Column("treatment_plan", sa.Text(), nullable=True))

    # 2. Create consultation_diagnostic_tests table
    if "consultation_diagnostic_tests" not in tables:
        op.create_table(
            "consultation_diagnostic_tests",
            sa.Column("id", sa.Integer(), primary_key=True, index=True, nullable=False),
            sa.Column("consultation_id", sa.Integer(), sa.ForeignKey("consultations.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("diagnostic_test_id", sa.Integer(), sa.ForeignKey("diagnostic_tests.id", ondelete="SET NULL"), nullable=True, index=True),
            sa.Column("test_name", sa.String(length=255), nullable=False),
            sa.Column("category", sa.String(length=100), nullable=True),
            sa.Column("status", sa.String(length=50), nullable=False, server_default="Ordered"),
            sa.Column("clinical_indication", sa.String(length=500), nullable=True),
            sa.Column("result", sa.Text(), nullable=True),
            sa.Column("result_date", sa.DateTime(timezone=True), nullable=True),
            sa.Column("doctor_notes", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        )


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "consultation_diagnostic_tests" in tables:
        op.drop_table("consultation_diagnostic_tests")

    if "consultations" in tables:
        consultation_cols = [c["name"] for c in inspector.get_columns("consultations")]
        with op.batch_alter_table("consultations") as batch_op:
            if "treatment_plan" in consultation_cols:
                batch_op.drop_column("treatment_plan")
            if "additional_examination" in consultation_cols:
                batch_op.drop_column("additional_examination")
            if "clinical_description" in consultation_cols:
                batch_op.drop_column("clinical_description")
