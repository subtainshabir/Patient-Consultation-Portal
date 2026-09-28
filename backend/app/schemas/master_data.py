from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


# -------------------------------------------------------------
# Base Schemas
# -------------------------------------------------------------
class MasterDataBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    sort_order: int = Field(0, ge=0)
    is_active: bool = True


class MasterDataStatusUpdate(BaseModel):
    is_active: bool


# -------------------------------------------------------------
# 1. Symptom Schemas
# -------------------------------------------------------------
class SymptomBase(MasterDataBase):
    category: str = Field("General", max_length=100)


class SymptomCreate(SymptomBase):
    pass


class SymptomUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    sort_order: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None


class SymptomResponse(SymptomBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class SymptomListResponse(BaseModel):
    items: List[SymptomResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# -------------------------------------------------------------
# 2. Patient State Schemas
# -------------------------------------------------------------
class PatientStateBase(MasterDataBase):
    pass


class PatientStateCreate(PatientStateBase):
    pass


class PatientStateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    sort_order: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None


class PatientStateResponse(PatientStateBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class PatientStateListResponse(BaseModel):
    items: List[PatientStateResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# -------------------------------------------------------------
# 3. Neurological Examination Option Schemas
# -------------------------------------------------------------
class NeurologicalExamOptionBase(MasterDataBase):
    category: str = Field(..., min_length=1, max_length=100)
    item_name: Optional[str] = Field(None, max_length=150)


class NeurologicalExamOptionCreate(NeurologicalExamOptionBase):
    pass


class NeurologicalExamOptionUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    item_name: Optional[str] = Field(None, max_length=150)
    description: Optional[str] = Field(None, max_length=500)
    sort_order: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None


class NeurologicalExamOptionResponse(NeurologicalExamOptionBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class NeurologicalExamOptionListResponse(BaseModel):
    items: List[NeurologicalExamOptionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# -------------------------------------------------------------
# 4. Diagnostic Test Schemas
# -------------------------------------------------------------
class DiagnosticTestBase(MasterDataBase):
    category: str = Field("General", max_length=100)


class DiagnosticTestCreate(DiagnosticTestBase):
    pass


class DiagnosticTestUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    sort_order: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None


class DiagnosticTestResponse(DiagnosticTestBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class DiagnosticTestListResponse(BaseModel):
    items: List[DiagnosticTestResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# -------------------------------------------------------------
# 5. Medicine Schemas
# -------------------------------------------------------------
class MedicineBase(MasterDataBase):
    generic_name: Optional[str] = Field(None, max_length=255)
    strength: Optional[str] = Field(None, max_length=100)
    form: str = Field("Tablet", max_length=100)


class MedicineCreate(MedicineBase):
    pass


class MedicineUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    generic_name: Optional[str] = Field(None, max_length=255)
    strength: Optional[str] = Field(None, max_length=100)
    form: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    sort_order: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None


class MedicineResponse(MedicineBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class MedicineListResponse(BaseModel):
    items: List[MedicineResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# -------------------------------------------------------------
# 6. Medicine Frequency Schemas
# -------------------------------------------------------------
class MedicineFrequencyBase(MasterDataBase):
    urdu_label: str = Field(..., min_length=1, max_length=255)
    roman_urdu: Optional[str] = Field(None, max_length=255)


class MedicineFrequencyCreate(MedicineFrequencyBase):
    pass


class MedicineFrequencyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    urdu_label: Optional[str] = Field(None, min_length=1, max_length=255)
    roman_urdu: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    sort_order: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None


class MedicineFrequencyResponse(MedicineFrequencyBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class MedicineFrequencyListResponse(BaseModel):
    items: List[MedicineFrequencyResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# -------------------------------------------------------------
# 7. Medicine Dosage Schemas
# -------------------------------------------------------------
class MedicineDosageBase(MasterDataBase):
    urdu_label: Optional[str] = Field(None, max_length=255)


class MedicineDosageCreate(MedicineDosageBase):
    pass


class MedicineDosageUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    urdu_label: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    sort_order: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None


class MedicineDosageResponse(MedicineDosageBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class MedicineDosageListResponse(BaseModel):
    items: List[MedicineDosageResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# -------------------------------------------------------------
# 8. Medicine Instruction Schemas
# -------------------------------------------------------------
class MedicineInstructionBase(MasterDataBase):
    urdu_label: str = Field(..., min_length=1, max_length=255)


class MedicineInstructionCreate(MedicineInstructionBase):
    pass


class MedicineInstructionUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    urdu_label: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    sort_order: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None


class MedicineInstructionResponse(MedicineInstructionBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class MedicineInstructionListResponse(BaseModel):
    items: List[MedicineInstructionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# -------------------------------------------------------------
# 9. Follow-Up Option Schemas
# -------------------------------------------------------------
class FollowUpOptionBase(MasterDataBase):
    urdu_label: str = Field(..., min_length=1, max_length=255)


class FollowUpOptionCreate(FollowUpOptionBase):
    pass


class FollowUpOptionUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    urdu_label: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    sort_order: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None


class FollowUpOptionResponse(FollowUpOptionBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class FollowUpOptionListResponse(BaseModel):
    items: List[FollowUpOptionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
