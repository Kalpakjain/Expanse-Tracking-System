from collections import defaultdict
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db.models import Category, Group, GroupExpense, GroupExpenseSplit, GroupMember, Settlement, User
from app.schemas.group_expense import GroupExpenseCreate, GroupExpenseRead, GroupExpenseSplitRead
from app.schemas.settlement import GroupBalanceEntry, GroupBalanceRead


def create_group_expense(db: Session, user: User, payload: GroupExpenseCreate) -> GroupExpenseRead:
    group = _get_group_for_member(db, user, payload.group_id)
    members = _get_group_members(db, group.id)
    payer_member = _member_by_user_id(members, user.id)
    if payer_member is None:
        raise ValueError("Group not found.")

    if payload.category_id is not None:
        category = db.get(Category, str(payload.category_id))
        if category is None or (category.user_id is not None and category.user_id != user.id):
            raise ValueError("Selected category does not exist.")

    split_amounts = _calculate_split_amounts(payload, members, user.id)
    expense = GroupExpense(
        group_id=group.id,
        paid_by=user.id,
        amount=round(payload.amount, 2),
        description=payload.description.strip(),
        category_id=str(payload.category_id) if payload.category_id is not None else None,
        expense_date=payload.expense_date,
        split_type=payload.split_type,
    )
    db.add(expense)
    db.flush()

    for member in members:
        db.add(
            GroupExpenseSplit(
                group_expense_id=expense.id,
                user_id=member.user_id,
                amount_owed=split_amounts[member.user_id],
            )
        )

    db.commit()
    db.refresh(expense)
    return _to_group_expense_read(_get_group_expense_for_member(db, user, UUID(expense.id)))


def list_group_expenses(db: Session, user: User, group_id: UUID) -> list[GroupExpenseRead]:
    group = _get_group_for_member(db, user, group_id)
    expenses = db.scalars(
        select(GroupExpense)
        .where(GroupExpense.group_id == group.id)
        .options(
            selectinload(GroupExpense.payer),
            selectinload(GroupExpense.splits).selectinload(GroupExpenseSplit.user),
        )
        .order_by(GroupExpense.expense_date.desc(), GroupExpense.created_at.desc())
    ).all()
    return [_to_group_expense_read(expense) for expense in expenses]


def get_group_balances(db: Session, user: User, group_id: UUID) -> GroupBalanceRead:
    group = _get_group_for_member(db, user, group_id)
    members = _get_group_members(db, group.id)
    balances = defaultdict(float)

    for member in members:
        balances[member.user_id] = 0.0

    expenses = db.scalars(
        select(GroupExpense)
        .where(GroupExpense.group_id == group.id)
        .options(selectinload(GroupExpense.splits))
    ).all()
    for expense in expenses:
        for split in expense.splits:
            if split.user_id == expense.paid_by:
                continue
            # The payer fronted this member's share, so the group owes the payer.
            balances[expense.paid_by] += split.amount_owed
            # This member consumed value paid by someone else, so they owe the group.
            balances[split.user_id] -= split.amount_owed

    settlements = db.scalars(select(Settlement).where(Settlement.group_id == group.id)).all()
    for settlement in settlements:
        # When a member pays another member, the payer's debt decreases.
        balances[settlement.from_user_id] += settlement.amount
        # The receiver's credit decreases because they collected part of what was owed.
        balances[settlement.to_user_id] -= settlement.amount

    return GroupBalanceRead(
        group_id=group.id,
        balances=[
            GroupBalanceEntry(
                user_id=member.user_id,
                full_name=member.user.full_name,
                net_balance=round(balances[member.user_id], 2),
            )
            for member in sorted(members, key=lambda item: item.user.full_name.lower())
        ],
    )


def get_friend_balances(db: Session, user: User) -> list[GroupBalanceEntry]:
    group_ids = db.scalars(
        select(Group.id)
        .join(GroupMember)
        .where(GroupMember.user_id == user.id)
    ).all()
    friend_balances: defaultdict[str, float] = defaultdict(float)
    friend_names: dict[str, str] = {}

    for group_id in group_ids:
        group_balance = get_group_balances(db, user, UUID(group_id))
        for balance in group_balance.balances:
            user_id = str(balance.user_id)
            if user_id == user.id:
                continue
            friend_names[user_id] = balance.full_name
            friend_balances[user_id] += balance.net_balance

    return [
        GroupBalanceEntry(
            user_id=friend_id,
            full_name=friend_names[friend_id],
            net_balance=round(net_balance, 2),
        )
        for friend_id, net_balance in sorted(
            friend_balances.items(),
            key=lambda item: friend_names[item[0]].lower(),
        )
    ]


