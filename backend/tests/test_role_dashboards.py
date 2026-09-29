import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


@pytest.fixture
def admin_token():
    res = client.post(
        "/api/auth/login",
        json={"username_or_email": "admin", "password": "Admin@123"},
    )
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


@pytest.fixture
def doctor_token():
    res = client.post(
        "/api/auth/login",
        json={"username_or_email": "drrauf", "password": "Doctor@123"},
    )
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


@pytest.fixture
def staff_token():
    res = client.post(
        "/api/auth/login",
        json={"username_or_email": "staff", "password": "Staff@123"},
    )
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


def test_admin_dashboard_access_and_metrics(admin_token):
    res = client.get(
        "/api/admin/dashboard",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "categories" in data
    assert "total_patients" in data
    assert "total_consultations" in data
    assert "total_doctors" in data
    assert "total_staff" in data
    assert "active_users" in data
    assert "inactive_users" in data
    assert "active_medicines" in data
    assert "active_symptoms" in data
    assert "active_diagnostic_tests" in data
    assert "recent_activity" in data
    assert "recent_patients" in data["recent_activity"]
    assert "recent_consultations" in data["recent_activity"]
    assert "recent_users" in data["recent_activity"]


def test_doctor_forbidden_from_admin_dashboard(doctor_token):
    res = client.get(
        "/api/admin/dashboard",
        headers={"Authorization": f"Bearer {doctor_token}"},
    )
    assert res.status_code == 403


def test_staff_forbidden_from_admin_dashboard(staff_token):
    res = client.get(
        "/api/admin/dashboard",
        headers={"Authorization": f"Bearer {staff_token}"},
    )
    assert res.status_code == 403


def test_doctor_dashboard_access_and_metrics(doctor_token):
    res = client.get(
        "/api/doctor/dashboard",
        headers={"Authorization": f"Bearer {doctor_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "total_patients" in data
    assert "total_consultations" in data
    assert "today_consultations_count" in data
    assert "today_consultations" in data
    assert "recent_patients" in data
    assert "recent_consultations" in data


def test_staff_forbidden_from_doctor_dashboard(staff_token):
    res = client.get(
        "/api/doctor/dashboard",
        headers={"Authorization": f"Bearer {staff_token}"},
    )
    assert res.status_code == 403


def test_staff_dashboard_access_and_metrics(staff_token):
    res = client.get(
        "/api/staff/dashboard",
        headers={"Authorization": f"Bearer {staff_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "total_patients" in data
    assert "today_registered_count" in data
    assert "today_patients" in data
    assert "recent_patients" in data


def test_doctor_forbidden_from_staff_dashboard(doctor_token):
    res = client.get(
        "/api/staff/dashboard",
        headers={"Authorization": f"Bearer {doctor_token}"},
    )
    assert res.status_code == 403
