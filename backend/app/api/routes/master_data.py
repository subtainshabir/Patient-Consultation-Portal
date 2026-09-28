from math import ceil
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, require_roles
from app.models.user import User, UserRole
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
from app.services.master_data_service import (
    list_master_items,
    get_master_item,
    create_master_item,
    update_master_item,
    set_master_item_status,
)

router = APIRouter(prefix="/master-data", tags=["Clinical Master Data"])

# Authorization dependencies
allow_clinical_mutation = require_roles([UserRole.ADMIN, UserRole.DOCTOR])


# =========================================================================
# 1. Symptoms Endpoints
# =========================================================================
@router.get("/symptoms", response_model=SymptomListResponse)
def get_symptoms(
    search: Optional[str] = Query(None, description="Search symptom name or category"),
    category: Optional[str] = Query(None, description="Filter by category (General, Pain, etc.)"),
    is_active: Optional[bool] = Query(True, description="Filter active symptoms"),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, total = list_master_items(
        Symptom, db, search=search, category=category, is_active=is_active, page=page, page_size=page_size
    )
    return SymptomListResponse(
        items=[SymptomResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 1,
    )


@router.post("/symptoms", response_model=SymptomResponse, status_code=status.HTTP_201_CREATED)
def create_symptom(
    data: SymptomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_clinical_mutation),
):
    item = create_master_item(Symptom, db, data.model_dump(), created_by_id=current_user.id)
    return SymptomResponse.model_validate(item)


@router.get("/symptoms/{item_id}", response_model=SymptomResponse)
def get_symptom_detail(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = get_master_item(Symptom, db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Symptom not found")
    return SymptomResponse.model_validate(item)


@router.patch("/symptoms/{item_id}", response_model=SymptomResponse)
def modify_symptom(
    item_id: int,
    data: SymptomUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_clinical_mutation),
):
    item = update_master_item(Symptom, db, item_id, data.model_dump(exclude_unset=True))
    if not item:
        raise HTTPException(status_code=404, detail="Symptom not found")
    return SymptomResponse.model_validate(item)


@router.patch("/symptoms/{item_id}/status", response_model=SymptomResponse)
def toggle_symptom_status(
    item_id: int,
    data: MasterDataStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_clinical_mutation),
):
    item = set_master_item_status(Symptom, db, item_id, data.is_active)
    if not item:
        raise HTTPException(status_code=404, detail="Symptom not found")
    return SymptomResponse.model_validate(item)


# =========================================================================
# 2. Patient States Endpoints
# =========================================================================
@router.get("/patient-states", response_model=PatientStateListResponse)
def get_patient_states(
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(True),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, total = list_master_items(
        PatientState, db, search=search, is_active=is_active, page=page, page_size=page_size
    )
    return PatientStateListResponse(
        items=[PatientStateResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 1,
    )


@router.post("/patient-states", response_model=PatientStateResponse, status_code=status.HTTP_201_CREATED)
def create_patient_state(
    data: PatientStateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_clinical_mutation),
):
    item = create_master_item(PatientState, db, data.model_dump(), created_by_id=current_user.id)
    return PatientStateResponse.model_validate(item)


@router.get("/patient-states/{item_id}", response_model=PatientStateResponse)
def get_patient_state_detail(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = get_master_item(PatientState, db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Patient state not found")
    return PatientStateResponse.model_validate(item)


@router.patch("/patient-states/{item_id}", response_model=PatientStateResponse)
def modify_patient_state(
    item_id: int,
    data: PatientStateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_clinical_mutation),
):
    item = update_master_item(PatientState, db, item_id, data.model_dump(exclude_unset=True))
    if not item:
        raise HTTPException(status_code=404, detail="Patient state not found")
    return PatientStateResponse.model_validate(item)


@router.patch("/patient-states/{item_id}/status", response_model=PatientStateResponse)
def toggle_patient_state_status(
    item_id: int,
    data: MasterDataStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_clinical_mutation),
):
    item = set_master_item_status(PatientState, db, item_id, data.is_active)
    if not item:
        raise HTTPException(status_code=404, detail="Patient state not found")
    return PatientStateResponse.model_validate(item)


# =========================================================================
# 3. Neurological Examination Options Endpoints
# =========================================================================
@router.get("/neurological-examinations", response_model=NeurologicalExamOptionListResponse)
def get_neurological_examinations(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None, description="Category (Motor, Reflexes, Cranial Nerves, etc.)"),
    item_name: Optional[str] = Query(None, description="Item name (e.g. Right Upper Limb, CN VII)"),
    is_active: Optional[bool] = Query(True),
    page: int = Query(1, ge=1),
    page_size: int = Query(200, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, total = list_master_items(
        NeurologicalExamOption,
        db,
        search=search,
        category=category,
        item_name=item_name,
        is_active=is_active,
        page=page,
        page_size=page_size,
    )
    return NeurologicalExamOptionListResponse(
        items=[NeurologicalExamOptionResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 1,
    )


@router.post("/neurological-examinations", response_model=NeurologicalExamOptionResponse, status_code=status.HTTP_201_CREATED)
def create_neurological_examination(
    data: NeurologicalExamOptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_clinical_mutation),
):
    item = create_master_item(NeurologicalExamOption, db, data.model_dump(), created_by_id=current_user.id)
    return NeurologicalExamOptionResponse.model_validate(item)


@router.get("/neurological-examinations/{item_id}", response_model=NeurologicalExamOptionResponse)
def get_neurological_examination_detail(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = get_master_item(NeurologicalExamOption, db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Neurological examination option not found")
    return NeurologicalExamOptionResponse.model_validate(item)


@router.patch("/neurological-examinations/{item_id}", response_model=NeurologicalExamOptionResponse)
def modify_neurological_examination(
    item_id: int,
    data: NeurologicalExamOptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_clinical_mutation),
):
    item = update_master_item(NeurologicalExamOption, db, item_id, data.model_dump(exclude_unset=True))
    if not item:
        raise HTTPException(status_code=404, detail="Neurological examination option not found")
    return NeurologicalExamOptionResponse.model_validate(item)


@router.patch("/neurological-examinations/{item_id}/status", response_model=NeurologicalExamOptionResponse)
def toggle_neurological_examination_status(
    item_id: int,
    data: MasterDataStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_clinical_mutation),
):
    item = set_master_item_status(NeurologicalExamOption, db, item_id, data.is_active)
    if not item:
        raise HTTPException(status_code=404, detail="Neurological examination option not found")
    return NeurologicalExamOptionResponse.model_validate(item)


# =========================================================================
# 4. Diagnostic Tests Endpoints
# =========================================================================
@router.get("/diagnostic-tests", response_model=DiagnosticTestListResponse)
def get_diagnostic_tests(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None, description="Category (Imaging, Laboratory, etc.)"),
    is_active: Optional[bool] = Query(True),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, total = list_master_items(
        DiagnosticTest, db, search=search, category=category, is_active=is_active, page=page, page_size=page_size
    )
    return DiagnosticTestListResponse(
        items=[DiagnosticTestResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 1,
    )


@router.post("/diagnostic-tests", response_model=DiagnosticTestResponse, status_code=status.HTTP_201_CREATED)
def create_diagnostic_test(
    data: DiagnosticTestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_clinical_mutation),
):
    item = create_master_item(DiagnosticTest, db, data.model_dump(), created_by_id=current_user.id)
    return DiagnosticTestResponse.model_validate(item)


@router.get("/diagnostic-tests/{item_id}", response_model=DiagnosticTestResponse)
def get_diagnostic_test_detail(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = get_master_item(DiagnosticTest, db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Diagnostic test not found")
    return DiagnosticTestResponse.model_validate(item)


@router.patch("/diagnostic-tests/{item_id}", response_model=DiagnosticTestResponse)
def modify_diagnostic_test(
    item_id: int,
    data: DiagnosticTestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_clinical_mutation),
):
    item = update_master_item(DiagnosticTest, db, item_id, data.model_dump(exclude_unset=True))
    if not item:
        raise HTTPException(status_code=404, detail="Diagnostic test not found")
    return DiagnosticTestResponse.model_validate(item)


@router.patch("/diagnostic-tests/{item_id}/status", response_model=DiagnosticTestResponse)
def toggle_diagnostic_test_status(
    item_id: int,
    data: MasterDataStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_clinical_mutation),
):
    item = set_master_item_status(DiagnosticTest, db, item_id, data.is_active)
    if not item:
        raise HTTPException(status_code=404, detail="Diagnostic test not found")
    return DiagnosticTestResponse.model_validate(item)


# =========================================================================
# 5. Medicines Endpoints
# =========================================================================
@router.get("/medicines", response_model=MedicineListResponse)
def get_medicines(
    search: Optional[str] = Query(None, description="Search medicine name or generic"),
    is_active: Optional[bool] = Query(True),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, total = list_master_items(
        Medicine, db, search=search, is_active=is_active, page=page, page_size=page_size
    )
    return MedicineListResponse(
        items=[MedicineResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 1,
    )


@router.post("/medicines", response_model=MedicineResponse, status_code=status.HTTP_201_CREATED)
def create_medicine(
    data: MedicineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_clinical_mutation),
):
    item = create_master_item(Medicine, db, data.model_dump(), created_by_id=current_user.id)
    return MedicineResponse.model_validate(item)


@router.get("/medicines/{item_id}", response_model=MedicineResponse)
def get_medicine_detail(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = get_master_item(Medicine, db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return MedicineResponse.model_validate(item)


@router.patch("/medicines/{item_id}", response_model=MedicineResponse)
def modify_medicine(
    item_id: int,
    data: MedicineUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_clinical_mutation),
):
    item = update_master_item(Medicine, db, item_id, data.model_dump(exclude_unset=True))
    if not item:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return MedicineResponse.model_validate(item)


@router.patch("/medicines/{item_id}/status", response_model=MedicineResponse)
def toggle_medicine_status(
    item_id: int,
    data: MasterDataStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_clinical_mutation),
):
    item = set_master_item_status(Medicine, db, item_id, data.is_active)
    if not item:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return MedicineResponse.model_validate(item)


# =========================================================================
# 6. Medicine Frequencies Endpoints
# =========================================================================
@router.get("/frequencies", response_model=MedicineFrequencyListResponse)
def get_frequencies(
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(True),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, total = list_master_items(
        MedicineFrequency, db, search=search, is_active=is_active, page=page, page_size=page_size
    )
    return MedicineFrequencyListResponse(
        items=[MedicineFrequencyResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 1,
    )


@router.post("/frequencies", response_model=MedicineFrequencyResponse, status_code=status.HTTP_201_CREATED)
def create_frequency(
    data: MedicineFrequencyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_clinical_mutation),
):
    item = create_master_item(MedicineFrequency, db, data.model_dump(), created_by_id=current_user.id)
    return MedicineFrequencyResponse.model_validate(item)


@router.get("/frequencies/{item_id}", response_model=MedicineFrequencyResponse)
def get_frequency_detail(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = get_master_item(MedicineFrequency, db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Frequency not found")
    return MedicineFrequencyResponse.model_validate(item)


@router.patch("/frequencies/{item_id}", response_model=MedicineFrequencyResponse)
def modify_frequency(
    item_id: int,
    data: MedicineFrequencyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_clinical_mutation),
):
    item = update_master_item(MedicineFrequency, db, item_id, data.model_dump(exclude_unset=True))
    if not item:
        raise HTTPException(status_code=404, detail="Frequency not found")
    return MedicineFrequencyResponse.model_validate(item)


@router.patch("/frequencies/{item_id}/status", response_model=MedicineFrequencyResponse)
def toggle_frequency_status(
    item_id: int,
    data: MasterDataStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_clinical_mutation),
):
    item = set_master_item_status(MedicineFrequency, db, item_id, data.is_active)
    if not item:
        raise HTTPException(status_code=404, detail="Frequency not found")
    return MedicineFrequencyResponse.model_validate(item)


# =========================================================================
# 7. Medicine Dosages Endpoints
# =========================================================================
@router.get("/dosages", response_model=MedicineDosageListResponse)
def get_dosages(
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(True),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, total = list_master_items(
        MedicineDosage, db, search=search, is_active=is_active, page=page, page_size=page_size
    )
    return MedicineDosageListResponse(
        items=[MedicineDosageResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 1,
    )


@router.post("/dosages", response_model=MedicineDosageResponse, status_code=status.HTTP_201_CREATED)
def create_dosage(
    data: MedicineDosageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_clinical_mutation),
):
    item = create_master_item(MedicineDosage, db, data.model_dump(), created_by_id=current_user.id)
    return MedicineDosageResponse.model_validate(item)


@router.get("/dosages/{item_id}", response_model=MedicineDosageResponse)
def get_dosage_detail(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = get_master_item(MedicineDosage, db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Dosage option not found")
    return MedicineDosageResponse.model_validate(item)


@router.patch("/dosages/{item_id}", response_model=MedicineDosageResponse)
def modify_dosage(
    item_id: int,
    data: MedicineDosageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_clinical_mutation),
):
    item = update_master_item(MedicineDosage, db, item_id, data.model_dump(exclude_unset=True))
    if not item:
        raise HTTPException(status_code=404, detail="Dosage option not found")
    return MedicineDosageResponse.model_validate(item)


@router.patch("/dosages/{item_id}/status", response_model=MedicineDosageResponse)
def toggle_dosage_status(
    item_id: int,
    data: MasterDataStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_clinical_mutation),
):
    item = set_master_item_status(MedicineDosage, db, item_id, data.is_active)
    if not item:
        raise HTTPException(status_code=404, detail="Dosage option not found")
    return MedicineDosageResponse.model_validate(item)


# =========================================================================
# 8. Medicine Instructions Endpoints
# =========================================================================
@router.get("/instructions", response_model=MedicineInstructionListResponse)
def get_instructions(
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(True),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, total = list_master_items(
        MedicineInstruction, db, search=search, is_active=is_active, page=page, page_size=page_size
    )
    return MedicineInstructionListResponse(
        items=[MedicineInstructionResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 1,
    )


@router.post("/instructions", response_model=MedicineInstructionResponse, status_code=status.HTTP_201_CREATED)
def create_instruction(
    data: MedicineInstructionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_clinical_mutation),
):
    item = create_master_item(MedicineInstruction, db, data.model_dump(), created_by_id=current_user.id)
    return MedicineInstructionResponse.model_validate(item)


@router.get("/instructions/{item_id}", response_model=MedicineInstructionResponse)
def get_instruction_detail(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = get_master_item(MedicineInstruction, db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Instruction not found")
    return MedicineInstructionResponse.model_validate(item)


@router.patch("/instructions/{item_id}", response_model=MedicineInstructionResponse)
def modify_instruction(
    item_id: int,
    data: MedicineInstructionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_clinical_mutation),
):
    item = update_master_item(MedicineInstruction, db, item_id, data.model_dump(exclude_unset=True))
    if not item:
        raise HTTPException(status_code=404, detail="Instruction not found")
    return MedicineInstructionResponse.model_validate(item)


@router.patch("/instructions/{item_id}/status", response_model=MedicineInstructionResponse)
def toggle_instruction_status(
    item_id: int,
    data: MasterDataStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_clinical_mutation),
):
    item = set_master_item_status(MedicineInstruction, db, item_id, data.is_active)
    if not item:
        raise HTTPException(status_code=404, detail="Instruction not found")
    return MedicineInstructionResponse.model_validate(item)


# =========================================================================
# 9. Follow-Up Options Endpoints
# =========================================================================
@router.get("/follow-ups", response_model=FollowUpOptionListResponse)
def get_follow_ups(
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(True),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, total = list_master_items(
        FollowUpOption, db, search=search, is_active=is_active, page=page, page_size=page_size
    )
    return FollowUpOptionListResponse(
        items=[FollowUpOptionResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 1,
    )


@router.post("/follow-ups", response_model=FollowUpOptionResponse, status_code=status.HTTP_201_CREATED)
def create_follow_up(
    data: FollowUpOptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_clinical_mutation),
):
    item = create_master_item(FollowUpOption, db, data.model_dump(), created_by_id=current_user.id)
    return FollowUpOptionResponse.model_validate(item)


@router.get("/follow-ups/{item_id}", response_model=FollowUpOptionResponse)
def get_follow_up_detail(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = get_master_item(FollowUpOption, db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Follow-up option not found")
    return FollowUpOptionResponse.model_validate(item)


@router.patch("/follow-ups/{item_id}", response_model=FollowUpOptionResponse)
def modify_follow_up(
    item_id: int,
    data: FollowUpOptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_clinical_mutation),
):
    item = update_master_item(FollowUpOption, db, item_id, data.model_dump(exclude_unset=True))
    if not item:
        raise HTTPException(status_code=404, detail="Follow-up option not found")
    return FollowUpOptionResponse.model_validate(item)


@router.patch("/follow-ups/{item_id}/status", response_model=FollowUpOptionResponse)
def toggle_follow_up_status(
    item_id: int,
    data: MasterDataStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_clinical_mutation),
):
    item = set_master_item_status(FollowUpOption, db, item_id, data.is_active)
    if not item:
        raise HTTPException(status_code=404, detail="Follow-up option not found")
    return FollowUpOptionResponse.model_validate(item)
