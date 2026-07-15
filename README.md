# Smart Expense Tracker

An INR-first full-stack expense tracker that starts with reliable manual finance operations and grows into budgeting, OCR, and AI-assisted insights.

## Current Status

The repository now includes a working product foundation:

- `frontend/`: multi-page Next.js experience for dashboard, categories, reports, receipts, accounts, and savings
- `backend/`: FastAPI API with auth, accounts, categories, transactions, CSV tools, budgets, reports, and receipts
- `database/`: PostgreSQL reference schema and seed files aligned with the current MVP
- `infra/`: Docker-based local and deployment-friendly runtime
- `docs/`: architecture, roadmap, project layers, deployment, and workflow guides

The current MVP foundation already includes:

- database-backed categories and transactions
- seeded starter data for first-run experience
- dashboard reads from the API when available
- add-expense form wired to the backend flow
- transaction CSV import/export from the dashboard
- signup/login API with bearer-token sessions
- user-scoped transactions, budgets, and receipts
- category creation from the dashboard
- transaction deletion from the dashboard
- multi-section frontend navigation for home, categories, reports, receipts, split expenses, and about
- monthly rupee budgets with backend persistence
- report overview with category breakdown and budget utilization
- backend-generated smart insights for reports
- receipt upload workflow with review, category suggestions, duplicate checks, and ledger posting
- data-backed bank connections and savings transfer pages
- health and readiness checks for deployment probes
- production-oriented Dockerfiles and GitHub Actions CI
- Alembic migrations for production database setup

## Vision

Build a secure expense tracker that helps users:

- record income and expenses
- manage categories and rupee-based budgets
- view dashboards and reports
- upload receipts
- get smart category suggestions
- detect unusual spending patterns
- receive budget alerts

## Product Layers

1. `Capture Layer`
Transaction logging, categories, payment context, and clean bookkeeping.

2. `Control Layer`
Budgets, category-based reports, and monthly spending review in INR.

3. `Automation Layer`
Receipt workflows, recurring expense detection, and budget alert rules.

4. `Intelligence Layer`
Receipt OCR, AI categorization, anomaly detection, and natural-language insights.

5. `Platform Layer`
Docker, CI, managed infrastructure, secrets, and public deployment.

## Product Phases

### Phase 1: Core MVP

- user authentication
- add, edit, delete expenses
- add income records
- categories and payment accounts
- monthly budgets
- dashboard and reports
- CSV import/export

### Phase 2: Smart Automation

- receipt upload
- OCR text extraction
- auto-fill transaction details from receipts
- AI category suggestions
- recurring expense detection
- duplicate transaction detection

### Phase 3: Intelligence Layer

- spending insights in natural language
- anomaly detection
- future spending prediction
- savings recommendations
- shared or family wallets

## Recommended Stack

- Frontend: Next.js 15, React 19, TypeScript
- Backend: FastAPI, Python 3.12
- Database: PostgreSQL 18
- ORM: SQLModel or SQLAlchemy
- Queue/Cache: Redis
- Background jobs: Celery or RQ
- Storage: S3-compatible object storage for receipts
- OCR: Tesseract initially, optional upgrade to Google Vision or AWS Textract
- Charts: Recharts
- Auth: JWT with refresh tokens or managed auth later
- DevOps: Docker, GitHub Actions, platform-neutral container deployment

## Suggested Repository Structure

```text
smart-expense-tracker/
  frontend/
  backend/
  database/
  docs/
  infra/
```

## Frontend Sections

- `/`: home page for transaction entry and recent activity
- `/categories`: category creation and category management
- `/reports`: summary cards and category-based reporting
- `/receipts`: receipt upload, review, duplicate warning, and ledger posting
- `/bank-connections`: local account connection and balance management
- `/savings-transfer`: savings suggestions from budgets and balances
- `/about`: product direction and app overview

## Local Development

### Option 1: Run with Docker

```bash
make up
```

### Option 2: Run services separately

Backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e .
alembic upgrade head
python -m uvicorn app.main:app --reload
```

The backend uses SQLite by default for local development, so you can get moving without setting up Postgres first.
Docker uses PostgreSQL 18 through [infra/docker-compose.yml](./infra/docker-compose.yml).
Local SQLite auto-creates tables by default; hosted/PostgreSQL environments should use Alembic migrations.

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## First Working Endpoints

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

## Deployment Readiness

The repository is now set up so we can ship it with:

- a production Next.js container
- a production FastAPI container
- PostgreSQL and Redis wiring for hosted environments
- Alembic migrations for production schema setup
- a CI workflow that builds frontend and backend on every push or PR
- production config validation for auth secrets, CORS origins, and migration-based database setup

To make the app truly public, we still need real deployment credentials and runtime secrets for:

- the frontend public URL
- backend public URL and allowed frontend origins
- PostgreSQL
- Redis
- object storage credentials, if receipt file persistence moves beyond local metadata

## Initial Build Order

1. define product requirements and user flows
2. design database schema
3. set up backend API and authentication
4. build frontend dashboard and forms
5. add reporting and charts
6. add receipt OCR pipeline
7. add AI categorization and insights
8. add tests, CI/CD, monitoring, and deployment

## Core Modules

- auth
- users
- accounts
- transactions
- categories
- budgets
- reports
- receipts
- notifications
- AI suggestions

## Documentation

- [Architecture](./docs/architecture.md)
- [Database Schema](./docs/database-schema.md)
- [Product Layers](./docs/product-layers.md)
- [Deployment Guide](./docs/deployment.md)
- [Roadmap](./docs/roadmap.md)
- [GitHub Workflow](./docs/github-workflow.md)

## Brevo OTP Email

The backend sends account OTP emails through Brevo SMTP when `EMAIL_ENABLED=true`.
Create a free Brevo account, generate an SMTP key, verify your sender email, and add these values to `backend/.env`:

```env
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your-brevo-smtp-login
BREVO_SMTP_PASS=your-brevo-smtp-key
SENDER_EMAIL=your-verified-sender@example.com
SENDER_NAME=FinTrack AI
```

OTPs are valid for 5 minutes and limited to 3 requests per email every 10 minutes.

## First Milestone

The first milestone should deliver:

- signup and login
- create and manage categories
- create, edit, and delete transactions
- monthly dashboard
- budget setup with simple alerts

Once this is stable, the smart features become much easier to add cleanly.
