import uuid
import io
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


@pytest.fixture
def admin_auth_headers():
    res = client.post(
        "/api/auth/login",
        json={"username_or_email": "admin", "password": "Admin@123"}
    )
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def doctor_auth_headers():
    res = client.post(
        "/api/auth/login",
        json={"username_or_email": "drrauf", "password": "Doctor@123"}
    )
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def staff_auth_headers():
    res = client.post(
        "/api/auth/login",
        json={"username_or_email": "staff", "password": "Staff@123"}
    )
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# =========================================================================
# 1. Admin Authorization & Security Tests
# =========================================================================
def test_admin_api_unauthorized_without_token():
    """Unauthenticated users cannot access admin endpoints (401)."""
    assert client.get("/api/admin/stats").status_code == 401
    assert client.get("/api/admin/symptoms").status_code == 401
    assert client.get("/api/admin/medicines").status_code == 401
    assert client.get("/api/admin/settings").status_code == 401


def test_doctor_forbidden_from_admin_endpoints(doctor_auth_headers):
    """Normal doctors cannot access admin endpoints (403 Forbidden)."""
    assert client.get("/api/admin/stats", headers=doctor_auth_headers).status_code == 403
    assert client.get("/api/admin/medicines", headers=doctor_auth_headers).status_code == 403
    assert client.post(
        "/api/admin/medicines",
        json={"name": "Forbidden Med", "form": "Tablet"},
        headers=doctor_auth_headers
    ).status_code == 403
    assert client.get("/api/admin/settings", headers=doctor_auth_headers).status_code == 403


def test_staff_forbidden_from_admin_endpoints(staff_auth_headers):
    """Staff users cannot access admin endpoints (403 Forbidden)."""
    assert client.get("/api/admin/stats", headers=staff_auth_headers).status_code == 403
    assert client.get("/api/admin/symptoms", headers=staff_auth_headers).status_code == 403
    assert client.get("/api/admin/settings", headers=staff_auth_headers).status_code == 403


def test_admin_allowed_access(admin_auth_headers):
    """Authorized administrators can access all admin endpoints."""
    res_stats = client.get("/api/admin/stats", headers=admin_auth_headers)
    assert res_stats.status_code == 200
    data = res_stats.json()
    assert "categories" in data
    assert "total_master_items" in data
    assert "symptoms" in data["categories"]
    assert "medicines" in data["categories"]


# =========================================================================
# 2. Master Data CRUD & Deactivation / Reactivation Lifecycle
# =========================================================================
def test_admin_symptoms_crud_and_status_lifecycle(admin_auth_headers):
    """Admin can list, search, add, edit, deactivate, and reactivate symptoms."""
    unique_name = f"Test Symptom {uuid.uuid4().hex[:6]}"
    
    # 1. Create
    res_create = client.post(
        "/api/admin/symptoms",
        json={"name": unique_name, "category": "General", "description": "Admin test description"},
        headers=admin_auth_headers
    )
    assert res_create.status_code == 201
    symptom = res_create.json()
    symptom_id = symptom["id"]
    assert symptom["name"] == unique_name
    assert symptom["is_active"] is True

    # 2. Search & List
    res_search = client.get(f"/api/admin/symptoms?search={unique_name}", headers=admin_auth_headers)
    assert res_search.status_code == 200
    items = res_search.json()["items"]
    assert any(i["id"] == symptom_id for i in items)

    # 3. Edit / Update
    updated_name = f"{unique_name} Updated"
    res_update = client.patch(
        f"/api/admin/symptoms/{symptom_id}",
        json={"name": updated_name, "category": "Pain"},
        headers=admin_auth_headers
    )
    assert res_update.status_code == 200
    assert res_update.json()["name"] == updated_name
    assert res_update.json()["category"] == "Pain"

    # 4. Deactivate
    res_deact = client.patch(
        f"/api/admin/symptoms/{symptom_id}/status",
        json={"is_active": False},
        headers=admin_auth_headers
    )
    assert res_deact.status_code == 200
    assert res_deact.json()["is_active"] is False

    # 5. Reactivate
    res_react = client.patch(
        f"/api/admin/symptoms/{symptom_id}/status",
        json={"is_active": True},
        headers=admin_auth_headers
    )
    assert res_react.status_code == 200
    assert res_react.json()["is_active"] is True


def test_admin_medicines_crud_and_validation(admin_auth_headers):
    """Admin can manage medicines with validation and duplicate prevention."""
    med_name = f"Test Med {uuid.uuid4().hex[:6]}"

    # Create medicine
    res = client.post(
        "/api/admin/medicines",
        json={
            "name": med_name,
            "generic_name": "Test Generic",
            "strength": "100mg",
            "form": "Tablet"
        },
        headers=admin_auth_headers
    )
    assert res.status_code == 201
    med_id = res.json()["id"]

    # Duplicate creation check (Case-insensitive) -> 409
    res_dup = client.post(
        "/api/admin/medicines",
        json={"name": med_name.lower(), "form": "Tablet"},
        headers=admin_auth_headers
    )
    assert res_dup.status_code == 409

    # Empty name check -> 422
    res_empty = client.post(
        "/api/admin/medicines",
        json={"name": "   ", "form": "Tablet"},
        headers=admin_auth_headers
    )
    assert res_empty.status_code == 422

    # Toggle status to False
    res_status = client.patch(
        f"/api/admin/medicines/{med_id}/status",
        json={"is_active": False},
        headers=admin_auth_headers
    )
    assert res_status.status_code == 200
    assert res_status.json()["is_active"] is False


