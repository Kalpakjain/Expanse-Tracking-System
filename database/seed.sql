INSERT INTO categories (id, name, type, color, icon, is_default)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Food', 'expense', '#D97706', 'utensils', TRUE),
    ('22222222-2222-2222-2222-222222222222', 'Transport', 'expense', '#2563EB', 'bus', TRUE),
    ('33333333-3333-3333-3333-333333333333', 'Bills', 'expense', '#7C3AED', 'receipt', TRUE),
    ('44444444-4444-4444-4444-444444444444', 'Salary', 'income', '#15803D', 'briefcase', TRUE)
ON CONFLICT (name) DO NOTHING;

INSERT INTO transactions (
    id,
    account_name,
    category_id,
    type,
    amount,
    currency_code,
    merchant_name,
    description,
    transaction_date,
    payment_method,
    notes
)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Primary Wallet',
    '11111111-1111-1111-1111-111111111111',
    'expense',
    280.00,
    'INR',
    'Local Grocery',
    'Weekly essentials',
    CURRENT_DATE,
    'UPI',
    'Seed data for the dashboard preview'
)
ON CONFLICT (id) DO NOTHING;
