import os
import random
import pytest
from datetime import datetime, timezone, date
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
            "full_name": "Muhammad Imran Khan",
            "age": 42,
            "gender": "Male",
            "mobile_number": unique_phone(),
            "cnic": unique_cnic(),
            "confirm_duplicate": True,
        },
    )
    assert res.status_code in [200, 201], res.text
    return res.json()


@pytest.fixture
def minimal_consultation(auth_headers, test_patient):
    c_data = {
        "patient_id": test_patient["patient_id"],
        "symptoms": [{"symptom_name": "Headache", "category": "General"}],
        "prescriptions": [
            {
                "medicine_name": "Augmentin 625mg",
                "dosage": "1 tablet",
                "frequency_name": "صبح، شام",
                "duration_days": 7,
                "instruction_name": "کھانے کے بعد",
            }
        ]
    }
    res = client.post("/api/consultations", json=c_data, headers=auth_headers)
    assert res.status_code == 201, res.text
    return res.json()


def test_minimal_consultation_report_generation(
    minimal_consultation,
    auth_headers,
):
    """
    Test generating report for minimal consultation (patient + symptoms + prescription only).
    Must succeed, physically store PDF file, record metadata, and hide empty sections.
    """
    c_id = minimal_consultation["consultation_id"]
    response = client.post(
        f"/api/consultations/{c_id}/report",
        headers=auth_headers,
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["report_id"] == f"RPT-{c_id}-v1"
    assert data["version"] == 1
    assert data["is_latest"] is True
    assert data["file_size"] > 0
    assert os.path.exists(data["storage_path"])

    # Verify physical file starts with %PDF magic bytes
    with open(data["storage_path"], "rb") as f:
        header = f.read(5)
        assert header == b"%PDF-"


def test_full_consultation_with_urdu_and_prescription(
    test_patient,
    auth_headers,
):
    """
    Create a complete consultation with vitals, symptoms (Urdu), neuro exam, diagnostic tests,
    clinical notes, prescription items (Urdu instructions), and follow-up.
    """
    c_data = {
        "patient_id": test_patient["patient_id"],
        "vitals": {
            "systolic_bp": 130,
            "diastolic_bp": 85,
            "pulse_rate": 95,
            "temperature": 38.4,
            "oxygen_saturation": 96,
            "nihss_score": 2,
            "fall_risk_status": "Done",
        },
        "symptoms": [
            {"symptom_name": "سر درد (Severe Headache)", "category": "Neurological", "notes": "Left temporal"},
            {"symptom_name": "Dizziness / چکر", "category": "General"},
        ],
        "examinations": [
            {"category": "Motor Examination", "item_name": "Power", "finding": "5/5 Upper, 4/5 Lower"},
            {"category": "Reflexes", "item_name": "Deep Tendon", "finding": "Normal (2+)"},
            {"category": "Gait & Balance", "item_name": "Tandem Walking", "finding": "Intact"},
        ],
        "diagnostic_tests": [
            {
                "test_name": "MRI Brain with Contrast",
                "category": "Imaging",
                "clinical_indication": "Rule out acute ischemia",
                "status": "Reviewed",
                "result": "No acute intracranial hemorrhage or territorial infarction.",
            }
        ],
        "prescriptions": [
            {
                "medicine_name": "Augmentin 625mg (Co-amoxiclav)",
                "dosage": "1 tablet",
                "frequency_name": "صبح، شام",
                "duration_days": 7,
                "instruction_name": "کھانے کے بعد",
                "custom_instruction": "پورا کورس مکمل کریں",
            },
            {
                "medicine_name": "Panadol 500mg (Paracetamol)",
                "dosage": "1 tablet",
                "frequency_name": "ضرورت کے مطابق",
                "duration_days": 5,
                "instruction_name": "کھانے کے بعد",
                "custom_instruction": "بخار یا درد کے لیے",
            }
        ],
        "clinical_description": "Possible Viral/Bacterial Bronchitis with tension-type headache. Fluid intake advised.",
        "additional_examination": "Chest clear bilaterally on auscultation.",
        "treatment_plan": "Oral antibiotic course + symptomatic analgesics. Return if symptoms worsen.",
        "follow_up_date": (date.today().replace(year=date.today().year + 1)).isoformat(),
        "follow_up_period": "2 weeks later / 2 ہفتے بعد",
        "follow_up_instructions": "Return with follow-up lab and MRI report.",
    }

    create_res = client.post(
        "/api/consultations",
        json=c_data,
        headers=auth_headers,
    )
    assert create_res.status_code == 201, create_res.text
    created_consultation = create_res.json()
    c_id = created_consultation["consultation_id"]

    # 1. Generate Report
    rep_res = client.post(
        f"/api/consultations/{c_id}/report",
        headers=auth_headers,
    )
    assert rep_res.status_code == 200
    rep_data = rep_res.json()
    assert rep_data["version"] == 1
    assert rep_data["file_size"] > 1000  # Multi-section PDF is substantive

    # 2. Preview Report (inline stream)
    prev_res = client.get(
        f"/api/consultations/{c_id}/report/preview",
        headers=auth_headers,
    )
    assert prev_res.status_code == 200
    assert prev_res.headers["content-type"] == "application/pdf"
    assert "inline" in prev_res.headers.get("content-disposition", "")
    assert prev_res.content.startswith(b"%PDF-")

    # 3. Download Report (attachment stream)
    dl_res = client.get(
        f"/api/consultations/{c_id}/report/download",
        headers=auth_headers,
    )
    assert dl_res.status_code == 200
    assert dl_res.headers["content-type"] == "application/pdf"
    assert "attachment" in dl_res.headers.get("content-disposition", "")
    assert dl_res.content.startswith(b"%PDF-")


def test_report_versioning_and_regeneration(
    minimal_consultation,
    auth_headers,
):
    """
    Test versioning:
    - Initial POST creates v1.
    - POST with regenerate=False returns v1 without duplicate file.
    - POST with regenerate=True creates v2, marks v1 is_latest=False.
    - GET /reports returns both versions.
    """
    c_id = minimal_consultation["consultation_id"]

    # Initial generation (v1)
    res1 = client.post(
        f"/api/consultations/{c_id}/report",
        headers=auth_headers,
    )
    assert res1.status_code == 200
    d1 = res1.json()
    assert d1["version"] == 1
    assert d1["is_latest"] is True

    # Call again without regenerate flag -> returns same v1
    res1_cached = client.post(
        f"/api/consultations/{c_id}/report",
        headers=auth_headers,
    )
    assert res1_cached.status_code == 200
    d1_cached = res1_cached.json()
    assert d1_cached["version"] == 1
    assert d1_cached["report_id"] == d1["report_id"]

    # Force regenerate -> creates v2
    res2 = client.post(
        f"/api/consultations/{c_id}/report?regenerate=true",
        headers=auth_headers,
    )
    assert res2.status_code == 200
    d2 = res2.json()
    assert d2["version"] == 2
    assert d2["is_latest"] is True

    # List reports
    list_res = client.get(
        f"/api/consultations/{c_id}/reports",
        headers=auth_headers,
    )
    assert list_res.status_code == 200
    reports_list = list_res.json()
    assert len(reports_list) == 2
    assert reports_list[0]["version"] == 2
    assert reports_list[0]["is_latest"] is True
    assert reports_list[1]["version"] == 1
    assert reports_list[1]["is_latest"] is False


def test_unauthorized_access(
    minimal_consultation,
):
    """
    Unauthenticated users must be rejected from preview, download, and generation.
    """
    c_id = minimal_consultation["consultation_id"]

    # Unauthenticated generate
    res = client.post(f"/api/consultations/{c_id}/report")
    assert res.status_code == 401

    # Unauthenticated preview
    res = client.get(f"/api/consultations/{c_id}/report/preview")
    assert res.status_code == 401

    # Unauthenticated download
    res = client.get(f"/api/consultations/{c_id}/report/download")
    assert res.status_code == 401


def test_consultation_summary_includes_report_metadata(
    test_patient,
    minimal_consultation,
    auth_headers,
):
    """
    Verify patient consultations history endpoint returns has_report=True and report details
    once a report is generated.
    """
    c_id = minimal_consultation["consultation_id"]

    # Before generating report
    hist_before = client.get(
        f"/api/patients/{test_patient['patient_id']}/consultations",
        headers=auth_headers,
    )
    assert hist_before.status_code == 200
    c_item = next(c for c in hist_before.json() if c["consultation_id"] == c_id)
    assert c_item["has_report"] is False

    # Generate report
    client.post(
        f"/api/consultations/{c_id}/report",
        headers=auth_headers,
    )

    # After generating report
    hist_after = client.get(
        f"/api/patients/{test_patient['patient_id']}/consultations",
        headers=auth_headers,
    )
    assert hist_after.status_code == 200
    c_item_after = next(c for c in hist_after.json() if c["consultation_id"] == c_id)
    assert c_item_after["has_report"] is True
    assert c_item_after["latest_report_version"] == 1
    assert "Prescription" in c_item_after["latest_report_file_name"]
