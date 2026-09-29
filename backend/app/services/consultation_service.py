import os
import re
from datetime import datetime, timezone
from typing import Optional, List, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, desc, asc, func

from app.models.patient import Patient
from app.models.master_data import (
    PatientState,
    Symptom,
    NeurologicalExamOption,
    DiagnosticTest,
    Medicine,
    FollowUpOption,
)
from app.models.consultation import (
    Consultation,
    ConsultationVitals,
    ConsultationSymptom,
    ConsultationExamination,
    ConsultationDiagnosticTest,
    PrescriptionItem,
)
from app.schemas.consultation import ConsultationCreate, ConsultationUpdate, ConsultationSummaryResponse


def generate_consultation_id(db: Session, dt: Optional[datetime] = None) -> str:
    """
    Generates a unique, human-friendly consultation ID in format CNS-YYYYMMDD-XXXX (e.g., CNS-20260929-0001).
    """
    if dt is None:
        dt = datetime.now(timezone.utc)
    date_str = dt.strftime("%Y%m%d")
    prefix = f"CNS-{date_str}-"

    # Count consultations created on this date to derive sequence number
    existing_count = (
        db.query(func.count(Consultation.id))
        .filter(Consultation.consultation_id.like(f"{prefix}%"))
        .scalar()
        or 0
    )
    seq = existing_count + 1

    while True:
        candidate_id = f"{prefix}{seq:04d}"
        exists = db.query(Consultation.id).filter(Consultation.consultation_id == candidate_id).first()
        if not exists:
            return candidate_id
        seq += 1


def resolve_patient(db: Session, patient_identifier: str) -> Optional[Patient]:
    """
    Resolves a patient by either their permanent patient_id (e.g. DRN-000001, PT-000001)
    or primary key integer ID.
    """
    clean_id = str(patient_identifier).strip()
    if clean_id.isdigit():
        patient = db.query(Patient).filter(
            or_(Patient.id == int(clean_id), Patient.patient_id.ilike(clean_id))
        ).first()
    else:
        patient = db.query(Patient).filter(Patient.patient_id.ilike(clean_id)).first()
    return patient


