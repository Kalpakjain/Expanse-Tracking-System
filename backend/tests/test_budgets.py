from fastapi.testclient import TestClient

from app.db.init_db import create_database_and_seed
from app.main import app


create_database_and_seed()
client = TestClient(app)


def _expense_category_id() -> str:
    response = client.get("/api/v1/categories/")
    assert response.status_code == 200
    return next(category["id"] for category in response.json() if category["type"] == "expense")


def test_can_update_budget() -> None:
    category_id = _expense_category_id()
    payload = {
        "category_id": category_id,
        "month": 12,
        "year": 2099,
        "limit_amount": 5000,
        "currency_code": "INR",
        "alert_threshold_percent": 80,
    }
    create_response = client.post("/api/v1/budgets/", json=payload)
    if create_response.status_code == 201:
        budget = create_response.json()
    else:
        assert create_response.status_code == 400
        budgets = client.get("/api/v1/budgets/").json()
        budget = next(item for item in budgets if item["month"] == 12 and item["year"] == 2099)

    update_response = client.put(
        f"/api/v1/budgets/{budget['id']}",
        json={**payload, "limit_amount": 7500, "alert_threshold_percent": 90},
    )

    assert update_response.status_code == 200
    body = update_response.json()
    assert body["limit_amount"] == 7500
    assert body["alert_threshold_percent"] == 90


def test_update_missing_budget_returns_error() -> None:
    response = client.put(
        "/api/v1/budgets/00000000-0000-0000-0000-000000000000",
        json={
            "category_id": _expense_category_id(),
            "month": 1,
            "year": 2099,
            "limit_amount": 1000,
            "currency_code": "INR",
            "alert_threshold_percent": 80,
        },
    )

    assert response.status_code == 400
