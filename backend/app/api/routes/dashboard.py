from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_roles
from app.models.user import User, UserRole
from app.schemas.dashboard import DoctorDashboardResponse, StaffDashboardResponse
from app.services.dashboard_service import get_doctor_dashboard_data, get_staff_dashboard_data

router = APIRouter(tags=["Role Dashboards"])

doctor_access = require_roles([UserRole.DOCTOR, UserRole.ADMIN])
staff_access = require_roles([UserRole.STAFF, UserRole.ADMIN])


@router.get("/doctor/dashboard", response_model=DoctorDashboardResponse)
def get_doctor_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(doctor_access),
):
    """
    Returns clinical metrics, today's consultations, and recent patient/consultation
    activity for the Doctor Dashboard.
    Enforces strict access control (DOCTOR or ADMIN only; STAFF is rejected with 403).
    """
    data = get_doctor_dashboard_data(db, doctor_id=current_user.id)
    return DoctorDashboardResponse(**data)


@router.get("/staff/dashboard", response_model=StaffDashboardResponse)
def get_staff_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(staff_access),
):
    """
    Returns patient registration metrics, today's registrations, and recent patient
    demographics for the Staff Dashboard.
    Enforces strict access control (STAFF or ADMIN only; DOCTOR is rejected with 403).
    """
    data = get_staff_dashboard_data(db)
    return StaffDashboardResponse(**data)
