import re
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator, ConfigDict
from app.models.patient import Gender


CNIC_REGEX = re.compile(r"^\d{5}-?\d{7}-?\d{1}$")
MOBILE_REGEX = re.compile(r"^(\+92|0)?3\d{2}-?\d{7}$|^(\+?\d{10,15})$")


class PatientBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255, description="Patient's full name")
    age: int = Field(..., ge=0, le=130, description="Age in years (0 to 130)")
    gender: Gender = Field(..., description="Gender")
    mobile_number: str = Field(..., min_length=10, max_length=30, description="Contact mobile number")
    cnic: Optional[str] = Field(None, max_length=30, description="Pakistani CNIC (optional)")

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Full Name cannot be empty or contain only whitespace.")
        if len(clean) < 2:
            raise ValueError("Full Name must be at least 2 characters.")
        return clean

    @field_validator("mobile_number")
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        clean = v.strip().replace(" ", "").replace("-", "")
        if not clean:
            raise ValueError("Mobile number is required.")
        # Check general length and numeric composition
        digits = re.sub(r"[^\d]", "", clean)
        if len(digits) < 10 or len(digits) > 15:
            raise ValueError("Mobile number must contain between 10 and 15 digits.")
        # Standardize Pakistani mobile numbers (e.g. 03001234567 or 923001234567 -> 0300-1234567)
        if digits.startswith("923") and len(digits) == 12:
            digits = "0" + digits[2:]
        if len(digits) == 11 and digits.startswith("03"):
            return f"{digits[:4]}-{digits[4:]}"
        return v.strip()

    @field_validator("cnic")
    @classmethod
    def validate_cnic(cls, v: Optional[str]) -> Optional[str]:
        if not v or not v.strip():
            return None
        clean = v.strip()
        # Accept formatted 12345-1234567-1 or unformatted 13 digits
        digits_only = re.sub(r"[^\d]", "", clean)
        if len(digits_only) != 13:
            raise ValueError("CNIC must consist of 13 digits (format: XXXXX-XXXXXXX-X).")
        # Format consistently as XXXXX-XXXXXXX-X
        return f"{digits_only[:5]}-{digits_only[5:12]}-{digits_only[12:]}"


class PatientCreate(PatientBase):
    confirm_duplicate: bool = Field(False, description="Flag to force creation if duplicate warning triggered")


class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = Field(None, ge=0, le=130)
    gender: Optional[Gender] = None
    mobile_number: Optional[str] = None
    cnic: Optional[str] = None

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        clean = v.strip()
        if not clean:
            raise ValueError("Full Name cannot be empty or contain only whitespace.")
        if len(clean) < 2:
            raise ValueError("Full Name must be at least 2 characters.")
        return clean

    @field_validator("mobile_number")
    @classmethod
    def validate_mobile(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        clean = v.strip().replace(" ", "").replace("-", "")
        if not clean:
            raise ValueError("Mobile number cannot be empty.")
        digits = re.sub(r"[^\d]", "", clean)
        if len(digits) < 10 or len(digits) > 15:
            raise ValueError("Mobile number must contain between 10 and 15 digits.")
        if digits.startswith("923") and len(digits) == 12:
            digits = "0" + digits[2:]
        if len(digits) == 11 and digits.startswith("03"):
            return f"{digits[:4]}-{digits[4:]}"
        return v.strip()

    @field_validator("cnic")
    @classmethod
    def validate_cnic(cls, v: Optional[str]) -> Optional[str]:
        if not v or not v.strip():
            return None
        digits_only = re.sub(r"[^\d]", "", v.strip())
        if len(digits_only) != 13:
            raise ValueError("CNIC must consist of 13 digits (format: XXXXX-XXXXXXX-X).")
        return f"{digits_only[:5]}-{digits_only[5:12]}-{digits_only[12:]}"


class PatientStatusUpdate(BaseModel):
    is_active: bool


class PatientResponse(PatientBase):
    patient_id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PatientListResponse(BaseModel):
    items: List[PatientResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class DuplicatePatientWarning(BaseModel):
    is_duplicate: bool = True
    message: str
    existing_patient: PatientResponse
