from uuid import UUID, uuid4

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.db.models import Group, GroupMember, User
from app.schemas.group import GroupCreate, GroupMemberRead, GroupRead


def create_group(db: Session, user: User, payload: GroupCreate) -> GroupRead:
    group = Group(name=payload.name.strip(), created_by=user.id)
    db.add(group)
    db.flush()

    db.add(GroupMember(group_id=group.id, user_id=user.id))

    seen_member_names = {user.full_name.strip().lower()}
    for member_name in payload.member_names:
        normalized_name = member_name.strip()
        if not normalized_name:
            continue
        if normalized_name.lower() in seen_member_names:
            continue
        member_user = _create_placeholder_user(db, normalized_name)
        seen_member_names.add(normalized_name.lower())
        db.add(GroupMember(group_id=group.id, user_id=member_user.id))

    db.commit()
    db.refresh(group)
    return _to_group_read(_get_user_group(db, user, UUID(group.id)))


def list_groups(db: Session, user: User) -> list[GroupRead]:
    groups = db.scalars(
        select(Group)
        .join(GroupMember)
        .where(GroupMember.user_id == user.id)
        .options(selectinload(Group.members).selectinload(GroupMember.user))
        .order_by(Group.created_at.desc())
    ).all()
    return [_to_group_read(group) for group in groups]


def get_group(db: Session, user: User, group_id: UUID) -> GroupRead:
    return _to_group_read(_get_user_group(db, user, group_id))


def add_member(db: Session, user: User, group_id: UUID, name: str) -> GroupRead:
    group = _get_user_group(db, user, group_id)
    if group.created_by != user.id:
        raise ValueError("Only the group creator can add members.")

    normalized_name = name.strip()
    if not normalized_name:
        raise ValueError("Member name is required.")

    existing_names = {member.user.full_name.strip().lower() for member in group.members}
    if normalized_name.lower() in existing_names:
        return _to_group_read(_get_user_group(db, user, group_id))

    member_user = _create_placeholder_user(db, normalized_name)
    db.add(GroupMember(group_id=group.id, user_id=member_user.id))
    db.commit()

    return _to_group_read(_get_user_group(db, user, group_id))


def user_is_group_member(db: Session, user_id: str, group_id: str) -> bool:
    return (
        db.scalar(
            select(func.count(GroupMember.id)).where(
                GroupMember.group_id == group_id,
                GroupMember.user_id == user_id,
            )
        )
        or 0
    ) > 0


def _get_user_group(db: Session, user: User, group_id: UUID) -> Group:
    group = db.scalar(
        select(Group)
        .join(GroupMember)
        .where(Group.id == str(group_id), GroupMember.user_id == user.id)
        .options(selectinload(Group.members).selectinload(GroupMember.user))
    )
    if group is None:
        raise ValueError("Group not found.")
    return group


def _to_group_read(group: Group) -> GroupRead:
    members = sorted(group.members, key=lambda member: member.user.full_name.lower())
    return GroupRead(
        id=group.id,
        name=group.name,
        created_by=group.created_by,
        members=[
            GroupMemberRead(
                user_id=member.user_id,
                full_name=member.user.full_name,
                email="" if _is_placeholder_email(member.user.email) else member.user.email,
                is_placeholder=_is_placeholder_email(member.user.email),
            )
            for member in members
        ],
        created_at=group.created_at,
    )


def _create_placeholder_user(db: Session, full_name: str) -> User:
    user = User(
        email=f"group-member-{uuid4().hex}@local.invalid",
        full_name=full_name,
        password_hash="placeholder-member",
        is_active=False,
        is_demo=True,
        email_verified=False,
    )
    db.add(user)
    db.flush()
    return user


def _is_placeholder_email(email: str) -> bool:
    return email.endswith("@local.invalid")
