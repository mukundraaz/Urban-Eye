import requests
import json
import sqlite3

BASE_URL = "http://127.0.0.1:8000/api/auth"

def run_tests():
    print("=== STARTING URBAN EYE USER REGISTRATION & AUTHENTICATION TESTS ===")
    
    test_email = "test.officer@smartcity.gov.in"
    test_password = "SecurePassword123!"
    test_name = "Inspector Rajesh Kulkarni"
    test_dept = "Traffic Police"

    # Clean up test user if previously existing in database
    conn = sqlite3.connect("backend/urbaneye.db")
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE email = ?", (test_email.lower(),))
    conn.commit()
    conn.close()

    # TEST 1: Register new user with valid data
    print("\n[TEST 1] Registering a new official user...")
    payload = {
        "full_name": test_name,
        "email": test_email,
        "password": test_password,
        "department": test_dept
    }
    res = requests.post(f"{BASE_URL}/register", json=payload)
    print(f"  Status code: {res.status_code}")
    print(f"  Response: {res.json()}")
    assert res.status_code == 201, f"Expected 201, got {res.status_code}"
    data = res.json()
    assert data["email"] == test_email.lower()
    assert data["full_name"] == test_name
    assert data["role"] == "official", f"Expected role 'official', got {data.get('role')}"
    print("  -> PASSED: User successfully registered with status 201 Created and role 'official'.")

    # TEST 2: Verify password is securely hashed in the database (never stored in plain text)
    print("\n[TEST 2] Verifying password hashing in SQLite database...")
    conn = sqlite3.connect("backend/urbaneye.db")
    cursor = conn.cursor()
    cursor.execute("SELECT password_hash, role, department FROM users WHERE email = ?", (test_email.lower(),))
    row = cursor.fetchone()
    conn.close()
    assert row is not None, "User record not found in database"
    password_hash, role, dept = row
    print(f"  Stored password_hash in DB: {password_hash[:15]}... (length: {len(password_hash)})")
    assert test_password not in password_hash, "SECURITY FAILURE: Plain text password found in database!"
    assert password_hash.startswith("$2b$") or password_hash.startswith("$2a$"), "Hash is not a valid bcrypt hash"
    assert role == "official", "Role must be non-admin safe default"
    assert dept == test_dept, "Department must be preserved"
    print("  -> PASSED: Password is securely hashed with bcrypt ($2b$). Plaintext never stored.")

    # TEST 3: Duplicate email rejection
    print("\n[TEST 3] Testing duplicate email registration rejection...")
    dup_res = requests.post(f"{BASE_URL}/register", json=payload)
    print(f"  Status code: {dup_res.status_code}")
    print(f"  Response: {dup_res.json()}")
    assert dup_res.status_code == 400, f"Expected 400, got {dup_res.status_code}"
    assert "already exists" in dup_res.json().get("detail", "").lower(), "Expected duplicate error message"
    print("  -> PASSED: Duplicate registration correctly rejected with HTTP 400.")

    # TEST 4: Invalid email format rejection
    print("\n[TEST 4] Testing invalid email rejection...")
    invalid_email_res = requests.post(f"{BASE_URL}/register", json={
        "full_name": "Test User",
        "email": "not-a-valid-email",
        "password": "ValidPassword123"
    })
    print(f"  Status code: {invalid_email_res.status_code}")
    assert invalid_email_res.status_code == 422, f"Expected 422, got {invalid_email_res.status_code}"
    print("  -> PASSED: Invalid email format rejected by backend validation (422 Unprocessable Entity).")

    # TEST 5: Short password rejection
    print("\n[TEST 5] Testing short password (< 6 chars) rejection...")
    short_pw_res = requests.post(f"{BASE_URL}/register", json={
        "full_name": "Test User",
        "email": "shortpw@smartcity.gov.in",
        "password": "123"
    })
    print(f"  Status code: {short_pw_res.status_code}")
    print(f"  Response: {short_pw_res.json()}")
    assert short_pw_res.status_code == 400, f"Expected 400, got {short_pw_res.status_code}"
    print("  -> PASSED: Short password correctly rejected with HTTP 400.")

    # TEST 6: Sign in with the newly registered user credentials
    print("\n[TEST 6] Testing Sign In with newly registered credentials...")
    login_res = requests.post(f"{BASE_URL}/login", data={
        "username": test_email,
        "password": test_password
    })
    print(f"  Status code: {login_res.status_code}")
    assert login_res.status_code == 200, f"Expected 200, got {login_res.status_code}"
    login_data = login_res.json()
    token = login_data.get("access_token")
    user_info = login_data.get("user")
    print(f"  Access token received: {token[:25]}...")
    print(f"  User info: {user_info}")
    assert token is not None, "Access token missing"
    assert user_info["email"] == test_email.lower()
    assert user_info["full_name"] == test_name
    print("  -> PASSED: Newly registered user successfully authenticated and received valid JWT bearer token.")

    # TEST 7: Sign in with incorrect password rejection
    print("\n[TEST 7] Testing Sign In with incorrect password...")
    wrong_pw_res = requests.post(f"{BASE_URL}/login", data={
        "username": test_email,
        "password": "WrongPassword123!"
    })
    print(f"  Status code: {wrong_pw_res.status_code}")
    assert wrong_pw_res.status_code == 401, f"Expected 401, got {wrong_pw_res.status_code}"
    print("  -> PASSED: Incorrect password rejected with HTTP 401 Unauthorized.")

    # TEST 8: Test authenticated /api/auth/me endpoint using token
    print("\n[TEST 8] Fetching profile via /api/auth/me with JWT...")
    me_res = requests.get(f"{BASE_URL}/me", headers={"Authorization": f"Bearer {token}"})
    print(f"  Status code: {me_res.status_code}")
    print(f"  Profile: {me_res.json()}")
    assert me_res.status_code == 200
    assert me_res.json()["department"] == test_dept
    print("  -> PASSED: User profile and department successfully retrieved from token.")

    print("\n==============================================================")
    print("ALL 8 USER REGISTRATION & AUTHENTICATION TESTS PASSED!")
    print("==============================================================")

if __name__ == "__main__":
    run_tests()
