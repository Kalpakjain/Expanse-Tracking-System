INSERT INTO users (
    id,
    email,
    full_name,
    password_hash,
    is_active,
    is_demo
)
VALUES (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'demo@fintrack.local',
    'Demo User',
    'pbkdf2_sha256$29600293103661c4f9be81fc4c429812$ryu7XZvfuAyt0fLXQ9MI2k5yKPQsTG86Ncce8BbUJAo=',
    TRUE,
    TRUE
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO categories (id, name, type, color, icon, is_default)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Food', 'expense', '#D97706', 'utensils', TRUE),
    ('22222222-2222-2222-2222-222222222222', 'Transport', 'expense', '#2563EB', 'bus', TRUE),
    ('33333333-3333-3333-3333-333333333333', 'Bills', 'expense', '#7C3AED', 'receipt', TRUE),
    ('44444444-4444-4444-4444-444444444444', 'Salary', 'income', '#15803D', 'briefcase', TRUE)
ON CONFLICT (name) DO NOTHING;

INSERT INTO payment_accounts (
    id,
    user_id,
    name,
    type,
    institution_name,
    opening_balance,
    currency_code,
    color,
    is_default,
    is_active
)
VALUES
    (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'Primary Wallet',
        'wallet',
        '',
        0,
        'INR',
        '#0051D5',
        TRUE,
        TRUE
    ),
    (
        'ffffffff-ffff-ffff-ffff-ffffffffffff',
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'Cash',
        'cash',
        '',
        0,
        'INR',
        '#10B981',
        FALSE,
        TRUE
    )
ON CONFLICT (id) DO NOTHING;

INSERT INTO transactions (
    id,
    user_id,
    account_id,
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
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
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
