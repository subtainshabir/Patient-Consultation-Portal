from datetime import date, timedelta
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
        json={"username_or_email": "drrauf", "password": "Doctor@123"},
    )
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_phase7_consultation_history_and_follow_up(auth_headers: dict):
    headers = auth_headers

    # 1. Create a fresh patient
    patient_res = client.post(
        "/api/patients",
        json={
            "full_name": "Phase7 History Patient",
            "age": 50,
            "gender": "Female",
            "mobile_number": unique_phone(),
            "cnic": unique_cnic(),
            "confirm_duplicate": True,
        },
        headers=headers,
    )
    assert patient_res.status_code == 201
    patient = patient_res.json()
    p_id = patient["patient_id"]

    # 2. Verify 0 consultations
    hist_0 = client.get(f"/api/patients/{p_id}/consultations", headers=headers)
    assert hist_0.status_code == 200
    assert len(hist_0.json()) == 0

    # 3. Create Consultation #1 with Scheduled Follow-Up
    target_date = (date.today() + timedelta(days=14)).isoformat()
    c1_res = client.post(
        "/api/consultations",
        json={
            "patient_id": p_id,
            "patient_state_name": "Stable",
            "vitals": {
                "systolic_bp": 125,
                "diastolic_bp": 82,
                "pulse_rate": 74,
                "temperature": 37.1,
                "oxygen_saturation": 98,
            },
            "symptoms": [
                {"symptom_name": "Migraine", "category": "Headache"},
                {"symptom_name": "Photophobia", "category": "Visual"},
            ],
            "symptom_notes": "Unilateral throbbing headache with photophobia",
            "power_text": "5/5",
            "mmse_score": 30,
            "gcs_score": 15,
            "clinical_description": "Migraine without aura",
            "treatment_plan": "Hydration, dark room rest, avoid trigger foods",
            "prescriptions": [
                {
                    "medicine_name": "Sumatriptan 50mg",
                    "frequency_name": "حسبِ ضرورت",
                    "dosage": "1 tablet",
                    "duration_days": 10,
                    "instruction_name": "درد کے وقت",
                    "custom_instruction": "Take at onset of migraine",
                }
            ],
            "follow_up_option_id": 2,
            "follow_up_period": "2 ہفتے بعد",
            "follow_up_date": target_date,
            "follow_up_instructions": "Return after 2 weeks with headache diary.",
        },
        headers=headers,
    )
    assert c1_res.status_code == 201
    c1_data = c1_res.json()
    c1_id = c1_data["consultation_id"]
    assert c1_data["follow_up_period"] == "2 ہفتے بعد"
    assert c1_data["follow_up_date"] == target_date
    assert c1_data["follow_up_status"] == "Scheduled"

    # 4. Verify History summary has symptoms_summary and Scheduled follow-up
    hist_1 = client.get(f"/api/patients/{p_id}/consultations", headers=headers)
    assert hist_1.status_code == 200
    h1_items = hist_1.json()
    assert len(h1_items) == 1
    assert "Migraine" in h1_items[0]["symptoms_summary"]
    assert "Photophobia" in h1_items[0]["symptoms_summary"]
    assert h1_items[0]["follow_up_status"] == "Scheduled"
    assert h1_items[0]["follow_up_period"] == "2 ہفتے بعد"
    assert h1_items[0]["follow_up_date"] == target_date

    # 5. Create Consultation #2 (Subsequent Visit)
    c2_res = client.post(
        "/api/consultations",
        json={
            "patient_id": p_id,
            "patient_state_name": "Improving",
            "vitals": {
                "systolic_bp": 120,
                "diastolic_bp": 80,
                "pulse_rate": 72,
            },
            "symptoms": [
                {"symptom_name": "Migraine", "category": "Headache"},
            ],
            "symptom_notes": "Significant reduction in migraine frequency",
            "clinical_description": "Good response to abortive therapy",
            "treatment_plan": "Continue current protocol",
            "follow_up_period": "حسبِ ضرورت",
            "follow_up_instructions": "Follow up as needed",
        },
        headers=headers,
    )
    assert c2_res.status_code == 201
    c2_id = c2_res.json()["consultation_id"]

    # 6. Verify Longitudinal History & Status Transition
    hist_2 = client.get(f"/api/patients/{p_id}/consultations", headers=headers)
    assert hist_2.status_code == 200
    h2_items = hist_2.json()
    assert len(h2_items) == 2
    # Ordered newest first:
    assert h2_items[0]["consultation_id"] == c2_id
    assert h2_items[0]["patient_state_name"] == "Improving"
    assert h2_items[0]["follow_up_status"] == "As Needed"

    assert h2_items[1]["consultation_id"] == c1_id
    # Previous consultation follow-up is now marked Completed!
    assert h2_items[1]["follow_up_status"] == "Completed"

    # 7. Test Editing old consultation #1
    edit_res = client.put(
        f"/api/consultations/{c1_id}",
        json={
            "patient_id": p_id,
            "patient_state_name": "Stable",
            "symptom_notes": "Updated note on historical consultation",
            "power_text": "5/5 all limbs",
            "mmse_score": 30,
            "gcs_score": 15,
            "follow_up_period": "2 ہفتے بعد",
            "follow_up_date": target_date,
            "follow_up_instructions": "Updated follow up instruction",
        },
        headers=headers,
    )
    assert edit_res.status_code == 200
    assert edit_res.json()["symptom_notes"] == "Updated note on historical consultation"

    # Verify consultation #2 remains unchanged
    c2_verify = client.get(f"/api/consultations/{c2_id}", headers=headers)
    assert c2_verify.status_code == 200
    assert c2_verify.json()["clinical_description"] == "Good response to abortive therapy"

    # 8. Test Security: Unauthorized access rejected
    unauth = client.get(f"/api/patients/{p_id}/consultations")
    assert unauth.status_code == 401
