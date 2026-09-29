import os
from datetime import datetime, timezone
from math import ceil
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.consultation import ConsultationReport
from app.schemas.consultation import (
    ConsultationCreate,
    ConsultationUpdate,
    ConsultationResponse,
    ConsultationListResponse,
    ConsultationSummaryResponse,
    ConsultationReportResponse,
    ServerDateResponse,
)
from app.services.consultation_service import (
    create_consultation,
    update_consultation,
    get_consultation_by_id,
    list_all_consultations,
    build_consultation_summary,
)
from app.services.report_service import generate_or_retrieve_report

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
    All data (vitals, symptoms, neurological exams, diagnostic tests, scores, notes, assessment) are committed atomically.
    """
    consultation = create_consultation(
        db,
        consultation_in=consultation_in,
        doctor_id=current_user.id,
    )
    return ConsultationResponse.model_validate(consultation)


@router.put("/{consultation_id}", response_model=ConsultationResponse)
def modify_consultation(
    consultation_id: str,
    consultation_in: ConsultationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_clinical_creation),
):
    """
    Update an existing clinical consultation workspace entry.
    All clinical data and related records are updated atomically.
    """
    consultation = update_consultation(
        db,
        consultation_identifier=consultation_id,
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
    patient_id: Optional[str] = Query(None, description="Optional patient ID verification"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve full consultation workspace record including vitals, symptoms, neurological examination,
    diagnostic tests, and clinical assessment.
    """
    consultation = get_consultation_by_id(db, consultation_id)
    if not consultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Consultation '{consultation_id}' not found."
        )
    if patient_id:
        from app.services.consultation_service import resolve_patient
        p = resolve_patient(db, patient_id)
        if not p or consultation.patient_id != p.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Consultation '{consultation_id}' does not belong to patient '{patient_id}'."
            )
    return ConsultationResponse.model_validate(consultation)


def _build_report_response(report: ConsultationReport, consultation_id_str: str) -> ConsultationReportResponse:
    resp = ConsultationReportResponse.model_validate(report)
    resp.download_url = f"/api/consultations/{consultation_id_str}/report/download"
    resp.preview_url = f"/api/consultations/{consultation_id_str}/report/preview"
    return resp


@router.post("/{consultation_id}/report", response_model=ConsultationReportResponse)
def generate_consultation_report(
    consultation_id: str,
    regenerate: bool = Query(False, description="Force generate a new version of the report"),
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_clinical_creation),
):
    """
    Generate and permanently store an A4 PDF prescription report for the consultation.
    If a report already exists and regenerate is False, returns existing report without duplicating.
    If regenerate is True, creates a controlled new version (v2, v3, etc.) and updates latest flag.
    """
    consultation = get_consultation_by_id(db, consultation_id)
    if not consultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Consultation '{consultation_id}' not found."
        )

    try:
        report = generate_or_retrieve_report(
            db,
            consultation=consultation,
            user_id=current_user.id,
            force_regenerate=regenerate,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate prescription report: {str(e)}"
        )

    return _build_report_response(report, consultation.consultation_id)


@router.get("/{consultation_id}/report", response_model=ConsultationReportResponse)
def get_consultation_report_metadata(
    consultation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve report metadata for a consultation. If no report exists yet, generates the initial version.
    """
    consultation = get_consultation_by_id(db, consultation_id)
    if not consultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Consultation '{consultation_id}' not found."
        )

    report = generate_or_retrieve_report(
        db,
        consultation=consultation,
        user_id=current_user.id,
        force_regenerate=False,
    )
    return _build_report_response(report, consultation.consultation_id)


@router.get("/{consultation_id}/report/download")
def download_consultation_report_pdf(
    consultation_id: str,
    version: Optional[int] = Query(None, description="Specific report version to download"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Securely download the persistent PDF prescription report as an attachment.
    Requires authenticated user. Access verified against consultation and patient.
    """
    consultation = get_consultation_by_id(db, consultation_id)
    if not consultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Consultation '{consultation_id}' not found."
        )

    query = db.query(ConsultationReport).filter(ConsultationReport.consultation_id == consultation.id)
    if version:
        report = query.filter(ConsultationReport.version == version).first()
    else:
        report = query.filter(ConsultationReport.is_latest == True).first() or query.order_by(desc(ConsultationReport.version)).first()

    if not report or not os.path.exists(report.storage_path):
        report = generate_or_retrieve_report(db, consultation, user_id=current_user.id, force_regenerate=False)

    if not os.path.exists(report.storage_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription report PDF file not found on server storage."
        )

    return FileResponse(
        path=report.storage_path,
        media_type="application/pdf",
        filename=report.file_name,
        headers={"Content-Disposition": f'attachment; filename="{report.file_name}"'},
    )


@router.get("/{consultation_id}/report/preview")
def preview_consultation_report_pdf(
    consultation_id: str,
    version: Optional[int] = Query(None, description="Specific report version to preview"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Securely stream the persistent PDF prescription report inline for A4 browser preview.
    Requires authenticated user.
    """
    consultation = get_consultation_by_id(db, consultation_id)
    if not consultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Consultation '{consultation_id}' not found."
        )

    query = db.query(ConsultationReport).filter(ConsultationReport.consultation_id == consultation.id)
    if version:
        report = query.filter(ConsultationReport.version == version).first()
    else:
        report = query.filter(ConsultationReport.is_latest == True).first() or query.order_by(desc(ConsultationReport.version)).first()

    if not report or not os.path.exists(report.storage_path):
        report = generate_or_retrieve_report(db, consultation, user_id=current_user.id, force_regenerate=False)

    if not os.path.exists(report.storage_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription report PDF file not found on server storage."
        )

    return FileResponse(
        path=report.storage_path,
        media_type="application/pdf",
        filename=report.file_name,
        headers={"Content-Disposition": f'inline; filename="{report.file_name}"'},
    )


@router.get("/{consultation_id}/reports", response_model=List[ConsultationReportResponse])
def list_consultation_reports(
    consultation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all generated versions of reports for a given consultation.
    """
    consultation = get_consultation_by_id(db, consultation_id)
    if not consultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Consultation '{consultation_id}' not found."
        )

    reports = (
        db.query(ConsultationReport)
        .filter(ConsultationReport.consultation_id == consultation.id)
        .order_by(desc(ConsultationReport.version))
        .all()
    )
    return [_build_report_response(r, consultation.consultation_id) for r in reports]

