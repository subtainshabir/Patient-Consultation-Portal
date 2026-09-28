"""create consultation tables

Revision ID: a1e6b2f4a5b2
Revises: c1f28b4e7e89
Create Date: 2026-09-29 02:55:39.865577

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1e6b2f4a5b2'
down_revision: Union[str, None] = 'c1f28b4e7e89'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    # 1. Consultations Table
    if "consultations" not in tables:
        op.create_table(
            'consultations',
            sa.Column('id', sa.Integer(), primary_key=True, index=True, nullable=False),
            sa.Column('consultation_id', sa.String(length=35), unique=True, index=True, nullable=False),
            sa.Column('patient_id', sa.Integer(), sa.ForeignKey('patients.id', ondelete='CASCADE'), nullable=False, index=True),
            sa.Column('doctor_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True, index=True),
            sa.Column('consultation_date', sa.DateTime(timezone=True), nullable=False, index=True),
            sa.Column('patient_state_id', sa.Integer(), sa.ForeignKey('patient_states.id'), nullable=True),
            sa.Column('patient_state_name', sa.String(length=255), nullable=True),
            sa.Column('symptom_notes', sa.Text(), nullable=True),
            sa.Column('power_text', sa.String(length=255), nullable=True),
            sa.Column('mmse_score', sa.Integer(), nullable=True),
            sa.Column('gcs_score', sa.Integer(), nullable=True),
            sa.Column('additional_observations', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        )

    # 2. Consultation Vitals Table
    if "consultation_vitals" not in tables:
        op.create_table(
            'consultation_vitals',
            sa.Column('id', sa.Integer(), primary_key=True, index=True, nullable=False),
            sa.Column('consultation_id', sa.Integer(), sa.ForeignKey('consultations.id', ondelete='CASCADE'), unique=True, nullable=False, index=True),
            sa.Column('systolic_bp', sa.Integer(), nullable=True),
            sa.Column('diastolic_bp', sa.Integer(), nullable=True),
            sa.Column('pulse_rate', sa.Integer(), nullable=True),
            sa.Column('temperature', sa.Float(), nullable=True),
            sa.Column('oxygen_saturation', sa.Integer(), nullable=True),
            sa.Column('nihss_score', sa.Integer(), nullable=True),
            sa.Column('fall_risk_status', sa.String(length=30), nullable=True),
            sa.Column('fall_risk_notes', sa.String(length=500), nullable=True),
            sa.Column('respiratory_rate', sa.Integer(), nullable=True),
            sa.Column('weight_kg', sa.Float(), nullable=True),
            sa.Column('height_cm', sa.Float(), nullable=True),
            sa.Column('bmi', sa.Float(), nullable=True),
            sa.Column('blood_glucose', sa.Float(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        )

    # 3. Consultation Symptoms Table
    if "consultation_symptoms" not in tables:
        op.create_table(
            'consultation_symptoms',
            sa.Column('id', sa.Integer(), primary_key=True, index=True, nullable=False),
            sa.Column('consultation_id', sa.Integer(), sa.ForeignKey('consultations.id', ondelete='CASCADE'), nullable=False, index=True),
            sa.Column('symptom_id', sa.Integer(), sa.ForeignKey('symptoms.id'), nullable=True, index=True),
            sa.Column('symptom_name', sa.String(length=255), nullable=False),
            sa.Column('category', sa.String(length=100), nullable=True),
            sa.Column('notes', sa.String(length=500), nullable=True),
            sa.Column('sort_order', sa.Integer(), default=0, nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        )

    # 4. Consultation Examinations Table
    if "consultation_examinations" not in tables:
        op.create_table(
            'consultation_examinations',
            sa.Column('id', sa.Integer(), primary_key=True, index=True, nullable=False),
            sa.Column('consultation_id', sa.Integer(), sa.ForeignKey('consultations.id', ondelete='CASCADE'), nullable=False, index=True),
            sa.Column('category', sa.String(length=100), nullable=False, index=True),
            sa.Column('item_name', sa.String(length=100), nullable=False, index=True),
            sa.Column('finding', sa.String(length=255), nullable=True),
            sa.Column('finding_id', sa.Integer(), sa.ForeignKey('neurological_exam_options.id'), nullable=True),
            sa.Column('status', sa.String(length=20), server_default='Done', nullable=True),
            sa.Column('observation', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        )
        op.create_index(
            'ix_consult_exam_cat_item',
            'consultation_examinations',
            ['consultation_id', 'category', 'item_name']
        )


def downgrade() -> None:
    op.drop_index('ix_consult_exam_cat_item', table_name='consultation_examinations')
    op.drop_table('consultation_examinations')
    op.drop_table('consultation_symptoms')
    op.drop_table('consultation_vitals')
    op.drop_table('consultations')

