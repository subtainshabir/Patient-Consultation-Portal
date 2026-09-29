import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.base import Base
from app.api.deps import get_db
from app.models.user import User, UserRole

# Use an isolated in-memory SQLite database specifically for testing auth and setup flow
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="module")
def client():
    # Create tables
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def get_error_text(resp) -> str:
    data = resp.json()
    return (data.get("message") or data.get("detail") or str(data)).lower()


# ═════════════════════════════════════════════════════════════════════════════
# PHASE 9.1 AUTHENTICATION & USER MANAGEMENT TEST SUITE (TESTS 1 - 13)
# ═════════════════════════════════════════════════════════════════════════════

def test_01_database_has_no_admin_shows_setup_required(client: TestClient):
    """
    Test 1:
    Database has no Admin.
    Open application -> Initial Admin Setup appears (setup_required = True).
    """
    response = client.get("/api/auth/setup-status")
    assert response.status_code == 200
    data = response.json()
    assert data["setup_required"] is True
    assert "required" in data["message"].lower()


def test_02_create_admin_manually_via_setup(client: TestClient):
    """
    Test 2:
    Create Admin using a username/password entered manually.
    Expected: Admin is created successfully with role = ADMIN.
    """
    admin_payload = {
        "username": "customadmin",
        "password": "SecureAdminPassword!2026",
        "full_name": "Clinic Primary Administrator",
        "email": "customadmin@testclinic.org"
    }
    response = client.post("/api/auth/setup-admin", json=admin_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "customadmin"
    assert data["role"] == "ADMIN"
    assert data["is_active"] is True
    # Password and hash must NOT be exposed in response
    assert "password" not in data
    assert "hashed_password" not in data


def test_03_lock_first_time_setup_when_admin_exists(client: TestClient):
    """
    Test 3:
    Try to open initial setup again.
    Expected: Setup is blocked because an Admin already exists.
    """
    # 1. Status endpoint now reports setup_required = False
    status_resp = client.get("/api/auth/setup-status")
    assert status_resp.status_code == 200
    assert status_resp.json()["setup_required"] is False

    # 2. Setup creation endpoint is permanently locked (403 Forbidden)
    attempt_payload = {
        "username": "secondadmin",
        "password": "AnotherAdminPassword!2026"
    }
    response = client.post("/api/auth/setup-admin", json=attempt_payload)
    assert response.status_code == 403
    assert "locked" in get_error_text(response)



def test_04_login_with_correct_admin_credentials(client: TestClient):
    """
    Test 4:
    Login with correct Admin credentials.
    Expected: Successful login and Admin Portal access.
    """
    login_payload = {
        "username_or_email": "customadmin",
        "password": "SecureAdminPassword!2026"
    }
    response = client.post("/api/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "ADMIN"

    # Verify access to protected admin API with token
    admin_token = data["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    users_resp = client.get("/api/admin/users", headers=admin_headers)
    assert users_resp.status_code == 200
    users_list = users_resp.json()
    assert len(users_list) >= 1
    assert any(u["username"] == "customadmin" for u in users_list)


def test_05_login_with_incorrect_password_rejected(client: TestClient):
    """
    Test 5:
    Login with incorrect password.
    Expected: Login rejected (401 Unauthorized) without leaking internal details.
    """
    login_payload = {
        "username_or_email": "customadmin",
        "password": "WrongPasswordEntered123"
    }
    response = client.post("/api/auth/login", json=login_payload)
    assert response.status_code == 401
    assert "invalid" in get_error_text(response)



def test_06_admin_creates_doctor_account(client: TestClient):
    """
    Test 6:
    Create a Doctor account from Admin -> User Management.
    Expected: Doctor account created with role = DOCTOR.
    """
    # Login as admin to get token
    login_resp = client.post("/api/auth/login", json={
        "username_or_email": "customadmin",
        "password": "SecureAdminPassword!2026"
    })
    admin_headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

    doctor_payload = {
        "username": "consultant_doctor",
        "password": "DoctorClinicalPass!2026",
        "role": "DOCTOR",
        "full_name": "Consultant Neurologist",
        "email": "doctor@testclinic.org"
    }
    response = client.post("/api/admin/users", json=doctor_payload, headers=admin_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "consultant_doctor"
    assert data["role"] == "DOCTOR"
    assert data["is_active"] is True
    assert "password" not in data
    assert "hashed_password" not in data


def test_07_admin_creates_staff_account(client: TestClient):
    """
    Test 7:
    Create a Staff account from Admin -> User Management.
    Expected: Staff account created with role = STAFF.
    """
    login_resp = client.post("/api/auth/login", json={
        "username_or_email": "customadmin",
        "password": "SecureAdminPassword!2026"
    })
    admin_headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

    staff_payload = {
        "username": "reception_staff",
        "password": "StaffReceptionPass!2026",
        "role": "STAFF",
        "full_name": "Clinic Reception Staff",
        "email": "staff@testclinic.org"
    }
    response = client.post("/api/admin/users", json=staff_payload, headers=admin_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "reception_staff"
    assert data["role"] == "STAFF"
    assert data["is_active"] is True


def test_08_login_as_doctor_and_verify_role_permissions(client: TestClient):
    """
    Test 8:
    Login as Doctor.
    Expected:
    - Doctor can access permitted doctor functionality (e.g. patients).
    - Doctor CANNOT access Admin Portal / admin APIs (403 Forbidden).
    """
    # 1. Login as Doctor
    login_resp = client.post("/api/auth/login", json={
        "username_or_email": "consultant_doctor",
        "password": "DoctorClinicalPass!2026"
    })
    assert login_resp.status_code == 200
    doc_token = login_resp.json()["access_token"]
    doc_headers = {"Authorization": f"Bearer {doc_token}"}

    # 2. Doctor can access patients list
    patients_resp = client.get("/api/patients", headers=doc_headers)
    assert patients_resp.status_code == 200

    # 3. Doctor CANNOT access Admin users endpoint (403 Forbidden)
    admin_users_resp = client.get("/api/admin/users", headers=doc_headers)
    assert admin_users_resp.status_code == 403
    assert "permission" in get_error_text(admin_users_resp)


    # 4. Doctor CANNOT access Admin settings
    admin_settings_resp = client.get("/api/admin/settings", headers=doc_headers)
    assert admin_settings_resp.status_code == 403


def test_09_login_as_staff_and_verify_role_permissions(client: TestClient):
    """
    Test 9:
    Login as Staff.
    Expected:
    - Staff can access permitted staff functionality (e.g. patient search / registration).
    - Staff CANNOT access Admin Portal / admin APIs (403 Forbidden).
    - Staff CANNOT record consultations (403 Forbidden).
    """
    # 1. Login as Staff
    login_resp = client.post("/api/auth/login", json={
        "username_or_email": "reception_staff",
        "password": "StaffReceptionPass!2026"
    })
    assert login_resp.status_code == 200
    staff_token = login_resp.json()["access_token"]
    staff_headers = {"Authorization": f"Bearer {staff_token}"}

    # 2. Staff can view patients
    patients_resp = client.get("/api/patients", headers=staff_headers)
    assert patients_resp.status_code == 200

    # 3. Staff CANNOT access Admin endpoints
    admin_users_resp = client.get("/api/admin/users", headers=staff_headers)
    assert admin_users_resp.status_code == 403

    # 4. Staff CANNOT create clinical consultations
    consultation_resp = client.post("/api/consultations", json={}, headers=staff_headers)
    assert consultation_resp.status_code == 403


def test_10_deactivate_doctor_blocks_login(client: TestClient):
    """
    Test 10:
    Deactivate Doctor from Admin.
    Expected: Doctor can no longer log in.
    """
    # Admin login
    admin_login = client.post("/api/auth/login", json={
        "username_or_email": "customadmin",
        "password": "SecureAdminPassword!2026"
    })
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    # Find doctor user id
    users_resp = client.get("/api/admin/users?role=DOCTOR", headers=admin_headers)
    doctor_user = next(u for u in users_resp.json() if u["username"] == "consultant_doctor")
    doctor_id = doctor_user["id"]

    # Deactivate doctor
    deactivate_resp = client.patch(
        f"/api/admin/users/{doctor_id}/status",
        json={"is_active": False},
        headers=admin_headers
    )
    assert deactivate_resp.status_code == 200
    assert deactivate_resp.json()["is_active"] is False

    # Doctor tries to log in -> rejected
    doc_login_resp = client.post("/api/auth/login", json={
        "username_or_email": "consultant_doctor",
        "password": "DoctorClinicalPass!2026"
    })
    assert doc_login_resp.status_code == 401


def test_11_reactivate_doctor_allows_login(client: TestClient):
    """
    Test 11:
    Reactivate Doctor from Admin.
    Expected: Doctor can log in again.
    """
    admin_login = client.post("/api/auth/login", json={
        "username_or_email": "customadmin",
        "password": "SecureAdminPassword!2026"
    })
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    users_resp = client.get("/api/admin/users?role=DOCTOR", headers=admin_headers)
    doctor_user = next(u for u in users_resp.json() if u["username"] == "consultant_doctor")
    doctor_id = doctor_user["id"]

    # Reactivate doctor
    reactivate_resp = client.patch(
        f"/api/admin/users/{doctor_id}/status",
        json={"is_active": True},
        headers=admin_headers
    )
    assert reactivate_resp.status_code == 200
    assert reactivate_resp.json()["is_active"] is True

    # Doctor logs in again -> succeeds
    doc_login_resp = client.post("/api/auth/login", json={
        "username_or_email": "consultant_doctor",
        "password": "DoctorClinicalPass!2026"
    })
    assert doc_login_resp.status_code == 200
    assert doc_login_resp.json()["user"]["username"] == "consultant_doctor"


def test_12_admin_resets_user_password(client: TestClient):
    """
    Test 12:
    Change a user's password from Admin.
    Expected: Old password no longer works, new password works.
    """
    admin_login = client.post("/api/auth/login", json={
        "username_or_email": "customadmin",
        "password": "SecureAdminPassword!2026"
    })
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    users_resp = client.get("/api/admin/users?role=DOCTOR", headers=admin_headers)
    doctor_user = next(u for u in users_resp.json() if u["username"] == "consultant_doctor")
    doctor_id = doctor_user["id"]

    # Reset password
    reset_resp = client.post(
        f"/api/admin/users/{doctor_id}/reset-password",
        json={"new_password": "NewUpdatedPassword!2026"},
        headers=admin_headers
    )
    assert reset_resp.status_code == 200
    assert reset_resp.json()["success"] is True

    # Old password no longer works
    old_login = client.post("/api/auth/login", json={
        "username_or_email": "consultant_doctor",
        "password": "DoctorClinicalPass!2026"
    })
    assert old_login.status_code == 401

    # New password works
    new_login = client.post("/api/auth/login", json={
        "username_or_email": "consultant_doctor",
        "password": "NewUpdatedPassword!2026"
    })
    assert new_login.status_code == 200
    assert "access_token" in new_login.json()


def test_13_logout_and_unauthenticated_access_protection(client: TestClient):
    """
    Test 13:
    Logout & Protected endpoints require authentication.
    Expected: Protected pages and APIs cannot be accessed without valid authentication.
    """
    # 1. Unauthenticated requests to /api/admin/users return 401
    anon_admin_resp = client.get("/api/admin/users")
    assert anon_admin_resp.status_code == 401

    # 2. Unauthenticated requests to /api/patients return 401
    anon_patients_resp = client.get("/api/patients")
    assert anon_patients_resp.status_code == 401

    # 3. Invalid or fabricated token returns 401
    fake_headers = {"Authorization": "Bearer fake.jwt.token"}
    fake_resp = client.get("/api/admin/users", headers=fake_headers)
    assert fake_resp.status_code == 401

    # 4. Valid user logout endpoint
    login_resp = client.post("/api/auth/login", json={
        "username_or_email": "customadmin",
        "password": "SecureAdminPassword!2026"
    })
    admin_token = login_resp.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    logout_resp = client.post("/api/auth/logout", headers=admin_headers)
    assert logout_resp.status_code == 200
    assert logout_resp.json()["success"] is True


def test_14_admin_self_protection_prevents_removing_only_admin(client: TestClient):
    """
    Section 13 Admin Self-Protection:
    Prevent deactivating or demoting the only active administrator.
    """
    admin_login = client.post("/api/auth/login", json={
        "username_or_email": "customadmin",
        "password": "SecureAdminPassword!2026"
    })
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    users_resp = client.get("/api/admin/users?role=ADMIN", headers=admin_headers)
    admin_user = next(u for u in users_resp.json() if u["username"] == "customadmin")
    admin_id = admin_user["id"]

    # Attempt to deactivate the only active admin -> 400 Bad Request
    deact_resp = client.patch(
        f"/api/admin/users/{admin_id}/status",
        json={"is_active": False},
        headers=admin_headers
    )
    assert deact_resp.status_code == 400
    assert "only active administrator" in get_error_text(deact_resp)

    # Attempt to demote the only active admin to STAFF -> 400 Bad Request
    demote_resp = client.put(
        f"/api/admin/users/{admin_id}",
        json={"role": "STAFF"},
        headers=admin_headers
    )
    assert demote_resp.status_code == 400
    assert "only active administrator" in get_error_text(demote_resp)