def create_consultation(
    db: Session,
    consultation_in: ConsultationCreate,
    doctor_id: Optional[int] = None,
) -> Consultation:
    """
    Creates a new clinical consultation record inside an atomic database transaction.
    Server dictates the consultation timestamp.
    Validates patient existence and status.
    Auto-registers any newly typed custom symptoms into the master database.
    """
    patient = resolve_patient(db, consultation_in.patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient '{consultation_in.patient_id}' not found."
        )

    if not patient.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot record a consultation for an inactive or deactivated patient."
        )

    now = datetime.now(timezone.utc)
    consult_dt = getattr(consultation_in, "consultation_date", None) or now
    consultation_unique_id = generate_consultation_id(db, consult_dt)

    # Validate / resolve patient state
    resolved_state_name = consultation_in.patient_state_name
    if consultation_in.patient_state_id:
        p_state = db.query(PatientState).filter(PatientState.id == consultation_in.patient_state_id).first()
        if p_state:
            resolved_state_name = p_state.name

    # Validate / resolve follow-up period
    resolved_follow_up_period = consultation_in.follow_up_period.strip() if consultation_in.follow_up_period else None
    if consultation_in.follow_up_option_id and not resolved_follow_up_period:
        f_opt = db.query(FollowUpOption).filter(FollowUpOption.id == consultation_in.follow_up_option_id).first()
        if f_opt:
            resolved_follow_up_period = f_opt.urdu_label or f_opt.name

    # Calculate follow-up status
    f_status = "No Follow-Up"
    if consultation_in.follow_up_date:
        if consultation_in.follow_up_date < now.date():
            f_status = "Overdue"
        else:
            f_status = "Scheduled"
    elif resolved_follow_up_period:
        f_status = "Scheduled" if resolved_follow_up_period not in ["حسبِ ضرورت", "As needed"] else "As Needed"

    try:
        # 1. Main Consultation Entity
        consultation = Consultation(
            consultation_id=consultation_unique_id,
            patient_id=patient.id,
            doctor_id=doctor_id,
            consultation_date=consult_dt,
            patient_state_id=consultation_in.patient_state_id,
            patient_state_name=resolved_state_name,
            symptom_notes=consultation_in.symptom_notes.strip() if consultation_in.symptom_notes else None,
            power_text=consultation_in.power_text.strip() if consultation_in.power_text else None,
            mmse_score=consultation_in.mmse_score,
            gcs_score=consultation_in.gcs_score,
            additional_observations=consultation_in.additional_observations.strip() if consultation_in.additional_observations else None,
            clinical_description=consultation_in.clinical_description.strip() if consultation_in.clinical_description else None,
            additional_examination=consultation_in.additional_examination.strip() if consultation_in.additional_examination else None,
            treatment_plan=consultation_in.treatment_plan.strip() if consultation_in.treatment_plan else None,
            follow_up_option_id=consultation_in.follow_up_option_id,
            follow_up_period=resolved_follow_up_period,
            follow_up_date=consultation_in.follow_up_date,
            follow_up_instructions=consultation_in.follow_up_instructions.strip() if consultation_in.follow_up_instructions else None,
            follow_up_status=f_status,
            created_at=now,
            updated_at=now,
        )
        db.add(consultation)
        db.flush()  # Generates consultation.id

        # 2. Vitals Signs (if provided)
        if consultation_in.vitals:
            v_data = consultation_in.vitals
            vitals = ConsultationVitals(
                consultation_id=consultation.id,
                systolic_bp=v_data.systolic_bp,
                diastolic_bp=v_data.diastolic_bp,
                pulse_rate=v_data.pulse_rate,
                temperature=v_data.temperature,
                oxygen_saturation=v_data.oxygen_saturation,
                nihss_score=v_data.nihss_score,
                fall_risk_status=v_data.fall_risk_status,
                fall_risk_notes=v_data.fall_risk_notes.strip() if v_data.fall_risk_notes else None,
                respiratory_rate=v_data.respiratory_rate,
                weight_kg=v_data.weight_kg,
                height_cm=v_data.height_cm,
                bmi=v_data.bmi,
                blood_glucose=v_data.blood_glucose,
                created_at=now,
                updated_at=now,
            )
            db.add(vitals)

        # 3. Symptoms (Normalized junction records)
        if consultation_in.symptoms:
            for idx, s_item in enumerate(consultation_in.symptoms):
                s_name = s_item.symptom_name.strip()
                s_id = s_item.symptom_id
                s_cat = s_item.category or "General"

                # If no symptom_id is provided, check if it already exists or auto-add to master data (Section 16)
                if not s_id:
                    existing_symptom = db.query(Symptom).filter(Symptom.name.ilike(s_name)).first()
                    if existing_symptom:
                        s_id = existing_symptom.id
                        s_cat = existing_symptom.category
                    else:
                        # Auto-create custom symptom in master database so it becomes available for future consultations
                        new_master_sym = Symptom(
                            name=s_name,
                            category=s_cat,
                            is_active=True,
                            sort_order=999,
                            created_by_id=doctor_id,
                            created_at=now,
                            updated_at=now,
                        )
                        db.add(new_master_sym)
                        db.flush()
                        s_id = new_master_sym.id

                db_symptom = ConsultationSymptom(
                    consultation_id=consultation.id,
                    symptom_id=s_id,
                    symptom_name=s_name,
                    category=s_cat,
                    notes=s_item.notes.strip() if s_item.notes else None,
                    sort_order=s_item.sort_order if s_item.sort_order else idx,
                    created_at=now,
                )
                db.add(db_symptom)

        # 4. Neurological Examinations (Normalized structured records)
        if consultation_in.examinations:
            for e_item in consultation_in.examinations:
                # If status is Not Done, finding can be empty or 'Not Done'
                status_val = e_item.status or "Done"
                finding_val = e_item.finding.strip() if e_item.finding else None
                finding_id_val = e_item.finding_id

                if finding_val and not finding_id_val:
                    # Try to link to master NeurologicalExamOption if matching
                    opt = db.query(NeurologicalExamOption).filter(
                        NeurologicalExamOption.category.ilike(e_item.category.strip()),
                        NeurologicalExamOption.name.ilike(finding_val)
                    ).first()
                    if opt:
                        finding_id_val = opt.id

                db_exam = ConsultationExamination(
                    consultation_id=consultation.id,
                    category=e_item.category.strip(),
                    item_name=e_item.item_name.strip(),
                    finding=finding_val,
                    finding_id=finding_id_val,
                    status=status_val,
                    observation=e_item.observation.strip() if e_item.observation else None,
                    created_at=now,
                )
                db.add(db_exam)

        # 5. Diagnostic Tests (Phase 5)
        if consultation_in.diagnostic_tests:
            for d_item in consultation_in.diagnostic_tests:
                t_name = d_item.test_name.strip()
                t_id = d_item.diagnostic_test_id
                t_cat = d_item.category or "General"

                if not t_id:
                    existing_test = db.query(DiagnosticTest).filter(DiagnosticTest.name.ilike(t_name)).first()
                    if existing_test:
                        t_id = existing_test.id
                        t_cat = existing_test.category
                    else:
                        # Auto-create custom diagnostic test in master database
                        new_master_test = DiagnosticTest(
                            name=t_name,
                            category=t_cat,
                            is_active=True,
                            sort_order=999,
                            created_by_id=doctor_id,
                            created_at=now,
                            updated_at=now,
                        )
                        db.add(new_master_test)
                        db.flush()
                        t_id = new_master_test.id

                valid_statuses = ["Ordered", "Pending", "Completed", "Reviewed"]
                status_val = d_item.status if d_item.status in valid_statuses else "Ordered"

                db_test = ConsultationDiagnosticTest(
                    consultation_id=consultation.id,
                    diagnostic_test_id=t_id,
                    test_name=t_name,
                    category=t_cat,
                    status=status_val,
                    clinical_indication=d_item.clinical_indication.strip() if d_item.clinical_indication else None,
                    result=d_item.result.strip() if d_item.result else None,
                    result_date=d_item.result_date,
                    doctor_notes=d_item.doctor_notes.strip() if d_item.doctor_notes else None,
                    created_at=now,
                    updated_at=now,
                )
                db.add(db_test)

        # 6. Prescription Items (Phase 6)
        if consultation_in.prescriptions:
            for idx, p_item in enumerate(consultation_in.prescriptions):
                m_name = p_item.medicine_name.strip()
                m_id = p_item.medicine_id

                if not m_id:
                    existing_med = db.query(Medicine).filter(Medicine.name.ilike(m_name)).first()
                    if existing_med:
                        m_id = existing_med.id
                    else:
                        new_med = Medicine(
                            name=m_name,
                            form="Tablet",
                            is_active=True,
                            sort_order=999,
                            created_by_id=doctor_id,
                            created_at=now,
                            updated_at=now,
                        )
                        db.add(new_med)
                        db.flush()
                        m_id = new_med.id

                db_prescription = PrescriptionItem(
                    consultation_id=consultation.id,
                    medicine_id=m_id,
                    medicine_name=m_name,
                    frequency_id=p_item.frequency_id,
                    frequency_name=p_item.frequency_name.strip(),
                    dosage=p_item.dosage.strip(),
                    duration_days=p_item.duration_days,
                    instruction_id=p_item.instruction_id,
                    instruction_name=p_item.instruction_name.strip() if p_item.instruction_name else None,
                    custom_instruction=p_item.custom_instruction.strip() if p_item.custom_instruction else None,
                    sort_order=p_item.sort_order if p_item.sort_order else idx,
                    created_at=now,
                    updated_at=now,
                )
                db.add(db_prescription)

        db.commit()
        db.refresh(consultation)
        return consultation

    except Exception as exc:
        db.rollback()
        raise exc


