from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.schemas.patient import PatientResponse


class ConsultationVitalsBase(BaseModel):
    systolic_bp: Optional[int] = Field(None, ge=40, le=300, description="Systolic blood pressure in mmHg")
    diastolic_bp: Optional[int] = Field(None, ge=20, le=200, description="Diastolic blood pressure in mmHg")
    pulse_rate: Optional[int] = Field(None, ge=20, le=250, description="Pulse rate in beats per minute (bpm)")
    temperature: Optional[float] = Field(None, ge=25.0, le=45.0, description="Body temperature in Celsius (°C)")
    oxygen_saturation: Optional[int] = Field(None, ge=40, le=100, description="SpO2 percentage (%)")
    nihss_score: Optional[int] = Field(None, ge=0, le=42, description="NIH Stroke Scale score (0-42)")
    fall_risk_status: Optional[str] = Field(None, description="Done | Not Done")
    fall_risk_notes: Optional[str] = Field(None, max_length=500)

    # Extensible future vitals fields
    respiratory_rate: Optional[int] = Field(None, ge=5, le=80, description="Breaths per minute")
    weight_kg: Optional[float] = Field(None, ge=0.5, le=500.0, description="Weight in kilograms")
    height_cm: Optional[float] = Field(None, ge=20.0, le=300.0, description="Height in centimeters")
    bmi: Optional[float] = Field(None, ge=5.0, le=100.0, description="Body Mass Index")
    blood_glucose: Optional[float] = Field(None, ge=10.0, le=1000.0, description="Blood glucose mg/dL")

    @field_validator("fall_risk_status")
    @classmethod
    def validate_fall_risk_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v.strip():
            cleaned = v.strip()
            if cleaned not in ["Done", "Not Done"]:
                raise ValueError("Fall risk status must be 'Done' or 'Not Done'")
            return cleaned
        return None


class ConsultationVitalsCreate(ConsultationVitalsBase):
    pass


class ConsultationVitalsResponse(ConsultationVitalsBase):
    id: int
    consultation_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConsultationSymptomBase(BaseModel):
    symptom_id: Optional[int] = None
    symptom_name: str = Field(..., min_length=1, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=500)
    sort_order: int = 0


class ConsultationSymptomCreate(ConsultationSymptomBase):
    pass


class ConsultationSymptomResponse(ConsultationSymptomBase):
    id: int
    consultation_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConsultationExaminationBase(BaseModel):
    category: str = Field(..., min_length=1, max_length=100)
    item_name: str = Field(..., min_length=1, max_length=100)
    finding: Optional[str] = Field(None, max_length=255)
    finding_id: Optional[int] = None
    status: Optional[str] = Field("Done", max_length=20)
    observation: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v and v.strip():
            cleaned = v.strip()
            if cleaned not in ["Done", "Not Done"]:
                return "Done"
            return cleaned
        return "Done"


class ConsultationExaminationCreate(ConsultationExaminationBase):
    pass


class ConsultationExaminationResponse(ConsultationExaminationBase):
    id: int
    consultation_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConsultationCreate(BaseModel):
    patient_id: str = Field(..., description="Patient ID (DRN-XXXXXX or integer ID)")
    patient_state_id: Optional[int] = None
    patient_state_name: Optional[str] = None
    symptom_notes: Optional[str] = Field(None, description="Clinical notes for symptoms")
    power_text: Optional[str] = Field(None, max_length=255, description="Power text field requested by doctor")
    mmse_score: Optional[int] = Field(None, ge=0, le=30, description="Mini-Mental State Examination score (0-30)")
    gcs_score: Optional[int] = Field(None, ge=3, le=15, description="Glasgow Coma Scale score (3-15)")
    additional_observations: Optional[str] = Field(None, description="General examination observations")

    vitals: Optional[ConsultationVitalsCreate] = None
    symptoms: Optional[List[ConsultationSymptomCreate]] = Field(default_factory=list)
    examinations: Optional[List[ConsultationExaminationCreate]] = Field(default_factory=list)


class ConsultationResponse(BaseModel):
    id: int
    consultation_id: str
    patient_id: int
    doctor_id: Optional[int]
    consultation_date: datetime
    patient_state_id: Optional[int]
    patient_state_name: Optional[str]
    symptom_notes: Optional[str]
    power_text: Optional[str]
    mmse_score: Optional[int]
    gcs_score: Optional[int]
    additional_observations: Optional[str]
    created_at: datetime
    updated_at: datetime

    patient: Optional[PatientResponse] = None
    vitals: Optional[ConsultationVitalsResponse] = None
    symptoms: List[ConsultationSymptomResponse] = []
    examinations: List[ConsultationExaminationResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ConsultationSummaryResponse(BaseModel):
    id: int
    consultation_id: str
    patient_id: int
    patient_unique_id: str
    patient_name: str
    consultation_date: datetime
    patient_state_name: Optional[str] = None
    symptom_count: int = 0
    mmse_score: Optional[int] = None
    gcs_score: Optional[int] = None
    has_vitals: bool = False
    bp_formatted: Optional[str] = None
    pulse_rate: Optional[int] = None
    temperature: Optional[float] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConsultationListResponse(BaseModel):
    items: List[ConsultationSummaryResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ServerDateResponse(BaseModel):
    server_date: str
    formatted_date: str
    iso_timestamp: str
