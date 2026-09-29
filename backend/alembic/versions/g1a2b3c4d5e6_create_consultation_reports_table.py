"""create consultation reports table for persistent PDF storage

Revision ID: g1a2b3c4d5e6
Revises: f3d9b5a1c2e4
Create Date: 2026-09-29 09:25:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'g1a2b3c4d5e6'
down_revision: Union[str, None] = 'f3d9b5a1c2e4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "consultation_reports" not in tables:
        op.create_table(
            "consultation_reports",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("report_id", sa.String(length=50), nullable=False),
            sa.Column("consultation_id", sa.Integer(), nullable=False),
            sa.Column("patient_id", sa.Integer(), nullable=False),
            sa.Column("file_name", sa.String(length=255), nullable=False),
            sa.Column("storage_path", sa.String(length=500), nullable=False),
            sa.Column("document_type", sa.String(length=50), server_default="Prescription Report", nullable=False),
            sa.Column("file_size", sa.Integer(), server_default="0", nullable=False),
            sa.Column("version", sa.Integer(), server_default="1", nullable=False),
            sa.Column("is_latest", sa.Boolean(), server_default=sa.text("1"), nullable=False),
            sa.Column("generated_by_id", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["consultation_id"], ["consultations.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["generated_by_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_consultation_reports_id"), "consultation_reports", ["id"], unique=False)
        op.create_index(op.f("ix_consultation_reports_report_id"), "consultation_reports", ["report_id"], unique=True)
        op.create_index(op.f("ix_consultation_reports_consultation_id"), "consultation_reports", ["consultation_id"], unique=False)
        op.create_index(op.f("ix_consultation_reports_patient_id"), "consultation_reports", ["patient_id"], unique=False)
        op.create_index(op.f("ix_consultation_reports_is_latest"), "consultation_reports", ["is_latest"], unique=False)


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "consultation_reports" in tables:
        op.drop_index(op.f("ix_consultation_reports_is_latest"), table_name="consultation_reports")
        op.drop_index(op.f("ix_consultation_reports_patient_id"), table_name="consultation_reports")
        op.drop_index(op.f("ix_consultation_reports_consultation_id"), table_name="consultation_reports")
        op.drop_index(op.f("ix_consultation_reports_report_id"), table_name="consultation_reports")
        op.drop_index(op.f("ix_consultation_reports_id"), table_name="consultation_reports")
        op.drop_table("consultation_reports")