def _calculate_split_amounts(
    payload: GroupExpenseCreate,
    members: list[GroupMember],
    payer_id: str,
) -> dict[str, float]:
    member_ids = [member.user_id for member in members]
    amount = round(payload.amount, 2)

    if payload.split_type == "equal":
        base_amount = round(amount / len(member_ids), 2)
        split_amounts = {member_id: base_amount for member_id in member_ids}
        return _apply_leftover_to_payer(split_amounts, amount, payer_id)

    if not payload.splits:
        raise ValueError("Splits are required for this split type.")

    split_values = {str(split.user_id): split.value for split in payload.splits}
    missing_members = [member_id for member_id in member_ids if member_id not in split_values]
    if missing_members:
        raise ValueError("Every group member must have a split value.")

    unknown_members = [member_id for member_id in split_values if member_id not in member_ids]
    if unknown_members:
        raise ValueError("Split contains a user who is not a group member.")

    if payload.split_type == "percentage":
        percentage_total = sum(split_values.values())
        if abs(percentage_total - 100) > 0.5:
            raise ValueError("Percentage splits must total 100.")
        split_amounts = {
            member_id: round((amount * split_values[member_id]) / 100, 2)
            for member_id in member_ids
        }
        return _apply_leftover_to_payer(split_amounts, amount, payer_id)

    split_amounts = {member_id: round(split_values[member_id], 2) for member_id in member_ids}
    if abs(sum(split_amounts.values()) - amount) > 0.01:
        raise ValueError("Custom splits must total the expense amount.")
    return _apply_leftover_to_payer(split_amounts, amount, payer_id)


def _apply_leftover_to_payer(split_amounts: dict[str, float], amount: float, payer_id: str) -> dict[str, float]:
    leftover = round(amount - sum(split_amounts.values()), 2)
    split_amounts[payer_id] = round(split_amounts[payer_id] + leftover, 2)
    return split_amounts


def _get_group_for_member(db: Session, user: User, group_id: UUID) -> Group:
    group = db.scalar(
        select(Group)
        .join(GroupMember)
        .where(Group.id == str(group_id), GroupMember.user_id == user.id)
    )
    if group is None:
        raise ValueError("Group not found.")
    return group


def _get_group_members(db: Session, group_id: str) -> list[GroupMember]:
    return db.scalars(
        select(GroupMember)
        .where(GroupMember.group_id == group_id)
        .options(selectinload(GroupMember.user))
        .order_by(GroupMember.joined_at.asc())
    ).all()


def _member_by_user_id(members: list[GroupMember], user_id: str) -> GroupMember | None:
    return next((member for member in members if member.user_id == user_id), None)


def _get_group_expense_for_member(db: Session, user: User, expense_id: UUID) -> GroupExpense:
    expense = db.scalar(
        select(GroupExpense)
        .join(Group, Group.id == GroupExpense.group_id)
        .join(GroupMember, GroupMember.group_id == Group.id)
        .where(GroupExpense.id == str(expense_id), GroupMember.user_id == user.id)
        .options(
            selectinload(GroupExpense.payer),
            selectinload(GroupExpense.splits).selectinload(GroupExpenseSplit.user),
        )
    )
    if expense is None:
        raise ValueError("Group expense not found.")
    return expense


def _to_group_expense_read(expense: GroupExpense) -> GroupExpenseRead:
    return GroupExpenseRead(
        id=expense.id,
        group_id=expense.group_id,
        paid_by=expense.paid_by,
        paid_by_name=expense.payer.full_name,
        amount=round(expense.amount, 2),
        description=expense.description,
        expense_date=expense.expense_date,
        split_type=expense.split_type,
        splits=[
            GroupExpenseSplitRead(
                user_id=split.user_id,
                full_name=split.user.full_name,
                amount_owed=round(split.amount_owed, 2),
                is_settled=split.is_settled,
            )
            for split in sorted(expense.splits, key=lambda item: item.user.full_name.lower())
        ],
        created_at=expense.created_at,
    )
