from datetime import date, timedelta
from uuid import UUID

from fastapi import UploadFile
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.db.models import Category, Receipt, Transaction, User
from app.schemas.receipt import ReceiptRead, ReceiptTransactionCreate
from app.schemas.transaction import TransactionCreate, TransactionRead
from app.services.finance import create_transaction


def list_receipts(db: Session, user: User) -> list[ReceiptRead]:
    receipts = db.scalars(
        select(Receipt)
        .where(Receipt.user_id == user.id)
        .options(selectinload(Receipt.suggested_category))
        .order_by(Receipt.created_at.desc())
    ).all()
    return [_to_receipt_read(receipt, db=db, user=user) for receipt in receipts]


async def create_receipt(
    db: Session,
    user: User,
    file: UploadFile,
    merchant_hint: str,
    amount_hint: float | None,
) -> ReceiptRead:
    file_bytes = await file.read()
    category = _suggest_category(db, user, file.filename or "", merchant_hint)
    merchant_name = merchant_hint.strip() or _merchant_from_filename(file.filename or "Receipt")

    receipt = Receipt(
        user_id=user.id,
        file_name=file.filename or "receipt",
        content_type=file.content_type or "application/octet-stream",
        file_size=len(file_bytes),
        status="review_ready",
        extracted_text=_build_extracted_text(merchant_name, amount_hint, category),
        merchant_name=merchant_name,
        suggested_amount=amount_hint,
        suggested_category_id=category.id if category else None,
        confidence_score=0.72 if merchant_hint or amount_hint else 0.58,
    )
    db.add(receipt)
    db.commit()
    db.refresh(receipt)
    return _to_receipt_read(receipt, category, db=db, user=user)


def create_transaction_from_receipt(
    db: Session,
    user: User,
    receipt_id: UUID,
    payload: ReceiptTransactionCreate,
) -> TransactionRead:
    receipt = db.get(Receipt, str(receipt_id))
    if receipt is None or receipt.user_id != user.id:
        raise ValueError("Receipt not found.")
    if receipt.status == "posted":
        raise ValueError("Receipt has already been posted to the ledger.")

    amount = payload.amount if payload.amount is not None else receipt.suggested_amount
    if amount is None:
        raise ValueError("Receipt needs an amount before it can become an expense.")

    category_id = payload.category_id or receipt.suggested_category_id or _fallback_expense_category_id(db, user)
    if category_id is None:
        raise ValueError("Create an expense category before posting this receipt.")

    transaction = create_transaction(
        db,
        user,
        TransactionCreate(
            account_name=payload.account_name,
            account_id=payload.account_id,
            category_id=category_id,
            type="expense",
            amount=amount,
            currency_code="INR",
            merchant_name=receipt.merchant_name,
            description=payload.description,
            transaction_date=payload.transaction_date,
            payment_method=payload.payment_method,
            notes=payload.notes or f"Created from receipt: {receipt.file_name}",
        ),
    )

    receipt.status = "posted"
    db.add(receipt)
    db.commit()
    return transaction


def _suggest_category(db: Session, user: User, file_name: str, merchant_hint: str) -> Category | None:
    text = f"{file_name} {merchant_hint}".lower()
    category_name = "Food"
    if any(keyword in text for keyword in ["uber", "ola", "bus", "train", "metro", "fuel"]):
        category_name = "Transport"
    elif any(keyword in text for keyword in ["bill", "electric", "wifi", "rent", "recharge"]):
        category_name = "Bills"

    category = db.scalar(
        select(Category).where(
            Category.name == category_name,
            or_(Category.user_id.is_(None), Category.user_id == user.id),
        )
    )
    if category is not None:
        return category
    return db.scalar(
        select(Category)
        .where(Category.type == "expense", or_(Category.user_id.is_(None), Category.user_id == user.id))
        .order_by(Category.name.asc())
    )


def _merchant_from_filename(file_name: str) -> str:
    stem = file_name.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").strip()
    return stem.title()[:80] or "Receipt"


def _build_extracted_text(
    merchant_name: str,
    amount_hint: float | None,
    category: Category | None,
) -> str:
    amount_text = f"Amount candidate: INR {amount_hint:.2f}" if amount_hint else "Amount candidate: needs review"
    category_text = f"Suggested category: {category.name}" if category else "Suggested category: needs review"
    return f"Merchant candidate: {merchant_name}\n{amount_text}\n{category_text}"


def _fallback_expense_category_id(db: Session, user: User) -> str | None:
    category = db.scalar(
        select(Category)
        .where(Category.type == "expense", or_(Category.user_id.is_(None), Category.user_id == user.id))
        .order_by(Category.is_default.desc(), Category.name.asc())
    )
    return category.id if category is not None else None


def _duplicate_count(db: Session, user: User, receipt: Receipt) -> int:
    if receipt.suggested_amount is None:
        return 0

    merchant_name = receipt.merchant_name.strip().lower()
    if not merchant_name:
        return 0

    today = date.today()
    start_date = today - timedelta(days=7)
    end_date = today + timedelta(days=1)
    count = db.scalar(
        select(func.count(Transaction.id)).where(
            Transaction.user_id == user.id,
            Transaction.type == "expense",
            func.lower(Transaction.merchant_name) == merchant_name,
            Transaction.amount == receipt.suggested_amount,
            Transaction.transaction_date >= start_date,
            Transaction.transaction_date <= end_date,
        )
    )
    return int(count or 0)


def _to_receipt_read(
    receipt: Receipt,
    category: Category | None = None,
    db: Session | None = None,
    user: User | None = None,
) -> ReceiptRead:
    resolved_category = category or receipt.suggested_category
    return ReceiptRead(
        id=receipt.id,
        file_name=receipt.file_name,
        content_type=receipt.content_type,
        file_size=receipt.file_size,
        status=receipt.status,
        extracted_text=receipt.extracted_text,
        merchant_name=receipt.merchant_name,
        suggested_amount=receipt.suggested_amount,
        suggested_category_id=receipt.suggested_category_id,
        suggested_category_name=resolved_category.name if resolved_category else None,
        confidence_score=receipt.confidence_score,
        duplicate_count=_duplicate_count(db, user, receipt) if db is not None and user is not None else 0,
        created_at=receipt.created_at,
        updated_at=receipt.updated_at,
    )
