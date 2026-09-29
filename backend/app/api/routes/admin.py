import os
import re
from math import ceil
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.api.deps import get_db, require_roles
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from app.schemas.user import (
    UserResponse,
    AdminCreateUserRequest,
    AdminUpdateUserRequest,
    AdminResetPasswordRequest,
    UserStatusUpdate,
)

from app.models.master_data import (
    Symptom,
    PatientState,
    NeurologicalExamOption,
    DiagnosticTest,
    Medicine,
    MedicineFrequency,
    MedicineDosage,
    MedicineInstruction,
    FollowUpOption,
)
from app.schemas.master_data import (
    MasterDataStatusUpdate,
    SymptomCreate,
    SymptomUpdate,
    SymptomResponse,
    SymptomListResponse,
    PatientStateCreate,
    PatientStateUpdate,
    PatientStateResponse,
    PatientStateListResponse,
    NeurologicalExamOptionCreate,
    NeurologicalExamOptionUpdate,
    NeurologicalExamOptionResponse,
    NeurologicalExamOptionListResponse,
    DiagnosticTestCreate,
    DiagnosticTestUpdate,
    DiagnosticTestResponse,
    DiagnosticTestListResponse,
    MedicineCreate,
    MedicineUpdate,
    MedicineResponse,
    MedicineListResponse,
    MedicineFrequencyCreate,
    MedicineFrequencyUpdate,
    MedicineFrequencyResponse,
    MedicineFrequencyListResponse,
    MedicineDosageCreate,
    MedicineDosageUpdate,
    MedicineDosageResponse,
    MedicineDosageListResponse,
    MedicineInstructionCreate,
    MedicineInstructionUpdate,
    MedicineInstructionResponse,
    MedicineInstructionListResponse,
    FollowUpOptionCreate,
    FollowUpOptionUpdate,
    FollowUpOptionResponse,
    FollowUpOptionListResponse,
)
from app.schemas.settings import (
    ClinicSettingUpdate,
    ClinicSettingResponse,
    AdminDashboardStatsResponse,
)
from app.services.master_data_service import (
    list_master_items,
    get_master_item,
    create_master_item,
    update_master_item,
    set_master_item_status,
)
from app.services.settings_service import (
    get_or_create_clinic_settings,
    update_clinic_settings,
    save_clinic_logo,
    get_admin_dashboard_stats,
)
from app.schemas.dashboard import AdminDashboardResponse
from app.services.dashboard_service import get_admin_dashboard_data

router = APIRouter(prefix="/admin", tags=["Admin Portal & Master Data Management"])

# Strict backend authorization dependency: ADMIN role ONLY
admin_only = require_roles([UserRole.ADMIN])


# =========================================================================
# 0. Admin Dashboard Statistics & Real-time Metrics
# =========================================================================
@router.get("/stats", response_model=AdminDashboardStatsResponse)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    stats = get_admin_dashboard_stats(db)
    return AdminDashboardStatsResponse(**stats)


