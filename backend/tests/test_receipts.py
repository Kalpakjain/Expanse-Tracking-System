from datetime import date

from fastapi.testclient import TestClient

from app.db.init_db import create_database_and_seed
from app.main import app


create_database_and_seed()
client = TestClient(app)


def _default_account_id() -> str:
    response = client.get("/api/v1/accounts/")
    assert response.status_code == 200
    return next(account["id"] for account in response.json() if account["is_default"])


def test_can_post_receipt_to_transaction_ledger() -> None:
    upload_response = client.post(
        "/api/v1/receipts/",
        data={"merchant_hint": "Uber", "amount_hint": "375.5"},
        files={"file": ("uber-receipt.jpg", b"receipt bytes", "image/jpeg")},
    )
    assert upload_response.status_code == 201
    receipt = upload_response.json()
    assert receipt["status"] == "review_ready"
    assert receipt["suggested_category_name"] == "Transport"

    post_response = client.post(
        f"/api/v1/receipts/{receipt['id']}/transaction",
        json={
            "account_id": _default_account_id(),
            "account_name": "Primary Wallet",
            "amount": 375.5,
            "transaction_date": date.today().isoformat(),
            "payment_method": "UPI",
            "description": "Ride receipt",
            "notes": "Posted from receipt review",
        },
    )

    assert post_response.status_code == 201
    transaction = post_response.json()
    assert transaction["type"] == "expense"
    assert transaction["merchant_name"] == "Uber"
    assert transaction["amount"] == 375.5
    assert transaction["category_name"] == "Transport"

    receipts_response = client.get("/api/v1/receipts/")
    assert receipts_response.status_code == 200
    posted_receipt = next(item for item in receipts_response.json() if item["id"] == receipt["id"])
    assert posted_receipt["status"] == "posted"
    assert posted_receipt["duplicate_count"] >= 1


def test_posting_same_receipt_twice_returns_error() -> None:
    upload_response = client.post(
        "/api/v1/receipts/",
        data={"merchant_hint": "Cafe Test", "amount_hint": "215"},
        files={"file": ("cafe-test.jpg", b"receipt bytes", "image/jpeg")},
    )
    assert upload_response.status_code == 201
    receipt_id = upload_response.json()["id"]
    payload = {
        "account_id": _default_account_id(),
        "account_name": "Primary Wallet",
        "transaction_date": date.today().isoformat(),
        "payment_method": "UPI",
    }

    first_response = client.post(f"/api/v1/receipts/{receipt_id}/transaction", json=payload)
    assert first_response.status_code == 201

    second_response = client.post(f"/api/v1/receipts/{receipt_id}/transaction", json=payload)
    assert second_response.status_code == 400
