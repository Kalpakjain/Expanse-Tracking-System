from datetime import date

from fastapi.testclient import TestClient

from app.db.init_db import create_database_and_seed
from app.main import app


create_database_and_seed()
client = TestClient(app)


def _category_id(category_type: str) -> str:
    response = client.get("/api/v1/categories/")
    assert response.status_code == 200
    categories = response.json()
    return next(category["id"] for category in categories if category["type"] == category_type)


def _transaction_payload(category_id: str, transaction_type: str = "expense") -> dict[str, object]:
    return {
        "account_name": "Primary Wallet",
        "category_id": category_id,
        "type": transaction_type,
        "amount": 1250.0,
        "currency_code": "INR",
        "merchant_name": "Test Source" if transaction_type == "income" else "Test Merchant",
        "description": "Test transaction",
        "transaction_date": date.today().isoformat(),
        "payment_method": "UPI",
        "notes": "Created by test",
    }


def test_can_create_income_transaction() -> None:
    response = client.post(
        "/api/v1/transactions/",
        json=_transaction_payload(_category_id("income"), "income"),
    )

    assert response.status_code == 201
    body = response.json()
    assert body["type"] == "income"
    assert body["amount"] == 1250.0


def test_can_update_transaction() -> None:
    create_response = client.post(
        "/api/v1/transactions/",
        json=_transaction_payload(_category_id("expense")),
    )
    assert create_response.status_code == 201
    transaction = create_response.json()

    update_payload = {
        **_transaction_payload(_category_id("expense")),
        "amount": 499.0,
        "merchant_name": "Updated Merchant",
        "description": "Updated description",
    }
    update_response = client.put(f"/api/v1/transactions/{transaction['id']}", json=update_payload)

    assert update_response.status_code == 200
    body = update_response.json()
    assert body["amount"] == 499.0
    assert body["merchant_name"] == "Updated Merchant"
    assert body["description"] == "Updated description"


def test_update_missing_transaction_returns_not_found() -> None:
    response = client.put(
        "/api/v1/transactions/00000000-0000-0000-0000-000000000000",
        json=_transaction_payload(_category_id("expense")),
    )

    assert response.status_code == 404
