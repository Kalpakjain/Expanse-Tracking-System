from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.db.models import User
from app.schemas.auth import (
    AuthLogin,
    AuthRegister,
    AuthRegisterResponse,
    AuthSession,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResendVerificationRequest,
    ResetPasswordRequest,
    UserRead,
    VerifyEmailRequest,
)
from app.services.auth import (
    authenticate_user,
    change_user_password,
    register_user,
    resend_verification_code,
    reset_user_password,
    send_otp,
    send_password_reset_otp,
    verify_otp as verify_auth_otp,
    verify_user_email,
)


router = APIRouter()


@router.post("/register", response_model=AuthRegisterResponse, status_code=status.HTTP_201_CREATED)
def register(payload: AuthRegister, db: Session = Depends(get_db)) -> AuthRegisterResponse:
    try:
        return register_user(db, payload)
    except ValueError as exc:
        raise _auth_http_exception(exc) from exc


@router.post("/verify-email", response_model=AuthSession)
def verify_email(payload: VerifyEmailRequest, db: Session = Depends(get_db)) -> AuthSession:
    try:
        return verify_user_email(db, payload)
    except ValueError as exc:
        raise _auth_http_exception(exc) from exc


@router.post("/verify-otp", response_model=AuthSession)
def verify_otp(payload: VerifyEmailRequest, db: Session = Depends(get_db)) -> AuthSession:
    try:
        return verify_auth_otp(db, payload)
    except ValueError as exc:
        raise _auth_http_exception(exc) from exc


@router.post("/resend-verification", response_model=AuthRegisterResponse)
def resend_verification(
    payload: ResendVerificationRequest,
    db: Session = Depends(get_db),
) -> AuthRegisterResponse:
    try:
        return resend_verification_code(db, payload.email)
    except ValueError as exc:
        raise _auth_http_exception(exc) from exc


@router.post("/send-otp", response_model=AuthRegisterResponse)
def send_auth_otp(
    payload: ResendVerificationRequest,
    db: Session = Depends(get_db),
) -> AuthRegisterResponse:
    try:
        return send_otp(db, payload.email)
    except ValueError as exc:
        raise _auth_http_exception(exc) from exc


@router.post("/forgot-password", response_model=AuthRegisterResponse)
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
) -> AuthRegisterResponse:
    try:
        return send_password_reset_otp(db, payload.email)
    except ValueError as exc:
        raise _auth_http_exception(exc) from exc


@router.post("/reset-password", response_model=AuthSession)
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
) -> AuthSession:
    try:
        return reset_user_password(db, payload)
    except ValueError as exc:
        raise _auth_http_exception(exc) from exc


@router.post("/login", response_model=AuthSession)
def login(payload: AuthLogin, db: Session = Depends(get_db)) -> AuthSession:
    try:
        return authenticate_user(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc


@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(current_user)


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    try:
        change_user_password(db, current_user, payload)
    except ValueError as exc:
        raise _auth_http_exception(exc) from exc


def _auth_http_exception(exc: ValueError) -> HTTPException:
    message = str(exc)
    lowered = message.lower()
    if "too many" in lowered:
        return HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=message)
    if "email service" in lowered or "could not send" in lowered:
        return HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=message)
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
