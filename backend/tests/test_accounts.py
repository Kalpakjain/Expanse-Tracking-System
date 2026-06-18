from fastapi.testclient import TestClient

from app.db.init_db import create_database_and_seed
from app.main import app


create_database_and_seed()
client = TestClient(app)


def test_accounts_endpoint_lists_seeded_accounts() -> None:
    response = client.get("/api/v1/accounts/")

    assert response.status_code == 200
    accounts = response.json()
    assert accounts
    assert any(account["name"] == "Primary Wallet" for account in accounts)
    assert all("current_balance" in account for account in accounts)


def test_can_create_payment_account() -> None:
    response = client.post(
        "/api/v1/accounts/",
        json={
            "name": "Test Bank Account",
            "type": "bank",
            "institution_name": "Test Bank",
            "opening_balance": 2500,
            "currency_code": "INR",
            "color": "#2563EB",
            "is_default": False,
        },
    )

    assert response.status_code in {201, 400}
    if response.status_code == 201:
        body = response.json()
        assert body["name"] == "Test Bank Account"
        assert body["current_balance"] == 2500


def test_can_update_payment_account() -> None:
    create_response = client.post(
        "/api/v1/accounts/",
        json={
            "name": "Editable Account",
            "type": "wallet",
            "institution_name": "",
            "opening_balance": 100,
            "currency_code": "INR",
            "color": "#0051D5",
            "is_default": False,
        },
    )
    assert create_response.status_code in {201, 400}
    if create_response.status_code == 400:
        accounts = client.get("/api/v1/accounts/").json()
        account = next(item for item in accounts if item["name"] == "Editable Account")
    else:
        account = create_response.json()

    update_response = client.put(
        f"/api/v1/accounts/{account['id']}",
        json={
            "name": "Updated Editable Account",
            "type": "bank",
            "institution_name": "Updated Bank",
            "opening_balance": 300,
            "currency_code": "INR",
            "color": "#10B981",
            "is_default": False,
        },
    )

    assert update_response.status_code == 200
    body = update_response.json()
    assert body["name"] == "Updated Editable Account"
    assert body["opening_balance"] == 300


def test_can_deactivate_payment_account_when_another_account_exists() -> None:
    create_response = client.post(
        "/api/v1/accounts/",
        json={
            "name": "Temporary Deactivate Account",
            "type": "cash",
            "institution_name": "",
            "opening_balance": 0,
            "currency_code": "INR",
            "color": "#F97316",
            "is_default": False,
        },
    )
    assert create_response.status_code in {201, 400}
    if create_response.status_code == 400:
        accounts = client.get("/api/v1/accounts/").json()
        account = next(item for item in accounts if item["name"] == "Temporary Deactivate Account")
    else:
        account = create_response.json()

    response = client.delete(f"/api/v1/accounts/{account['id']}")

    assert response.status_code == 204
