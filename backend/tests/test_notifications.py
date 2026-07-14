from datetime import date

from fastapi.testclient import TestClient

from app.db.init_db import create_database_and_seed
from app.main import app


create_database_and_seed()
client = TestClient(app)


def _expense_category_id() -> str:
    response = client.get("/api/v1/categories/")
    assert response.status_code == 200
    return next(category["id"] for category in response.json() if category["type"] == "expense")


def _default_account_id() -> str:
    response = client.get("/api/v1/accounts/")
    assert response.status_code == 200
    return next(account["id"] for account in response.json() if account["is_default"])


def test_notification_preview_returns_local_messages() -> None:
    response = client.get("/api/v1/settings/notifications/preview")

    assert response.status_code == 200
    body = response.json()
    assert body["timezone"] == "Asia/Kolkata"
    assert body["messages"]
    assert {"daily_digest", "budget_alert", "weekly_summary", "recurring_reminder"}.issuperset(
        {message["kind"] for message in body["messages"]}
    )


def test_notification_preview_surfaces_budget_alerts() -> None:
    category_id = _expense_category_id()
    budget_payload = {
        "category_id": category_id,
        "month": date.today().month,
        "year": date.today().year,
        "limit_amount": 100,
        "currency_code": "INR",
        "alert_threshold_percent": 50,
    }
    budget_response = client.post("/api/v1/budgets/", json=budget_payload)
    if budget_response.status_code not in {201, 400}:
        raise AssertionError(budget_response.text)

    transaction_response = client.post(
        "/api/v1/transactions/",
        json={
            "account_id": _default_account_id(),
            "account_name": "Primary Wallet",
            "category_id": category_id,
            "type": "expense",
            "amount": 125,
            "currency_code": "INR",
            "merchant_name": "Alert Test Merchant",
            "description": "Budget alert trigger",
            "transaction_date": date.today().isoformat(),
            "payment_method": "UPI",
            "notes": "Created by notification test",
        },
    )
    assert transaction_response.status_code == 201

    response = client.get("/api/v1/settings/notifications/preview")

    assert response.status_code == 200
    messages = response.json()["messages"]
    assert any(message["kind"] == "budget_alert" and message["severity"] == "high" for message in messages)
