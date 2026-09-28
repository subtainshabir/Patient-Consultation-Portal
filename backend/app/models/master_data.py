from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class Symptom(Base):
    __tablename__ = "symptoms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    category = Column(String(100), index=True, nullable=False, default="General")
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, index=True, nullable=False)
    sort_order = Column(Integer, default=0, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_by = relationship("User", foreign_keys=[created_by_id])

    def __repr__(self) -> str:
        return f"<Symptom id={self.id} name='{self.name}' category='{self.category}'>"


class PatientState(Base):
    __tablename__ = "patient_states"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    description = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, index=True, nullable=False)
    sort_order = Column(Integer, default=0, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_by = relationship("User", foreign_keys=[created_by_id])

    def __repr__(self) -> str:
        return f"<PatientState id={self.id} name='{self.name}'>"


class NeurologicalExamOption(Base):
    __tablename__ = "neurological_exam_options"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(100), index=True, nullable=False)  # e.g., Motor Functions, Cranial Nerves, Reflexes
    item_name = Column(String(150), index=True, nullable=True)  # e.g., Right Upper Limb, CN VII - Facial
    name = Column(String(255), index=True, nullable=False)       # e.g., Normal, 5/5, Spastic, Flexor
    description = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, index=True, nullable=False)
    sort_order = Column(Integer, default=0, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_by = relationship("User", foreign_keys=[created_by_id])

    def __repr__(self) -> str:
        return f"<NeurologicalExamOption id={self.id} category='{self.category}' item='{self.item_name}' name='{self.name}'>"


class DiagnosticTest(Base):
    __tablename__ = "diagnostic_tests"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    category = Column(String(100), index=True, nullable=False, default="General")  # Imaging, Electrophysiology, Laboratory
    description = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, index=True, nullable=False)
    sort_order = Column(Integer, default=0, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_by = relationship("User", foreign_keys=[created_by_id])

    def __repr__(self) -> str:
        return f"<DiagnosticTest id={self.id} name='{self.name}' category='{self.category}'>"


class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)         # Trade / Brand Name
    generic_name = Column(String(255), index=True, nullable=True)  # Generic Active Ingredient
    strength = Column(String(100), nullable=True)                 # e.g., 500mg, 10mg
    form = Column(String(100), nullable=False, default="Tablet")  # Tablet, Capsule, Syrup, Injection, etc.
    description = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, index=True, nullable=False)
    sort_order = Column(Integer, default=0, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_by = relationship("User", foreign_keys=[created_by_id])

    def __repr__(self) -> str:
        return f"<Medicine id={self.id} name='{self.name}' form='{self.form}'>"


class MedicineFrequency(Base):
    __tablename__ = "medicine_frequencies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True, nullable=False)        # Short code or English name
    urdu_label = Column(String(255), nullable=False)              # e.g. صبح و شام
    roman_urdu = Column(String(255), nullable=True)               # e.g. Subah aur Sham
    description = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, index=True, nullable=False)
    sort_order = Column(Integer, default=0, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_by = relationship("User", foreign_keys=[created_by_id])

    def __repr__(self) -> str:
        return f"<MedicineFrequency id={self.id} name='{self.name}' urdu='{self.urdu_label}'>"


class MedicineDosage(Base):
    __tablename__ = "medicine_dosages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True, nullable=False)        # e.g., 1, 1/2, 1/4, 2
    urdu_label = Column(String(255), nullable=True)               # e.g., ایک, آدھی
    description = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, index=True, nullable=False)
    sort_order = Column(Integer, default=0, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_by = relationship("User", foreign_keys=[created_by_id])

    def __repr__(self) -> str:
        return f"<MedicineDosage id={self.id} name='{self.name}' urdu='{self.urdu_label}'>"


class MedicineInstruction(Base):
    __tablename__ = "medicine_instructions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)        # e.g. After meals, Before meals
    urdu_label = Column(String(255), nullable=False)              # e.g. کھانے کے بعد, خالی پیٹ
    description = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, index=True, nullable=False)
    sort_order = Column(Integer, default=0, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_by = relationship("User", foreign_keys=[created_by_id])

    def __repr__(self) -> str:
        return f"<MedicineInstruction id={self.id} name='{self.name}' urdu='{self.urdu_label}'>"


class FollowUpOption(Base):
    __tablename__ = "follow_up_options"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)        # e.g. 1 week later, 2 weeks later
    urdu_label = Column(String(255), nullable=False)              # e.g. 1 ہفتے بعد
    description = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, index=True, nullable=False)
    sort_order = Column(Integer, default=0, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_by = relationship("User", foreign_keys=[created_by_id])

    def __repr__(self) -> str:
        return f"<FollowUpOption id={self.id} name='{self.name}' urdu='{self.urdu_label}'>"
