from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.db.models import User
from app.schemas.receipt import ReceiptRead
from app.services.receipts import create_receipt, list_receipts


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