def test_admin_frequencies_urdu_support(admin_auth_headers):
    """Admin frequencies correctly store Urdu and English representations."""
    freq_name = f"Freq_{uuid.uuid4().hex[:6]}"
    urdu_text = "دن میں دو بار"
    res = client.post(
        "/api/admin/frequencies",
        json={"name": freq_name, "urdu_label": urdu_text, "roman_urdu": "Din mein do baar"},
        headers=admin_auth_headers
    )
    assert res.status_code == 201
    assert res.json()["urdu_label"] == urdu_text


def test_admin_dosages_urdu_support(admin_auth_headers):
    """Admin dosages correctly manage fractions and Urdu wording."""
    dosage_name = f"Dosage_{uuid.uuid4().hex[:6]}"
    urdu_text = "آدھی گولی"
    res = client.post(
        "/api/admin/dosages",
        json={"name": dosage_name, "urdu_label": urdu_text},
        headers=admin_auth_headers
    )
    assert res.status_code == 201
    assert res.json()["urdu_label"] == urdu_text


def test_admin_instructions_urdu_support(admin_auth_headers):
    """Admin instructions correctly store Urdu instructions."""
    inst_name = f"Inst_{uuid.uuid4().hex[:6]}"
    urdu_text = "کھانے کے ایک گھنٹے بعد"
    res = client.post(
        "/api/admin/instructions",
        json={"name": inst_name, "urdu_label": urdu_text},
        headers=admin_auth_headers
    )
    assert res.status_code == 201
    assert res.json()["urdu_label"] == urdu_text


def test_admin_diagnostic_tests_crud(admin_auth_headers):
    """Admin can manage diagnostic tests."""
    test_name = f"NeuroTest_{uuid.uuid4().hex[:6]}"
    res = client.post(
        "/api/admin/diagnostic-tests",
        json={"name": test_name, "category": "Electrophysiology"},
        headers=admin_auth_headers
    )
    assert res.status_code == 201
    assert res.json()["category"] == "Electrophysiology"


def test_admin_neurological_examinations_by_category(admin_auth_headers):
    """Admin can manage neurological examination options organized by category."""
    opt_name = f"Hyperreflexic_{uuid.uuid4().hex[:6]}"
    res = client.post(
        "/api/admin/neurological-examinations",
        json={
            "category": "Reflexes",
            "item_name": "Knee Jerk",
            "name": opt_name,
            "description": "Exaggerated patellar response"
        },
        headers=admin_auth_headers
    )
    assert res.status_code == 201
    assert res.json()["category"] == "Reflexes"
    assert res.json()["item_name"] == "Knee Jerk"


def test_admin_follow_ups_urdu_support(admin_auth_headers):
    """Admin can manage follow-up duration options with Urdu text."""
    fu_name = f"FollowUp_{uuid.uuid4().hex[:6]}"
    urdu_text = "تین ہفتے بعد"
    res = client.post(
        "/api/admin/follow-ups",
        json={"name": fu_name, "urdu_label": urdu_text},
        headers=admin_auth_headers
    )
    assert res.status_code == 201
    assert res.json()["urdu_label"] == urdu_text


def test_admin_patient_states_crud(admin_auth_headers):
    """Admin can manage patient clinical states."""
    state_name = f"State_{uuid.uuid4().hex[:6]}"
    res = client.post(
        "/api/admin/patient-states",
        json={"name": state_name, "description": "Clinical state description"},
        headers=admin_auth_headers
    )
    assert res.status_code == 201
    assert res.json()["name"] == state_name


