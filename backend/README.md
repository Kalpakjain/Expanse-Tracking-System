# Backend

FastAPI starter for the Smart Expense Tracker.

## Run locally

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e .
python -m uvicorn app.main:app --reload
```

By default, the backend uses a local SQLite database for quick development.
Set `DATABASE_URL` to PostgreSQL when you want to run against Postgres.

## First endpoints

- `GET /health`
- `GET /api/v1/categories`
- `POST /api/v1/categories`
- `GET /api/v1/transactions`
- `POST /api/v1/transactions`
- `GET /api/v1/reports/summary`