def update_consultation(
    db: Session,
    consultation_identifier: str,
    consultation_in: ConsultationUpdate,
    doctor_id: Optional[int] = None,
) -> Consultation:
    """
    Atomically updates an existing clinical consultation record and all its associated
    vitals, symptoms, examinations, and diagnostic tests.
    """
    consultation = get_consultation_by_id(db, consultation_identifier)
    if not consultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Consultation '{consultation_identifier}' not found."
        )

    if consultation_in.patient_id:
        patient = resolve_patient(db, consultation_in.patient_id)
        if not patient or patient.id != consultation.patient_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Consultation belongs to patient ID {consultation.patient_id}. Cannot reassign to patient '{consultation_in.patient_id}'."
            )

    now = datetime.now(timezone.utc)

    # Validate / resolve patient state
    resolved_state_name = consultation_in.patient_state_name
    if consultation_in.patient_state_id:
        p_state = db.query(PatientState).filter(PatientState.id == consultation_in.patient_state_id).first()
        if p_state:
            resolved_state_name = p_state.name

    try:
        # 1. Update main consultation fields
        if getattr(consultation_in, "consultation_date", None):
            consultation.consultation_date = consultation_in.consultation_date
        consultation.patient_state_id = consultation_in.patient_state_id
        consultation.patient_state_name = resolved_state_name
        consultation.symptom_notes = consultation_in.symptom_notes.strip() if consultation_in.symptom_notes else None
        consultation.power_text = consultation_in.power_text.strip() if consultation_in.power_text else None
        consultation.mmse_score = consultation_in.mmse_score
        consultation.gcs_score = consultation_in.gcs_score
        consultation.additional_observations = consultation_in.additional_observations.strip() if consultation_in.additional_observations else None
        consultation.clinical_description = consultation_in.clinical_description.strip() if consultation_in.clinical_description else None
        consultation.additional_examination = consultation_in.additional_examination.strip() if consultation_in.additional_examination else None
        consultation.treatment_plan = consultation_in.treatment_plan.strip() if consultation_in.treatment_plan else None

        # Resolve follow-up period and status
        resolved_follow_up_period = consultation_in.follow_up_period.strip() if consultation_in.follow_up_period else None
        if consultation_in.follow_up_option_id and not resolved_follow_up_period:
            f_opt = db.query(FollowUpOption).filter(FollowUpOption.id == consultation_in.follow_up_option_id).first()
            if f_opt:
                resolved_follow_up_period = f_opt.urdu_label or f_opt.name

        f_status = "No Follow-Up"
        if consultation_in.follow_up_date:
            subsequent = db.query(Consultation.id).filter(
                Consultation.patient_id == consultation.patient_id,
                Consultation.id != consultation.id,
                Consultation.consultation_date > consultation.consultation_date,
            ).first()
            if subsequent:
                f_status = "Completed"
            elif consultation_in.follow_up_date < now.date():
                f_status = "Overdue"
            else:
                f_status = "Scheduled"
        elif resolved_follow_up_period:
            f_status = "Scheduled" if resolved_follow_up_period not in ["حسبِ ضرورت", "As needed"] else "As Needed"

        consultation.follow_up_option_id = consultation_in.follow_up_option_id
        consultation.follow_up_period = resolved_follow_up_period
        consultation.follow_up_date = consultation_in.follow_up_date
        consultation.follow_up_instructions = consultation_in.follow_up_instructions.strip() if consultation_in.follow_up_instructions else None
        consultation.follow_up_status = f_status

        consultation.updated_at = now

        # 2. Update vitals
        if consultation_in.vitals:
            v_data = consultation_in.vitals
            if not consultation.vitals:
                consultation.vitals = ConsultationVitals(
                    consultation_id=consultation.id,
                    created_at=now,
                    updated_at=now,
                )
            consultation.vitals.systolic_bp = v_data.systolic_bp
            consultation.vitals.diastolic_bp = v_data.diastolic_bp
            consultation.vitals.pulse_rate = v_data.pulse_rate
            consultation.vitals.temperature = v_data.temperature
            consultation.vitals.oxygen_saturation = v_data.oxygen_saturation
            consultation.vitals.nihss_score = v_data.nihss_score
            consultation.vitals.fall_risk_status = v_data.fall_risk_status
            consultation.vitals.fall_risk_notes = v_data.fall_risk_notes.strip() if v_data.fall_risk_notes else None
            consultation.vitals.respiratory_rate = v_data.respiratory_rate
            consultation.vitals.weight_kg = v_data.weight_kg
            consultation.vitals.height_cm = v_data.height_cm
            consultation.vitals.bmi = v_data.bmi
            consultation.vitals.blood_glucose = v_data.blood_glucose
            consultation.vitals.updated_at = now
        elif consultation.vitals:
            db.delete(consultation.vitals)

        # 3. Replace Symptoms
        consultation.symptoms.clear()
        db.flush()
        if consultation_in.symptoms:
            for idx, s_item in enumerate(consultation_in.symptoms):
                s_name = s_item.symptom_name.strip()
                s_id = s_item.symptom_id
                s_cat = s_item.category or "General"

                if not s_id:
                    existing_symptom = db.query(Symptom).filter(Symptom.name.ilike(s_name)).first()
                    if existing_symptom:
                        s_id = existing_symptom.id
                        s_cat = existing_symptom.category
                    else:
                        new_master_sym = Symptom(
                            name=s_name,
                            category=s_cat,
                            is_active=True,
                            sort_order=999,
                            created_by_id=doctor_id,
                            created_at=now,
                            updated_at=now,
                        )
                        db.add(new_master_sym)
                        db.flush()
                        s_id = new_master_sym.id

                db_symptom = ConsultationSymptom(
                    consultation_id=consultation.id,
                    symptom_id=s_id,
                    symptom_name=s_name,
                    category=s_cat,
                    notes=s_item.notes.strip() if s_item.notes else None,
                    sort_order=s_item.sort_order if s_item.sort_order else idx,
                    created_at=now,
                )
                db.add(db_symptom)

        # 4. Replace Examinations
        consultation.examinations.clear()
        db.flush()
        if consultation_in.examinations:
            for e_item in consultation_in.examinations:
                status_val = e_item.status or "Done"
                finding_val = e_item.finding.strip() if e_item.finding else None
                finding_id_val = e_item.finding_id

                if finding_val and not finding_id_val:
                    opt = db.query(NeurologicalExamOption).filter(
                        NeurologicalExamOption.category.ilike(e_item.category.strip()),
                        NeurologicalExamOption.name.ilike(finding_val)
                    ).first()
                    if opt:
                        finding_id_val = opt.id

                db_exam = ConsultationExamination(
                    consultation_id=consultation.id,
                    category=e_item.category.strip(),
                    item_name=e_item.item_name.strip(),
                    finding=finding_val,
                    finding_id=finding_id_val,
                    status=status_val,
                    observation=e_item.observation.strip() if e_item.observation else None,
                    created_at=now,
                )
                db.add(db_exam)

        # 5. Replace Diagnostic Tests
        consultation.diagnostic_tests.clear()
        db.flush()
        if consultation_in.diagnostic_tests:
            for d_item in consultation_in.diagnostic_tests:
                t_name = d_item.test_name.strip()
                t_id = d_item.diagnostic_test_id
                t_cat = d_item.category or "General"

                if not t_id:
                    existing_test = db.query(DiagnosticTest).filter(DiagnosticTest.name.ilike(t_name)).first()
                    if existing_test:
                        t_id = existing_test.id
                        t_cat = existing_test.category
                    else:
                        new_master_test = DiagnosticTest(
                            name=t_name,
                            category=t_cat,
                            is_active=True,
                            sort_order=999,
                            created_by_id=doctor_id,
                            created_at=now,
                            updated_at=now,
                        )
                        db.add(new_master_test)
                        db.flush()
                        t_id = new_master_test.id

                valid_statuses = ["Ordered", "Pending", "Completed", "Reviewed"]
                status_val = d_item.status if d_item.status in valid_statuses else "Ordered"

                db_test = ConsultationDiagnosticTest(
                    consultation_id=consultation.id,
                    diagnostic_test_id=t_id,
                    test_name=t_name,
                    category=t_cat,
                    status=status_val,
                    clinical_indication=d_item.clinical_indication.strip() if d_item.clinical_indication else None,
                    result=d_item.result.strip() if d_item.result else None,
                    result_date=d_item.result_date,
                    doctor_notes=d_item.doctor_notes.strip() if d_item.doctor_notes else None,
                    created_at=now,
                    updated_at=now,
                )
                db.add(db_test)

        # 6. Replace Prescriptions (Phase 6)
        consultation.prescriptions.clear()
        db.flush()
        if consultation_in.prescriptions:
            for idx, p_item in enumerate(consultation_in.prescriptions):
                m_name = p_item.medicine_name.strip()
                m_id = p_item.medicine_id

                if not m_id:
                    existing_med = db.query(Medicine).filter(Medicine.name.ilike(m_name)).first()
                    if existing_med:
                        m_id = existing_med.id
                    else:
                        new_med = Medicine(
                            name=m_name,
                            form="Tablet",
                            is_active=True,
                            sort_order=999,
                            created_by_id=doctor_id,
                            created_at=now,
                            updated_at=now,
                        )
                        db.add(new_med)
                        db.flush()
                        m_id = new_med.id

                db_prescription = PrescriptionItem(
                    consultation_id=consultation.id,
                    medicine_id=m_id,
                    medicine_name=m_name,
                    frequency_id=p_item.frequency_id,
                    frequency_name=p_item.frequency_name.strip(),
                    dosage=p_item.dosage.strip(),
                    duration_days=p_item.duration_days,
                    instruction_id=p_item.instruction_id,
                    instruction_name=p_item.instruction_name.strip() if p_item.instruction_name else None,
                    custom_instruction=p_item.custom_instruction.strip() if p_item.custom_instruction else None,
                    sort_order=p_item.sort_order if p_item.sort_order else idx,
                    created_at=now,
                    updated_at=now,
                )
                db.add(db_prescription)

        # Refresh any existing generated PDF report so changes reflect immediately
        from app.models.consultation import ConsultationReport
        from app.models.settings import ClinicSetting
        from app.services.report_service import compile_prescription_pdf

        latest_rpt = (
            db.query(ConsultationReport)
            .filter(ConsultationReport.consultation_id == consultation.id, ConsultationReport.is_latest == True)
            .first()
        )
        if latest_rpt and os.path.exists(latest_rpt.storage_path):
            try:
                clinic_cfg = db.query(ClinicSetting).first()
                new_size = compile_prescription_pdf(consultation, latest_rpt.storage_path, clinic_cfg=clinic_cfg)
                latest_rpt.file_size = new_size
                latest_rpt.updated_at = now
            except Exception:
                pass

        db.commit()
        db.refresh(consultation)
        return consultation

    except Exception as exc:
        db.rollback()
        raise exc


