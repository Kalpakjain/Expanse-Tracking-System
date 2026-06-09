from sqlalchemy import select

from app.db.models import Category, Transaction
from app.db.session import SessionLocal, create_all_tables


def create_database_and_seed() -> None:
    create_all_tables()

    with SessionLocal() as session:
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
