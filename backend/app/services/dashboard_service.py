from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func, or_, cast, Date

from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.consultation import (
    Consultation,
    ConsultationVitals,
    ConsultationSymptom,
    PrescriptionItem,
    ConsultationReport,
)
from app.models.master_data import (
    Symptom,
    PatientState,
    NeurologicalExamOption,
    DiagnosticTest,
    Medicine,
    MedicineFrequency,
    MedicineDosage,
    MedicineInstruction,
    FollowUpOption,
)


def get_admin_dashboard_data(db: Session) -> Dict[str, Any]:
    """
    Computes real-time statistics, master data counts, and recent system activities
    specifically for the Administrator Dashboard.
    """
    category_configs = [
        ("symptoms", "Symptoms", Symptom),
        ("patient_states", "Patient States", PatientState),
        ("neurological_examinations", "Neurological Exam Options", NeurologicalExamOption),
        ("diagnostic_tests", "Diagnostic Tests", DiagnosticTest),
        ("medicines", "Medicines", Medicine),
        ("frequencies", "Frequencies", MedicineFrequency),
        ("dosages", "Dosages", MedicineDosage),
        ("instructions", "Instructions", MedicineInstruction),
        ("follow_ups", "Follow-Up Options", FollowUpOption),
    ]

    categories_stats = {}
    total_master_items = 0
    total_active_items = 0
    total_inactive_items = 0

    for key, label, model in category_configs:
        active_count = db.query(model).filter(model.is_active == True).count()
        inactive_count = db.query(model).filter(model.is_active == False).count()
        tot = active_count + inactive_count

        categories_stats[key] = {
            "category_key": key,
            "label": label,
            "active": active_count,
            "inactive": inactive_count,
            "total": tot,
        }
        total_active_items += active_count
        total_inactive_items += inactive_count
        total_master_items += tot

    total_patients = db.query(Patient).count()
    total_consultations = db.query(Consultation).count()
    total_doctors = db.query(User).filter(User.role == UserRole.DOCTOR).count()
    total_staff = db.query(User).filter(User.role == UserRole.STAFF).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    inactive_users = db.query(User).filter(User.is_active == False).count()

    # Recent activities (non-clinical sensitive details only)
    recent_patients_query = db.query(Patient).order_by(desc(Patient.created_at)).limit(5).all()
    recent_patients = [
        {
            "patient_id": p.patient_id,
            "full_name": p.full_name,
            "age": p.age,
            "gender": p.gender.value if hasattr(p.gender, "value") else str(p.gender),
            "mobile_number": p.mobile_number,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in recent_patients_query
    ]

    recent_consultations_query = (
        db.query(Consultation)
        .join(Consultation.patient)
        .options(joinedload(Consultation.patient))
        .order_by(desc(Consultation.created_at))
        .limit(5)
        .all()
    )
    recent_consultations = [
        {
            "consultation_id": c.consultation_id,
            "patient_id": c.patient.patient_id if c.patient else "",
            "patient_name": c.patient.full_name if c.patient else "Unknown",
            "consultation_date": c.consultation_date.isoformat() if c.consultation_date else None,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c in recent_consultations_query
    ]

    recent_users_query = db.query(User).order_by(desc(User.created_at)).limit(5).all()
    recent_users = [
        {
            "id": u.id,
            "username": u.username,
            "full_name": u.full_name,
            "role": u.role.value if hasattr(u.role, "value") else str(u.role),
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in recent_users_query
    ]

    return {
        "categories": categories_stats,
        "total_master_items": total_master_items,
        "total_active_items": total_active_items,
        "total_inactive_items": total_inactive_items,
        "total_patients": total_patients,
        "total_consultations": total_consultations,
        "total_doctors": total_doctors,
        "total_staff": total_staff,
        "active_users": active_users,
        "inactive_users": inactive_users,
        "active_medicines": categories_stats["medicines"]["active"],
        "active_symptoms": categories_stats["symptoms"]["active"],
        "active_diagnostic_tests": categories_stats["diagnostic_tests"]["active"],
        "active_neuro_exams": categories_stats["neurological_examinations"]["active"],
        "active_follow_ups": categories_stats["follow_ups"]["active"],
        "recent_activity": {
            "recent_patients": recent_patients,
            "recent_consultations": recent_consultations,
            "recent_users": recent_users,
        },
    }


def get_doctor_dashboard_data(db: Session, doctor_id: Optional[int] = None) -> Dict[str, Any]:
    """
    Computes clinical statistics, today's consultations, recent patients,
    and recent consultation workflows for the Doctor Dashboard.
    """
    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, 0, 0, 0, tzinfo=timezone.utc)
    today_end = datetime(now.year, now.month, now.day, 23, 59, 59, 999999, tzinfo=timezone.utc)
    today_date = now.date()

    total_patients = db.query(Patient).count()
    total_consultations = db.query(Consultation).count()

    # Query consultations matching today
    today_consultations_query = (
        db.query(Consultation)
        .join(Consultation.patient)
        .options(
            joinedload(Consultation.patient),
            joinedload(Consultation.vitals),
            joinedload(Consultation.prescriptions),
            joinedload(Consultation.symptoms),
            joinedload(Consultation.reports),
        )
        .filter(
            or_(
                Consultation.consultation_date >= today_start,
                cast(Consultation.consultation_date, Date) == today_date,
            )
        )
        .order_by(desc(Consultation.consultation_date))
        .all()
    )

    today_consultations = []
    for c in today_consultations_query:
        bp_str = None
        pulse_str = None
        if c.vitals:
            if c.vitals.systolic_bp is not None and c.vitals.diastolic_bp is not None:
                bp_str = f"{c.vitals.systolic_bp}/{c.vitals.diastolic_bp}"
            if c.vitals.pulse_rate is not None:
                pulse_str = f"{c.vitals.pulse_rate} bpm"

        has_report = len(c.reports) > 0 if c.reports else False

        today_consultations.append({
            "consultation_id": c.consultation_id,
            "patient_id": c.patient.patient_id if c.patient else "",
            "patient_name": c.patient.full_name if c.patient else "Unknown",
            "consultation_date": c.consultation_date.isoformat() if c.consultation_date else None,
            "bp_formatted": bp_str,
            "pulse_rate": pulse_str,
            "has_report": has_report,
            "prescriptions_count": len(c.prescriptions) if c.prescriptions else 0,
            "symptoms": [s.symptom_name for s in c.symptoms[:2]] if c.symptoms else [],
            "patient_state": c.patient_state_name or "Stable",
        })

    # Recent patients (non-sensitive demographic summary)
    recent_patients_query = db.query(Patient).order_by(desc(Patient.created_at)).limit(6).all()
    recent_patients = [
        {
            "patient_id": p.patient_id,
            "full_name": p.full_name,
            "age": p.age,
            "gender": p.gender.value if hasattr(p.gender, "value") else str(p.gender),
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in recent_patients_query
    ]

    # Recent consultations
    recent_consultations_query = (
        db.query(Consultation)
        .join(Consultation.patient)
        .options(joinedload(Consultation.patient), joinedload(Consultation.prescriptions))
        .order_by(desc(Consultation.consultation_date), desc(Consultation.id))
        .limit(6)
        .all()
    )
    recent_consultations = [
        {
            "consultation_id": c.consultation_id,
            "patient_id": c.patient.patient_id if c.patient else "",
            "patient_name": c.patient.full_name if c.patient else "Unknown",
            "consultation_date": c.consultation_date.isoformat() if c.consultation_date else None,
            "prescriptions_count": len(c.prescriptions) if c.prescriptions else 0,
        }
        for c in recent_consultations_query
    ]

    return {
        "total_patients": total_patients,
        "total_consultations": total_consultations,
        "today_consultations_count": len(today_consultations),
        "today_consultations": today_consultations,
        "recent_patients": recent_patients,
        "recent_consultations": recent_consultations,
    }


def get_staff_dashboard_data(db: Session) -> Dict[str, Any]:
    """
    Computes patient registration statistics, today's patient registrations,
    and administrative activity specifically for the Staff Dashboard.
    NO clinical, diagnostic, medication, or user administration data is exposed.
    """
    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, 0, 0, 0, tzinfo=timezone.utc)
    today_date = now.date()

    total_patients = db.query(Patient).count()

    today_patients_query = (
        db.query(Patient)
        .filter(
            or_(
                Patient.created_at >= today_start,
                cast(Patient.created_at, Date) == today_date,
            )
        )
        .order_by(desc(Patient.created_at))
        .all()
    )

    today_patients = [
        {
            "patient_id": p.patient_id,
            "full_name": p.full_name,
            "age": p.age,
            "gender": p.gender.value if hasattr(p.gender, "value") else str(p.gender),
            "mobile_number": p.mobile_number,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in today_patients_query
    ]

    recent_patients_query = db.query(Patient).order_by(desc(Patient.created_at)).limit(8).all()
    recent_patients = [
        {
            "patient_id": p.patient_id,
            "full_name": p.full_name,
            "age": p.age,
            "gender": p.gender.value if hasattr(p.gender, "value") else str(p.gender),
            "mobile_number": p.mobile_number,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in recent_patients_query
    ]

    return {
        "total_patients": total_patients,
        "today_registered_count": len(today_patients),
        "today_patients": today_patients,
        "recent_patients": recent_patients,
    }
