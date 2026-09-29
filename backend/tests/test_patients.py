import time
import random
import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def unique_phone():
    return f"03{random.randint(10, 49)}-{random.randint(1000000, 9999999)}"


def unique_cnic():
    return f"37405-{random.randint(1000000, 9999999)}-{random.randint(1, 9)}"


@pytest.fixture
def auth_headers():
    res = client.post(
        "/api/auth/login",
        json={"username_or_email": "drrauf", "password": "Doctor@123"}
    )
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_register_patient_success(auth_headers):
    phone = unique_phone()
    cnic = unique_cnic()
    payload = {
        "full_name": f"Tariq Mahmood {random.randint(100, 999)}",
        "age": 45,
        "gender": "Male",
        "mobile_number": phone,
        "cnic": cnic
    }
    response = client.post("/api/patients", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["age"] == 45
    assert data["gender"] == "Male"
    assert data["patient_id"].startswith("DRN-")
    assert len(data["patient_id"]) == 10  # DRN-000001 is 10 chars
    assert data["is_active"] is True
    assert data["cnic"] == cnic


def test_register_patient_without_cnic(auth_headers):
    phone = unique_phone()
    payload = {
        "full_name": f"Fatima Bibi {random.randint(100, 999)}",
        "age": 32,
        "gender": "Female",
        "mobile_number": phone,
        "cnic": ""
    }
    response = client.post("/api/patients", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["cnic"] is None


def test_register_patient_validation_errors(auth_headers):
    # Reject empty name
    res1 = client.post(
        "/api/patients",
        json={"full_name": "   ", "age": 40, "gender": "Male", "mobile_number": "03001234567"},
        headers=auth_headers
    )
    assert res1.status_code == 422

    # Reject negative age
    res2 = client.post(
        "/api/patients",
        json={"full_name": "Valid Name", "age": -5, "gender": "Male", "mobile_number": "03001234567"},
        headers=auth_headers
    )
    assert res2.status_code == 422

    # Reject invalid CNIC format
    res3 = client.post(
        "/api/patients",
        json={"full_name": "Valid Name", "age": 40, "gender": "Male", "mobile_number": "03001234567", "cnic": "12345"},
        headers=auth_headers
    )
    assert res3.status_code == 422


def test_duplicate_patient_warning_and_confirm(auth_headers):
    phone = unique_phone()
    name = f"Duplicate Test Patient {random.randint(100, 999)}"
    # Create first patient
    res1 = client.post(
        "/api/patients",
        json={"full_name": name, "age": 28, "gender": "Male", "mobile_number": phone},
        headers=auth_headers
    )
    assert res1.status_code == 201
    first_patient_id = res1.json()["patient_id"]

    # Attempt to create duplicate with same mobile
    res2 = client.post(
        "/api/patients",
        json={"full_name": name, "age": 28, "gender": "Male", "mobile_number": phone},
        headers=auth_headers
    )
    assert res2.status_code == 409
    dup_data = res2.json()
    assert dup_data["error_code"] == "DUPLICATE_PATIENT_WARNING"
    assert dup_data["details"]["is_duplicate"] is True
    assert dup_data["details"]["existing_patient"]["patient_id"] == first_patient_id

    # Confirm duplicate creation
    res3 = client.post(
        "/api/patients",
        json={"full_name": name, "age": 28, "gender": "Male", "mobile_number": phone, "confirm_duplicate": True},
        headers=auth_headers
    )
    assert res3.status_code == 201
    second_patient_id = res3.json()["patient_id"]
    assert second_patient_id != first_patient_id


def test_get_patient_by_id(auth_headers):
    phone = unique_phone()
    # Register patient
    res = client.post(
        "/api/patients",
        json={"full_name": f"Zubair Shah {random.randint(100, 999)}", "age": 55, "gender": "Male", "mobile_number": phone},
        headers=auth_headers
    )
    assert res.status_code == 201
    pid = res.json()["patient_id"]

    # Fetch
    fetch_res = client.get(f"/api/patients/{pid}", headers=auth_headers)
    assert fetch_res.status_code == 200
    assert fetch_res.json()["patient_id"] == pid


def test_search_and_list_patients(auth_headers):
    unique_term = f"UniqueNeuro{random.randint(1000, 9999)}"
    phone = unique_phone()
    # Register distinct patient
    client.post(
        "/api/patients",
        json={"full_name": unique_term, "age": 60, "gender": "Female", "mobile_number": phone},
        headers=auth_headers
    )

    # Search by full name
    search_res = client.get(f"/api/patients?search={unique_term}", headers=auth_headers)
    assert search_res.status_code == 200
    data = search_res.json()
    assert data["total"] >= 1
    assert any(p["full_name"] == unique_term for p in data["items"])


def test_update_patient(auth_headers):
    phone = unique_phone()
    res = client.post(
        "/api/patients",
        json={"full_name": "Original Name", "age": 40, "gender": "Male", "mobile_number": phone},
        headers=auth_headers
    )
    assert res.status_code == 201
    pid = res.json()["patient_id"]

    # Update age and name
    patch_res = client.patch(
        f"/api/patients/{pid}",
        json={"full_name": "Updated Name", "age": 41},
        headers=auth_headers
    )
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["full_name"] == "Updated Name"
    assert updated["age"] == 41
    # Verify patient_id is unchanged
    assert updated["patient_id"] == pid


def test_deactivate_patient(auth_headers):
    phone = unique_phone()
    record_name = f"TempRecord{random.randint(1000, 9999)}"
    res = client.post(
        "/api/patients",
        json={"full_name": record_name, "age": 25, "gender": "Other", "mobile_number": phone},
        headers=auth_headers
    )
    assert res.status_code == 201
    pid = res.json()["patient_id"]

    # Deactivate
    status_res = client.patch(
        f"/api/patients/{pid}/status",
        json={"is_active": False},
        headers=auth_headers
    )
    assert status_res.status_code == 200
    assert status_res.json()["is_active"] is False

    # Check active list excludes it
    active_list = client.get(f"/api/patients?search={record_name}&is_active=true", headers=auth_headers)
    assert active_list.json()["total"] == 0

    # Still accessible directly by ID
    get_res = client.get(f"/api/patients/{pid}", headers=auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["is_active"] is False


def test_unauthenticated_patient_endpoints_rejected():
    """Verify that unauthenticated requests to all patient endpoints return 401 Unauthorized (Section 35 & 52)."""
    assert client.get("/api/patients").status_code == 401
    assert client.post("/api/patients", json={}).status_code == 401
    assert client.get("/api/patients/DRN-000001").status_code == 401
    assert client.patch("/api/patients/DRN-000001", json={}).status_code == 401
    assert client.patch("/api/patients/DRN-000001/status", json={"is_active": False}).status_code == 401


def test_patient_gender_filter(auth_headers):
    """Verify filtering patients by gender (Section 45)."""
    unique_suffix = f"Gnd_{uuid.uuid4().hex[:8]}"
    # Register a female patient
    client.post(
        "/api/patients",
        json={"full_name": f"Amina Bibi {unique_suffix}", "age": 29, "gender": "Female", "mobile_number": unique_phone()},
        headers=auth_headers
    )
    # Register a male patient
    client.post(
        "/api/patients",
        json={"full_name": f"Bilal Khan {unique_suffix}", "age": 42, "gender": "Male", "mobile_number": unique_phone()},
        headers=auth_headers
    )

    res_female = client.get(f"/api/patients?search={unique_suffix}&gender=Female", headers=auth_headers)
    assert res_female.status_code == 200
    female_items = res_female.json()["items"]
    assert len(female_items) == 1
    assert female_items[0]["gender"] == "Female"

    res_male = client.get(f"/api/patients?search={unique_suffix}&gender=Male", headers=auth_headers)
    assert res_male.status_code == 200
    male_items = res_male.json()["items"]
    assert len(male_items) == 1
    assert male_items[0]["gender"] == "Male"


def test_patient_sorting(auth_headers):
    """Verify sorting patients by name (Section 28)."""
    res_asc = client.get("/api/patients?sort_by=full_name&sort_order=asc&page_size=5", headers=auth_headers)
    assert res_asc.status_code == 200
    names_asc = [p["full_name"].lower() for p in res_asc.json()["items"]]
    assert names_asc == sorted(names_asc)

    res_desc = client.get("/api/patients?sort_by=full_name&sort_order=desc&page_size=5", headers=auth_headers)
    assert res_desc.status_code == 200
    names_desc = [p["full_name"].lower() for p in res_desc.json()["items"]]
    assert names_desc == sorted(names_desc, reverse=True)


def test_patient_not_found(auth_headers):
    """Verify 404 for non-existent patient (Section 39)."""
    res = client.get("/api/patients/DRN-999999", headers=auth_headers)
    assert res.status_code == 404

