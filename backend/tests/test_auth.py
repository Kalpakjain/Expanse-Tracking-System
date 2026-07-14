from fastapi.testclient import TestClient
from uuid import uuid4

from app.core.config import settings
from app.db.init_db import create_database_and_seed
from app.main import app


settings.email_enabled = False
settings.expose_dev_otp = True
create_database_and_seed()
client = TestClient(app)


def test_register_requires_email_verification_before_login() -> None:
    email = f"verify-user-{uuid4().hex}@example.com"
    password = "password123"

    register_response = client.post(
        "/api/v1/auth/register",
        json={"email": email, "full_name": "Verify User", "password": password},
    )

    assert register_response.status_code == 201
    register_body = register_response.json()
    assert register_body["verification_required"] is True
    assert len(register_body["dev_verification_code"]) == 6

    login_before_verify = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )

    assert login_before_verify.status_code == 401
    assert "verify" in login_before_verify.json()["detail"].lower()

    verify_response = client.post(
        "/api/v1/auth/verify-email",
        json={"email": email, "code": register_body["dev_verification_code"]},
    )

    assert verify_response.status_code == 200
    verify_body = verify_response.json()
    assert verify_body["access_token"]
    assert verify_body["user"]["email_verified"] is True

    login_after_verify = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )

    assert login_after_verify.status_code == 200


def test_send_and_verify_otp_alias_flow() -> None:
    email = f"otp-user-{uuid4().hex}@example.com"
    password = "password123"

    register_response = client.post(
        "/api/v1/auth/register",
        json={"email": email, "full_name": "Otp User", "password": password},
    )

    assert register_response.status_code == 201

    send_response = client.post("/api/v1/auth/send-otp", json={"email": email})
    assert send_response.status_code == 200
    otp = send_response.json()["dev_verification_code"]

    invalid_response = client.post("/api/v1/auth/verify-otp", json={"email": email, "code": "000000"})
    assert invalid_response.status_code == 400
    assert "invalid" in invalid_response.json()["detail"].lower()

    verify_response = client.post("/api/v1/auth/verify-otp", json={"email": email, "code": otp})
    assert verify_response.status_code == 200
    assert verify_response.json()["user"]["email_verified"] is True

    login_otp_response = client.post("/api/v1/auth/send-otp", json={"email": email})
    assert login_otp_response.status_code == 200
    login_otp = login_otp_response.json()["dev_verification_code"]

    login_verify_response = client.post("/api/v1/auth/verify-otp", json={"email": email, "code": login_otp})
    assert login_verify_response.status_code == 200
    assert login_verify_response.json()["access_token"]


def test_send_otp_rate_limit() -> None:
    email = f"rate-limit-{uuid4().hex}@example.com"

    register_response = client.post(
        "/api/v1/auth/register",
        json={"email": email, "full_name": "Rate Limit", "password": "password123"},
    )

    assert register_response.status_code == 201

    first_resend = client.post("/api/v1/auth/send-otp", json={"email": email})
    second_resend = client.post("/api/v1/auth/send-otp", json={"email": email})
    third_resend = client.post("/api/v1/auth/send-otp", json={"email": email})

    assert first_resend.status_code == 200
    assert second_resend.status_code == 200
    assert third_resend.status_code == 429
    assert "too many" in third_resend.json()["detail"].lower()


def test_forgot_password_resets_password_with_otp() -> None:
    email = f"reset-user-{uuid4().hex}@example.com"
    old_password = "password123"
    new_password = "newpassword123"

    register_response = client.post(
        "/api/v1/auth/register",
        json={"email": email, "full_name": "Reset User", "password": old_password},
    )
    assert register_response.status_code == 201

    verify_response = client.post(
        "/api/v1/auth/verify-email",
        json={"email": email, "code": register_response.json()["dev_verification_code"]},
    )
    assert verify_response.status_code == 200

    forgot_response = client.post("/api/v1/auth/forgot-password", json={"email": email})
    assert forgot_response.status_code == 200
    reset_otp = forgot_response.json()["dev_verification_code"]

    reset_response = client.post(
        "/api/v1/auth/reset-password",
        json={"email": email, "code": reset_otp, "password": new_password},
    )
    assert reset_response.status_code == 200

    old_login = client.post("/api/v1/auth/login", json={"email": email, "password": old_password})
    assert old_login.status_code == 401

    new_login = client.post("/api/v1/auth/login", json={"email": email, "password": new_password})
    assert new_login.status_code == 200
