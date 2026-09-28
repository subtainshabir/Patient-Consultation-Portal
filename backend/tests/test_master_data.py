import random
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


@pytest.fixture
def doctor_headers():
    res = client.post(
        "/api/auth/login",
        json={"username_or_email": "drrauf", "password": "Doctor@123"}
    )
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers():
    res = client.post(
        "/api/auth/login",
        json={"username_or_email": "admin", "password": "Admin@123"}
    )
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def staff_headers():
    res = client.post(
        "/api/auth/login",
        json={"username_or_email": "staff", "password": "Staff@123"}
    )
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# -------------------------------------------------------------
# 1. Symptoms Tests
# -------------------------------------------------------------
def test_list_and_search_symptoms(doctor_headers):
    # List all active symptoms
    res = client.get("/api/master-data/symptoms", headers=doctor_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 20
    assert any(s["name"] == "Headache" for s in data["items"])

    # Search symptoms
    res_search = client.get("/api/master-data/symptoms?search=Dizziness", headers=doctor_headers)
    assert res_search.status_code == 200
    search_data = res_search.json()
    assert any("Dizziness" in s["name"] for s in search_data["items"])

    # Category filter
    res_cat = client.get("/api/master-data/symptoms?category=Stroke-related", headers=doctor_headers)
    assert res_cat.status_code == 200
    cat_items = res_cat.json()["items"]
    assert all(s["category"] == "Stroke-related" for s in cat_items)


def test_create_custom_symptom_and_duplicate_prevention(doctor_headers):
    unique_suffix = random.randint(10000, 99999)
    custom_name = f"Custom Neuropathy {unique_suffix}"

    # Doctor adds custom symptom
    res = client.post(
        "/api/master-data/symptoms",
        json={"name": custom_name, "category": "Sensory", "description": "Custom clinical finding"},
        headers=doctor_headers
    )
    assert res.status_code == 201
    created = res.json()
    assert created["name"] == custom_name
    assert created["category"] == "Sensory"
    assert created["is_active"] is True
    item_id = created["id"]

    # Duplicate creation should return 409 Conflict
    res_dup = client.post(
        "/api/master-data/symptoms",
        json={"name": custom_name, "category": "Sensory"},
        headers=doctor_headers
    )
    assert res_dup.status_code == 409

    # Edit symptom
    res_edit = client.patch(
        f"/api/master-data/symptoms/{item_id}",
        json={"description": "Updated clinical description"},
        headers=doctor_headers
    )
    assert res_edit.status_code == 200
    assert res_edit.json()["description"] == "Updated clinical description"

    # Soft-deactivate symptom
    res_deact = client.patch(
        f"/api/master-data/symptoms/{item_id}/status",
        json={"is_active": False},
        headers=doctor_headers
    )
    assert res_deact.status_code == 200
    assert res_deact.json()["is_active"] is False

    # Should not appear in active query
    res_active = client.get(f"/api/master-data/symptoms?search={unique_suffix}&is_active=true", headers=doctor_headers)
    assert res_active.json()["total"] == 0

    # Appears when is_active=false
    res_inactive = client.get(f"/api/master-data/symptoms?search={unique_suffix}&is_active=false", headers=doctor_headers)
    assert res_inactive.json()["total"] == 1


# -------------------------------------------------------------
# 2. Patient States Tests
# -------------------------------------------------------------
def test_patient_states_crud(admin_headers):
    # List patient states
    res = client.get("/api/master-data/patient-states", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert any(s["name"] == "Stable" for s in data["items"])
    assert any(s["name"] == "Acute" for s in data["items"])

    # Create new state
    unique_suffix = random.randint(1000, 9999)
    res_new = client.post(
        "/api/master-data/patient-states",
        json={"name": f"Clinical State {unique_suffix}", "description": "Custom state"},
        headers=admin_headers
    )
    assert res_new.status_code == 201


# -------------------------------------------------------------
# 3. Neurological Examination Options Tests
# -------------------------------------------------------------
def test_neurological_exam_options(doctor_headers):
    # Get motor options
    res = client.get("/api/master-data/neurological-examinations?category=Motor Functions", headers=doctor_headers)
    assert res.status_code == 200
    items = res.json()["items"]
    assert any(i["name"] == "Normal" for i in items)
    assert any(i["name"] == "Hemiparesis" for i in items)

    # Get muscle strength grading
    res_str = client.get("/api/master-data/neurological-examinations?category=Muscle Strength&item_name=Right Upper Limb", headers=doctor_headers)
    assert res_str.status_code == 200
    str_items = res_str.json()["items"]
    assert any("5/5" in i["name"] for i in str_items)
    assert any("0/5" in i["name"] for i in str_items)

    # Get cranial nerves
    res_cn = client.get("/api/master-data/neurological-examinations?category=Cranial Nerves&item_name=CN VII - Facial", headers=doctor_headers)
    assert res_cn.status_code == 200
    assert len(res_cn.json()["items"]) >= 4

    # Add custom exam option
    unique_suffix = random.randint(1000, 9999)
    res_custom = client.post(
        "/api/master-data/neurological-examinations",
        json={"category": "Motor Functions", "item_name": "General Motor", "name": f"Cogwheel Rigidity {unique_suffix}"},
        headers=doctor_headers
    )
    assert res_custom.status_code == 201


# -------------------------------------------------------------
# 4. Diagnostic Tests Tests
# -------------------------------------------------------------
def test_diagnostic_tests_crud(doctor_headers):
    res = client.get("/api/master-data/diagnostic-tests", headers=doctor_headers)
    assert res.status_code == 200
    data = res.json()
    assert any("MRI Brain" in t["name"] for t in data["items"])
    assert any("EEG" in t["name"] for t in data["items"])

    # Search
    res_search = client.get("/api/master-data/diagnostic-tests?search=Spine", headers=doctor_headers)
    assert res_search.status_code == 200
    assert any("Spine" in t["name"] for t in res_search.json()["items"])

    # Add custom diagnostic test
    unique_suffix = random.randint(1000, 9999)
    res_new = client.post(
        "/api/master-data/diagnostic-tests",
        json={"name": f"Brain PET Scan {unique_suffix}", "category": "Imaging"},
        headers=doctor_headers
    )
    assert res_new.status_code == 201


# -------------------------------------------------------------
# 5. Medicines & Manual Addition Tests
# -------------------------------------------------------------
def test_medicines_search_and_custom_addition(doctor_headers):
    # Search medicines
    res = client.get("/api/master-data/medicines?search=Levetiracetam", headers=doctor_headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) >= 1

    # Search non-existing medicine returns empty list
    res_empty = client.get("/api/master-data/medicines?search=NonExistentDrug999", headers=doctor_headers)
    assert res_empty.status_code == 200
    assert res_empty.json()["total"] == 0

    # Doctor manually creates new medicine (Section 41)
    unique_suffix = random.randint(1000, 9999)
    res_add = client.post(
        "/api/master-data/medicines",
        json={
            "name": f"GenericNeuro {unique_suffix}",
            "generic_name": "Sample Compound",
            "strength": "100mg",
            "form": "Tablet"
        },
        headers=doctor_headers
    )
    assert res_add.status_code == 201
    assert res_add.json()["name"] == f"GenericNeuro {unique_suffix}"


# -------------------------------------------------------------
# 6. Frequencies, Dosages, Instructions & Follow-up Tests
# -------------------------------------------------------------
def test_urdu_clinical_master_data(doctor_headers):
    # Frequencies (Urdu & Roman Urdu)
    res_freq = client.get("/api/master-data/frequencies", headers=doctor_headers)
    assert res_freq.status_code == 200
    freq_items = res_freq.json()["items"]
    assert any("صبح و شام" in f["urdu_label"] for f in freq_items)
    assert any("حسب ضرورت" in f["urdu_label"] for f in freq_items)

    # Dosages
    res_dos = client.get("/api/master-data/dosages", headers=doctor_headers)
    assert res_dos.status_code == 200
    dos_items = res_dos.json()["items"]
    assert any(d["name"] == "1" for d in dos_items)
    assert any(d["name"] == "½" for d in dos_items)

    # Instructions
    res_ins = client.get("/api/master-data/instructions", headers=doctor_headers)
    assert res_ins.status_code == 200
    ins_items = res_ins.json()["items"]
    assert any("کھانے کے بعد" in i["urdu_label"] for i in ins_items)
    assert any("خالی پیٹ" in i["urdu_label"] for i in ins_items)

    # Follow-ups
    res_fu = client.get("/api/master-data/follow-ups", headers=doctor_headers)
    assert res_fu.status_code == 200
    fu_items = res_fu.json()["items"]
    assert any("1 ہفتے بعد" in f["urdu_label"] for f in fu_items)
    assert any("1 ماہ بعد" in f["urdu_label"] for f in fu_items)


# -------------------------------------------------------------
# 7. Security & Authorization Tests
# -------------------------------------------------------------
def test_unauthenticated_requests_rejected():
    """Verify that unauthenticated calls return 401 (Section 63)."""
    assert client.get("/api/master-data/symptoms").status_code == 401
    assert client.post("/api/master-data/symptoms", json={}).status_code == 401
    assert client.get("/api/master-data/medicines").status_code == 401
    assert client.post("/api/master-data/medicines", json={}).status_code == 401
    assert client.get("/api/master-data/frequencies").status_code == 401
    assert client.patch("/api/master-data/symptoms/1/status", json={"is_active": False}).status_code == 401


def test_staff_role_cannot_modify_master_data(staff_headers):
    """Verify that non-doctor/non-admin staff cannot create or modify master data (Section 57)."""
    res = client.post(
        "/api/master-data/symptoms",
        json={"name": "Staff Unauthorized Symptom"},
        headers=staff_headers
    )
    assert res.status_code == 403

    res_patch = client.patch(
        "/api/master-data/symptoms/1",
        json={"name": "Staff Update Attempt"},
        headers=staff_headers
    )
    assert res_patch.status_code == 403
