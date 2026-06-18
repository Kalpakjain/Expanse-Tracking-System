from fastapi.testclient import TestClient

from app.db.init_db import create_database_and_seed
from app.main import app


create_database_and_seed()
client = TestClient(app)


def test_app_metadata() -> None:
    assert app.title == "Smart Expense Tracker API"


def test_healthcheck() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_readiness_check() -> None:
    response = client.get("/ready")

    assert response.status_code == 200
    assert response.json() == {"status": "ready", "database": "connected"}


def test_receipts_endpoint_lists_receipts() -> None:
    response = client.get("/api/v1/receipts/")

    assert response.status_code == 200
    assert isinstance(response.json(), list)

