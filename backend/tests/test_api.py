from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_login_success():
    response = client.post(
        "/api/auth/login",
        json={"username_or_email": "drrauf", "password": "Doctor@123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "drrauf"
    assert data["user"]["role"] == "DOCTOR"


def test_login_invalid_password():
    response = client.post(
        "/api/auth/login",
        json={"username_or_email": "drrauf", "password": "WrongPassword123"}
    )
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert data["message"] == "Invalid username or password."


def test_login_nonexistent_user():
    response = client.post(
        "/api/auth/login",
        json={"username_or_email": "ghost_user", "password": "SomePassword"}
    )
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert data["message"] == "Invalid username or password."


def test_get_current_user_profile():
    # Login first
    login_res = client.post(
        "/api/auth/login",
        json={"username_or_email": "drrauf", "password": "Doctor@123"}
    )
    token = login_res.json()["access_token"]
    
    # Request profile
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "drrauf"
    assert data["email"] == "doctor@neurology.pk"


def test_protected_route_without_token():
    response = client.get("/api/auth/me")
    assert response.status_code == 401
