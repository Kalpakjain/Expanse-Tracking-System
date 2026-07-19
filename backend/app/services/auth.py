import secrets
from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.db.models import User
from app.schemas.auth import (
    AuthLogin,
    AuthRegister,
    AuthRegisterResponse,
    AuthSession,
    ChangePasswordRequest,
    ResetPasswordRequest,
    UserRead,
    VerifyEmailRequest,
)
from app.services.email import EmailSendError, send_verification_email


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
        email_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def register_user(db: Session, payload: AuthRegister) -> AuthRegisterResponse:
    email = payload.email.strip().lower()
    if get_user_by_email(db, email) is not None:
        raise ValueError("An account with this email already exists.")

    verification_code = _create_verification_code()
    user = User(
        email=email,
        full_name=payload.full_name.strip(),
        password_hash=hash_password(payload.password),
        is_demo=False,
        email_verified=False,
    )
    _check_otp_rate_limit(user, datetime.utcnow())
    _apply_otp(user, verification_code, datetime.utcnow())
    db.add(user)
    _send_verification_email(user, verification_code)
    db.commit()
    db.refresh(user)
    return AuthRegisterResponse(
        email=user.email,
        verification_required=True,
        dev_verification_code=_dev_otp(verification_code),
    )


def authenticate_user(db: Session, payload: AuthLogin) -> AuthSession:
    user = get_user_by_email(db, payload.email)
    if user is None or not user.is_active:
        raise ValueError("Invalid email or password.")

    now = datetime.utcnow()
    if user.login_locked_until is not None and user.login_locked_until > now:
        raise ValueError("Too many failed attempts. Try again later.")

    if not verify_password(payload.password, user.password_hash):
        user.login_attempt_count += 1
        if user.login_attempt_count >= 5:
            user.login_attempt_count = 0
            user.login_locked_until = now + timedelta(minutes=15)
        db.add(user)
        db.commit()
        raise ValueError("Invalid email or password.")

    user.login_attempt_count = 0
    user.login_locked_until = None
    db.add(user)
    db.commit()
    db.refresh(user)

    if not user.email_verified:
        raise ValueError("Please verify your email before signing in.")
    return _to_auth_session(user)


def verify_user_email(db: Session, payload: VerifyEmailRequest) -> AuthSession:
    user = get_user_by_email(db, payload.email)
    if user is None or not user.is_active:
        raise ValueError("Account not found.")
    if user.email_verified:
        return _to_auth_session(user)
    _verify_otp_or_raise(db, user, payload.code, datetime.utcnow())

    user.email_verified = True
    user.email_verification_code_hash = ""
    user.email_verification_code_expires_at = None
    user.otp_attempt_count = 0
    db.add(user)
    db.commit()
    db.refresh(user)
    return _to_auth_session(user)


def resend_verification_code(db: Session, email: str) -> AuthRegisterResponse:
    user = get_user_by_email(db, email)
    if user is None or not user.is_active:
        raise ValueError("Account not found.")
    if user.email_verified:
        raise ValueError("Email is already verified.")

    now = datetime.utcnow()
    _check_otp_rate_limit(user, now)
    verification_code = _create_verification_code()
    _apply_otp(user, verification_code, now)
    db.add(user)
    _send_verification_email(user, verification_code)
    db.commit()
    return AuthRegisterResponse(
        email=user.email,
        verification_required=True,
        dev_verification_code=_dev_otp(verification_code),
    )


def send_otp(db: Session, email: str) -> AuthRegisterResponse:
    user = get_user_by_email(db, email)
    if user is None or not user.is_active:
        raise ValueError("Account not found.")
    now = datetime.utcnow()
    _check_otp_rate_limit(user, now)
    verification_code = _create_verification_code()
    _apply_otp(user, verification_code, now)
    db.add(user)
    _send_verification_email(user, verification_code)
    db.commit()
    return AuthRegisterResponse(
        email=user.email,
        verification_required=not user.email_verified,
        dev_verification_code=_dev_otp(verification_code),
    )


