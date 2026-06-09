from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.db.models import Category, Transaction
from app.schemas.category import CategoryCreate, CategoryRead
from app.schemas.report import DashboardSummary
from app.schemas.transaction import TransactionCreate, TransactionRead


def list_categories(db: Session) -> list[CategoryRead]:
    categories = db.scalars(select(Category).order_by(Category.type.asc(), Category.name.asc())).all()
    return [CategoryRead.model_validate(category) for category in categories]


def create_category(db: Session, payload: CategoryCreate) -> CategoryRead:
    normalized_name = payload.name.strip()
    existing = db.scalar(select(Category).where(func.lower(Category.name) == normalized_name.lower()))
    if existing is not None:
        raise ValueError("Category name already exists.")

    category = Category(
        name=normalized_name,
        type=payload.type,
        color=payload.color,
        icon=payload.icon,
        is_default=False,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return CategoryRead.model_validate(category)


def list_transactions(db: Session) -> list[TransactionRead]:
    transactions = db.scalars(
        select(Transaction)
        .options(selectinload(Transaction.category))
        .order_by(Transaction.transaction_date.desc(), Transaction.created_at.desc())
    ).all()
    return [_to_transaction_read(transaction) for transaction in transactions]


def create_transaction(db: Session, payload: TransactionCreate) -> TransactionRead:
    category = db.get(Category, str(payload.category_id))
    if category is None:
        raise ValueError("Selected category does not exist.")

    transaction = Transaction(
        account_name=payload.account_name.strip(),
        category_id=category.id,
        type=payload.type,
        amount=payload.amount,
        currency_code=payload.currency_code.upper(),
        merchant_name=payload.merchant_name.strip(),
        description=payload.description.strip(),
        transaction_date=payload.transaction_date,
        payment_method=payload.payment_method.strip(),
        notes=payload.notes.strip(),
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return _to_transaction_read(transaction, category)


def delete_transaction(db: Session, transaction_id: UUID) -> None:
    transaction = db.get(Transaction, str(transaction_id))
    if transaction is None:
        raise ValueError("Transaction not found.")

    db.delete(transaction)
    db.commit()


def get_dashboard_summary(db: Session) -> DashboardSummary:
    total_income = db.scalar(
        select(func.coalesce(func.sum(Transaction.amount), 0.0)).where(Transaction.type == "income")
    )
    total_expenses = db.scalar(
        select(func.coalesce(func.sum(Transaction.amount), 0.0)).where(Transaction.type == "expense")
    )
    transaction_count = db.scalar(select(func.count(Transaction.id))) or 0
    category_count = db.scalar(select(func.count(Category.id))) or 0

    total_income_value = float(total_income or 0.0)
    total_expenses_value = float(total_expenses or 0.0)

    return DashboardSummary(
        total_income=round(total_income_value, 2),
        total_expenses=round(total_expenses_value, 2),
        balance=round(total_income_value - total_expenses_value, 2),
        transaction_count=int(transaction_count),
        category_count=int(category_count),
    )


def _to_transaction_read(
    transaction: Transaction,
    category: Category | None = None,
) -> TransactionRead:
    resolved_category_name = (category or transaction.category).name if (category or transaction.category) else "Unknown"
    return TransactionRead(
        id=transaction.id,
        account_name=transaction.account_name,
        category_id=transaction.category_id,
        type=transaction.type,
        amount=transaction.amount,
        currency_code=transaction.currency_code,
        merchant_name=transaction.merchant_name,
        description=transaction.description,
        transaction_date=transaction.transaction_date,
        payment_method=transaction.payment_method,
        notes=transaction.notes,
        category_name=resolved_category_name,
        created_at=transaction.created_at,
        updated_at=transaction.updated_at,
    )
