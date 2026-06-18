# Database Schema

This document reflects the user-scoped schema currently implemented in Alembic and mirrored by [database/schema.sql](../database/schema.sql).

## Current Tables

### users

Purpose:
Store account identities and password hashes.

Fields:

```text
id
email
full_name
password_hash
is_active
is_demo
created_at
updated_at
```

### categories

Purpose:
Store reusable income and expense buckets. Default categories can be global, while custom categories can belong to a user.

Fields:

```text
id
user_id
name
type                    # expense or income
color
icon
is_default
created_at
updated_at
```

### transactions

Purpose:
Store the core money ledger.

Fields:

```text
id
user_id
account_name
category_id
type                    # expense or income
amount
currency_code
merchant_name
description
transaction_date
payment_method
notes
created_at
updated_at
```

### budgets

Purpose:
Track monthly limits for expense categories in INR.

Fields:

```text
id
user_id
category_id
month
year
limit_amount
currency_code
alert_threshold_percent
is_active
created_at
updated_at
```

Rules:

- one budget per category per month per year
- budgets are intended for expense categories only

### receipts

Purpose:
Store uploaded receipt metadata and review-ready extraction hints.

Fields:

```text
id
user_id
file_name
content_type
file_size
status
extracted_text
merchant_name
suggested_amount
suggested_category_id
confidence_score
created_at
updated_at
```

### notification_preferences

Purpose:
Store WhatsApp and digest preferences for future scheduled delivery.

Fields:

```text
id
user_id
phone_number
daily_digest_enabled
budget_alerts_enabled
weekly_report_enabled
preferred_send_hour
timezone
currency_code
created_at
updated_at
```

## Current Relationships

- one user has many transactions, budgets, receipts, and notification preferences
- one category has many transactions
- one category has many budgets
- global default categories can be shared by all users
- user-created categories belong to one user

## Seeded Defaults

The seed data currently creates:

- one demo user
- default categories for Food, Transport, Bills, and Salary
- one sample INR expense transaction for the demo user
- one sample monthly Food budget for the demo user
- one default notification-preferences row for the demo user

## Planned Next Tables

These are part of the longer-term design but are not implemented yet:

- `accounts`
- `recurring_rules`
- `alerts`
- `ai_suggestions`
- `audit_log`

## Migration Direction

Alembic now owns production schema changes.

```bash
cd backend
alembic upgrade head
```

SQLite local development can still use SQLAlchemy auto-create behavior for fast iteration.