def get_consultation_by_id(db: Session, consultation_identifier: str) -> Optional[Consultation]:
    """
    Retrieves a single consultation record by consultation_id (e.g. CNS-20260929-0001)
    or integer primary key. Eagerly loads relationships.
    """
    clean_id = str(consultation_identifier).strip()
    query = (
        db.query(Consultation)
        .options(
            joinedload(Consultation.patient),
            joinedload(Consultation.vitals),
            joinedload(Consultation.symptoms),
            joinedload(Consultation.examinations),
            joinedload(Consultation.diagnostic_tests),
            joinedload(Consultation.prescriptions),
        )
    )

    if clean_id.isdigit():
        consultation = query.filter(or_(Consultation.id == int(clean_id), Consultation.consultation_id.ilike(clean_id))).first()
    else:
        consultation = query.filter(Consultation.consultation_id.ilike(clean_id)).first()

    if consultation:
        # Dynamically derive follow-up status based on subsequent records or calendar date
        now_date = datetime.now(timezone.utc).date()
        subsequent = db.query(Consultation.id).filter(
            Consultation.patient_id == consultation.patient_id,
            Consultation.id != consultation.id,
            Consultation.consultation_date > consultation.consultation_date,
        ).first()

        if subsequent and (consultation.follow_up_date or consultation.follow_up_period):
            consultation.follow_up_status = "Completed"
        elif consultation.follow_up_date:
            if consultation.follow_up_date < now_date:
                consultation.follow_up_status = "Overdue"
            else:
                consultation.follow_up_status = "Scheduled"
        elif consultation.follow_up_period:
            if consultation.follow_up_period in ["حسبِ ضرورت", "As needed", "as needed"]:
                consultation.follow_up_status = "As Needed"
            else:
                consultation.follow_up_status = "Scheduled"
        else:
            consultation.follow_up_status = "No Follow-Up"

    return consultation


