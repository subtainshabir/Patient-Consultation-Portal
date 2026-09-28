import random
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



@pytest.fixture
def sample_patient(auth_headers):
    # Register a generic sample patient
    res = client.post(
        "/api/patients",
        headers=auth_headers,
        json={
            "full_name": "Sample Test Patient",
            "age": 48,
            "gender": "Male",
            "mobile_number": unique_phone(),
            "cnic": unique_cnic(),
            "confirm_duplicate": True,
        },
    )
    assert res.status_code in [201, 200]
    return res.json()



def test_get_consultation_server_date(auth_headers):
    res = client.get("/api/consultations/current-date", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "server_date" in data
    assert "formatted_date" in data
    assert "iso_timestamp" in data


def test_get_consultations_unauthorized():
    res = client.get("/api/consultations")
    assert res.status_code == 401


def test_empty_patient_consultation_history(auth_headers, sample_patient):
    patient_id = sample_patient["patient_id"]
    res = client.get(f"/api/patients/{patient_id}/consultations", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) == 0


def test_create_and_get_consultation_full(auth_headers, sample_patient):
    patient_id = sample_patient["patient_id"]

    # 1. Create a complete consultation
    payload = {
        "patient_id": patient_id,
        "patient_state_name": "Stable",
        "symptom_notes": "Patient reports intermittent headache and occasional dizziness for 2 weeks.",
        "power_text": "5/5 across all 4 extremities",
        "mmse_score": 29,
        "gcs_score": 15,
        "additional_observations": "Patient is alert, well-oriented, and cooperative. No signs of meningeal irritation.",
        "vitals": {
            "systolic_bp": 120,
            "diastolic_bp": 80,
            "pulse_rate": 72,
            "temperature": 36.8,
            "oxygen_saturation": 99,
            "nihss_score": 0,
            "fall_risk_status": "Done",
            "fall_risk_notes": "Low risk, steady unassisted ambulation",
        },
        "symptoms": [
            {"symptom_name": "Headache", "category": "General"},
            {"symptom_name": "Dizziness", "category": "General"},
            {"symptom_name": "New Custom Tension Symptom", "category": "General"},  # Auto-registers in master data
        ],
        "examinations": [
            {
                "category": "Motor Examination",
                "item_name": "Motor Functions",
                "finding": "Normal",
                "status": "Done",
                "observation": "Good bulk and tone",
            },
            {
                "category": "Motor Examination",
                "item_name": "Muscle Tone",
                "finding": "Normal",
                "status": "Done",
            },
            {
                "category": "Motor Examination",
                "item_name": "Right Upper Limb",
                "finding": "5/5 - Normal power",
                "status": "Done",
            },
            {
                "category": "Reflexes",
                "item_name": "Reflexes",
                "finding": "Normal (+2)",
                "status": "Done",
                "observation": "Biceps, triceps, and knee jerks brisk and equal",
            },
            {
                "category": "Special Tests",
                "item_name": "Fundoscopy",
                "finding": None,
                "status": "Not Done",
                "observation": "Equipment unavailable in room",
            },
        ],
    }

    res = client.post("/api/consultations", headers=auth_headers, json=payload)
    assert res.status_code == 201
    created = res.json()

    assert created["consultation_id"].startswith("CNS-")
    assert created["mmse_score"] == 29
    assert created["gcs_score"] == 15
    assert created["power_text"] == "5/5 across all 4 extremities"

    # Check vitals
    assert created["vitals"] is not None
    assert created["vitals"]["systolic_bp"] == 120
    assert created["vitals"]["diastolic_bp"] == 80
    assert created["vitals"]["temperature"] == 36.8
    assert created["vitals"]["fall_risk_status"] == "Done"

    # Check symptoms
    assert len(created["symptoms"]) == 3
    symptom_names = [s["symptom_name"] for s in created["symptoms"]]
    assert "Headache" in symptom_names
    assert "New Custom Tension Symptom" in symptom_names

    # Check examinations
    assert len(created["examinations"]) == 5
    not_done_item = next(e for e in created["examinations"] if e["item_name"] == "Fundoscopy")
    assert not_done_item["status"] == "Not Done"

    # 2. Verify custom symptom is in master data
    sym_res = client.get("/api/master-data/symptoms?search=New Custom Tension Symptom", headers=auth_headers)
    assert sym_res.status_code == 200
    assert sym_res.json()["total"] >= 1

    # 3. Retrieve consultation by ID
    c_id = created["consultation_id"]
    get_res = client.get(f"/api/consultations/{c_id}", headers=auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["consultation_id"] == c_id

    # 4. Check patient consultation history
    hist_res = client.get(f"/api/patients/{patient_id}/consultations", headers=auth_headers)
    assert hist_res.status_code == 200
    hist = hist_res.json()
    assert len(hist) >= 1
    assert hist[0]["consultation_id"] == c_id
    assert hist[0]["bp_formatted"] == "120 / 80 mmHg"
    assert hist[0]["symptom_count"] == 3


def test_create_consultation_validation_errors(auth_headers, sample_patient):
    patient_id = sample_patient["patient_id"]

    # Invalid pulse rate (negative)
    res = client.post(
        "/api/consultations",
        headers=auth_headers,
        json={"patient_id": patient_id, "vitals": {"pulse_rate": -10}},
    )
    assert res.status_code == 422

    # Invalid MMSE score (> 30)
    res2 = client.post(
        "/api/consultations",
        headers=auth_headers,
        json={"patient_id": patient_id, "mmse_score": 35},
    )
    assert res2.status_code == 422

    # Invalid GCS score (< 3)
    res3 = client.post(
        "/api/consultations",
        headers=auth_headers,
        json={"patient_id": patient_id, "gcs_score": 2},
    )
    assert res3.status_code == 422

    # Patient not found
    res4 = client.post(
        "/api/consultations",
        headers=auth_headers,
        json={"patient_id": "NON-EXISTENT-PT-999"},
    )
    assert res4.status_code == 404


def test_phase5_diagnostic_tests_and_assessment(auth_headers, sample_patient):
    patient_id = sample_patient["patient_id"]

    payload = {
        "patient_id": patient_id,
        "patient_state_name": "Stable",
        "clinical_description": "48yo male presenting with subacute headaches. Clinical impression: tension-type headache with migrainous features.",
        "additional_examination": "General exam: Hydrated, normotensive, no peripheral edema. Cardiorespiratory exam normal.",
        "treatment_plan": "Reassurance, sleep hygiene, hydration, stress management. Await MRI results before follow-up.",
        "diagnostic_tests": [
            {
                "test_name": "MRI Brain",
                "category": "Imaging",
                "status": "Ordered",
                "clinical_indication": "Evaluation of recurrent episodic headaches",
            },
            {
                "test_name": "New Autoimmune Neuro Panel",  # Custom unlisted test
                "category": "Laboratory",
                "status": "Pending",
            },
            {
                "test_name": "CBC",
                "category": "Laboratory",
                "status": "Completed",
                "clinical_indication": "Routine baseline profile",
                "result": "Hb: 14.5 g/dL, TLC: 7,200, Platelets: 250,000",
                "result_date": "2026-09-29T10:00:00Z",
                "doctor_notes": "Hematology parameters within reference range",
            },
        ],
    }

    res = client.post("/api/consultations", headers=auth_headers, json=payload)
    assert res.status_code == 201
    created = res.json()
    c_id = created["consultation_id"]

    # Verify Phase 5 text fields
    assert created["clinical_description"] == payload["clinical_description"]
    assert created["additional_examination"] == payload["additional_examination"]
    assert created["treatment_plan"] == payload["treatment_plan"]

    # Verify diagnostic tests
    tests = created["diagnostic_tests"]
    assert len(tests) == 3
    test_names = [t["test_name"] for t in tests]
    assert "MRI Brain" in test_names
    assert "New Autoimmune Neuro Panel" in test_names
    assert "CBC" in test_names

    cbc_test = next(t for t in tests if t["test_name"] == "CBC")
    assert cbc_test["status"] == "Completed"
    assert "14.5 g/dL" in cbc_test["result"]
    assert cbc_test["doctor_notes"] == "Hematology parameters within reference range"

    # Verify custom test auto-registered into master data
    master_res = client.get("/api/master-data/diagnostic-tests?search=New Autoimmune Neuro Panel", headers=auth_headers)
    assert master_res.status_code == 200
    assert master_res.json()["total"] >= 1

    # Verify GET returns all Phase 5 data
    get_res = client.get(f"/api/consultations/{c_id}", headers=auth_headers)
    assert get_res.status_code == 200
    retrieved = get_res.json()
    assert len(retrieved["diagnostic_tests"]) == 3
    assert retrieved["treatment_plan"] == payload["treatment_plan"]


def test_phase5_edit_consultation(auth_headers, sample_patient):
    patient_id = sample_patient["patient_id"]

    # 1. Create consultation
    initial_payload = {
        "patient_id": patient_id,
        "patient_state_name": "Stable",
        "clinical_description": "Initial assessment.",
        "treatment_plan": "Initial treatment plan.",
        "diagnostic_tests": [
            {
                "test_name": "EEG",
                "category": "Neurological",
                "status": "Ordered",
            }
        ],
    }
    create_res = client.post("/api/consultations", headers=auth_headers, json=initial_payload)
    assert create_res.status_code == 201
    c_id = create_res.json()["consultation_id"]

    # 2. Update consultation via PUT
    updated_payload = {
        "patient_id": patient_id,
        "patient_state_name": "Improving",
        "clinical_description": "Updated clinical assessment: Significant improvement reported.",
        "additional_examination": "Neck supple, Kernig sign negative.",
        "treatment_plan": "Continue current supportive measures. Review in 1 month.",
        "diagnostic_tests": [
            {
                "test_name": "EEG",
                "category": "Neurological",
                "status": "Reviewed",
                "result": "Normal background activity with no epileptiform discharges.",
                "doctor_notes": "Reassuring study.",
            },
            {
                "test_name": "MRI Brain",
                "category": "Imaging",
                "status": "Completed",
                "result": "No acute intracranial pathology.",
            },
        ],
    }

    put_res = client.put(f"/api/consultations/{c_id}", headers=auth_headers, json=updated_payload)
    assert put_res.status_code == 200
    updated = put_res.json()

    assert updated["patient_state_name"] == "Improving"
    assert "Significant improvement" in updated["clinical_description"]
    assert updated["additional_examination"] == "Neck supple, Kernig sign negative."
    assert len(updated["diagnostic_tests"]) == 2

    eeg_test = next(t for t in updated["diagnostic_tests"] if t["test_name"] == "EEG")
    assert eeg_test["status"] == "Reviewed"
    assert "Normal background" in eeg_test["result"]


def test_phase5_diagnostic_test_status_validation(auth_headers, sample_patient):
    patient_id = sample_patient["patient_id"]

    invalid_payload = {
        "patient_id": patient_id,
        "diagnostic_tests": [
            {
                "test_name": "MRI Brain",
                "status": "InvalidStatusNotAllowed",
            }
        ],
    }
    res = client.post("/api/consultations", headers=auth_headers, json=invalid_payload)
    assert res.status_code == 422


# =========================================================================
# Phase 6: Prescription Management Tests
# =========================================================================

def test_phase6_prescription_creation_and_retrieval(auth_headers, sample_patient):
    patient_id = sample_patient["patient_id"]

    payload = {
        "patient_id": patient_id,
        "patient_state_name": "Stable",
        "clinical_description": "Essential tremor with mild sensory neuropathy.",
        "treatment_plan": "Start pharmacological therapy and schedule review in 4 weeks.",
        "prescriptions": [
            {
                "medicine_name": "Gabapentin",
                "frequency_name": "صبح و شام",
                "dosage": "1 capsule",
                "duration_days": 30,
                "instruction_name": "کھانے کے بعد",
                "custom_instruction": "Take with full glass of water",
                "sort_order": 0,
            },
            {
                "medicine_name": "Propranolol",
                "frequency_name": "صبح، دوپہر، شام",
                "dosage": "1 tablet",
                "duration_days": 14,
                "instruction_name": "کھانے سے پہلے",
                "sort_order": 1,
            },
        ],
    }

    create_res = client.post("/api/consultations", headers=auth_headers, json=payload)
    assert create_res.status_code == 201
    created = create_res.json()
    c_id = created["consultation_id"]

    assert len(created["prescriptions"]) == 2
    med1 = created["prescriptions"][0]
    assert med1["medicine_name"] == "Gabapentin"
    assert med1["dosage"] == "1 capsule"
    assert med1["duration_days"] == 30
    assert med1["frequency_name"] == "صبح و شام"
    assert med1["instruction_name"] == "کھانے کے بعد"
    assert med1["custom_instruction"] == "Take with full glass of water"

    med2 = created["prescriptions"][1]
    assert med2["medicine_name"] == "Propranolol"
    assert med2["dosage"] == "1 tablet"
    assert med2["duration_days"] == 14

    # Fetch individual consultation detail
    get_res = client.get(f"/api/consultations/{c_id}", headers=auth_headers)
    assert get_res.status_code == 200
    detail = get_res.json()
    assert len(detail["prescriptions"]) == 2

    # Check consultation history summary endpoint
    summary_res = client.get(f"/api/patients/{patient_id}/consultations", headers=auth_headers)
    assert summary_res.status_code == 200
    summaries = summary_res.json()
    matching_summary = next(s for s in summaries if s["consultation_id"] == c_id)
    assert matching_summary["prescription_count"] == 2


def test_phase6_prescription_update_and_atomic_replace(auth_headers, sample_patient):
    patient_id = sample_patient["patient_id"]

    # Initial consultation with 1 medicine
    initial_payload = {
        "patient_id": patient_id,
        "treatment_plan": "Initial trial of medication.",
        "prescriptions": [
            {
                "medicine_name": "Gabapentin",
                "frequency_name": "صبح و شام",
                "dosage": "1 capsule",
                "duration_days": 14,
                "instruction_name": "کھانے کے بعد",
                "sort_order": 0,
            }
        ],
    }
    create_res = client.post("/api/consultations", headers=auth_headers, json=initial_payload)
    assert create_res.status_code == 201
    c_id = create_res.json()["consultation_id"]

    # Update via PUT: Replace with 2 different medicines
    updated_payload = {
        "patient_id": patient_id,
        "treatment_plan": "Adjusted prescription based on follow-up.",
        "prescriptions": [
            {
                "medicine_name": "Pregabalin",
                "frequency_name": "رات",
                "dosage": "75 mg",
                "duration_days": 30,
                "instruction_name": "سونے سے پہلے",
                "sort_order": 0,
            },
            {
                "medicine_name": "Mecobalamin",
                "frequency_name": "روزانہ ایک بار",
                "dosage": "500 mcg",
                "duration_days": 60,
                "instruction_name": "صبح ناشتے کے بعد",
                "sort_order": 1,
            },
        ],
    }
    put_res = client.put(f"/api/consultations/{c_id}", headers=auth_headers, json=updated_payload)
    assert put_res.status_code == 200
    updated = put_res.json()

    assert len(updated["prescriptions"]) == 2
    pregabalin = next(m for m in updated["prescriptions"] if m["medicine_name"] == "Pregabalin")
    assert pregabalin["dosage"] == "75 mg"
    assert pregabalin["duration_days"] == 30
    assert pregabalin["frequency_name"] == "رات"

    # Confirm previous Gabapentin was replaced
    assert not any(m["medicine_name"] == "Gabapentin" for m in updated["prescriptions"])


def test_phase6_prescription_auto_register_custom_medicine(auth_headers, sample_patient):
    patient_id = sample_patient["patient_id"]
    custom_med_name = f"Custom Neuro Tonic {random.randint(1000, 9999)}"

    payload = {
        "patient_id": patient_id,
        "prescriptions": [
            {
                "medicine_name": custom_med_name,
                "frequency_name": "صبح و شام",
                "dosage": "10 ml",
                "duration_days": 10,
                "instruction_name": "کھانے کے بعد",
            }
        ],
    }
    create_res = client.post("/api/consultations", headers=auth_headers, json=payload)
    assert create_res.status_code == 201
    created = create_res.json()
    assert len(created["prescriptions"]) == 1
    assert created["prescriptions"][0]["medicine_name"] == custom_med_name
    assert created["prescriptions"][0]["medicine_id"] is not None

    # Verify that the new medicine is now available in master data
    med_list_res = client.get(f"/api/master-data/medicines?search={custom_med_name}", headers=auth_headers)
    assert med_list_res.status_code == 200
    items = med_list_res.json()["items"]
    assert any(m["name"] == custom_med_name for m in items)


def test_phase6_prescription_duration_validation(auth_headers, sample_patient):
    patient_id = sample_patient["patient_id"]

    invalid_payload = {
        "patient_id": patient_id,
        "prescriptions": [
            {
                "medicine_name": "Gabapentin",
                "frequency_name": "صبح و شام",
                "dosage": "1 capsule",
                "duration_days": 0,  # Invalid: must be >= 1
            }
        ],
    }
    res = client.post("/api/consultations", headers=auth_headers, json=invalid_payload)
    assert res.status_code == 422


