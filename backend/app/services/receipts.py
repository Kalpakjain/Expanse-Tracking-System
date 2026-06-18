from fastapi import UploadFile
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.db.models import Category, Receipt, User
from app.schemas.receipt import ReceiptRead


def list_receipts(db: Session, user: User) -> list[ReceiptRead]:
    receipts = db.scalars(
        select(Receipt)
        .where(Receipt.user_id == user.id)
        .options(selectinload(Receipt.suggested_category))
        .order_by(Receipt.created_at.desc())
    ).all()
    return [_to_receipt_read(receipt) for receipt in receipts]


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
    return _to_receipt_read(receipt, category)


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


def _to_receipt_read(receipt: Receipt, category: Category | None = None) -> ReceiptRead:
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
        created_at=receipt.created_at,
        updated_at=receipt.updated_at,
    )
