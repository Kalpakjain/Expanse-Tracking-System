# Database Schema

## Design Principles

- every transaction belongs to a user
- accounts and categories are user-scoped
- receipts are linked to transactions when available
- keep enough metadata for future automation and analytics

## Core Tables

### users

```text
id
full_name
email
password_hash
currency_code
timezone
created_at
updated_at
```

### accounts

```text
id
user_id
name
type              # cash, bank, credit_card, wallet
institution_name
current_balance
currency_code
is_active
created_at
updated_at
```

### categories

```text
id
user_id
name
type              # expense or income
color
icon
is_default
created_at
updated_at
```

### transactions

```text
id
user_id
account_id
category_id
type              # expense or income
amount
currency_code
merchant_name
description
transaction_date
payment_method
location
notes
receipt_status
created_at
updated_at
```

### budgets

```text
id
user_id
category_id
month
year
limit_amount
alert_threshold_percent
created_at
updated_at
```

### receipts

```text
id
user_id
transaction_id
file_url
ocr_raw_text
ocr_status
parsed_merchant
parsed_total
parsed_date
created_at
updated_at
```

### recurring_rules

```text
id
user_id
merchant_name
category_id
expected_amount
frequency
last_detected_at
is_active
created_at
updated_at
```

### alerts

```text
id
user_id
type
title
message
status
triggered_at
read_at
created_at
```

### ai_suggestions

```text
id
user_id
transaction_id
suggestion_type
suggested_value
confidence_score
source
applied
created_at
```

## Example Relationships

- one user has many accounts
- one user has many categories
- one account has many transactions
- one category has many transactions
- one transaction may have one receipt
- one transaction may have many AI suggestions over time

## Future-Friendly Extensions

- tags table for flexible labels
- teams or households for shared finance
- bank_sync_connections for external providers
- audit_log for sensitive actions
