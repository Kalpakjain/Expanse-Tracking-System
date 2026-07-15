CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(80) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('expense', 'income')),
    color VARCHAR(20) NOT NULL DEFAULT '#2F855A',
    icon VARCHAR(40) NOT NULL DEFAULT 'wallet',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_accounts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(60) NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'wallet',
    institution_name VARCHAR(80) NOT NULL DEFAULT '',
    opening_balance DOUBLE PRECISION NOT NULL DEFAULT 0,
    currency_code CHAR(3) NOT NULL DEFAULT 'INR',
    color VARCHAR(20) NOT NULL DEFAULT '#0051D5',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES payment_accounts(id) ON DELETE SET NULL,
    account_name VARCHAR(60) NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('expense', 'income')),
    amount DOUBLE PRECISION NOT NULL CHECK (amount > 0),
    currency_code CHAR(3) NOT NULL DEFAULT 'INR',
    merchant_name VARCHAR(80) NOT NULL,
    description VARCHAR(160) NOT NULL DEFAULT '',
    transaction_date DATE NOT NULL,
    payment_method VARCHAR(40) NOT NULL,
    notes VARCHAR(250) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year BETWEEN 2025 AND 2100),
    limit_amount DOUBLE PRECISION NOT NULL CHECK (limit_amount > 0),
    currency_code CHAR(3) NOT NULL DEFAULT 'INR',
    alert_threshold_percent INTEGER NOT NULL DEFAULT 80 CHECK (alert_threshold_percent BETWEEN 1 AND 100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, category_id, month, year)
);

CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(180) NOT NULL,
    content_type VARCHAR(80) NOT NULL DEFAULT 'application/octet-stream',
    file_size INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'review_ready',
    extracted_text TEXT NOT NULL DEFAULT '',
    merchant_name VARCHAR(80) NOT NULL DEFAULT '',
    suggested_amount DOUBLE PRECISION,
    suggested_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    confidence_score DOUBLE PRECISION NOT NULL DEFAULT 0.62,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_category_date ON transactions(category_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_payment_accounts_user ON payment_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(year, month);
CREATE INDEX IF NOT EXISTS idx_budgets_user_period ON budgets(user_id, year, month);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at);
