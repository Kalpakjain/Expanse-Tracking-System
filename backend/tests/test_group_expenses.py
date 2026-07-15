from datetime import date
from uuid import uuid4

from fastapi.testclient import TestClient

from app.core.config import settings
from app.db.init_db import create_database_and_seed
from app.main import app


settings.email_enabled = False
settings.expose_dev_otp = True
create_database_and_seed()
client = TestClient(app)


def _register_verified_user(full_name: str) -> str:
    email = f"group-{uuid4().hex}@example.com"
    register_response = client.post(
        "/api/v1/auth/register",
        json={"email": email, "full_name": full_name, "password": "password123"},
    )
    assert register_response.status_code == 201
    verify_response = client.post(
        "/api/v1/auth/verify-email",
        json={"email": email, "code": register_response.json()["dev_verification_code"]},
    )
    assert verify_response.status_code == 200
    return email


def test_equal_split_rounding_adds_leftover_paise_to_payer() -> None:
    group_response = client.post(
        "/api/v1/groups/",
        json={"name": "Trip Split", "member_names": ["First Member", "Second Member"]},
    )

    assert group_response.status_code == 201
    group_id = group_response.json()["id"]

    expense_response = client.post(
        f"/api/v1/groups/{group_id}/expenses",
        json={
            "amount": 100,
            "description": "Dinner",
            "category_id": None,
            "expense_date": date.today().isoformat(),
            "split_type": "equal",
            "splits": None,
        },
    )

    assert expense_response.status_code == 201
    body = expense_response.json()
    payer_split = next(split for split in body["splits"] if split["user_id"] == body["paid_by"])
    split_total = round(sum(split["amount_owed"] for split in body["splits"]), 2)

    assert split_total == 100.0
    assert payer_split["amount_owed"] == 33.34
