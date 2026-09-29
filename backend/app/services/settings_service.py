import os
import uuid
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings
from app.models.settings import ClinicSetting
from app.models.patient import Patient
from app.models.consultation import Consultation
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

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


def get_or_create_clinic_settings(db: Session) -> ClinicSetting:
    """
    Returns the singleton clinic setting record, creating it from config defaults if absent.
    """
    setting = db.query(ClinicSetting).first()
    if not setting:
        setting = ClinicSetting(
            doctor_name=settings.DOCTOR_NAME,
            doctor_name_urdu=settings.DOCTOR_NAME_URDU,
            doctor_title="Dr.",
            specialization=settings.DOCTOR_SPECIALIZATION,
            specialization_urdu=settings.DOCTOR_SPECIALIZATION_URDU,
            qualifications=settings.DOCTOR_QUALIFICATIONS,
            registration_no=settings.DOCTOR_REGISTRATION_NO,
            clinic_name=settings.CLINIC_NAME,
            clinic_name_urdu=settings.CLINIC_NAME_URDU,
            clinic_subtitle=settings.CLINIC_SUBTITLE,
            clinic_phone=settings.CLINIC_PHONE,
            clinic_email=settings.CLINIC_EMAIL,
            clinic_address=settings.CLINIC_ADDRESS,
            logo_path=settings.CLINIC_LOGO_PATH or None,
        )
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting


def update_clinic_settings(db: Session, data: dict) -> ClinicSetting:
    """
    Updates customizable doctor and clinic information.
    """
    setting = get_or_create_clinic_settings(db)
    for field, val in data.items():
        if val is not None and hasattr(setting, field):
            if isinstance(val, str):
                setattr(setting, field, val.strip())
            else:
                setattr(setting, field, val)

    db.commit()
    db.refresh(setting)
    return setting


def save_clinic_logo(db: Session, upload_file: UploadFile) -> Tuple[ClinicSetting, str]:
    """
    Validates and securely saves an uploaded clinic logo image.
    Generates a secure randomized filename and stores in the storage directory.
    """
    content_type = (upload_file.content_type or "").lower()
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image type. Supported formats are PNG, JPEG, and WebP."
        )

    # Read content to check file size
    contents = upload_file.file.read()
    if len(contents) > MAX_LOGO_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image size exceeds 5MB limit ({len(contents) / (1024 * 1024):.1f} MB)."
        )

    if len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )

    ext = ALLOWED_IMAGE_TYPES[content_type]
    storage_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "storage", "clinic_logo"))
    os.makedirs(storage_dir, exist_ok=True)

    setting = get_or_create_clinic_settings(db)

    # Clean up previous logo file if it exists
    if setting.logo_path and os.path.exists(setting.logo_path):
        try:
            os.remove(setting.logo_path)
        except OSError:
            pass

    safe_filename = f"clinic_logo_{uuid.uuid4().hex[:12]}{ext}"
    destination_path = os.path.join(storage_dir, safe_filename)

    with open(destination_path, "wb") as f:
        f.write(contents)

    setting.logo_path = destination_path
    db.commit()
    db.refresh(setting)

    return setting, safe_filename


def get_admin_dashboard_stats(db: Session) -> Dict[str, Any]:
    """
    Computes real-time counts from the database for all 9 master data entities,
    as well as overall clinical system statistics.
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

    return {
        "categories": categories_stats,
        "total_master_items": total_master_items,
        "total_active_items": total_active_items,
        "total_inactive_items": total_inactive_items,
        "total_patients": total_patients,
        "total_consultations": total_consultations,
    }
