from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict


class AdminRecentPatientItem(BaseModel):
    patient_id: str
    full_name: str
    age: int
    gender: str
    mobile_number: Optional[str] = None
    created_at: Optional[str] = None


class AdminRecentConsultationItem(BaseModel):
    consultation_id: str
    patient_id: str
    patient_name: str
    consultation_date: Optional[str] = None
    created_at: Optional[str] = None


class AdminRecentUserItem(BaseModel):
    id: int
    username: str
    full_name: str
    role: str
    is_active: bool
    created_at: Optional[str] = None


class AdminRecentActivity(BaseModel):
    recent_patients: List[AdminRecentPatientItem] = []
    recent_consultations: List[AdminRecentConsultationItem] = []
    recent_users: List[AdminRecentUserItem] = []


class CategoryStatDetail(BaseModel):
    category_key: str
    label: str
    active: int
    inactive: int
    total: int


class AdminDashboardResponse(BaseModel):
    categories: Dict[str, CategoryStatDetail]
    total_master_items: int
    total_active_items: int
    total_inactive_items: int
    total_patients: int
    total_consultations: int
    total_doctors: int
    total_staff: int
    active_users: int
    inactive_users: int
    active_medicines: int
    active_symptoms: int
    active_diagnostic_tests: int
    active_neuro_exams: int
    active_follow_ups: int
    recent_activity: AdminRecentActivity


# Doctor Dashboard Models
class DoctorTodayConsultationItem(BaseModel):
    consultation_id: str
    patient_id: str
    patient_name: str
    consultation_date: Optional[str] = None
    bp_formatted: Optional[str] = None
    pulse_rate: Optional[str] = None
    has_report: bool = False
    prescriptions_count: int = 0
    symptoms: List[str] = []
    patient_state: str = "Stable"


class DoctorRecentPatientItem(BaseModel):
    patient_id: str
    full_name: str
    age: int
    gender: str
    created_at: Optional[str] = None


class DoctorRecentConsultationItem(BaseModel):
    consultation_id: str
    patient_id: str
    patient_name: str
    consultation_date: Optional[str] = None
    prescriptions_count: int = 0


class DoctorDashboardResponse(BaseModel):
    total_patients: int
    total_consultations: int
    today_consultations_count: int
    today_consultations: List[DoctorTodayConsultationItem] = []
    recent_patients: List[DoctorRecentPatientItem] = []
    recent_consultations: List[DoctorRecentConsultationItem] = []


# Staff Dashboard Models
class StaffPatientItem(BaseModel):
    patient_id: str
    full_name: str
    age: int
    gender: str
    mobile_number: Optional[str] = None
    created_at: Optional[str] = None


class StaffDashboardResponse(BaseModel):
    total_patients: int
    today_registered_count: int
    today_patients: List[StaffPatientItem] = []
    recent_patients: List[StaffPatientItem] = []