# =========================================================================
# 3. Doctor Portal Integration & Historical Data Preservation Tests
# =========================================================================
def test_historical_consultation_unaffected_by_master_data_deactivation(
    admin_auth_headers, doctor_auth_headers
):
    """
    CRITICAL REQUIREMENT:
    1. Admin creates a master medicine and symptom.
    2. Doctor uses them in a consultation.
    3. Admin deactivates the medicine and symptom.
    4. Doctor creating NEW consultations does NOT see them in active dropdowns.
    5. The OLD consultation continues to display the exact saved values without data loss!
    """
    uid = uuid.uuid4().hex[:6]
    symptom_name = f"HistSymptom_{uid}"
    medicine_name = f"HistMedicine_{uid}"

    # 1. Admin creates symptom and medicine
    res_sym = client.post(
        "/api/admin/symptoms",
        json={"name": symptom_name, "category": "General"},
        headers=admin_auth_headers
    )
    assert res_sym.status_code == 201
    sym_id = res_sym.json()["id"]

    res_med = client.post(
        "/api/admin/medicines",
        json={"name": medicine_name, "form": "Tablet", "strength": "50mg"},
        headers=admin_auth_headers
    )
    assert res_med.status_code == 201
    med_id = res_med.json()["id"]

    import random
    phone_digits = f"03{random.randint(10, 49)}-{random.randint(1000000, 9999999)}"
    res_pt = client.post(
        "/api/patients",
        json={
            "full_name": f"Historical Patient {uid}",
            "age": 45,
            "gender": "Male",
            "mobile_number": phone_digits
        },
        headers=doctor_auth_headers
    )
    assert res_pt.status_code == 201
    patient_id = res_pt.json()["patient_id"]

    res_cns = client.post(
        "/api/consultations",
        json={
            "patient_id": patient_id,
            "symptoms": [{"symptom_name": symptom_name, "category": "General"}],
            "prescriptions": [
                {
                    "medicine_name": medicine_name,
                    "dosage": "1 tablet",
                    "frequency_name": "صبح و شام",
                    "duration_days": 14
                }
            ]
        },
        headers=doctor_auth_headers
    )
    assert res_cns.status_code == 201
    consultation = res_cns.json()
    cns_id = consultation["consultation_id"]

    # 3. Admin deactivates both master items
    res_deact_s = client.patch(
        f"/api/admin/symptoms/{sym_id}/status",
        json={"is_active": False},
        headers=admin_auth_headers
    )
    assert res_deact_s.status_code == 200
    assert res_deact_s.json()["is_active"] is False

    res_deact_m = client.patch(
        f"/api/admin/medicines/{med_id}/status",
        json={"is_active": False},
        headers=admin_auth_headers
    )
    assert res_deact_m.status_code == 200
    assert res_deact_m.json()["is_active"] is False

    # 4. Doctor active dropdown queries must NOT include the deactivated items
    res_active_s = client.get(
        f"/api/master-data/symptoms?search={symptom_name}&is_active=true",
        headers=doctor_auth_headers
    )
    assert res_active_s.status_code == 200
    assert len(res_active_s.json()["items"]) == 0

    res_active_m = client.get(
        f"/api/master-data/medicines?search={medicine_name}&is_active=true",
        headers=doctor_auth_headers
    )
    assert res_active_m.status_code == 200
    assert len(res_active_m.json()["items"]) == 0

    # 5. Retrieve historical consultation - values MUST remain intact!
    res_hist = client.get(
        f"/api/consultations/{cns_id}",
        headers=doctor_auth_headers
    )
    assert res_hist.status_code == 200
    hist_data = res_hist.json()
    
    # Symptom is preserved
    assert len(hist_data["symptoms"]) == 1
    assert hist_data["symptoms"][0]["symptom_name"] == symptom_name

    # Prescription item is preserved
    assert len(hist_data["prescriptions"]) == 1
    assert hist_data["prescriptions"][0]["medicine_name"] == medicine_name


# =========================================================================
# 4. Doctor & Clinic Settings Tests
# =========================================================================
def test_admin_settings_get_and_update(admin_auth_headers):
    """Admin can retrieve and update clinic and doctor settings."""
    res_get = client.get("/api/admin/settings", headers=admin_auth_headers)
    assert res_get.status_code == 200
    initial = res_get.json()
    assert "doctor_name" in initial
    assert "clinic_name" in initial

    # Update settings
    res_up = client.put(
        "/api/admin/settings",
        json={
            "doctor_name": "Dr. Test Administrator",
            "clinic_name": "Test Neurology Diagnostic Center",
            "clinic_phone": "0300-9999999",
            "qualifications": "MBBS, MD Neurology"
        },
        headers=admin_auth_headers
    )
    assert res_up.status_code == 200
    updated = res_up.json()
    assert updated["doctor_name"] == "Dr. Test Administrator"
    assert updated["clinic_name"] == "Test Neurology Diagnostic Center"
    assert updated["clinic_phone"] == "0300-9999999"


def test_admin_settings_logo_upload(admin_auth_headers):
    """Admin can upload, retrieve, and delete clinic logo."""
    # Create dummy PNG image bytes (1x1 transparent PNG)
    png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc\xf8\xff\xff?\x00\x05\xfe\x02\xfe\r\xef\x8f\x8e\x00\x00\x00\x00IEND\xaeB`\x82"
    
    files = {"file": ("test_logo.png", io.BytesIO(png_bytes), "image/png")}
    res_upload = client.post("/api/admin/settings/logo", files=files, headers=admin_auth_headers)
    assert res_upload.status_code == 200
    assert res_upload.json()["has_logo"] is True

    # Retrieve logo
    res_view = client.get("/api/admin/settings/logo", headers=admin_auth_headers)
    assert res_view.status_code == 200
    assert res_view.headers["content-type"].startswith("image/")

    # Remove logo
    res_del = client.delete("/api/admin/settings/logo", headers=admin_auth_headers)
    assert res_del.status_code == 200
    assert res_del.json()["has_logo"] is False
