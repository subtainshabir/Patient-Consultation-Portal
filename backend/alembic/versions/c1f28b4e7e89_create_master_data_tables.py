"""create clinical master data tables

Revision ID: c1f28b4e7e89
Revises: b4e06a65e2ee
Create Date: 2026-09-29 02:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c1f28b4e7e89'
down_revision: Union[str, None] = 'b4e06a65e2ee'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    # 1. Symptoms Table
    if "symptoms" not in tables:
        op.create_table(
            'symptoms',
            sa.Column('id', sa.Integer(), primary_key=True, index=True, nullable=False),
            sa.Column('name', sa.String(length=255), unique=True, index=True, nullable=False),
            sa.Column('category', sa.String(length=100), index=True, nullable=False, server_default='General'),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('is_active', sa.Boolean(), default=True, index=True, nullable=False),
            sa.Column('sort_order', sa.Integer(), default=0, index=True, nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('created_by_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        )

    # 2. Patient States Table
    if "patient_states" not in tables:
        op.create_table(
            'patient_states',
            sa.Column('id', sa.Integer(), primary_key=True, index=True, nullable=False),
            sa.Column('name', sa.String(length=255), unique=True, index=True, nullable=False),
            sa.Column('description', sa.String(length=500), nullable=True),
            sa.Column('is_active', sa.Boolean(), default=True, index=True, nullable=False),
            sa.Column('sort_order', sa.Integer(), default=0, index=True, nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('created_by_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        )

    # 3. Neurological Examination Options Table
    if "neurological_exam_options" not in tables:
        op.create_table(
            'neurological_exam_options',
            sa.Column('id', sa.Integer(), primary_key=True, index=True, nullable=False),
            sa.Column('category', sa.String(length=100), index=True, nullable=False),
            sa.Column('item_name', sa.String(length=150), index=True, nullable=True),
            sa.Column('name', sa.String(length=255), index=True, nullable=False),
            sa.Column('description', sa.String(length=500), nullable=True),
            sa.Column('is_active', sa.Boolean(), default=True, index=True, nullable=False),
            sa.Column('sort_order', sa.Integer(), default=0, index=True, nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('created_by_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        )

    # 4. Diagnostic Tests Table
    if "diagnostic_tests" not in tables:
        op.create_table(
            'diagnostic_tests',
            sa.Column('id', sa.Integer(), primary_key=True, index=True, nullable=False),
            sa.Column('name', sa.String(length=255), unique=True, index=True, nullable=False),
            sa.Column('category', sa.String(length=100), index=True, nullable=False, server_default='General'),
            sa.Column('description', sa.String(length=500), nullable=True),
            sa.Column('is_active', sa.Boolean(), default=True, index=True, nullable=False),
            sa.Column('sort_order', sa.Integer(), default=0, index=True, nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('created_by_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        )

    # 5. Medicines Table
    if "medicines" not in tables:
        op.create_table(
            'medicines',
            sa.Column('id', sa.Integer(), primary_key=True, index=True, nullable=False),
            sa.Column('name', sa.String(length=255), index=True, nullable=False),
            sa.Column('generic_name', sa.String(length=255), index=True, nullable=True),
            sa.Column('strength', sa.String(length=100), nullable=True),
            sa.Column('form', sa.String(length=100), nullable=False, server_default='Tablet'),
            sa.Column('description', sa.String(length=500), nullable=True),
            sa.Column('is_active', sa.Boolean(), default=True, index=True, nullable=False),
            sa.Column('sort_order', sa.Integer(), default=0, index=True, nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('created_by_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        )

    # 6. Medicine Frequencies Table
    if "medicine_frequencies" not in tables:
        op.create_table(
            'medicine_frequencies',
            sa.Column('id', sa.Integer(), primary_key=True, index=True, nullable=False),
            sa.Column('name', sa.String(length=100), index=True, nullable=False),
            sa.Column('urdu_label', sa.String(length=255), nullable=False),
            sa.Column('roman_urdu', sa.String(length=255), nullable=True),
            sa.Column('description', sa.String(length=500), nullable=True),
            sa.Column('is_active', sa.Boolean(), default=True, index=True, nullable=False),
            sa.Column('sort_order', sa.Integer(), default=0, index=True, nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('created_by_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        )

    # 7. Medicine Dosages Table
    if "medicine_dosages" not in tables:
        op.create_table(
            'medicine_dosages',
            sa.Column('id', sa.Integer(), primary_key=True, index=True, nullable=False),
            sa.Column('name', sa.String(length=100), index=True, nullable=False),
            sa.Column('urdu_label', sa.String(length=255), nullable=True),
            sa.Column('description', sa.String(length=500), nullable=True),
            sa.Column('is_active', sa.Boolean(), default=True, index=True, nullable=False),
            sa.Column('sort_order', sa.Integer(), default=0, index=True, nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('created_by_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        )

    # 8. Medicine Instructions Table
    if "medicine_instructions" not in tables:
        op.create_table(
            'medicine_instructions',
            sa.Column('id', sa.Integer(), primary_key=True, index=True, nullable=False),
            sa.Column('name', sa.String(length=255), index=True, nullable=False),
            sa.Column('urdu_label', sa.String(length=255), nullable=False),
            sa.Column('description', sa.String(length=500), nullable=True),
            sa.Column('is_active', sa.Boolean(), default=True, index=True, nullable=False),
            sa.Column('sort_order', sa.Integer(), default=0, index=True, nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('created_by_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        )

    # 9. Follow-Up Options Table
    if "follow_up_options" not in tables:
        op.create_table(
            'follow_up_options',
            sa.Column('id', sa.Integer(), primary_key=True, index=True, nullable=False),
            sa.Column('name', sa.String(length=255), index=True, nullable=False),
            sa.Column('urdu_label', sa.String(length=255), nullable=False),
            sa.Column('description', sa.String(length=500), nullable=True),
            sa.Column('is_active', sa.Boolean(), default=True, index=True, nullable=False),
            sa.Column('sort_order', sa.Integer(), default=0, index=True, nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('created_by_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        )


def downgrade() -> None:
    op.drop_table('follow_up_options')
    op.drop_table('medicine_instructions')
    op.drop_table('medicine_dosages')
    op.drop_table('medicine_frequencies')
    op.drop_table('medicines')
    op.drop_table('diagnostic_tests')
    op.drop_table('neurological_exam_options')
    op.drop_table('patient_states')
    op.drop_table('symptoms')
