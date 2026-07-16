# Architecture

## High-Level Goal

Create a modular expense tracking system that starts simple, works well in Indian rupees, and grows into an AI-assisted finance product without forcing a rewrite later.

## System Overview

```text
User
  ->
Next.js frontend
  ->
FastAPI backend
  ->
PostgreSQL

FastAPI also connects to:
  - Redis
  - background workers
  - receipt storage
  - OCR service
  - AI categorization service
```

## Frontend Responsibilities

- authentication screens
- transaction forms
- category and budget management
- dashboards and charts
- receipt upload UI
- split expense workspace
- smart suggestions and alerts

## Backend Responsibilities

- authentication and authorization
- transaction CRUD APIs
- budget logic
- reporting APIs
- group expense splitting APIs
- OCR job orchestration
- AI suggestion endpoints
- recurring transaction detection
- anomaly detection rules

## Service Boundaries

### Frontend

- Next.js app router
- server actions only where they simplify UI flow
- API consumption through typed client helpers

### Backend API

- REST APIs for core finance operations
- async background tasks for OCR and AI workloads
- validation via Pydantic models

### Database

- normalized financial records
- audit-friendly timestamps
- category, budget, receipt, and split-expense persistence
- PostgreSQL-first development and deployment with Alembic migrations

### Worker Layer

- process uploaded receipts
- extract fields from OCR
- run AI categorization
- generate scheduled alerts

## Non-Functional Requirements

- secure authentication
- encrypted secrets
- strong input validation
- reliable backups
- role-ready design for future multi-user support
- observability with logs and error tracking

## API Module Plan

- `/auth`
- `/users`
- `/accounts`
- `/categories`
- `/transactions`
- `/budgets`
- `/reports`
- `/receipts`
- `/groups`
- `/insights`
- `/alerts`

## Smart Features Strategy

Start with rules before machine learning where possible:

- keyword-based category matching
- merchant-based recurring detection
- threshold-based budget alerts

Then add AI where it clearly improves usability:

- category suggestions for ambiguous merchants
- natural-language explanations of spending
- anomaly summaries

This keeps the product useful even if AI services fail or are rate-limited.
