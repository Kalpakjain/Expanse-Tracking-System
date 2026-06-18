from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.db.models import User
from app.schemas.account import PaymentAccountCreate, PaymentAccountRead, PaymentAccountUpdate
from app.services.accounts import (
    create_payment_account,
    deactivate_payment_account,
    list_payment_accounts,
    update_payment_account,
)


router = APIRouter()


@router.get("/", response_model=list[PaymentAccountRead])
def get_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[PaymentAccountRead]:
    return list_payment_accounts(db, current_user)


@router.post("/", response_model=PaymentAccountRead, status_code=status.HTTP_201_CREATED)
def add_account(
    payload: PaymentAccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaymentAccountRead:
    try:
        return create_payment_account(db, current_user, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.put("/{account_id}", response_model=PaymentAccountRead)
def edit_account(
    account_id: str,
    payload: PaymentAccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaymentAccountRead:
    try:
        return update_payment_account(db, current_user, account_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_account(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    try:
        deactivate_payment_account(db, current_user, account_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)
