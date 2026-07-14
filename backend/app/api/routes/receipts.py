from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.db.models import User
from app.schemas.receipt import ReceiptRead, ReceiptTransactionCreate
from app.schemas.transaction import TransactionRead
from app.services.receipts import create_receipt, create_transaction_from_receipt, list_receipts


router = APIRouter()


@router.get("/", response_model=list[ReceiptRead])
def get_receipts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ReceiptRead]:
    return list_receipts(db, current_user)


@router.post("/", response_model=ReceiptRead, status_code=status.HTTP_201_CREATED)
async def upload_receipt(
    file: UploadFile = File(...),
    merchant_hint: str = Form(default=""),
    amount_hint: float | None = Form(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReceiptRead:
    return await create_receipt(db, current_user, file, merchant_hint, amount_hint)


@router.post("/{receipt_id}/transaction", response_model=TransactionRead, status_code=status.HTTP_201_CREATED)
def post_receipt_to_ledger(
    receipt_id: UUID,
    payload: ReceiptTransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TransactionRead:
    try:
        return create_transaction_from_receipt(db, current_user, receipt_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
