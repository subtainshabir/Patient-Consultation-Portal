from datetime import datetime, timezone
from math import ceil
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.consultation import (
    ConsultationCreate,
    ConsultationResponse,
    ConsultationListResponse,
    ConsultationSummaryResponse,
    ServerDateResponse,
)
from app.services.consultation_service import (
    create_consultation,
    get_consultation_by_id,
    list_all_consultations,
    build_consultation_summary,
)

router = APIRouter(prefix="/consultations", tags=["Clinical Consultations"])

# Doctors and Admins can create consultations; all authenticated users can view
allow_clinical_creation = require_roles([UserRole.ADMIN, UserRole.DOCTOR])


@router.get("/current-date", response_model=ServerDateResponse)
def get_consultation_server_date(
    current_user: User = Depends(get_current_user),
):
    """
    Returns the authoritative server date and timestamp for consultations.
    Guarantees clinical records do not depend exclusively on client system clock.
    """
    now = datetime.now(timezone.utc)
    return ServerDateResponse(
        server_date=now.strftime("%Y-%m-%d"),
        formatted_date=now.strftime("%d %B %Y"),
        iso_timestamp=now.isoformat(),
    )


@router.post("", response_model=ConsultationResponse, status_code=status.HTTP_201_CREATED)
def record_consultation(
    consultation_in: ConsultationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_clinical_creation),
):
    """
    Create and record a new clinical consultation workspace entry.
    All data (vitals, symptoms, neurological exams, scores, notes) are committed atomically.
    """
    consultation = create_consultation(
        db,
        consultation_in=consultation_in,
        doctor_id=current_user.id,
    )
    return ConsultationResponse.model_validate(consultation)


@router.get("", response_model=ConsultationListResponse)
def get_consultations(
    search: Optional[str] = Query(None, description="Search by consultation ID, patient ID, name, or phone"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List paginated consultations across the clinic.
    """
    items, total = list_all_consultations(
        db,
        page=page,
        page_size=page_size,
        search=search,
    )
    summaries = [build_consultation_summary(c) for c in items]
    return ConsultationListResponse(
        items=summaries,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 1,
    )


@router.get("/{consultation_id}", response_model=ConsultationResponse)
def get_consultation_detail(
    consultation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve full consultation workspace record including vitals, symptoms, and neurological examination.
    """
    consultation = get_consultation_by_id(db, consultation_id)
    if not consultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Consultation '{consultation_id}' not found."
        )
    return ConsultationResponse.model_validate(consultation)
