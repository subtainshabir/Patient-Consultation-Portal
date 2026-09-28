"""create patients table

Revision ID: b4e06a65e2ee
Revises: 
Create Date: 2026-09-29 01:55:29.015853

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b4e06a65e2ee'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check if table already exists (e.g. from create_all)
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if "patients" not in tables:
        op.create_table(
            'patients',
            sa.Column('id', sa.Integer(), primary_key=True, index=True, nullable=False),
            sa.Column('patient_id', sa.String(length=20), unique=True, index=True, nullable=False),
            sa.Column('full_name', sa.String(length=255), index=True, nullable=False),
            sa.Column('age', sa.Integer(), nullable=False),
            sa.Column('gender', sa.Enum('Male', 'Female', 'Other', 'Prefer not to specify', name='gender'), nullable=False),
            sa.Column('mobile_number', sa.String(length=50), index=True, nullable=False),
            sa.Column('cnic', sa.String(length=30), index=True, nullable=True),
            sa.Column('is_active', sa.Boolean(), default=True, index=True, nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('created_by_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        )


def downgrade() -> None:
    op.drop_table('patients')
