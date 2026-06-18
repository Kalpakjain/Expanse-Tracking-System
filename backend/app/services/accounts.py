from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import PaymentAccount, Transaction, User
from app.schemas.account import PaymentAccountCreate, PaymentAccountRead, PaymentAccountUpdate


def list_payment_accounts(db: Session, user: User) -> list[PaymentAccountRead]:
    accounts = db.scalars(
        select(PaymentAccount)
        .where(PaymentAccount.user_id == user.id, PaymentAccount.is_active.is_(True))
        .order_by(PaymentAccount.is_default.desc(), PaymentAccount.name.asc())
    ).all()
    balances = _build_account_balances(db, user)
    return [_to_account_read(account, balances.get(account.id, 0.0)) for account in accounts]


def create_payment_account(db: Session, user: User, payload: PaymentAccountCreate) -> PaymentAccountRead:
    normalized_name = payload.name.strip()
    existing = db.scalar(
        select(PaymentAccount).where(
            PaymentAccount.user_id == user.id,
            func.lower(PaymentAccount.name) == normalized_name.lower(),
            PaymentAccount.is_active.is_(True),
        )
    )
    if existing is not None:
        raise ValueError("An account with this name already exists.")

    if payload.is_default:
        _clear_default_accounts(db, user)

    account = PaymentAccount(
        user_id=user.id,
        name=normalized_name,
        type=payload.type,
        institution_name=payload.institution_name.strip(),
        opening_balance=payload.opening_balance,
        currency_code=payload.currency_code.upper(),
        color=payload.color,
        is_default=payload.is_default,
        is_active=True,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return _to_account_read(account, account.opening_balance)


def update_payment_account(
    db: Session,
    user: User,
    account_id: str,
    payload: PaymentAccountUpdate,
) -> PaymentAccountRead:
    account = _get_user_account(db, user, account_id)
    normalized_name = payload.name.strip()
    existing = db.scalar(
        select(PaymentAccount).where(
            PaymentAccount.user_id == user.id,
            func.lower(PaymentAccount.name) == normalized_name.lower(),
            PaymentAccount.id != account.id,
            PaymentAccount.is_active.is_(True),
        )
    )
    if existing is not None:
        raise ValueError("An account with this name already exists.")

    if payload.is_default:
        _clear_default_accounts(db, user)

    account.name = normalized_name
    account.type = payload.type
    account.institution_name = payload.institution_name.strip()
    account.opening_balance = payload.opening_balance
    account.currency_code = payload.currency_code.upper()
    account.color = payload.color
    account.is_default = payload.is_default
    db.add(account)
    db.commit()
    db.refresh(account)
    balances = _build_account_balances(db, user)
    return _to_account_read(account, balances.get(account.id, account.opening_balance))


def deactivate_payment_account(db: Session, user: User, account_id: str) -> None:
    account = _get_user_account(db, user, account_id)
    active_count = (
        db.scalar(
            select(func.count(PaymentAccount.id)).where(
                PaymentAccount.user_id == user.id,
                PaymentAccount.is_active.is_(True),
            )
        )
        or 0
    )
    if int(active_count) <= 1:
        raise ValueError("At least one active account is required.")

    account.is_active = False
    account.is_default = False
    db.add(account)
    db.commit()

    has_default = db.scalar(
        select(PaymentAccount.id).where(
            PaymentAccount.user_id == user.id,
            PaymentAccount.is_default.is_(True),
            PaymentAccount.is_active.is_(True),
        )
    )
    if has_default is None:
        next_account = db.scalar(
            select(PaymentAccount)
            .where(PaymentAccount.user_id == user.id, PaymentAccount.is_active.is_(True))
            .order_by(PaymentAccount.created_at.asc())
        )
        if next_account is not None:
            next_account.is_default = True
            db.add(next_account)
            db.commit()


def get_or_create_default_account(db: Session, user: User) -> PaymentAccount:
    account = db.scalar(
        select(PaymentAccount).where(
            PaymentAccount.user_id == user.id,
            PaymentAccount.is_default.is_(True),
            PaymentAccount.is_active.is_(True),
        )
    )
    if account is not None:
        return account

    account = PaymentAccount(
        user_id=user.id,
        name="Primary Wallet",
        type="wallet",
        institution_name="",
        opening_balance=0.0,
        currency_code="INR",
        color="#0051D5",
        is_default=True,
        is_active=True,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


def _clear_default_accounts(db: Session, user: User) -> None:
    db.query(PaymentAccount).filter(PaymentAccount.user_id == user.id).update({PaymentAccount.is_default: False})


def _get_user_account(db: Session, user: User, account_id: str) -> PaymentAccount:
    account = db.get(PaymentAccount, account_id)
    if account is None or account.user_id != user.id or not account.is_active:
        raise ValueError("Account not found.")
    return account


def _build_account_balances(db: Session, user: User) -> dict[str, float]:
    accounts = db.scalars(select(PaymentAccount).where(PaymentAccount.user_id == user.id)).all()
    balances = {account.id: account.opening_balance for account in accounts}
    transactions = db.scalars(select(Transaction).where(Transaction.user_id == user.id)).all()
    for transaction in transactions:
        if not transaction.account_id:
            continue
        direction = 1 if transaction.type == "income" else -1
        balances[transaction.account_id] = balances.get(transaction.account_id, 0.0) + direction * transaction.amount
    return {account_id: round(balance, 2) for account_id, balance in balances.items()}


def _to_account_read(account: PaymentAccount, current_balance: float) -> PaymentAccountRead:
    return PaymentAccountRead(
        id=account.id,
        name=account.name,
        type=account.type,
        institution_name=account.institution_name,
        opening_balance=account.opening_balance,
        current_balance=round(current_balance, 2),
        currency_code=account.currency_code,
        color=account.color,
        is_default=account.is_default,
        is_active=account.is_active,
        created_at=account.created_at,
        updated_at=account.updated_at,
    )