def list_patient_consultations(
    db: Session,
    patient_identifier: str,
) -> List[Consultation]:
    """
    Retrieves all consultation records for a specific patient, ordered newest first.
    """
    patient = resolve_patient(db, patient_identifier)
    if not patient:
        return []

    return (
        db.query(Consultation)
        .options(
            joinedload(Consultation.vitals),
            joinedload(Consultation.symptoms),
            joinedload(Consultation.diagnostic_tests),
            joinedload(Consultation.prescriptions),
        )
        .filter(Consultation.patient_id == patient.id)
        .order_by(desc(Consultation.consultation_date), desc(Consultation.id))
        .all()
    )


def list_all_consultations(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
) -> Tuple[List[Consultation], int]:
    """
    Paginated consultation listing with optional search.
    """
    query = (
        db.query(Consultation)
        .join(Consultation.patient)
        .options(
            joinedload(Consultation.patient),
            joinedload(Consultation.vitals),
            joinedload(Consultation.symptoms),
            joinedload(Consultation.diagnostic_tests),
            joinedload(Consultation.prescriptions),
        )
    )

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Consultation.consultation_id.ilike(term),
                Patient.patient_id.ilike(term),
                Patient.full_name.ilike(term),
                Patient.mobile_number.ilike(term),
            )
        )

    total = query.count()
    offset = max(0, (page - 1) * page_size)
    items = query.order_by(desc(Consultation.consultation_date), desc(Consultation.id)).offset(offset).limit(page_size).all()
    return items, total


