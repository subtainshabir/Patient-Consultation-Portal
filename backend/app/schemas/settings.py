from datetime import datetime
from typing import Optional, Dict
from pydantic import BaseModel, Field, ConfigDict


class ClinicSettingBase(BaseModel):
    doctor_name: str = Field(..., min_length=1, max_length=255)
    doctor_name_urdu: Optional[str] = Field(None, max_length=255)
    doctor_title: str = Field("Dr.", max_length=100)
    specialization: str = Field(..., min_length=1, max_length=255)
    specialization_urdu: Optional[str] = Field(None, max_length=255)
    qualifications: str = Field(..., min_length=1, max_length=255)
    registration_no: Optional[str] = Field(None, max_length=100)

    clinic_name: str = Field(..., min_length=1, max_length=255)
    clinic_name_urdu: Optional[str] = Field(None, max_length=255)
    clinic_subtitle: Optional[str] = Field(None, max_length=255)
    clinic_phone: str = Field(..., min_length=1, max_length=100)
    clinic_email: str = Field(..., min_length=1, max_length=255)
    clinic_address: str = Field(..., min_length=1, max_length=500)


class ClinicSettingUpdate(BaseModel):
    doctor_name: Optional[str] = Field(None, min_length=1, max_length=255)
    doctor_name_urdu: Optional[str] = Field(None, max_length=255)
    doctor_title: Optional[str] = Field(None, max_length=100)
    specialization: Optional[str] = Field(None, min_length=1, max_length=255)
    specialization_urdu: Optional[str] = Field(None, max_length=255)
    qualifications: Optional[str] = Field(None, min_length=1, max_length=255)
    registration_no: Optional[str] = Field(None, max_length=100)

    clinic_name: Optional[str] = Field(None, min_length=1, max_length=255)
    clinic_name_urdu: Optional[str] = Field(None, max_length=255)
    clinic_subtitle: Optional[str] = Field(None, max_length=255)
    clinic_phone: Optional[str] = Field(None, min_length=1, max_length=100)
    clinic_email: Optional[str] = Field(None, min_length=1, max_length=255)
    clinic_address: Optional[str] = Field(None, min_length=1, max_length=500)


class ClinicSettingResponse(ClinicSettingBase):
    id: int
    logo_path: Optional[str] = None
    has_logo: bool = False
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class CategoryStatItem(BaseModel):
    category_key: str
    label: str
    active: int
    inactive: int
    total: int


class AdminDashboardStatsResponse(BaseModel):
    categories: Dict[str, CategoryStatItem]
    total_master_items: int
    total_active_items: int
    total_inactive_items: int
    total_patients: int
    total_consultations: int
