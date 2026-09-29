import os
import random
import pytest
from datetime import datetime, timezone
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
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_patient(auth_headers):
    res = client.post(
        "/api/patients",
        headers=auth_headers,
        json={
            "full_name": "Tariq Mahmood",
            "age": 48,
            "gender": "Male",
            "mobile_number": unique_phone(),
            "cnic": unique_cnic(),
            "confirm_duplicate": True,
        },
    )
    assert res.status_code in [200, 201], res.text
    return res.json()


@pytest.fixture
def another_patient(auth_headers):
    res = client.post(
        "/api/patients",
        headers=auth_headers,
        json={
            "full_name": "Ayesha Bibi",
            "age": 35,
            "gender": "Female",
            "mobile_number": unique_phone(),
            "cnic": unique_cnic(),
            "confirm_duplicate": True,
        },
    )
    assert res.status_code in [200, 201], res.text
    return res.json()


def _create_consultation(auth_headers, test_patient):
    create_payload = {
        "patient_id": test_patient["patient_id"],
        "consultation_date": datetime.now(timezone.utc).isoformat(),
        "patient_state_name": "Alert & Stable",
        "symptom_notes": "Mild morning stiffness",
        "power_text": "Upper limbs 5/5, Lower limbs 4/5 right, 5/5 left",
        "mmse_score": 28,
        "gcs_score": 15,
        "additional_observations": "Patient is responsive and cooperative throughout examination.",
        "clinical_description": "Initial presentation of tension headache with cervical muscle spasm.\nNo focal neurological deficit found.",
        "additional_examination": "Fundoscopy normal, visual fields intact.",
        "treatment_plan": "Start oral muscle relaxant and NSAID. Review in 1 week.",
        "follow_up_period": "1 ہفتہ بعد",
        "follow_up_instructions": "Take medication after meals. Report if severe headache persists.",
        "vitals": {
            "systolic_bp": 120,
            "diastolic_bp": 80,
            "pulse_rate": 74,
            "temperature": 37.0,
            "oxygen_saturation": 98,
            "nihss_score": 0,
            "fall_risk_status": "Done",
            "fall_risk_notes": "Patient passed 10-step heel-to-toe test safely",
        },
        "symptoms": [
            {"symptom_name": "Headache", "category": "Neurological"},
            {"symptom_name": "Neck Pain", "category": "Musculoskeletal"},
        ],
        "examinations": [
            {
                "category": "Motor Functions",
                "item_name": "Motor Functions",
                "finding": "Normal bulk, tone intact",
                "status": "Done",
                "observation": "Symmetric strength",
            },
            {
                "category": "Sensory Examination",
                "item_name": "Pain & Sensation",
                "finding": "Intact to pinprick bilaterally",
                "status": "Done",
            },
            {
                "category": "Cranial Nerves",
                "item_name": "CN II-XII",
                "finding": "All cranial nerves grossly intact",
                "status": "Done",
            },
        ],
        "diagnostic_tests": [
            {"test_name": "MRI Brain with Contrast", "category": "Imaging"},
            {"test_name": "Serum Electrolytes", "category": "Laboratory"},
        ],
        "prescriptions": [
            {
                "medicine_name": "Tab Panadol 500mg",
                "dosage": "1 tablet",
                "frequency_name": "صبح، دوپہر، شام",
                "duration_days": 5,
                "instruction_name": "کھانے کے بعد",
            },
            {
                "medicine_name": "Tab Myonal 50mg",
                "dosage": "1 tablet",
                "frequency_name": "صبح، شام",
                "duration_days": 7,
                "instruction_name": "کھانے کے بعد",
            },
        ],
    }

    res = client.post("/api/consultations", headers=auth_headers, json=create_payload)
    assert res.status_code in [200, 201], f"Create failed: {res.text}"
    created = res.json()
    assert created["consultation_id"].startswith("CNS-")
    assert created["patient"]["patient_id"] == test_patient["patient_id"]
    return created


