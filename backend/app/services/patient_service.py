import re
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc, func
from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientUpdate


class DuplicatePatientException(Exception):
    def __init__(self, existing_patient: Patient, message: str = "A patient with similar information already exists."):
        self.existing_patient = existing_patient
        self.message = message
        super().__init__(self.message)


def generate_patient_id(db: Session) -> str:
    """
    Generates a guaranteed unique human-friendly Patient ID in format DRN-XXXXXX (e.g. DRN-000001).
    Permanent and never changes after creation.
    """
    # Count total patients to derive starting sequence
    total_count = db.query(func.count(Patient.id)).scalar() or 0
    next_num = total_count + 1

    while True:
        candidate_id = f"DRN-{next_num:06d}"
        exists = db.query(Patient.id).filter(Patient.patient_id == candidate_id).first()
        if not exists:
            return candidate_id
        next_num += 1


def check_duplicate_patient(
    db: Session,
    full_name: str,
    mobile_number: str,
    cnic: Optional[str] = None
) -> Optional[Patient]:
    """
    Checks for likely duplicate patients using:
    1. Exact or normalized CNIC match (if CNIC provided)
    2. Mobile number match (including digits-based matching)
    3. Full name (case-insensitive) + mobile number match
    Only checks active patients.
    """
    digits = re.sub(r"[^\d]", "", mobile_number)
    
    # 1. Match CNIC if provided
    if cnic and cnic.strip():
        clean_cnic = cnic.strip()
        cnic_digits = re.sub(r"[^\d]", "", clean_cnic)
        cnic_match = db.query(Patient).filter(
            Patient.is_active == True,
            or_(
                Patient.cnic == clean_cnic,
                Patient.cnic.like(f"%{cnic_digits[-8:]}%") if len(cnic_digits) >= 8 else Patient.cnic == clean_cnic
            )
        ).first()
        if cnic_match:
            return cnic_match

    # 2. Match mobile number (exact or ending 7 digits)
    mobile_conditions = [Patient.mobile_number == mobile_number.strip()]
    if len(digits) >= 7:
        mobile_conditions.append(Patient.mobile_number.like(f"%{digits[-7:]}"))

    mobile_match = db.query(Patient).filter(
        Patient.is_active == True,
        or_(*mobile_conditions)
    ).first()
    if mobile_match:
        return mobile_match

    # 3. Match normalized name + mobile
    name_mobile_match = db.query(Patient).filter(
        Patient.is_active == True,
        Patient.full_name.ilike(full_name.strip()),
        or_(*mobile_conditions)
    ).first()
    if name_mobile_match:
        return name_mobile_match

    return None


def create_patient(
    db: Session,
    patient_in: PatientCreate,
    created_by_id: Optional[int] = None
) -> Patient:
    """
    Creates a new patient.
    If likely duplicate is detected and confirm_duplicate is False, raises DuplicatePatientException.
    """
    if not patient_in.confirm_duplicate:
        duplicate = check_duplicate_patient(
            db,
            full_name=patient_in.full_name,
            mobile_number=patient_in.mobile_number,
            cnic=patient_in.cnic
        )
        if duplicate:
            raise DuplicatePatientException(
                existing_patient=duplicate,
                message="A patient with similar information already exists. Please review the existing patient before creating a new record."
            )

    new_patient_id = generate_patient_id(db)

    db_patient = Patient(
        patient_id=new_patient_id,
        full_name=patient_in.full_name.strip(),
        age=patient_in.age,
        gender=patient_in.gender,
        mobile_number=patient_in.mobile_number.strip(),
        cnic=patient_in.cnic.strip() if patient_in.cnic else None,
        is_active=True,
        created_by_id=created_by_id
    )

    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient


def get_patient_by_patient_id(db: Session, patient_id: str) -> Optional[Patient]:
    """
    Looks up patient by their unique patient_id (e.g. DRN-000001).
    """
    clean_id = patient_id.strip()
    return db.query(Patient).filter(Patient.patient_id.ilike(clean_id)).first()


def list_patients(
    db: Session,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 15,
    is_active: Optional[bool] = True,
    gender: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc"
) -> Tuple[List[Patient], int]:
    """
    Retrieves paginated and filtered patients.
    Supports search across patient_id, full_name, mobile_number, and cnic.
    """
    query = db.query(Patient)

    if is_active is not None:
        query = query.filter(Patient.is_active == is_active)

    if gender and gender.strip() and gender.lower() != "all":
        query = query.filter(Patient.gender == gender.strip())

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Patient.patient_id.ilike(term),
                Patient.full_name.ilike(term),
                Patient.mobile_number.ilike(term),
                Patient.cnic.ilike(term)
            )
        )

    total = query.count()

    # Whitelist sort fields to prevent unexpected behavior
    allowed_sort_fields = {
        "created_at": Patient.created_at,
        "full_name": Patient.full_name,
        "patient_id": Patient.patient_id,
        "age": Patient.age,
    }
    sort_column = allowed_sort_fields.get(sort_by, Patient.created_at)
    if sort_order.lower() == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    # Pagination
    offset = max(0, (page - 1) * page_size)
    items = query.offset(offset).limit(page_size).all()

    return items, total


def update_patient(
    db: Session,
    patient_id: str,
    patient_update: PatientUpdate
) -> Optional[Patient]:
    """
    Updates basic patient information.
    Patient ID cannot be changed.
    """
    patient = get_patient_by_patient_id(db, patient_id)
    if not patient:
        return None

    update_data = patient_update.model_dump(exclude_unset=True)
    # Ensure patient_id is never overwritten even if erroneously passed
    update_data.pop("patient_id", None)
    update_data.pop("id", None)

    for field, value in update_data.items():
        if value is not None:
            if isinstance(value, str):
                setattr(patient, field, value.strip())
            else:
                setattr(patient, field, value)

    db.commit()
    db.refresh(patient)
    return patient


def set_patient_status(
    db: Session,
    patient_id: str,
    is_active: bool
) -> Optional[Patient]:
    """
    Soft-deactivates or reactivates a patient record without physical deletion.
    Preserves all historical clinical records.
    """
    patient = get_patient_by_patient_id(db, patient_id)
    if not patient:
        return None

    patient.is_active = is_active
    db.commit()
    db.refresh(patient)
    return patient
