from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.db.models import User
from app.schemas.auth import AuthLogin, AuthRegister, AuthSession, UserRead


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(func.lower(User.email) == email.strip().lower()))


def get_demo_user(db: Session) -> User:
    user = get_user_by_email(db, settings.demo_user_email)
    if user is not None:
        return user

    user = User(
        email=settings.demo_user_email,
        full_name="Demo User",
        password_hash=hash_password(settings.demo_user_password),
        is_demo=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def register_user(db: Session, payload: AuthRegister) -> AuthSession:
    email = payload.email.strip().lower()
    if get_user_by_email(db, email) is not None:
        raise ValueError("An account with this email already exists.")

    user = User(
        email=email,
        full_name=payload.full_name.strip(),
        password_hash=hash_password(payload.password),
        is_demo=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _to_auth_session(user)


def authenticate_user(db: Session, payload: AuthLogin) -> AuthSession:
    user = get_user_by_email(db, payload.email)
    if user is None or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise ValueError("Invalid email or password.")
    return _to_auth_session(user)


def _to_auth_session(user: User) -> AuthSession:
    return AuthSession(
        access_token=create_access_token(user.id),
        user=UserRead.model_validate(user),
    )