# ==================================================
# TEST 1 — CREATE CONSULTATION WITH ALL SECTIONS
# ==================================================
def test_create_consultation_all_sections(auth_headers, test_patient):
    """
    TEST 1 — CREATE
    Enter representative values in:
    - Vital Signs (BP, Pulse, Temp, Oxygen, NIHSS, Fall Risk)
    - Symptoms
    - Neurological Examination & Sensory
    - Diagnostic Tests
    - Prescription with 2 medicines
    - Clinical Description
    - Follow-Up
    Expected: Consultation saved successfully.
    """
    created = _create_consultation(auth_headers, test_patient)

    # Verify vitals
    vitals = created.get("vitals")
    assert vitals is not None
    assert vitals["systolic_bp"] == 120
    assert vitals["diastolic_bp"] == 80
    assert vitals["pulse_rate"] == 74
    assert vitals["temperature"] == 37.0
    assert vitals["oxygen_saturation"] == 98
    assert vitals["nihss_score"] == 0
    assert vitals["fall_risk_status"] == "Done"

    # Verify symptoms
    symptoms = created.get("symptoms", [])
    assert len(symptoms) == 2
    sym_names = {s["symptom_name"] for s in symptoms}
    assert "Headache" in sym_names
    assert "Neck Pain" in sym_names

    # Verify examinations
    exams = created.get("examinations", [])
    assert len(exams) == 3

    # Verify diagnostic tests
    diag = created.get("diagnostic_tests", [])
    assert len(diag) == 2

    # Verify prescriptions
    prescriptions = created.get("prescriptions", [])
    assert len(prescriptions) == 2
    med_names = {p["medicine_name"] for p in prescriptions}
    assert "Tab Panadol 500mg" in med_names
    assert "Tab Myonal 50mg" in med_names

    # Verify clinical description and follow-up
    assert "tension headache" in created["clinical_description"]
    assert created["follow_up_period"] == "1 ہفتہ بعد"


# ==================================================
# TEST 2 — RELOAD CONSULTATION
# ==================================================
def test_reload_consultation(auth_headers, test_patient):
    """
    TEST 2 — RELOAD
    Open the saved consultation again.
    Expected: All saved values are still present.
    """
    created = _create_consultation(auth_headers, test_patient)
    cid = created["consultation_id"]

    # Fetch by consultation ID
    res = client.get(f"/api/consultations/{cid}", headers=auth_headers)
    assert res.status_code == 200, res.text
    reloaded = res.json()

    assert reloaded["consultation_id"] == cid
    assert reloaded["patient"]["patient_id"] == test_patient["patient_id"]

    # Check vitals
    assert reloaded["vitals"]["systolic_bp"] == 120
    assert reloaded["vitals"]["diastolic_bp"] == 80
    assert reloaded["vitals"]["pulse_rate"] == 74
    assert reloaded["vitals"]["fall_risk_status"] == "Done"

    # Check symptoms
    assert len(reloaded["symptoms"]) == 2

    # Check examinations & power
    assert len(reloaded["examinations"]) == 3
    assert "Upper limbs 5/5" in reloaded["power_text"]
    assert reloaded["mmse_score"] == 28
    assert reloaded["gcs_score"] == 15

    # Check diagnostic tests
    assert len(reloaded["diagnostic_tests"]) == 2

    # Check prescriptions
    assert len(reloaded["prescriptions"]) == 2

    # Check clinical description with preserved line breaks
    assert "\n" in reloaded["clinical_description"]
    assert reloaded["follow_up_period"] == "1 ہفتہ بعد"


