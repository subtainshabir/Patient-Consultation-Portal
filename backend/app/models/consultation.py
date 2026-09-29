import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    DateTime,
    Date,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import relationship
from app.db.base import Base


class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(Integer, primary_key=True, index=True)
    # Permanent human-friendly unique ID, e.g. CNS-20260929-0001
    consultation_id = Column(String(35), unique=True, index=True, nullable=False)

    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

    # Server-determined consultation timestamp
    consultation_date = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    # Patient clinical state (Phase 3 Master Data)
    patient_state_id = Column(Integer, ForeignKey("patient_states.id"), nullable=True)
    patient_state_name = Column(String(255), nullable=True)

    # Symptom Details / Clinical Notes
    symptom_notes = Column(Text, nullable=True)

    # Separate Power field requested by doctor (Section 45)
    power_text = Column(String(255), nullable=True)

    # Mental Status Scores (Sections 47 & 48)
    mmse_score = Column(Integer, nullable=True)
    gcs_score = Column(Integer, nullable=True)

    # Additional observations (Section 46)
    additional_observations = Column(Text, nullable=True)

    # Phase 5 Clinical Assessment & Plan fields
    clinical_description = Column(Text, nullable=True)  # Overall Clinical Assessment
    additional_examination = Column(Text, nullable=True)  # Non-neurological / extra exam findings
    treatment_plan = Column(Text, nullable=True)  # Treatment plan documentation (no medicine rows)

    # Phase 7 Follow-Up Management fields
    follow_up_option_id = Column(Integer, ForeignKey("follow_up_options.id", ondelete="SET NULL"), nullable=True)
    follow_up_period = Column(String(255), nullable=True)
    follow_up_date = Column(Date, nullable=True, index=True)
    follow_up_instructions = Column(Text, nullable=True)
    follow_up_status = Column(String(50), nullable=True, default="No Follow-Up")

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

    # Relationships
    patient = relationship("Patient", backref="consultations")
    doctor = relationship("User", foreign_keys=[doctor_id])
    patient_state = relationship("PatientState", foreign_keys=[patient_state_id])
    follow_up_option = relationship("FollowUpOption", foreign_keys=[follow_up_option_id])

    vitals = relationship(
        "ConsultationVitals",
        back_populates="consultation",
        uselist=False,
        cascade="all, delete-orphan",
    )
    symptoms = relationship(
        "ConsultationSymptom",
        back_populates="consultation",
        cascade="all, delete-orphan",
        order_by="ConsultationSymptom.sort_order",
    )
    examinations = relationship(
        "ConsultationExamination",
        back_populates="consultation",
        cascade="all, delete-orphan",
    )
    diagnostic_tests = relationship(
        "ConsultationDiagnosticTest",
        back_populates="consultation",
        cascade="all, delete-orphan",
        order_by="ConsultationDiagnosticTest.id",
    )
    prescriptions = relationship(
        "PrescriptionItem",
        back_populates="consultation",
        cascade="all, delete-orphan",
        order_by="PrescriptionItem.sort_order",
    )

    def __repr__(self) -> str:
        return f"<Consultation id={self.id} consultation_id='{self.consultation_id}' patient_id={self.patient_id}>"


