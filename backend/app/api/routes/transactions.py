import csv
from datetime import date
from io import StringIO
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.db.models import Category, PaymentAccount, User
from app.schemas.transaction import TransactionCreate, TransactionRead, TransactionUpdate
from app.services.finance import create_transaction, delete_transaction, list_transactions, update_transaction


router = APIRouter()

CSV_COLUMNS = [
    "type",
    "amount",
    "currency_code",
    "merchant_name",
    "description",
    "transaction_date",
    "payment_method",
    "notes",
    "category_name",
    "account_name",
]


@router.get("/", response_model=list[TransactionRead])
def get_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[TransactionRead]:
    return list_transactions(db, current_user)


@router.post("/", response_model=TransactionRead, status_code=status.HTTP_201_CREATED)
def add_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TransactionRead:
    try:
        return create_transaction(db, current_user, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/export")
def export_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    output = StringIO()
    writer = csv.DictWriter(output, fieldnames=CSV_COLUMNS)
    writer.writeheader()
    for transaction in list_transactions(db, current_user):
        writer.writerow(
            {
                "type": transaction.type,
                "amount": transaction.amount,
                "currency_code": transaction.currency_code,
                "merchant_name": transaction.merchant_name,
                "description": transaction.description,
                "transaction_date": transaction.transaction_date.isoformat(),
                "payment_method": transaction.payment_method,
                "notes": transaction.notes,
                "category_name": transaction.category_name,
                "account_name": transaction.account_display_name,
            }
        )
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="smart-expense-transactions.csv"'},
    )


@router.post("/import", status_code=status.HTTP_201_CREATED)
async def import_transactions(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, int]:
    try:
        content = (await file.read()).decode("utf-8-sig")
        rows = list(csv.DictReader(StringIO(content)))
    except UnicodeDecodeError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Upload a UTF-8 CSV file.") from exc

    imported_count = 0
    skipped_count = 0
    for row in rows:
        try:
            create_transaction(db, current_user, _csv_row_to_transaction(db, current_user, row))
            imported_count += 1
        except (KeyError, TypeError, ValueError):
            skipped_count += 1

    return {"imported_count": imported_count, "skipped_count": skipped_count}


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_transaction(
    transaction_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    try:
        delete_transaction(db, current_user, transaction_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/{transaction_id}", response_model=TransactionRead)
def edit_transaction(
    transaction_id: UUID,
    payload: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TransactionRead:
    try:
        return update_transaction(db, current_user, transaction_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


def _csv_row_to_transaction(db: Session, user: User, row: dict[str, str]) -> TransactionCreate:
    transaction_type = (row.get("type") or "expense").strip().lower()
    if transaction_type not in {"expense", "income"}:
        raise ValueError("Invalid transaction type.")

    category = _resolve_category(db, user, row.get("category_name", ""), transaction_type)
    account = _resolve_account(db, user, row.get("account_name", ""))
    return TransactionCreate(
        account_id=UUID(account.id) if account else None,
        account_name=account.name if account else (row.get("account_name") or "Primary Wallet").strip(),
        category_id=UUID(category.id),
        type=transaction_type,
        amount=float(row["amount"]),
        currency_code=(row.get("currency_code") or "INR").strip().upper(),
        merchant_name=(row.get("merchant_name") or "Imported transaction").strip(),
        description=(row.get("description") or "").strip(),
        transaction_date=date.fromisoformat(row["transaction_date"]),
        payment_method=(row.get("payment_method") or "UPI").strip(),
        notes=(row.get("notes") or "Imported from CSV").strip(),
    )


def _resolve_category(db: Session, user: User, category_name: str, transaction_type: str) -> Category:
    normalized_name = category_name.strip()
    if normalized_name:
        category = db.scalar(
            select(Category).where(
                func.lower(Category.name) == normalized_name.lower(),
                Category.type == transaction_type,
                or_(Category.user_id.is_(None), Category.user_id == user.id),
            )
        )
        if category is not None:
            return category

    category = db.scalar(
        select(Category)
        .where(Category.type == transaction_type, or_(Category.user_id.is_(None), Category.user_id == user.id))
        .order_by(Category.is_default.desc(), Category.name.asc())
    )
    if category is None:
        raise ValueError("No matching category found.")
    return category


def _resolve_account(db: Session, user: User, account_name: str) -> PaymentAccount | None:
    normalized_name = account_name.strip()
    if normalized_name:
        account = db.scalar(
            select(PaymentAccount).where(
                PaymentAccount.user_id == user.id,
                PaymentAccount.is_active.is_(True),
                func.lower(PaymentAccount.name) == normalized_name.lower(),
            )
        )
        if account is not None:
            return account

    return db.scalar(
        select(PaymentAccount).where(
            PaymentAccount.user_id == user.id,
            PaymentAccount.is_active.is_(True),
            PaymentAccount.is_default.is_(True),
        )
    )