def send_password_reset_otp(db: Session, email: str) -> AuthRegisterResponse:
    user = get_user_by_email(db, email)
    if user is None or not user.is_active:
        raise ValueError("Account not found.")

    now = datetime.utcnow()
    _check_otp_rate_limit(user, now)
    verification_code = _create_verification_code()
    _apply_otp(user, verification_code, now)
    db.add(user)
    _send_verification_email(user, verification_code)
    db.commit()
    return AuthRegisterResponse(
        email=user.email,
        verification_required=True,
        dev_verification_code=_dev_otp(verification_code),
    )


def reset_user_password(db: Session, payload: ResetPasswordRequest) -> AuthSession:
    user = get_user_by_email(db, payload.email)
    if user is None or not user.is_active:
        raise ValueError("Account not found.")
    _verify_otp_or_raise(db, user, payload.code, datetime.utcnow())

    user.password_hash = hash_password(payload.password)
    user.email_verified = True
    user.email_verification_code_hash = ""
    user.email_verification_code_expires_at = None
    user.otp_attempt_count = 0
    db.add(user)
    db.commit()
    db.refresh(user)
    return _to_auth_session(user)


def change_user_password(db: Session, user: User, payload: ChangePasswordRequest) -> None:
    if not verify_password(payload.current_password, user.password_hash):
        raise ValueError("Current password is incorrect.")
    if payload.new_password == payload.current_password:
        raise ValueError("New password must be different from the current password.")

    user.password_hash = hash_password(payload.new_password)
    db.add(user)
    db.commit()


def verify_otp(db: Session, payload: VerifyEmailRequest) -> AuthSession:
    user = get_user_by_email(db, payload.email)
    if user is None or not user.is_active:
        raise ValueError("Account not found.")
    _verify_otp_or_raise(db, user, payload.code, datetime.utcnow())

    user.email_verified = True
    user.email_verification_code_hash = ""
    user.email_verification_code_expires_at = None
    user.otp_attempt_count = 0
    db.add(user)
    db.commit()
    db.refresh(user)
    return _to_auth_session(user)


def _to_auth_session(user: User) -> AuthSession:
    return AuthSession(
        access_token=create_access_token(user.id),
        user=UserRead.model_validate(user),
    )


def _create_verification_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def _dev_otp(verification_code: str) -> str | None:
    if settings.app_env.lower() == "production":
        return None
    return verification_code if settings.expose_dev_otp else None


def _apply_otp(user: User, verification_code: str, now: datetime) -> None:
    user.email_verification_code_hash = hash_password(verification_code)
    user.email_verification_code_expires_at = now + timedelta(minutes=settings.otp_ttl_minutes)
    user.otp_attempt_count = 0


def _check_otp_rate_limit(user: User, now: datetime) -> None:
    window_minutes = settings.otp_rate_limit_window_minutes
    if user.otp_request_window_started_at is None:
        user.otp_request_window_started_at = now
        user.otp_request_count = 1
        return

    window_expires_at = user.otp_request_window_started_at + timedelta(minutes=window_minutes)
    if now >= window_expires_at:
        user.otp_request_window_started_at = now
        user.otp_request_count = 1
        return

    if user.otp_request_count >= settings.otp_rate_limit_count:
        raise ValueError("Too many OTP requests. Please wait 10 minutes before trying again.")

    user.otp_request_count += 1


def _verify_otp_or_raise(db: Session, user: User, otp: str, now: datetime) -> None:
    if user.otp_attempt_count >= settings.otp_max_attempts:
        raise ValueError("Too many incorrect OTP attempts. Please request a new code.")
    if not user.email_verification_code_hash:
        raise ValueError("No OTP is active. Please request a new code.")
    if user.email_verification_code_expires_at is None or now > user.email_verification_code_expires_at:
        user.email_verification_code_hash = ""
        user.email_verification_code_expires_at = None
        db.add(user)
        db.commit()
        raise ValueError("OTP has expired. Please request a new code.")
    if not verify_password(otp, user.email_verification_code_hash):
        user.otp_attempt_count += 1
        db.add(user)
        db.commit()
        raise ValueError("Invalid OTP.")


def _send_verification_email(user: User, verification_code: str) -> None:
    try:
        send_verification_email(user.email, user.full_name, verification_code)
    except EmailSendError as exc:
        raise ValueError(str(exc)) from exc