def build_consultation_summary(
    consultation: Consultation,
    has_subsequent: bool = False,
) -> ConsultationSummaryResponse:
    """
    Helper to convert a Consultation ORM model into a ConsultationSummaryResponse.
    """
    bp_formatted = None
    pulse = None
    temp = None
    has_vitals = False

    v = consultation.vitals
    if v and any([
        v.systolic_bp is not None,
        v.diastolic_bp is not None,
        v.pulse_rate is not None,
        v.temperature is not None,
        v.oxygen_saturation is not None,
        v.nihss_score is not None,
        v.fall_risk_status is not None,
        v.respiratory_rate is not None,
        v.weight_kg is not None,
        v.blood_glucose is not None,
    ]):
        has_vitals = True
        pulse = v.pulse_rate
        temp = v.temperature
        if v.systolic_bp is not None and v.diastolic_bp is not None:
            bp_formatted = f"{v.systolic_bp} / {v.diastolic_bp} mmHg"
        elif v.systolic_bp is not None:
            bp_formatted = f"{v.systolic_bp} / — mmHg"
        elif v.diastolic_bp is not None:
            bp_formatted = f"— / {v.diastolic_bp} mmHg"

    now_date = datetime.now(timezone.utc).date()
    f_status = consultation.follow_up_status or "No Follow-Up"
    if has_subsequent:
        if consultation.follow_up_date or consultation.follow_up_period:
            f_status = "Completed"
    elif consultation.follow_up_date:
        if consultation.follow_up_date < now_date:
            f_status = "Overdue"
        else:
            f_status = "Scheduled"
    elif consultation.follow_up_period:
        if consultation.follow_up_period in ["حسبِ ضرورت", "As needed", "as needed"]:
            f_status = "As Needed"
        elif f_status != "Completed":
            f_status = "Scheduled"
    else:
        f_status = "No Follow-Up"

    symptoms_summary = [s.symptom_name for s in consultation.symptoms] if consultation.symptoms else []

    has_report = False
    latest_report_id = None
    latest_report_version = None
    latest_report_file_name = None
    latest_report_created_at = None

    if consultation.reports:
        latest = next((r for r in consultation.reports if r.is_latest), consultation.reports[0])
        if latest:
            has_report = True
            latest_report_id = latest.report_id
            latest_report_version = latest.version
            latest_report_file_name = latest.file_name
            latest_report_created_at = latest.created_at

    return ConsultationSummaryResponse(
        id=consultation.id,
        consultation_id=consultation.consultation_id,
        patient_id=consultation.patient_id,
        patient_unique_id=consultation.patient.patient_id if consultation.patient else "",
        patient_name=consultation.patient.full_name if consultation.patient else "",
        consultation_date=consultation.consultation_date,
        patient_state_name=consultation.patient_state_name,
        symptom_count=len(consultation.symptoms) if consultation.symptoms else 0,
        diagnostic_test_count=len(consultation.diagnostic_tests) if consultation.diagnostic_tests else 0,
        prescription_count=len(consultation.prescriptions) if consultation.prescriptions else 0,
        mmse_score=consultation.mmse_score,
        gcs_score=consultation.gcs_score,
        has_vitals=has_vitals,
        bp_formatted=bp_formatted,
        pulse_rate=pulse,
        temperature=temp,
        follow_up_period=consultation.follow_up_period,
        follow_up_date=consultation.follow_up_date,
        follow_up_instructions=consultation.follow_up_instructions,
        follow_up_status=f_status,
        symptoms_summary=symptoms_summary,
        has_report=has_report,
        latest_report_id=latest_report_id,
        latest_report_version=latest_report_version,
        latest_report_file_name=latest_report_file_name,
        latest_report_created_at=latest_report_created_at,
        created_at=consultation.created_at,
    )
