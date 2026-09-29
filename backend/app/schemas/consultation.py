from datetime import datetime, date, timezone
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
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


class ConsultationDiagnosticTestBase(BaseModel):
    diagnostic_test_id: Optional[int] = None
    test_name: str = Field(..., min_length=1, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    status: str = Field("Ordered", max_length=50, description="Ordered | Pending | Completed | Reviewed")
    clinical_indication: Optional[str] = Field(None, max_length=500)
    result: Optional[str] = None
    result_date: Optional[datetime] = None
    doctor_notes: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_test_status(cls, v: Optional[str]) -> str:
        valid_statuses = ["Ordered", "Pending", "Completed", "Reviewed"]
        if v and v.strip():
            cleaned = v.strip().capitalize()
            # Match case-insensitively
            for s in valid_statuses:
                if s.lower() == v.strip().lower():
                    return s
            raise ValueError(f"Status must be one of: {', '.join(valid_statuses)}")
        return "Ordered"


class ConsultationDiagnosticTestCreate(ConsultationDiagnosticTestBase):
    pass


class ConsultationDiagnosticTestResponse(ConsultationDiagnosticTestBase):
    id: int
    consultation_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PrescriptionItemBase(BaseModel):
    medicine_id: Optional[int] = None
    medicine_name: str = Field(..., min_length=1, max_length=255)
    frequency_id: Optional[int] = None
    frequency_name: str = Field(..., min_length=1, max_length=255)
    dosage: str = Field(..., min_length=1, max_length=100)
    duration_days: int = Field(..., gt=0, le=365, description="Duration in days (must be positive)")
    instruction_id: Optional[int] = None
    instruction_name: Optional[str] = Field(None, max_length=255)
    custom_instruction: Optional[str] = None
    sort_order: int = 0


class PrescriptionItemCreate(PrescriptionItemBase):
    pass


class PrescriptionItemResponse(PrescriptionItemBase):
    id: int
    consultation_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConsultationCreate(BaseModel):
    patient_id: str = Field(..., description="Patient ID (DRN-XXXXXX or integer ID)")
    consultation_date: Optional[datetime] = Field(None, description="Optional consultation timestamp (defaults to server current time)")
    patient_state_id: Optional[int] = None
    patient_state_name: Optional[str] = None
    symptom_notes: Optional[str] = Field(None, description="Clinical notes for symptoms")
    power_text: Optional[str] = Field(None, max_length=255, description="Power text field requested by doctor")
    mmse_score: Optional[int] = Field(None, ge=0, le=30, description="Mini-Mental State Examination score (0-30)")
    gcs_score: Optional[int] = Field(None, ge=3, le=15, description="Glasgow Coma Scale score (3-15)")
    additional_observations: Optional[str] = Field(None, description="General examination observations")

    # Phase 5 Clinical Assessment, Additional Examination & Treatment Plan
    clinical_description: Optional[str] = Field(None, description="Overall clinical assessment and impression")
    additional_examination: Optional[str] = Field(None, description="Findings outside structured neuro examination")
    treatment_plan: Optional[str] = Field(None, description="Non-pharmacological and clinical treatment plan")

    # Phase 7 Follow-Up Management
    follow_up_option_id: Optional[int] = None
    follow_up_period: Optional[str] = Field(None, max_length=255, description="Follow-up period description, e.g. 1 week later / 1 ہفتے بعد")
    follow_up_date: Optional[date] = Field(None, description="Exact follow-up date (YYYY-MM-DD)")
    follow_up_instructions: Optional[str] = Field(None, description="Follow-up instructions or notes")

    vitals: Optional[ConsultationVitalsCreate] = None
    symptoms: Optional[List[ConsultationSymptomCreate]] = Field(default_factory=list)
    examinations: Optional[List[ConsultationExaminationCreate]] = Field(default_factory=list)
    diagnostic_tests: Optional[List[ConsultationDiagnosticTestCreate]] = Field(default_factory=list)
    prescriptions: Optional[List[PrescriptionItemCreate]] = Field(default_factory=list)


class ConsultationUpdate(ConsultationCreate):
    pass


class ConsultationReportResponse(BaseModel):
    id: int
    report_id: str
    consultation_id: int
    patient_id: int
    file_name: str
    storage_path: str
    document_type: str = "Prescription Report"
    file_size: int = 0
    version: int = 1
    is_latest: bool = True
    generated_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    download_url: Optional[str] = None
    preview_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


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

    # Phase 5 fields
    clinical_description: Optional[str] = None
    additional_examination: Optional[str] = None
    treatment_plan: Optional[str] = None

    # Phase 7 Follow-Up fields
    follow_up_option_id: Optional[int] = None
    follow_up_period: Optional[str] = None
    follow_up_date: Optional[date] = None
    follow_up_instructions: Optional[str] = None
    follow_up_status: Optional[str] = None

    created_at: datetime
    updated_at: datetime

    patient: Optional[PatientResponse] = None
    vitals: Optional[ConsultationVitalsResponse] = None
    symptoms: List[ConsultationSymptomResponse] = []
    examinations: List[ConsultationExaminationResponse] = []
    diagnostic_tests: List[ConsultationDiagnosticTestResponse] = []
    prescriptions: List[PrescriptionItemResponse] = []
    reports: List[ConsultationReportResponse] = []
    latest_report: Optional[ConsultationReportResponse] = None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def populate_latest_report(self):
        if self.reports and not self.latest_report:
            latest = next((r for r in self.reports if r.is_latest), self.reports[0])
            self.latest_report = latest
        return self


class ConsultationSummaryResponse(BaseModel):
    id: int
    consultation_id: str
    patient_id: int
    patient_unique_id: str
    patient_name: str
    consultation_date: datetime
    patient_state_name: Optional[str] = None
    symptom_count: int = 0
    diagnostic_test_count: int = 0
    prescription_count: int = 0
    mmse_score: Optional[int] = None
    gcs_score: Optional[int] = None
    has_vitals: bool = False
    bp_formatted: Optional[str] = None
    pulse_rate: Optional[int] = None
    temperature: Optional[float] = None
    follow_up_period: Optional[str] = None
    follow_up_date: Optional[date] = None
    follow_up_instructions: Optional[str] = None
    follow_up_status: Optional[str] = None
    symptoms_summary: List[str] = []
    has_report: bool = False
    latest_report_id: Optional[str] = None
    latest_report_version: Optional[int] = None
    latest_report_file_name: Optional[str] = None
    latest_report_created_at: Optional[datetime] = None
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
