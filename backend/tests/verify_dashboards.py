import sys
import httpx

BASE_URL = "http://127.0.0.1:8000/api"

def run_tests():
    print("==================================================")
    print("DASHBOARD ENDPOINTS & ROLE AUTHORIZATION TEST")
    print("==================================================")

    # 1. Login as Admin
    admin_login = httpx.post(f"{BASE_URL}/auth/login", json={"username_or_email": "admin", "password": "Admin@123"})
    assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("[OK] 1. Admin login successful")

    # 2. Login as Doctor
    doctor_login = httpx.post(f"{BASE_URL}/auth/login", json={"username_or_email": "drrauf", "password": "Doctor@123"})
    assert doctor_login.status_code == 200, f"Doctor login failed: {doctor_login.text}"
    doctor_token = doctor_login.json()["access_token"]
    doctor_headers = {"Authorization": f"Bearer {doctor_token}"}
    print("[OK] 2. Doctor login successful")

    # 3. Login as Staff
    staff_login = httpx.post(f"{BASE_URL}/auth/login", json={"username_or_email": "staff", "password": "Staff@123"})
    assert staff_login.status_code == 200, f"Staff login failed: {staff_login.text}"
    staff_token = staff_login.json()["access_token"]
    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    print("[OK] 3. Staff login successful")

    # 4. Verify Admin Dashboard
    admin_dash = httpx.get(f"{BASE_URL}/admin/dashboard", headers=admin_headers)
    assert admin_dash.status_code == 200, f"Admin dashboard failed: {admin_dash.text}"
    admin_data = admin_dash.json()
    print("[OK] 4. Admin Dashboard loaded from real database:")
    print(f"     Total Patients: {admin_data['total_patients']}")
    print(f"     Total Consultations: {admin_data['total_consultations']}")
    print(f"     Total Doctors: {admin_data['total_doctors']}")
    print(f"     Total Staff: {admin_data['total_staff']}")
    print(f"     Active Users: {admin_data['active_users']}")
    print(f"     Active Medicines: {admin_data['active_medicines']}")
    print(f"     Active Symptoms: {admin_data['active_symptoms']}")
    print(f"     Active Diagnostic Tests: {admin_data['active_diagnostic_tests']}")
    print(f"     Recent Patients: {len(admin_data['recent_activity']['recent_patients'])}")
    print(f"     Recent Consultations: {len(admin_data['recent_activity']['recent_consultations'])}")
    print(f"     Recent Users: {len(admin_data['recent_activity']['recent_users'])}")

    # 5. Verify Doctor Dashboard
    doc_dash = httpx.get(f"{BASE_URL}/doctor/dashboard", headers=doctor_headers)
    assert doc_dash.status_code == 200, f"Doctor dashboard failed: {doc_dash.text}"
    doc_data = doc_dash.json()
    print("[OK] 5. Doctor Dashboard loaded from real database:")
    print(f"     Total Patients: {doc_data['total_patients']}")
    print(f"     Total Consultations: {doc_data['total_consultations']}")
    print(f"     Today's Consultations: {doc_data['today_consultations_count']}")
    print(f"     Recent Patients: {len(doc_data['recent_patients'])}")
    print(f"     Recent Consultations: {len(doc_data['recent_consultations'])}")

    # 6. Verify Staff Dashboard
    staff_dash = httpx.get(f"{BASE_URL}/staff/dashboard", headers=staff_headers)
    assert staff_dash.status_code == 200, f"Staff dashboard failed: {staff_dash.text}"
    staff_data = staff_dash.json()
    print("[OK] 6. Staff Dashboard loaded from real database:")
    print(f"     Total Patients: {staff_data['total_patients']}")
    print(f"     Today's Registered Patients: {staff_data['today_registered_count']}")
    print(f"     Recent Patients: {len(staff_data['recent_patients'])}")

    # 7. Verify Cross-Role Security Denials (Backend Authorization)
    # Doctor cannot access Admin Dashboard
    doc_to_admin = httpx.get(f"{BASE_URL}/admin/dashboard", headers=doctor_headers)
    assert doc_to_admin.status_code == 403, f"Expected 403, got {doc_to_admin.status_code}"
    print("[OK] 7. Doctor forbidden from Admin Dashboard (HTTP 403)")

    # Staff cannot access Admin Dashboard
    staff_to_admin = httpx.get(f"{BASE_URL}/admin/dashboard", headers=staff_headers)
    assert staff_to_admin.status_code == 403, f"Expected 403, got {staff_to_admin.status_code}"
    print("[OK] 8. Staff forbidden from Admin Dashboard (HTTP 403)")

    # Staff cannot access Doctor Dashboard
    staff_to_doc = httpx.get(f"{BASE_URL}/doctor/dashboard", headers=staff_headers)
    assert staff_to_doc.status_code == 403, f"Expected 403, got {staff_to_doc.status_code}"
    print("[OK] 9. Staff forbidden from Doctor Dashboard (HTTP 403)")

    # Doctor cannot access Staff Dashboard
    doc_to_staff = httpx.get(f"{BASE_URL}/staff/dashboard", headers=doctor_headers)
    assert doc_to_staff.status_code == 403, f"Expected 403, got {doc_to_staff.status_code}"
    print("[OK] 10. Doctor forbidden from Staff Dashboard (HTTP 403)")

    print("==================================================")
    print("ALL 10 VERIFICATIONS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
