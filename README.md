# Smart Expense Tracker

A practical blueprint for building a smart expense tracker with manual expense management first and AI-assisted features added in phases.

## Current Status

The repository now includes an initial implementation scaffold:

- `frontend/`: Next.js starter dashboard
- `backend/`: FastAPI starter API
- `database/`: PostgreSQL schema and seed starter
- `infra/`: Docker Compose setup
- `docs/`: product and engineering blueprint

The first real MVP slice is now underway:

- database-backed categories and transactions
- seeded starter data for first-run experience
- dashboard reads from the API when available
- add-expense form wired to the backend flow
- category creation from the dashboard
- transaction deletion from the dashboard
- multi-section frontend navigation for home, categories, reports, WhatsApp notifications, and about

## Vision

Build a secure expense tracker that helps users:

- record income and expenses
- manage categories and budgets
- view dashboards and reports
- upload receipts
- get smart category suggestions
- detect unusual spending patterns
- receive budget alerts

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

- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS
- Backend: FastAPI, Python 3.12
- Database: PostgreSQL 18
- ORM: SQLModel or SQLAlchemy
- Queue/Cache: Redis
- Background jobs: Celery or RQ
- Storage: S3-compatible object storage for receipts
- OCR: Tesseract initially, optional upgrade to Google Vision or AWS Textract
- Charts: Recharts
- Auth: JWT with refresh tokens or managed auth later
- DevOps: Docker, GitHub Actions, Vercel for frontend, Railway/Render/AWS for backend

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
python -m uvicorn app.main:app --reload
```

The backend uses SQLite by default for local development, so you can get moving without setting up Postgres first.
Docker still uses PostgreSQL 18 through [infra/docker-compose.yml](./infra/docker-compose.yml).

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## First Working Endpoints

- `GET /health`
- `GET /api/v1/categories`
- `POST /api/v1/categories`
- `GET /api/v1/transactions`
- `POST /api/v1/transactions`
- `DELETE /api/v1/transactions/{transaction_id}`
- `GET /api/v1/reports/summary`

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