@router.get("/dashboard", response_model=AdminDashboardResponse)
def get_admin_dashboard(
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    """
    Returns full system, master data, user management, and recent activity metrics
    specifically for the Administrator Dashboard.
    Strictly restricted to ADMIN users only (403 for DOCTOR or STAFF).
    """
    data = get_admin_dashboard_data(db)
    return AdminDashboardResponse(**data)


# =========================================================================
# 1. Doctor / Clinic Settings & Logo Management
# =========================================================================
@router.get("/settings", response_model=ClinicSettingResponse)
def get_settings(
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    setting = get_or_create_clinic_settings(db)
    return ClinicSettingResponse(
        id=setting.id,
        doctor_name=setting.doctor_name,
        doctor_name_urdu=setting.doctor_name_urdu,
        doctor_title=setting.doctor_title,
        specialization=setting.specialization,
        specialization_urdu=setting.specialization_urdu,
        qualifications=setting.qualifications,
        registration_no=setting.registration_no,
        clinic_name=setting.clinic_name,
        clinic_name_urdu=setting.clinic_name_urdu,
        clinic_subtitle=setting.clinic_subtitle,
        clinic_phone=setting.clinic_phone,
        clinic_email=setting.clinic_email,
        clinic_address=setting.clinic_address,
        logo_path=setting.logo_path,
        has_logo=bool(setting.logo_path and os.path.exists(setting.logo_path)),
        updated_at=setting.updated_at,
    )


@router.put("/settings", response_model=ClinicSettingResponse)
@router.patch("/settings", response_model=ClinicSettingResponse)
def update_settings(
    data: ClinicSettingUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    setting = update_clinic_settings(db, data.model_dump(exclude_unset=True))
    return ClinicSettingResponse(
        id=setting.id,
        doctor_name=setting.doctor_name,
        doctor_name_urdu=setting.doctor_name_urdu,
        doctor_title=setting.doctor_title,
        specialization=setting.specialization,
        specialization_urdu=setting.specialization_urdu,
        qualifications=setting.qualifications,
        registration_no=setting.registration_no,
        clinic_name=setting.clinic_name,
        clinic_name_urdu=setting.clinic_name_urdu,
        clinic_subtitle=setting.clinic_subtitle,
        clinic_phone=setting.clinic_phone,
        clinic_email=setting.clinic_email,
        clinic_address=setting.clinic_address,
        logo_path=setting.logo_path,
        has_logo=bool(setting.logo_path and os.path.exists(setting.logo_path)),
        updated_at=setting.updated_at,
    )


@router.post("/settings/logo", response_model=ClinicSettingResponse)
def upload_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    setting, _ = save_clinic_logo(db, file)
    return ClinicSettingResponse(
        id=setting.id,
        doctor_name=setting.doctor_name,
        doctor_name_urdu=setting.doctor_name_urdu,
        doctor_title=setting.doctor_title,
        specialization=setting.specialization,
        specialization_urdu=setting.specialization_urdu,
        qualifications=setting.qualifications,
        registration_no=setting.registration_no,
        clinic_name=setting.clinic_name,
        clinic_name_urdu=setting.clinic_name_urdu,
        clinic_subtitle=setting.clinic_subtitle,
        clinic_phone=setting.clinic_phone,
        clinic_email=setting.clinic_email,
        clinic_address=setting.clinic_address,
        logo_path=setting.logo_path,
        has_logo=bool(setting.logo_path and os.path.exists(setting.logo_path)),
        updated_at=setting.updated_at,
    )


@router.get("/settings/logo")
def view_logo(
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    setting = get_or_create_clinic_settings(db)
    if not setting.logo_path or not os.path.exists(setting.logo_path):
        raise HTTPException(status_code=404, detail="Clinic logo not found.")
    return FileResponse(setting.logo_path)


@router.delete("/settings/logo", response_model=ClinicSettingResponse)
def remove_logo(
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    setting = get_or_create_clinic_settings(db)
    if setting.logo_path and os.path.exists(setting.logo_path):
        try:
            os.remove(setting.logo_path)
        except OSError:
            pass
    setting.logo_path = None
    db.commit()
    db.refresh(setting)
    return ClinicSettingResponse(
        id=setting.id,
        doctor_name=setting.doctor_name,
        doctor_name_urdu=setting.doctor_name_urdu,
        doctor_title=setting.doctor_title,
        specialization=setting.specialization,
        specialization_urdu=setting.specialization_urdu,
        qualifications=setting.qualifications,
        registration_no=setting.registration_no,
        clinic_name=setting.clinic_name,
        clinic_name_urdu=setting.clinic_name_urdu,
        clinic_subtitle=setting.clinic_subtitle,
        clinic_phone=setting.clinic_phone,
        clinic_email=setting.clinic_email,
        clinic_address=setting.clinic_address,
        logo_path=None,
        has_logo=False,
        updated_at=setting.updated_at,
    )


# =========================================================================
# 2. Symptoms Management
# =========================================================================
@router.get("/symptoms", response_model=SymptomListResponse)
def admin_get_symptoms(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    sort_by: str = Query("name"),
    sort_order: str = Query("asc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    items, total = list_master_items(
        Symptom, db, search=search, category=category, is_active=is_active,
        sort_by=sort_by, sort_order=sort_order, page=page, page_size=page_size
    )
    return SymptomListResponse(
        items=[SymptomResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 1,
    )


@router.post("/symptoms", response_model=SymptomResponse, status_code=status.HTTP_201_CREATED)
def admin_create_symptom(
    data: SymptomCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    item = create_master_item(Symptom, db, data.model_dump(), created_by_id=current_admin.id)
    return SymptomResponse.model_validate(item)


@router.get("/symptoms/{item_id}", response_model=SymptomResponse)
def admin_get_symptom(
    item_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    item = get_master_item(Symptom, db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Symptom not found")
    return SymptomResponse.model_validate(item)


@router.put("/symptoms/{item_id}", response_model=SymptomResponse)
@router.patch("/symptoms/{item_id}", response_model=SymptomResponse)
def admin_update_symptom(
    item_id: int,
    data: SymptomUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    item = update_master_item(Symptom, db, item_id, data.model_dump(exclude_unset=True))
    if not item:
        raise HTTPException(status_code=404, detail="Symptom not found")
    return SymptomResponse.model_validate(item)


@router.patch("/symptoms/{item_id}/status", response_model=SymptomResponse)
def admin_toggle_symptom_status(
    item_id: int,
    data: MasterDataStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    item = set_master_item_status(Symptom, db, item_id, data.is_active)
    if not item:
        raise HTTPException(status_code=404, detail="Symptom not found")
    return SymptomResponse.model_validate(item)


# =========================================================================
# 3. Patient States Management
# =========================================================================
@router.get("/patient-states", response_model=PatientStateListResponse)
def admin_get_patient_states(
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    sort_by: str = Query("sort_order"),
    sort_order: str = Query("asc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    items, total = list_master_items(
        PatientState, db, search=search, is_active=is_active,
        sort_by=sort_by, sort_order=sort_order, page=page, page_size=page_size
    )
    return PatientStateListResponse(
        items=[PatientStateResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 1,
    )


@router.post("/patient-states", response_model=PatientStateResponse, status_code=status.HTTP_201_CREATED)
def admin_create_patient_state(
    data: PatientStateCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    item = create_master_item(PatientState, db, data.model_dump(), created_by_id=current_admin.id)
    return PatientStateResponse.model_validate(item)


@router.get("/patient-states/{item_id}", response_model=PatientStateResponse)
def admin_get_patient_state(
    item_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    item = get_master_item(PatientState, db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Patient state not found")
    return PatientStateResponse.model_validate(item)


@router.put("/patient-states/{item_id}", response_model=PatientStateResponse)
@router.patch("/patient-states/{item_id}", response_model=PatientStateResponse)
def admin_update_patient_state(
    item_id: int,
    data: PatientStateUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    item = update_master_item(PatientState, db, item_id, data.model_dump(exclude_unset=True))
    if not item:
        raise HTTPException(status_code=404, detail="Patient state not found")
    return PatientStateResponse.model_validate(item)


@router.patch("/patient-states/{item_id}/status", response_model=PatientStateResponse)
def admin_toggle_patient_state_status(
    item_id: int,
    data: MasterDataStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    item = set_master_item_status(PatientState, db, item_id, data.is_active)
    if not item:
        raise HTTPException(status_code=404, detail="Patient state not found")
    return PatientStateResponse.model_validate(item)


# =========================================================================
# 4. Neurological Examination Options Management
# =========================================================================
@router.get("/neurological-examinations", response_model=NeurologicalExamOptionListResponse)
def admin_get_neuro_exams(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    item_name: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    sort_by: str = Query("category"),
    sort_order: str = Query("asc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    items, total = list_master_items(
        NeurologicalExamOption, db, search=search, category=category, item_name=item_name,
        is_active=is_active, sort_by=sort_by, sort_order=sort_order, page=page, page_size=page_size
    )
    return NeurologicalExamOptionListResponse(
        items=[NeurologicalExamOptionResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 1,
    )


@router.post("/neurological-examinations", response_model=NeurologicalExamOptionResponse, status_code=status.HTTP_201_CREATED)
def admin_create_neuro_exam(
    data: NeurologicalExamOptionCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    item = create_master_item(NeurologicalExamOption, db, data.model_dump(), created_by_id=current_admin.id)
    return NeurologicalExamOptionResponse.model_validate(item)


@router.get("/neurological-examinations/{item_id}", response_model=NeurologicalExamOptionResponse)
def admin_get_neuro_exam(
    item_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    item = get_master_item(NeurologicalExamOption, db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Neurological examination option not found")
    return NeurologicalExamOptionResponse.model_validate(item)


@router.put("/neurological-examinations/{item_id}", response_model=NeurologicalExamOptionResponse)
@router.patch("/neurological-examinations/{item_id}", response_model=NeurologicalExamOptionResponse)
def admin_update_neuro_exam(
    item_id: int,
    data: NeurologicalExamOptionUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    item = update_master_item(NeurologicalExamOption, db, item_id, data.model_dump(exclude_unset=True))
    if not item:
        raise HTTPException(status_code=404, detail="Neurological examination option not found")
    return NeurologicalExamOptionResponse.model_validate(item)


@router.patch("/neurological-examinations/{item_id}/status", response_model=NeurologicalExamOptionResponse)
def admin_toggle_neuro_exam_status(
    item_id: int,
    data: MasterDataStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    item = set_master_item_status(NeurologicalExamOption, db, item_id, data.is_active)
    if not item:
        raise HTTPException(status_code=404, detail="Neurological examination option not found")
    return NeurologicalExamOptionResponse.model_validate(item)


# =========================================================================
# 5. Diagnostic Tests Management
# =========================================================================
@router.get("/diagnostic-tests", response_model=DiagnosticTestListResponse)
def admin_get_diagnostic_tests(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    sort_by: str = Query("category"),
    sort_order: str = Query("asc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    items, total = list_master_items(
        DiagnosticTest, db, search=search, category=category, is_active=is_active,
        sort_by=sort_by, sort_order=sort_order, page=page, page_size=page_size
    )
    return DiagnosticTestListResponse(
        items=[DiagnosticTestResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 1,
    )


@router.post("/diagnostic-tests", response_model=DiagnosticTestResponse, status_code=status.HTTP_201_CREATED)
def admin_create_diagnostic_test(
    data: DiagnosticTestCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    item = create_master_item(DiagnosticTest, db, data.model_dump(), created_by_id=current_admin.id)
    return DiagnosticTestResponse.model_validate(item)


@router.get("/diagnostic-tests/{item_id}", response_model=DiagnosticTestResponse)
def admin_get_diagnostic_test(
    item_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    item = get_master_item(DiagnosticTest, db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Diagnostic test not found")
    return DiagnosticTestResponse.model_validate(item)


@router.put("/diagnostic-tests/{item_id}", response_model=DiagnosticTestResponse)
@router.patch("/diagnostic-tests/{item_id}", response_model=DiagnosticTestResponse)
def admin_update_diagnostic_test(
    item_id: int,
    data: DiagnosticTestUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    item = update_master_item(DiagnosticTest, db, item_id, data.model_dump(exclude_unset=True))
    if not item:
        raise HTTPException(status_code=404, detail="Diagnostic test not found")
    return DiagnosticTestResponse.model_validate(item)


@router.patch("/diagnostic-tests/{item_id}/status", response_model=DiagnosticTestResponse)
def admin_toggle_diagnostic_test_status(
    item_id: int,
    data: MasterDataStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    item = set_master_item_status(DiagnosticTest, db, item_id, data.is_active)
    if not item:
        raise HTTPException(status_code=404, detail="Diagnostic test not found")
    return DiagnosticTestResponse.model_validate(item)


# =========================================================================
# 6. Medicines Management
# =========================================================================
@router.get("/medicines", response_model=MedicineListResponse)
def admin_get_medicines(
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    sort_by: str = Query("name"),
    sort_order: str = Query("asc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    items, total = list_master_items(
        Medicine, db, search=search, is_active=is_active,
        sort_by=sort_by, sort_order=sort_order, page=page, page_size=page_size
    )
    return MedicineListResponse(
        items=[MedicineResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 1,
    )


@router.post("/medicines", response_model=MedicineResponse, status_code=status.HTTP_201_CREATED)
def admin_create_medicine(
    data: MedicineCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    item = create_master_item(Medicine, db, data.model_dump(), created_by_id=current_admin.id)
    return MedicineResponse.model_validate(item)


@router.get("/medicines/{item_id}", response_model=MedicineResponse)
def admin_get_medicine(
    item_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    item = get_master_item(Medicine, db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return MedicineResponse.model_validate(item)


@router.put("/medicines/{item_id}", response_model=MedicineResponse)
@router.patch("/medicines/{item_id}", response_model=MedicineResponse)
def admin_update_medicine(
    item_id: int,
    data: MedicineUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    item = update_master_item(Medicine, db, item_id, data.model_dump(exclude_unset=True))
    if not item:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return MedicineResponse.model_validate(item)


@router.patch("/medicines/{item_id}/status", response_model=MedicineResponse)
def admin_toggle_medicine_status(
    item_id: int,
    data: MasterDataStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    item = set_master_item_status(Medicine, db, item_id, data.is_active)
    if not item:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return MedicineResponse.model_validate(item)


# =========================================================================
# 7. Medicine Frequencies Management
# =========================================================================
@router.get("/frequencies", response_model=MedicineFrequencyListResponse)
def admin_get_frequencies(
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    sort_by: str = Query("sort_order"),
    sort_order: str = Query("asc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    items, total = list_master_items(
        MedicineFrequency, db, search=search, is_active=is_active,
        sort_by=sort_by, sort_order=sort_order, page=page, page_size=page_size
    )
    return MedicineFrequencyListResponse(
        items=[MedicineFrequencyResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 1,
    )


@router.post("/frequencies", response_model=MedicineFrequencyResponse, status_code=status.HTTP_201_CREATED)
def admin_create_frequency(
    data: MedicineFrequencyCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    item = create_master_item(MedicineFrequency, db, data.model_dump(), created_by_id=current_admin.id)
    return MedicineFrequencyResponse.model_validate(item)


@router.get("/frequencies/{item_id}", response_model=MedicineFrequencyResponse)
def admin_get_frequency(
    item_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    item = get_master_item(MedicineFrequency, db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Frequency option not found")
    return MedicineFrequencyResponse.model_validate(item)


@router.put("/frequencies/{item_id}", response_model=MedicineFrequencyResponse)
@router.patch("/frequencies/{item_id}", response_model=MedicineFrequencyResponse)
def admin_update_frequency(
    item_id: int,
    data: MedicineFrequencyUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    item = update_master_item(MedicineFrequency, db, item_id, data.model_dump(exclude_unset=True))
    if not item:
        raise HTTPException(status_code=404, detail="Frequency option not found")
    return MedicineFrequencyResponse.model_validate(item)


@router.patch("/frequencies/{item_id}/status", response_model=MedicineFrequencyResponse)
def admin_toggle_frequency_status(
    item_id: int,
    data: MasterDataStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    item = set_master_item_status(MedicineFrequency, db, item_id, data.is_active)
    if not item:
        raise HTTPException(status_code=404, detail="Frequency option not found")
    return MedicineFrequencyResponse.model_validate(item)


# =========================================================================
# 8. Medicine Dosages Management
# =========================================================================
@router.get("/dosages", response_model=MedicineDosageListResponse)
def admin_get_dosages(
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    sort_by: str = Query("sort_order"),
    sort_order: str = Query("asc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    items, total = list_master_items(
        MedicineDosage, db, search=search, is_active=is_active,
        sort_by=sort_by, sort_order=sort_order, page=page, page_size=page_size
    )
    return MedicineDosageListResponse(
        items=[MedicineDosageResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 1,
    )


@router.post("/dosages", response_model=MedicineDosageResponse, status_code=status.HTTP_201_CREATED)
def admin_create_dosage(
    data: MedicineDosageCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    item = create_master_item(MedicineDosage, db, data.model_dump(), created_by_id=current_admin.id)
    return MedicineDosageResponse.model_validate(item)


@router.get("/dosages/{item_id}", response_model=MedicineDosageResponse)
def admin_get_dosage(
    item_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    item = get_master_item(MedicineDosage, db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Dosage option not found")
    return MedicineDosageResponse.model_validate(item)


@router.put("/dosages/{item_id}", response_model=MedicineDosageResponse)
@router.patch("/dosages/{item_id}", response_model=MedicineDosageResponse)
def admin_update_dosage(
    item_id: int,
    data: MedicineDosageUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    item = update_master_item(MedicineDosage, db, item_id, data.model_dump(exclude_unset=True))
    if not item:
        raise HTTPException(status_code=404, detail="Dosage option not found")
    return MedicineDosageResponse.model_validate(item)


@router.patch("/dosages/{item_id}/status", response_model=MedicineDosageResponse)
def admin_toggle_dosage_status(
    item_id: int,
    data: MasterDataStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    item = set_master_item_status(MedicineDosage, db, item_id, data.is_active)
    if not item:
        raise HTTPException(status_code=404, detail="Dosage option not found")
    return MedicineDosageResponse.model_validate(item)


# =========================================================================
# 9. Medicine Instructions Management
# =========================================================================
@router.get("/instructions", response_model=MedicineInstructionListResponse)
def admin_get_instructions(
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    sort_by: str = Query("sort_order"),
    sort_order: str = Query("asc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    items, total = list_master_items(
        MedicineInstruction, db, search=search, is_active=is_active,
        sort_by=sort_by, sort_order=sort_order, page=page, page_size=page_size
    )
    return MedicineInstructionListResponse(
        items=[MedicineInstructionResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 1,
    )


@router.post("/instructions", response_model=MedicineInstructionResponse, status_code=status.HTTP_201_CREATED)
def admin_create_instruction(
    data: MedicineInstructionCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    item = create_master_item(MedicineInstruction, db, data.model_dump(), created_by_id=current_admin.id)
    return MedicineInstructionResponse.model_validate(item)


@router.get("/instructions/{item_id}", response_model=MedicineInstructionResponse)
def admin_get_instruction(
    item_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    item = get_master_item(MedicineInstruction, db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Instruction not found")
    return MedicineInstructionResponse.model_validate(item)


@router.put("/instructions/{item_id}", response_model=MedicineInstructionResponse)
@router.patch("/instructions/{item_id}", response_model=MedicineInstructionResponse)
def admin_update_instruction(
    item_id: int,
    data: MedicineInstructionUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    item = update_master_item(MedicineInstruction, db, item_id, data.model_dump(exclude_unset=True))
    if not item:
        raise HTTPException(status_code=404, detail="Instruction not found")
    return MedicineInstructionResponse.model_validate(item)


@router.patch("/instructions/{item_id}/status", response_model=MedicineInstructionResponse)
def admin_toggle_instruction_status(
    item_id: int,
    data: MasterDataStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    item = set_master_item_status(MedicineInstruction, db, item_id, data.is_active)
    if not item:
        raise HTTPException(status_code=404, detail="Instruction not found")
    return MedicineInstructionResponse.model_validate(item)


# =========================================================================
# 10. Follow-Up Options Management
# =========================================================================
@router.get("/follow-ups", response_model=FollowUpOptionListResponse)
def admin_get_follow_ups(
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    sort_by: str = Query("sort_order"),
    sort_order: str = Query("asc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    items, total = list_master_items(
        FollowUpOption, db, search=search, is_active=is_active,
        sort_by=sort_by, sort_order=sort_order, page=page, page_size=page_size
    )
    return FollowUpOptionListResponse(
        items=[FollowUpOptionResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 1,
    )


@router.post("/follow-ups", response_model=FollowUpOptionResponse, status_code=status.HTTP_201_CREATED)
def admin_create_follow_up(
    data: FollowUpOptionCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    item = create_master_item(FollowUpOption, db, data.model_dump(), created_by_id=current_admin.id)
    return FollowUpOptionResponse.model_validate(item)


@router.get("/follow-ups/{item_id}", response_model=FollowUpOptionResponse)
def admin_get_follow_up(
    item_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    item = get_master_item(FollowUpOption, db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Follow-up option not found")
    return FollowUpOptionResponse.model_validate(item)


@router.put("/follow-ups/{item_id}", response_model=FollowUpOptionResponse)
@router.patch("/follow-ups/{item_id}", response_model=FollowUpOptionResponse)
def admin_update_follow_up(
    item_id: int,
    data: FollowUpOptionUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    item = update_master_item(FollowUpOption, db, item_id, data.model_dump(exclude_unset=True))
    if not item:
        raise HTTPException(status_code=404, detail="Follow-up option not found")
    return FollowUpOptionResponse.model_validate(item)


@router.patch("/follow-ups/{item_id}/status", response_model=FollowUpOptionResponse)
def admin_toggle_follow_up_status(
    item_id: int,
    data: MasterDataStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    item = set_master_item_status(FollowUpOption, db, item_id, data.is_active)
    if not item:
        raise HTTPException(status_code=404, detail="Follow-up option not found")
    return FollowUpOptionResponse.model_validate(item)


# ═════════════════════════════════════════════════════════════════════════════
# 11. USER MANAGEMENT (PHASE 9.1)
# ═════════════════════════════════════════════════════════════════════════════

@router.get("/users", response_model=List[UserResponse])
def admin_list_users(
    search: Optional[str] = Query(None, description="Search by username, full name, or email"),
    role: Optional[UserRole] = Query(None, description="Filter by role"),
    is_active: Optional[bool] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    """
    List all portal users with optional search and filters.
    Passwords and password hashes are never exposed.
    """
    query = db.query(User)

    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                User.username.ilike(term),
                User.full_name.ilike(term),
                User.email.ilike(term),
            )
        )

    users = query.order_by(User.created_at.desc()).all()
    return [UserResponse.model_validate(u) for u in users]


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def admin_create_user(
    data: AdminCreateUserRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    """
    Create a new user account (Admin, Doctor, or Staff).
    Enforces username uniqueness and minimum password length.
    """
    clean_username = data.username.strip().lower()
    if len(clean_username) < 3 or len(clean_username) > 50:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Username must be between 3 and 50 characters."
        )
    if not re.match(r"^[a-zA-Z0-9_\-]+$", clean_username):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Username may only contain letters, numbers, underscores, and hyphens."
        )

    # Check username uniqueness
    existing_user = db.query(User).filter(User.username.ilike(clean_username)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this username already exists."
        )

    # Validate password length
    if len(data.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must be at least 8 characters in length."
        )

    full_name = data.full_name.strip() if data.full_name and data.full_name.strip() else clean_username.capitalize()
    email = str(data.email).strip().lower() if data.email else f"{clean_username}@clinic.portal"

    # Check email uniqueness if email provided
    if data.email:
        existing_email = db.query(User).filter(User.email.ilike(email)).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists."
            )
    else:
        # Avoid collision on synthetic email
        if db.query(User).filter(User.email.ilike(email)).first():
            import time
            email = f"{clean_username}_{int(time.time())}@clinic.portal"

    hashed_password = get_password_hash(data.password)
    user = User(
        username=clean_username,
        full_name=full_name,
        email=email,
        role=data.role,
        hashed_password=hashed_password,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


@router.put("/users/{user_id}", response_model=UserResponse)
@router.patch("/users/{user_id}", response_model=UserResponse)
def admin_update_user(
    user_id: int,
    data: AdminUpdateUserRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    """
    Update user profile details or role.
    Prevents demoting the last active administrator.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Admin Self-Protection: check if demoting the only active admin
    if data.role and data.role != user.role and user.role == UserRole.ADMIN and user.is_active:
        other_active_admins = db.query(User).filter(
            User.role == UserRole.ADMIN,
            User.is_active == True,
            User.id != user_id
        ).count()
        if other_active_admins == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot modify the role of the only active administrator account. System must have at least one active administrator."
            )
        user.role = data.role

    if data.full_name and data.full_name.strip():
        user.full_name = data.full_name.strip()

    if data.email:
        clean_email = str(data.email).strip().lower()
        collision = db.query(User).filter(User.email.ilike(clean_email), User.id != user_id).first()
        if collision:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists."
            )
        user.email = clean_email

    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


@router.patch("/users/{user_id}/status", response_model=UserResponse)
def admin_toggle_user_status(
    user_id: int,
    data: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    """
    Activate or deactivate a user account.
    Prevents deactivating the only active administrator account.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Admin Self-Protection: check if deactivating the last active admin
    if not data.is_active and user.role == UserRole.ADMIN and user.is_active:
        other_active_admins = db.query(User).filter(
            User.role == UserRole.ADMIN,
            User.is_active == True,
            User.id != user_id
        ).count()
        if other_active_admins == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot deactivate the only active administrator account. System must have at least one active administrator."
            )

    user.is_active = data.is_active
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


@router.post("/users/{user_id}/reset-password")
def admin_reset_user_password(
    user_id: int,
    data: AdminResetPasswordRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_only),
):
    """
    Reset another user's password.
    Hashes the password with PBKDF2-HMAC-SHA256 before saving.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if len(data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must be at least 8 characters in length."
        )

    user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {
        "success": True,
        "message": f"Password for user '{user.username}' has been successfully updated."
    }

