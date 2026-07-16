# Roadmap

## Phase 0: Foundation

- finalize scope
- create repository structure
- define coding standards
- set up local development with Docker
- add CI with lint and test jobs

## Phase 1: MVP

### Goal

Ship a usable expense tracker without AI dependencies.

### Features

- authentication
- profile setup
- accounts
- categories
- transaction CRUD
- budget CRUD
- dashboard summary
- monthly and category reports

### Exit Criteria

- user can record daily expenses
- user can see current month spending
- user can compare spending against budgets

Status:
Completed locally.

## Phase 2: Smart Inputs

### Goal

Reduce manual effort for entering expenses.

### Features

- receipt upload
- OCR extraction
- transaction pre-fill from receipt
- category suggestion engine
- duplicate detection

### Exit Criteria

- user can upload a receipt and get a near-complete draft transaction
- at least basic merchants are auto-categorized correctly

Status:
Completed locally with receipt review, category suggestions, duplicate checks, and ledger posting.

## Phase 3: Smart Insights

### Goal

Help users understand and improve spending.

### Features

- recurring expense detection
- budget overrun alerts
- unusual spending alerts
- monthly AI summary
- split-expense summaries

### Exit Criteria

- user receives useful, explainable insights
- alerts feel accurate enough to trust

Status:
Completed locally with report insights, budget alerts, recurring reminders, and split-expense summaries.

## Phase 4: Scale and Polish

- performance tuning
- caching and query optimization
- audit logs
- stronger analytics
- mobile responsiveness polish
- deployment hardening
- monitoring and backup strategy

Status:
Deployment-ready foundation is present. Public hosting still needs real infrastructure credentials, domains, and production secrets.

## Suggested Execution Order by Week

### Weeks 1-2

- repo setup
- auth
- schema
- transaction APIs

### Weeks 3-4

- frontend dashboard
- budget features
- reporting

### Weeks 5-6

- receipt uploads
- OCR pipeline
- category suggestions

### Weeks 7-8

- alerts
- recurring detection
- QA and deployment
