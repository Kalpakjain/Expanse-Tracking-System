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

### payment_accounts

Purpose:
Store wallets, cash, bank accounts, UPI accounts, and cards used by transactions.

Fields:

```text
id
user_id
name
type
institution_name
opening_balance
currency_code
color
is_default
is_active
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
account_id
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

## Current Relationships

- one user has many payment accounts, transactions, receipts, groups, and split-expense records
- one payment account has many transactions
- one category has many transactions
- global default categories can be shared by all users
- user-created categories belong to one user

## Seeded Defaults

The seed data currently creates:

- one demo user
- default payment accounts for Primary Wallet, Cash, and Credit Card
- default categories for Food, Transport, Bills, and Salary
- one sample INR expense transaction for the demo user

## Possible Later Tables

These are optional production extensions once the local app is hosted:

- `recurring_rules`
- `alerts`
- `ai_suggestions`
- `audit_log`

## Migration Direction

Alembic owns schema changes for local and production databases.

```bash
cd backend
alembic upgrade head
```

SQLite is reserved for explicit quick unit-test fallbacks; it is not the default development database.