# ==================================================
# TEST 3 — EDIT CONSULTATION (NO DUPLICATE MEDICINES)
# ==================================================
def test_edit_consultation_no_duplicates(auth_headers, test_patient):
    """
    TEST 3 — EDIT
    Change:
    - One vital sign (systolic BP from 120 to 130)
    - One symptom/examination value (Change symptom to Migraine, update exam)
    - One medicine (Replace Tab Panadol with Tab Sibelium)
    Save.
    Expected:
    Updated values are saved.
    No duplicate prescription rows.
    """
    created = _create_consultation(auth_headers, test_patient)
    cid = created["consultation_id"]

    update_payload = {
        "patient_id": test_patient["patient_id"],
        "consultation_date": created["consultation_date"],
        "patient_state_name": "Improving",
        "power_text": "Normal power 5/5 all limbs",
        "mmse_score": 29,
        "gcs_score": 15,
        "clinical_description": "Follow-up review. Headache responding well to therapy.\nBlood pressure slightly elevated.",
        "follow_up_period": "2 ہفتے بعد",
        "follow_up_instructions": "Continue preventive medication.",
        "vitals": {
            "systolic_bp": 130,  # Changed from 120
            "diastolic_bp": 82,
            "pulse_rate": 72,
            "temperature": 36.8,
            "oxygen_saturation": 99,
            "nihss_score": 0,
            "fall_risk_status": "Done",
        },
        "symptoms": [
            {"symptom_name": "Migraine without Aura", "category": "Neurological"},  # Changed
        ],
        "examinations": [
            {
                "category": "Motor Functions",
                "item_name": "Motor Functions",
                "finding": "Symmetric, full 5/5 strength",
                "status": "Done",
            }
        ],
        "diagnostic_tests": [
            {"test_name": "MRI Brain with Contrast", "category": "Imaging"},
        ],
        "prescriptions": [
            {
                "medicine_name": "Tab Sibelium 5mg",  # Replaced Panadol
                "dosage": "1 tablet",
                "frequency_name": "رات کو سوتے وقت",
                "duration_days": 30,
                "instruction_name": "کھانے کے بعد",
            },
            {
                "medicine_name": "Tab Myonal 50mg",  # Retained
                "dosage": "1 tablet",
                "frequency_name": "صبح، شام",
                "duration_days": 7,
                "instruction_name": "کھانے کے بعد",
            },
        ],
    }

    res = client.put(f"/api/consultations/{cid}", headers=auth_headers, json=update_payload)
    assert res.status_code == 200, f"Update failed: {res.text}"
    updated = res.json()

    # Verify updated vital
    assert updated["vitals"]["systolic_bp"] == 130
    assert updated["vitals"]["pulse_rate"] == 72

    # Verify updated symptom
    assert len(updated["symptoms"]) == 1
    assert updated["symptoms"][0]["symptom_name"] == "Migraine without Aura"

    # Verify prescriptions: EXACTLY 2 items, NO DUPLICATES!
    prescriptions = updated["prescriptions"]
    assert len(prescriptions) == 2, f"Expected 2 prescriptions, found {len(prescriptions)}"
    med_names = [p["medicine_name"] for p in prescriptions]
    assert "Tab Sibelium 5mg" in med_names
    assert "Tab Myonal 50mg" in med_names
    assert "Tab Panadol 500mg" not in med_names

    # Verify DB directly via GET to ensure persistence
    get_res = client.get(f"/api/consultations/{cid}", headers=auth_headers)
    assert get_res.status_code == 200
    db_record = get_res.json()
    assert len(db_record["prescriptions"]) == 2
    assert db_record["vitals"]["systolic_bp"] == 130


# ==================================================
# TEST 4 — CONSULTATION HISTORY IN PATIENT PROFILE
# ==================================================
def test_consultation_history_appears_immediately(auth_headers, test_patient):
    """
    TEST 4 — HISTORY
    Return to patient profile.
    Expected:
    The consultation appears in Consultation History immediately.
    """
    created = _create_consultation(auth_headers, test_patient)
    cid = created["consultation_id"]
    pid = test_patient["patient_id"]

    res = client.get(f"/api/patients/{pid}/consultations", headers=auth_headers)
    assert res.status_code == 200, res.text
    history = res.json()
    assert isinstance(history, list)
    assert len(history) >= 1

    consultation_ids = [item["consultation_id"] for item in history]
    assert cid in consultation_ids

    # Find the specific history summary item
    item = next(c for c in history if c["consultation_id"] == cid)
    assert item["has_vitals"] is True
    assert "120" in item["bp_formatted"] and "80" in item["bp_formatted"]
    assert item["prescription_count"] == 2


