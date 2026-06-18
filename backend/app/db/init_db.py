from datetime import date

from sqlalchemy import inspect, select, text

from app.db.models import Budget, Category, NotificationPreference, PaymentAccount, Receipt, Transaction
from app.db.session import SessionLocal, create_all_tables, engine
from app.core.config import settings
from app.services.auth import get_demo_user


def create_database_and_seed() -> None:
    if settings.database_auto_create_tables:
        create_all_tables()
    if settings.database_auto_create_tables and engine.url.drivername.startswith("sqlite"):
        _ensure_local_user_columns()

    with SessionLocal() as session:
        demo_user = get_demo_user(session)
        _seed_default_accounts(session, demo_user.id)

        has_categories = session.scalar(select(Category.id).limit(1)) is not None
        if not has_categories:
            session.add_all(
                [
                    Category(name="Food", type="expense", color="#D97706", icon="utensils", is_default=True),
                    Category(
                        name="Transport",
                        type="expense",
                        color="#2563EB",
                        icon="bus",
                        is_default=True,
                    ),
                    Category(name="Bills", type="expense", color="#7C3AED", icon="receipt", is_default=True),
                    Category(name="Salary", type="income", color="#15803D", icon="briefcase", is_default=True),
                ]
            )
            session.commit()

        has_transactions = session.scalar(select(Transaction.id).limit(1)) is not None
        food_category = session.scalar(select(Category).where(Category.name == "Food"))
        if not has_transactions and food_category is not None:
            session.add(
                Transaction(
                    user_id=demo_user.id,
                    account_id=_default_account_id(session, demo_user.id),
                    account_name="Primary Wallet",
                    category_id=food_category.id,
                    type="expense",
                    amount=280.0,
                    currency_code="INR",
                    merchant_name="Local Grocery",
                    description="Weekly essentials",
                    transaction_date=Transaction.today(),
                    payment_method="UPI",
                    notes="Seed data for the dashboard preview",
                )
            )
            session.commit()

        has_budgets = session.scalar(select(Budget.id).limit(1)) is not None
        if not has_budgets and food_category is not None:
            today = date.today()
            session.add(
                Budget(
                    user_id=demo_user.id,
                    category_id=food_category.id,
                    month=today.month,
                    year=today.year,
                    limit_amount=8000.0,
                    currency_code="INR",
                    alert_threshold_percent=80,
                    is_active=True,
                )
            )
            session.commit()

        has_notification_preferences = (
            session.scalar(select(NotificationPreference.id).limit(1)) is not None
        )
        if not has_notification_preferences:
            session.add(
                NotificationPreference(
                    user_id=demo_user.id,
                    phone_number="",
                    daily_digest_enabled=True,
                    budget_alerts_enabled=True,
                    weekly_report_enabled=False,
                    preferred_send_hour=20,
                    timezone="Asia/Kolkata",
                    currency_code="INR",
                )
            )
            session.commit()

        _assign_existing_rows_to_demo_user(session, demo_user.id)


def _ensure_local_user_columns() -> None:
    if not engine.url.drivername.startswith("sqlite"):
        return

    inspector = inspect(engine)
    table_columns = {
        table_name: {column["name"] for column in inspector.get_columns(table_name)}
        for table_name in inspector.get_table_names()
    }
    user_scoped_tables = ["categories", "payment_accounts", "transactions", "receipts", "budgets", "notification_preferences"]

    with engine.begin() as connection:
        for table_name in user_scoped_tables:
            if table_name in table_columns and "user_id" not in table_columns[table_name]:
                connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN user_id VARCHAR(36)"))
        if "transactions" in table_columns and "account_id" not in table_columns["transactions"]:
            connection.execute(text("ALTER TABLE transactions ADD COLUMN account_id VARCHAR(36)"))


def _assign_existing_rows_to_demo_user(session, demo_user_id: str) -> None:
    session.query(Transaction).filter(Transaction.user_id.is_(None)).update({Transaction.user_id: demo_user_id})
    session.query(Receipt).filter(Receipt.user_id.is_(None)).update({Receipt.user_id: demo_user_id})
    session.query(Budget).filter(Budget.user_id.is_(None)).update({Budget.user_id: demo_user_id})
    session.query(NotificationPreference).filter(NotificationPreference.user_id.is_(None)).update(
        {NotificationPreference.user_id: demo_user_id}
    )
    default_account_id = _default_account_id(session, demo_user_id)
    if default_account_id:
        session.query(Transaction).filter(Transaction.user_id == demo_user_id, Transaction.account_id.is_(None)).update(
            {Transaction.account_id: default_account_id}
        )
    session.commit()


def _seed_default_accounts(session, user_id: str) -> None:
    has_accounts = session.scalar(select(PaymentAccount.id).where(PaymentAccount.user_id == user_id).limit(1)) is not None
    if has_accounts:
        return

    session.add_all(
        [
            PaymentAccount(
                user_id=user_id,
                name="Primary Wallet",
                type="wallet",
                institution_name="",
                opening_balance=0.0,
                currency_code="INR",
                color="#0051D5",
                is_default=True,
                is_active=True,
            ),
            PaymentAccount(
                user_id=user_id,
                name="Cash",
                type="cash",
                institution_name="",
                opening_balance=0.0,
                currency_code="INR",
                color="#10B981",
                is_default=False,
                is_active=True,
            ),
            PaymentAccount(
                user_id=user_id,
                name="Credit Card",
                type="credit_card",
                institution_name="",
                opening_balance=0.0,
                currency_code="INR",
                color="#F97316",
                is_default=False,
                is_active=True,
            ),
        ]
    )
    session.commit()


def _default_account_id(session, user_id: str) -> str | None:
    account = session.scalar(
        select(PaymentAccount).where(
            PaymentAccount.user_id == user_id,
            PaymentAccount.is_default.is_(True),
            PaymentAccount.is_active.is_(True),
        )
    )
    return account.id if account is not None else None
