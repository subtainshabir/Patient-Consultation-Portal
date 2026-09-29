from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    PROJECT_NAME: str = "Dr. Rauf Neurology — Patient Consultation Portal"
    ENVIRONMENT: str = "development"
    API_PREFIX: str = "/api"

    # Security
    SECRET_KEY: str = "dev_secret_key_dr_rauf_neurology_portal_2026_super_secure"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/dr_rauf_neurology"
    USE_SQLITE_DEV_FALLBACK: bool = True
    SQLITE_DB_PATH: str = "./dr_rauf_dev.db"

    # Report & PDF Storage Settings (Phase 8)
    REPORT_STORAGE_PATH: str = "./storage/reports"

    # Clinic & Doctor Configuration (Clean abstraction for Phase 9)
    CLINIC_NAME: str = "Dr. Rauf Neurology Clinic"
    CLINIC_NAME_URDU: str = "ڈاکٹر رؤف نیورولوجی کلینک"
    CLINIC_SUBTITLE: str = "NEUROLOGY & BRAIN CARE CENTER"
    CLINIC_PHONE: str = "0300-1234567"
    CLINIC_EMAIL: str = "drrauf.clinic@gmail.com"
    CLINIC_ADDRESS: str = "Lahore, Pakistan"
    DOCTOR_NAME: str = "Dr. Abdul Rauf"
    DOCTOR_NAME_URDU: str = "ڈاکٹر عبد الرؤف"
    DOCTOR_SPECIALIZATION: str = "Consultant Neurologist"
    DOCTOR_SPECIALIZATION_URDU: str = "کنسلٹنٹ نیورولوجسٹ"
    DOCTOR_QUALIFICATIONS: str = "MBBS, FCPS (Neurology)"
    DOCTOR_REGISTRATION_NO: str = "PMC 45892-P"
    CLINIC_LOGO_PATH: str = ""

    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)


settings = Settings()
