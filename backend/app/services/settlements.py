from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db.models import Group, GroupExpense, GroupExpenseSplit, GroupMember, Settlement, User
from app.schemas.settlement import SettlementCreate, SettlementRead


def create_settlement(db: Session, user: User, payload: SettlementCreate) -> SettlementRead:
    group = _get_group_for_member(db, user, payload.group_id)
    if not _is_group_member(db, group.id, str(payload.to_user_id)):
        raise ValueError("Settlement receiver is not a group member.")

    settlement = Settlement(
        group_id=group.id,
        from_user_id=user.id,
        to_user_id=str(payload.to_user_id),
        amount=round(payload.amount, 2),
        note=payload.note.strip(),
    )
    db.add(settlement)
    _mark_splits_settled(db, group.id, user.id, payload.amount)
    db.commit()
    db.refresh(settlement)
    return _to_settlement_read(_get_settlement(db, user, UUID(settlement.id)))


def list_settlements(db: Session, user: User, group_id: UUID) -> list[SettlementRead]:
    group = _get_group_for_member(db, user, group_id)
    settlements = db.scalars(
        select(Settlement)
        .where(Settlement.group_id == group.id)
        .options(selectinload(Settlement.from_user), selectinload(Settlement.to_user))
        .order_by(Settlement.settled_at.desc())
    ).all()
    return [_to_settlement_read(settlement) for settlement in settlements]


def _mark_splits_settled(db: Session, group_id: str, user_id: str, amount: float) -> None:
    remaining_amount = round(amount, 2)
    splits = db.scalars(
        select(GroupExpenseSplit)
        .join(GroupExpense)
        .where(
            GroupExpense.group_id == group_id,
            GroupExpense.paid_by != user_id,
            GroupExpenseSplit.user_id == user_id,
            GroupExpenseSplit.is_settled.is_(False),
        )
        .order_by(GroupExpense.expense_date.asc(), GroupExpense.created_at.asc())
    ).all()

    for split in splits:
        if remaining_amount <= 0:
            break
        if remaining_amount + 0.01 >= split.amount_owed:
            split.is_settled = True
            remaining_amount = round(remaining_amount - split.amount_owed, 2)
            db.add(split)


def _get_group_for_member(db: Session, user: User, group_id: UUID) -> Group:
    group = db.scalar(
        select(Group)
        .join(GroupMember)
        .where(Group.id == str(group_id), GroupMember.user_id == user.id)
    )
    if group is None:
        raise ValueError("Group not found.")
    return group


def _is_group_member(db: Session, group_id: str, user_id: str) -> bool:
    return db.scalar(
        select(GroupMember.id).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user_id,
        )
    ) is not None


def _get_settlement(db: Session, user: User, settlement_id: UUID) -> Settlement:
    settlement = db.scalar(
        select(Settlement)
        .join(Group, Group.id == Settlement.group_id)
        .join(GroupMember, GroupMember.group_id == Group.id)
        .where(Settlement.id == str(settlement_id), GroupMember.user_id == user.id)
        .options(selectinload(Settlement.from_user), selectinload(Settlement.to_user))
    )
    if settlement is None:
        raise ValueError("Settlement not found.")
    return settlement


def _to_settlement_read(settlement: Settlement) -> SettlementRead:
    return SettlementRead(
        id=settlement.id,
        group_id=settlement.group_id,
        from_user_id=settlement.from_user_id,
        from_user_name=settlement.from_user.full_name,
        to_user_id=settlement.to_user_id,
        to_user_name=settlement.to_user.full_name,
        amount=round(settlement.amount, 2),
        note=settlement.note,
        settled_at=settlement.settled_at,
    )
