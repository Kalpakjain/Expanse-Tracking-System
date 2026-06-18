from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.db.models import Category, PaymentAccount, Transaction, User
from app.schemas.category import CategoryCreate, CategoryRead
from app.schemas.report import DashboardSummary
from app.schemas.transaction import TransactionCreate, TransactionRead, TransactionUpdate


def list_categories(db: Session, user: User) -> list[CategoryRead]:
    categories = db.scalars(
        select(Category)
        .where(or_(Category.user_id.is_(None), Category.user_id == user.id))
        .order_by(Category.type.asc(), Category.name.asc())
    ).all()
    return [CategoryRead.model_validate(category) for category in categories]


def create_category(db: Session, user: User, payload: CategoryCreate) -> CategoryRead:
    normalized_name = payload.name.strip()
    existing = db.scalar(
        select(Category).where(
            func.lower(Category.name) == normalized_name.lower(),
            or_(Category.user_id.is_(None), Category.user_id == user.id),
        )
    )
    if existing is not None:
        raise ValueError("Category name already exists.")

    category = Category(
        user_id=user.id,
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


def list_transactions(db: Session, user: User) -> list[TransactionRead]:
    transactions = db.scalars(
        select(Transaction)
        .where(Transaction.user_id == user.id)
        .options(selectinload(Transaction.category), selectinload(Transaction.account))
        .order_by(Transaction.transaction_date.desc(), Transaction.created_at.desc())
    ).all()
    return [_to_transaction_read(transaction) for transaction in transactions]


def create_transaction(db: Session, user: User, payload: TransactionCreate) -> TransactionRead:
    category = _get_user_category(db, user, payload.category_id)
    account = _resolve_transaction_account(db, user, payload.account_id, payload.account_name)

    transaction = Transaction(
        user_id=user.id,
        account_id=account.id if account else None,
        account_name=account.name if account else payload.account_name.strip(),
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
    return _to_transaction_read(transaction, category, account)


def update_transaction(
    db: Session,
    user: User,
    transaction_id: UUID,
    payload: TransactionUpdate,
) -> TransactionRead:
    transaction = db.get(Transaction, str(transaction_id))
    if transaction is None or transaction.user_id != user.id:
        raise ValueError("Transaction not found.")

    category = _get_user_category(db, user, payload.category_id)
    account = _resolve_transaction_account(db, user, payload.account_id, payload.account_name)
    transaction.account_id = account.id if account else None
    transaction.account_name = account.name if account else payload.account_name.strip()
    transaction.category_id = category.id
    transaction.type = payload.type
    transaction.amount = payload.amount
    transaction.currency_code = payload.currency_code.upper()
    transaction.merchant_name = payload.merchant_name.strip()
    transaction.description = payload.description.strip()
    transaction.transaction_date = payload.transaction_date
    transaction.payment_method = payload.payment_method.strip()
    transaction.notes = payload.notes.strip()
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return _to_transaction_read(transaction, category, account)


def delete_transaction(db: Session, user: User, transaction_id: UUID) -> None:
    transaction = db.get(Transaction, str(transaction_id))
    if transaction is None or transaction.user_id != user.id:
        raise ValueError("Transaction not found.")

    db.delete(transaction)
    db.commit()


def _get_user_category(db: Session, user: User, category_id: UUID) -> Category:
    category = db.get(Category, str(category_id))
    if category is None or (category.user_id is not None and category.user_id != user.id):
        raise ValueError("Selected category does not exist.")
    return category


def _resolve_transaction_account(
    db: Session,
    user: User,
    account_id: UUID | None,
    fallback_name: str,
) -> PaymentAccount | None:
    if account_id is None:
        return None
    account = db.get(PaymentAccount, str(account_id))
    if account is None or account.user_id != user.id or not account.is_active:
        raise ValueError("Selected account does not exist.")
    return account


def get_dashboard_summary(db: Session, user: User) -> DashboardSummary:
    total_income = db.scalar(
        select(func.coalesce(func.sum(Transaction.amount), 0.0)).where(
            Transaction.user_id == user.id,
            Transaction.type == "income",
        )
    )
    total_expenses = db.scalar(
        select(func.coalesce(func.sum(Transaction.amount), 0.0)).where(
            Transaction.user_id == user.id,
            Transaction.type == "expense",
        )
    )
    transaction_count = db.scalar(select(func.count(Transaction.id)).where(Transaction.user_id == user.id)) or 0
    category_count = (
        db.scalar(
            select(func.count(Category.id)).where(or_(Category.user_id.is_(None), Category.user_id == user.id))
        )
        or 0
    )

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
    account: PaymentAccount | None = None,
) -> TransactionRead:
    resolved_category_name = (category or transaction.category).name if (category or transaction.category) else "Unknown"
    resolved_account = account or transaction.account
    account_display_name = resolved_account.name if resolved_account else transaction.account_name
    return TransactionRead(
        id=transaction.id,
        account_id=transaction.account_id,
        account_name=transaction.account_name,
        account_display_name=account_display_name,
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
