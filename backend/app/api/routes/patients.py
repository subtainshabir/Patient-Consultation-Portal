from typing import Optional, List
from math import ceil
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.patient import (
    PatientCreate,
    PatientUpdate,
    PatientResponse,
    PatientListResponse,
    PatientStatusUpdate,
    DuplicatePatientWarning,
)
from app.schemas.consultation import ConsultationSummaryResponse, ConsultationResponse
from app.services.patient_service import (
    create_patient,
    get_patient_by_patient_id,
    list_patients,
    update_patient,
    set_patient_status,
    check_duplicate_patient,
    DuplicatePatientException,
)
from app.services.consultation_service import (
    list_patient_consultations,
    build_consultation_summary,
    get_consultation_by_id,
)

router = APIRouter(prefix="/patients", tags=["Patients"])



@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def register_patient(
    patient_in: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Register a new patient with auto-generated unique Patient ID (DRN-XXXXXX).
    Checks for likely duplicates unless confirm_duplicate is set to True.
    """
    try:
        new_patient = create_patient(
            db,
            patient_in=patient_in,
            created_by_id=current_user.id
        )
        return PatientResponse.model_validate(new_patient)
    except DuplicatePatientException as e:
        # Return 409 Conflict with duplicate patient details
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "success": False,
                "message": e.message,
                "error_code": "DUPLICATE_PATIENT_WARNING",
                "details": {
                    "is_duplicate": True,
                    "existing_patient": PatientResponse.model_validate(e.existing_patient).model_dump(mode="json")
                }
            }
        )


@router.get("", response_model=PatientListResponse)
def get_patients(
    search: Optional[str] = Query(None, description="Search by ID, name, mobile, or CNIC"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(15, ge=1, le=100, description="Items per page"),
    is_active: Optional[bool] = Query(True, description="Filter by active status (null for all)"),
    gender: Optional[str] = Query(None, description="Filter by gender (Male, Female, Other, etc.)"),
    sort_by: str = Query("created_at", description="Field to sort by"),
    sort_order: str = Query("desc", description="Sort order: 'asc' or 'desc'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get paginated and searchable list of patients.
    Supports live debounced search from the clinical frontend.
    """
    items, total = list_patients(
        db,
        search=search,
        page=page,
        page_size=page_size,
        is_active=is_active,
        gender=gender,
        sort_by=sort_by,
        sort_order=sort_order
    )
    total_pages = ceil(total / page_size) if total > 0 else 1

    return PatientListResponse(
        items=[PatientResponse.model_validate(p) for p in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.post("/check-duplicate", response_model=Optional[DuplicatePatientWarning])
def check_duplicate(
    patient_in: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Pre-check whether a patient with matching signals already exists.
    """
    existing = check_duplicate_patient(
        db,
        full_name=patient_in.full_name,
        mobile_number=patient_in.mobile_number,
        cnic=patient_in.cnic
    )
    if existing:
        return DuplicatePatientWarning(
            is_duplicate=True,
            message="A patient with similar information already exists. Please review the existing patient before creating a new record.",
            existing_patient=PatientResponse.model_validate(existing)
        )
    return None


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get detailed information for a single patient by their unique Patient ID (DRN-XXXXXX).
    """
    patient = get_patient_by_patient_id(db, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID '{patient_id}' not found."
        )
    return PatientResponse.model_validate(patient)


@router.patch("/{patient_id}", response_model=PatientResponse)
def modify_patient(
    patient_id: str,
    patient_update: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update basic patient details (Name, Age, Gender, Mobile, CNIC).
    Patient ID remains strictly permanent and immutable.
    """
    updated = update_patient(db, patient_id, patient_update)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID '{patient_id}' not found."
        )
    return PatientResponse.model_validate(updated)


@router.patch("/{patient_id}/status", response_model=PatientResponse)
def toggle_patient_status(
    patient_id: str,
    status_in: PatientStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Soft-deactivate (or reactivate) a patient record without physical deletion.
    Preserves all historical clinical records.
    """
    updated = set_patient_status(db, patient_id, is_active=status_in.is_active)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID '{patient_id}' not found."
        )
    return PatientResponse.model_validate(updated)


@router.get("/{patient_id}/consultations", response_model=List[ConsultationSummaryResponse])
def get_patient_consultations(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all previous clinical consultations for a given patient, ordered newest first.
    """
    patient = get_patient_by_patient_id(db, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID '{patient_id}' not found."
        )
    consultations = list_patient_consultations(db, patient_id)
    summaries = []
    for idx, c in enumerate(consultations):
        # Ordered newest first: any consultation with index > 0 has a subsequent consultation
        has_subsequent = idx > 0
        summaries.append(build_consultation_summary(c, has_subsequent=has_subsequent))
    return summaries


@router.get("/{patient_id}/consultations/{consultation_id}", response_model=ConsultationResponse)
def get_patient_consultation_detail(
    patient_id: str,
    consultation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get detailed information for a specific consultation belonging to this patient.
    Verifies that the consultation belongs to the specified patient.
    """
    patient = get_patient_by_patient_id(db, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID '{patient_id}' not found."
        )
    consultation = get_consultation_by_id(db, consultation_id)
    if not consultation or consultation.patient_id != patient.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Consultation '{consultation_id}' not found for patient '{patient_id}'."
        )
    return ConsultationResponse.model_validate(consultation)

