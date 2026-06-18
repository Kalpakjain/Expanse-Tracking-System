# Backend

FastAPI backend for the INR-first Smart Expense Tracker.

## Run locally

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e .
python -m uvicorn app.main:app --reload
```

By default, the backend uses a local SQLite database for quick development.
Set `DATABASE_URL` to PostgreSQL when you want to run against Postgres.

## Database migrations

Alembic owns the production schema.

```bash
alembic upgrade head
```

Local SQLite development still auto-creates tables by default through `DATABASE_AUTO_CREATE_TABLES=true`.
For deployed environments, set `DATABASE_AUTO_CREATE_TABLES=false` and run migrations before the API starts.

## First endpoints

- `GET /health`
- `GET /ready`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/categories`
- `POST /api/v1/categories`
- `GET /api/v1/transactions`
- `POST /api/v1/transactions`
- `DELETE /api/v1/transactions/{transaction_id}`
- `GET /api/v1/reports/summary`
- `GET /api/v1/reports/overview`
- `GET /api/v1/budgets`
- `POST /api/v1/budgets`
- `DELETE /api/v1/budgets/{budget_id}`
- `GET /api/v1/settings/notifications`
- `PUT /api/v1/settings/notifications`
- `GET /api/v1/receipts`
- `POST /api/v1/receipts`

## Environment variables

- `APP_NAME`
- `APP_ENV`
- `APP_HOST`
- `APP_PORT`
- `FRONTEND_ORIGINS`
- `DATABASE_URL`
- `DATABASE_AUTO_CREATE_TABLES`
- `REDIS_URL`
- `AUTH_SECRET_KEY`
- `AUTH_TOKEN_TTL_MINUTES`
- `AUTH_REQUIRED`
- `DEMO_USER_EMAIL`
- `DEMO_USER_PASSWORD`

Use [`.env.example`](./.env.example) as the starting point for local or hosted configuration.
Use [`.env.production.example`](./.env.production.example) for production deployments.