# ==================================================
# TEST 5 — REPORT INTEGRATION
# ==================================================
def test_report_contains_consultation_and_prescriptions(auth_headers, test_patient):
    """
    TEST 5 — REPORT
    Open View Report.
    Expected:
    The report metadata and content contain actual saved consultation data.
    Prescription must appear.
    """
    created = _create_consultation(auth_headers, test_patient)
    cid = created["consultation_id"]

    # 1. Fetch report metadata
    res = client.get(f"/api/consultations/{cid}/report", headers=auth_headers)
    assert res.status_code == 200, res.text
    report_data = res.json()
    assert report_data["consultation_id"] == created["id"]
    assert report_data["patient_id"] == created["patient_id"]
    assert report_data["file_name"].endswith(".pdf")

    # 2. Fetch full consultation detail to verify report-ready payload
    detail_res = client.get(f"/api/consultations/{cid}", headers=auth_headers)
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert len(detail["prescriptions"]) == 2
    assert detail["patient"]["full_name"] == test_patient["full_name"]
    assert detail["vitals"]["systolic_bp"] == 120


# ==================================================
# TEST 6 — PDF GENERATION & DOWNLOAD
# ==================================================
def test_pdf_generation_and_download(auth_headers, test_patient):
    """
    TEST 6 — PDF
    Generate/download the report.
    Expected:
    The PDF contains the saved prescription and consultation information.
    Valid PDF header and non-empty byte stream.
    """
    created = _create_consultation(auth_headers, test_patient)
    cid = created["consultation_id"]

    # Download PDF
    res = client.get(f"/api/consultations/{cid}/report/download", headers=auth_headers)
    assert res.status_code == 200, res.text
    assert res.headers["content-type"] == "application/pdf"
    assert "attachment" in res.headers.get("content-disposition", "")
    assert res.content.startswith(b"%PDF-")
    assert len(res.content) > 1000  # Valid non-empty PDF


# ==================================================
# SECURITY & PATIENT CONTEXT INTEGRITY
# ==================================================
def test_patient_cross_access_security(auth_headers, test_patient, another_patient):
    """
    Ensure Consultation belonging to Patient A cannot be retrieved via Patient B's route,
    and cannot be reassigned to Patient B during update.
    """
    created = _create_consultation(auth_headers, test_patient)
    cid = created["consultation_id"]

    # 1. Accessing Patient A's consultation via Patient B's route MUST return 404
    bad_route_res = client.get(
        f"/api/patients/{another_patient['patient_id']}/consultations/{cid}",
        headers=auth_headers
    )
    assert bad_route_res.status_code == 404
    err_msg = bad_route_res.json().get("message", "")
    assert "not found for patient" in err_msg.lower()

    # 2. Accessing Patient A's consultation with Patient A's route MUST succeed
    good_route_res = client.get(
        f"/api/patients/{test_patient['patient_id']}/consultations/{cid}",
        headers=auth_headers
    )
    assert good_route_res.status_code == 200

    # 3. Trying to reassign consultation to Patient B on update MUST return 400
    tamper_payload = {
        "patient_id": another_patient["patient_id"],  # Trying to switch patient
        "vitals": {"systolic_bp": 120},
    }
    update_res = client.put(f"/api/consultations/{cid}", headers=auth_headers, json=tamper_payload)
    assert update_res.status_code == 400
    err_msg = update_res.json().get("message", "")
    assert "cannot reassign" in err_msg.lower()
