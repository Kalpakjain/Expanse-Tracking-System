# Backend

FastAPI backend for the INR-first Smart Expense Tracker.

## Run locally

```bash
cd ..
docker compose -f infra/docker-compose.yml up -d postgres redis
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e .
alembic upgrade head
python -m uvicorn app.main:app --reload
```

Local development should run against PostgreSQL from `infra/docker-compose.yml`.
SQLite is only an optional fallback for quick unit-test experiments by explicitly setting `DATABASE_URL=sqlite:///...`.

## Database migrations

Alembic owns the production schema.
It is also the source of truth for local development.

```bash
alembic upgrade head
```

Keep `DATABASE_AUTO_CREATE_TABLES=false` for normal local and deployed environments, and run migrations before the API starts.

## First endpoints

- `GET /health`
- `GET /ready`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/send-otp`
- `POST /api/v1/auth/verify-otp`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/verify-email`
- `POST /api/v1/auth/resend-verification`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/categories`
- `POST /api/v1/categories`
- `GET /api/v1/transactions`
- `POST /api/v1/transactions`
- `GET /api/v1/transactions/export`
- `POST /api/v1/transactions/import`
- `PUT /api/v1/transactions/{transaction_id}`
- `DELETE /api/v1/transactions/{transaction_id}`
- `GET /api/v1/reports/summary`
- `GET /api/v1/reports/overview`
- `GET /api/v1/budgets`
- `POST /api/v1/budgets`
- `DELETE /api/v1/budgets/{budget_id}`
- `GET /api/v1/receipts`
- `POST /api/v1/receipts`
- `POST /api/v1/receipts/{receipt_id}/transaction`

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
- `EMAIL_ENABLED`
- `BREVO_SMTP_HOST`
- `BREVO_SMTP_PORT`
- `BREVO_SMTP_USER`
- `BREVO_SMTP_PASS`
- `SENDER_EMAIL`
- `SENDER_NAME`
- `OTP_TTL_MINUTES`
- `OTP_RATE_LIMIT_COUNT`
- `OTP_RATE_LIMIT_WINDOW_MINUTES`
- `OTP_MAX_ATTEMPTS`

Use [`.env.example`](./.env.example) as the starting point for local or hosted configuration.
Use [`.env.production.example`](./.env.production.example) for production deployments.

## Brevo email OTP setup

1. Create a free Brevo account.
2. Open Brevo SMTP settings and generate an SMTP key.
3. Verify the sender email you want to use for `SENDER_EMAIL`.
4. Add the SMTP login and key to `.env`.
5. Set `EMAIL_ENABLED=true`.
6. Restart the FastAPI backend.

Brevo's free tier supports 300 emails per day. OTPs are valid for 5 minutes by default, and each email can request at most 3 OTPs per 10-minute window.
