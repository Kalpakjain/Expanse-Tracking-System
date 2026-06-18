# Smart Expense Tracker

An INR-first full-stack expense tracker that starts with reliable manual finance operations and grows into budgeting, notifications, OCR, and AI-assisted insights.

## Current Status

The repository now includes a working product foundation:

- `frontend/`: multi-page Next.js experience for home, categories, reports, notifications, and about
- `backend/`: FastAPI API with categories, transactions, budgets, report overview, and notification settings
- `database/`: PostgreSQL reference schema and seed files aligned with the current MVP
- `infra/`: Docker-based local and deployment-friendly runtime
- `docs/`: architecture, roadmap, project layers, deployment, and workflow guides

The current MVP foundation already includes:

- database-backed categories and transactions
- seeded starter data for first-run experience
- dashboard reads from the API when available
- add-expense form wired to the backend flow
- signup/login API with bearer-token sessions
- user-scoped transactions, budgets, receipts, and notification settings
- category creation from the dashboard
- transaction deletion from the dashboard
- multi-section frontend navigation for home, categories, reports, WhatsApp notifications, and about
- monthly rupee budgets with backend persistence
- report overview with category breakdown and budget utilization
- persisted WhatsApp notification preferences
- backend-generated smart insights for reports
- receipt upload workflow with review-ready OCR/category suggestions
- Stitch-inspired bank connections and savings transfer pages
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
WhatsApp preferences, scheduled digests, and budget alert plumbing.

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
- `/whatsapp-notifications`: notification preferences UI
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
- future WhatsApp provider credentials
- future object storage credentials for receipts

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

## First Milestone

The first milestone should deliver:

- signup and login
- create and manage categories
- create, edit, and delete transactions
- monthly dashboard
- budget setup with simple alerts

Once this is stable, the smart features become much easier to add cleanly.
