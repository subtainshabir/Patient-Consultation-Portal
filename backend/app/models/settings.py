from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.db.base import Base


class ClinicSetting(Base):
    __tablename__ = "clinic_settings"

    id = Column(Integer, primary_key=True, index=True)
    
    # Doctor Information
    doctor_name = Column(String(255), nullable=False, default="Dr. Abdul Rauf")
    doctor_name_urdu = Column(String(255), nullable=True, default="ڈاکٹر عبد الرؤف")
    doctor_title = Column(String(100), nullable=False, default="Dr.")
    specialization = Column(String(255), nullable=False, default="Consultant Neurologist")
    specialization_urdu = Column(String(255), nullable=True, default="کنسلٹنٹ نیورولوجسٹ")
    qualifications = Column(String(255), nullable=False, default="MBBS, FCPS (Neurology)")
    registration_no = Column(String(100), nullable=True, default="PMC 45892-P")

    # Clinic Information
    clinic_name = Column(String(255), nullable=False, default="Dr. Rauf Neurology Clinic")
    clinic_name_urdu = Column(String(255), nullable=True, default="ڈاکٹر رؤف نیورولوجی کلینک")
    clinic_subtitle = Column(String(255), nullable=True, default="NEUROLOGY & BRAIN CARE CENTER")
    clinic_phone = Column(String(100), nullable=False, default="0300-1234567")
    clinic_email = Column(String(255), nullable=False, default="drrauf.clinic@gmail.com")
    clinic_address = Column(String(500), nullable=False, default="Lahore, Pakistan")
    
    # Logo Path
    logo_path = Column(String(500), nullable=True)

    # Standard audit timestamps
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<ClinicSetting id={self.id} clinic='{self.clinic_name}' doctor='{self.doctor_name}'>"
