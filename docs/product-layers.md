# Product Layers

This project is being built as a layered INR-first finance product so the foundations stay stable while smarter features are added later.

## Layer 1: Capture

Purpose:
Create a trustworthy financial record.

Scope:

- add income and expense transactions
- manage categories
- store payment method, merchant, notes, and transaction date
- keep the home screen optimized for fast day-to-day entry

Current status:
Implemented in the frontend and backend.

## Layer 2: Control

Purpose:
Help users make monthly decisions in rupees, not just collect data.

Scope:

- rupee-based dashboard summaries
- category-level reporting
- monthly budgets by category
- budget utilization and remaining balance

Current status:
Implemented in the reports flow and backend overview APIs.

## Layer 3: Automation

Purpose:
Reduce manual follow-up work after the records are captured.

Scope:

- notification preferences
- daily digest scheduling
- weekly summary scheduling
- budget threshold alerts
- recurring-expense reminders

Current status:
Preferences are implemented. Delivery and background scheduling are next.

## Layer 4: Intelligence

Purpose:
Turn the finance record into guidance.

Scope:

- receipt OCR
- auto-categorization
- duplicate detection
- anomaly detection
- natural-language insights

Current status:
Designed, not yet implemented.

## Layer 5: Platform

Purpose:
Make the product reliable, deployable, and maintainable.

Scope:

- Docker-based runtime
- GitHub Actions CI
- PostgreSQL and Redis support
- environment-driven configuration
- production deployment flow

Current status:
Repository is deployment-ready, but public hosting still requires real infrastructure credentials and domains.