class ConsultationVitals(Base):
    __tablename__ = "consultation_vitals"

    id = Column(Integer, primary_key=True, index=True)
    consultation_id = Column(
        Integer,
        ForeignKey("consultations.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    # Blood Pressure
    systolic_bp = Column(Integer, nullable=True)
    diastolic_bp = Column(Integer, nullable=True)

    # Vitals measurements
    pulse_rate = Column(Integer, nullable=True)
    temperature = Column(Float, nullable=True)  # in °C
    oxygen_saturation = Column(Integer, nullable=True)  # in %
    nihss_score = Column(Integer, nullable=True)

    # Fall Risk Assessment
    fall_risk_status = Column(String(30), nullable=True)  # "Done" | "Not Done"
    fall_risk_notes = Column(String(500), nullable=True)

    # Extensible future vital fields (Section 12)
    respiratory_rate = Column(Integer, nullable=True)
    weight_kg = Column(Float, nullable=True)
    height_cm = Column(Float, nullable=True)
    bmi = Column(Float, nullable=True)
    blood_glucose = Column(Float, nullable=True)

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

    consultation = relationship("Consultation", back_populates="vitals")

    def __repr__(self) -> str:
        return f"<ConsultationVitals id={self.id} consultation_id={self.consultation_id} BP={self.systolic_bp}/{self.diastolic_bp}>"


class ConsultationSymptom(Base):
    __tablename__ = "consultation_symptoms"

    id = Column(Integer, primary_key=True, index=True)
    consultation_id = Column(
        Integer,
        ForeignKey("consultations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    symptom_id = Column(Integer, ForeignKey("symptoms.id"), nullable=True, index=True)
    symptom_name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=True)
    notes = Column(String(500), nullable=True)
    sort_order = Column(Integer, default=0, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    consultation = relationship("Consultation", back_populates="symptoms")
    symptom = relationship("Symptom", foreign_keys=[symptom_id])

    def __repr__(self) -> str:
        return f"<ConsultationSymptom id={self.id} consultation_id={self.consultation_id} name='{self.symptom_name}'>"


class ConsultationExamination(Base):
    __tablename__ = "consultation_examinations"

    id = Column(Integer, primary_key=True, index=True)
    consultation_id = Column(
        Integer,
        ForeignKey("consultations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Categories: "Motor Examination", "Reflexes", "Cranial Nerves", "Sensory Examination",
    # "Coordination", "Gait & Balance", "Mental Status", "Special Tests", "Eye Examination", "Other"
    category = Column(String(100), nullable=False, index=True)
    item_name = Column(String(100), nullable=False, index=True)

    # Finding value from Master Data or custom
    finding = Column(String(255), nullable=True)
    finding_id = Column(Integer, ForeignKey("neurological_exam_options.id"), nullable=True)

    # Status: "Done" | "Not Done"
    status = Column(String(20), default="Done", nullable=True)

    # Optional clinical observation/notes for this specific exam item
    observation = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    consultation = relationship("Consultation", back_populates="examinations")
    exam_option = relationship("NeurologicalExamOption", foreign_keys=[finding_id])

    __table_args__ = (
        Index("ix_consult_exam_cat_item", "consultation_id", "category", "item_name"),
    )

    def __repr__(self) -> str:
        return f"<ConsultationExamination id={self.id} category='{self.category}' item='{self.item_name}' finding='{self.finding}'>"


class ConsultationDiagnosticTest(Base):
    __tablename__ = "consultation_diagnostic_tests"

    id = Column(Integer, primary_key=True, index=True)
    consultation_id = Column(
        Integer,
        ForeignKey("consultations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    diagnostic_test_id = Column(
        Integer,
        ForeignKey("diagnostic_tests.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    test_name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=True)

    # Status: "Ordered" | "Pending" | "Completed" | "Reviewed"
    status = Column(String(50), default="Ordered", nullable=False)

    clinical_indication = Column(String(500), nullable=True)
    result = Column(Text, nullable=True)
    result_date = Column(DateTime(timezone=True), nullable=True)
    doctor_notes = Column(Text, nullable=True)

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

    consultation = relationship("Consultation", back_populates="diagnostic_tests")
    diagnostic_test = relationship("DiagnosticTest", foreign_keys=[diagnostic_test_id])

    def __repr__(self) -> str:
        return f"<ConsultationDiagnosticTest id={self.id} consultation_id={self.consultation_id} test='{self.test_name}' status='{self.status}'>"


class PrescriptionItem(Base):
    __tablename__ = "prescription_items"

    id = Column(Integer, primary_key=True, index=True)
    consultation_id = Column(
        Integer,
        ForeignKey("consultations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    medicine_id = Column(
        Integer,
        ForeignKey("medicines.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    medicine_name = Column(String(255), nullable=False)

    frequency_id = Column(
        Integer,
        ForeignKey("medicine_frequencies.id", ondelete="SET NULL"),
        nullable=True,
    )
    frequency_name = Column(String(255), nullable=False)  # Urdu / English frequency wording

    dosage = Column(String(100), nullable=False)  # e.g., "1 tablet", "½ tablet", "1 capsule"
    duration_days = Column(Integer, nullable=False)  # Duration in days, e.g. 7, 30

    instruction_id = Column(
        Integer,
        ForeignKey("medicine_instructions.id", ondelete="SET NULL"),
        nullable=True,
    )
    instruction_name = Column(String(255), nullable=True)  # Urdu / English instruction wording
    custom_instruction = Column(Text, nullable=True)  # Additional specific instructions

    sort_order = Column(Integer, default=0, nullable=False)

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

    consultation = relationship("Consultation", back_populates="prescriptions")
    medicine = relationship("Medicine", foreign_keys=[medicine_id])
    frequency = relationship("MedicineFrequency", foreign_keys=[frequency_id])
    instruction = relationship("MedicineInstruction", foreign_keys=[instruction_id])

    def __repr__(self) -> str:
        return f"<PrescriptionItem id={self.id} consultation_id={self.consultation_id} medicine='{self.medicine_name}' dosage='{self.dosage}' duration={self.duration_days}>"


