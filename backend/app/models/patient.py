import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class Gender(str, enum.Enum):
    MALE = "Male"
    FEMALE = "Female"
    OTHER = "Other"
    PREFER_NOT_TO_SAY = "Prefer not to specify"


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    # Permanent human-friendly unique ID, e.g. DRN-000001
    patient_id = Column(String(20), unique=True, index=True, nullable=False)
    
    full_name = Column(String(255), index=True, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(Enum(Gender), nullable=False)
    mobile_number = Column(String(50), index=True, nullable=False)
    cnic = Column(String(30), index=True, nullable=True)
    
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    
    # Audit tracking
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationship to user who created the record
    created_by = relationship("User", foreign_keys=[created_by_id])

    def __repr__(self) -> str:
        return f"<Patient id={self.id} patient_id={self.patient_id} name='{self.full_name}'>"
