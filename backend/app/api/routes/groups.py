from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.db.models import User
from app.schemas.group import GroupCreate, GroupRead
from app.schemas.group_expense import GroupExpenseCreate, GroupExpenseRead
from app.schemas.settlement import GroupBalanceEntry, GroupBalanceRead, SettlementCreate, SettlementRead
from app.services.group_expenses import create_group_expense, get_friend_balances, get_group_balances, list_group_expenses
from app.services.groups import add_member, create_group, get_group, list_groups
from app.services.settlements import create_settlement, list_settlements


router = APIRouter()


class AddMemberRequest(BaseModel):
    name: str


class GroupExpenseRouteCreate(GroupExpenseCreate):
    group_id: UUID | None = None


class SettlementRouteCreate(SettlementCreate):
    group_id: UUID | None = None


@router.get("/", response_model=list[GroupRead])
def get_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[GroupRead]:
    return list_groups(db, current_user)


@router.post("/", response_model=GroupRead, status_code=status.HTTP_201_CREATED)
def add_group(
    payload: GroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GroupRead:
    try:
        return create_group(db, current_user, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/friends/balances", response_model=list[GroupBalanceEntry])
def read_friend_balances(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[GroupBalanceEntry]:
    return get_friend_balances(db, current_user)


@router.get("/{group_id}", response_model=GroupRead)
def read_group(
    group_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GroupRead:
    try:
        return get_group(db, current_user, group_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/{group_id}/members", response_model=GroupRead)
def add_group_member(
    group_id: UUID,
    payload: AddMemberRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GroupRead:
    try:
        return add_member(db, current_user, group_id, payload.name)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/{group_id}/expenses", response_model=list[GroupExpenseRead])
def get_group_expenses(
    group_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[GroupExpenseRead]:
    try:
        return list_group_expenses(db, current_user, group_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/{group_id}/expenses", response_model=GroupExpenseRead, status_code=status.HTTP_201_CREATED)
def add_group_expense(
    group_id: UUID,
    payload: GroupExpenseRouteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GroupExpenseRead:
    try:
        expense_payload = GroupExpenseCreate(**payload.model_dump(exclude={"group_id"}), group_id=group_id)
        return create_group_expense(db, current_user, expense_payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/{group_id}/balances", response_model=GroupBalanceRead)
def read_group_balances(
    group_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GroupBalanceRead:
    try:
        return get_group_balances(db, current_user, group_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/{group_id}/settlements", response_model=list[SettlementRead])
def get_settlements(
    group_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[SettlementRead]:
    try:
        return list_settlements(db, current_user, group_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/{group_id}/settlements", response_model=SettlementRead, status_code=status.HTTP_201_CREATED)
def add_settlement(
    group_id: UUID,
    payload: SettlementRouteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SettlementRead:
    try:
        settlement_payload = SettlementCreate(**payload.model_dump(exclude={"group_id"}), group_id=group_id)
        return create_settlement(db, current_user, settlement_payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
