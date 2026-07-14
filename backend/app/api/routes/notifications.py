from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.db.models import User
from app.schemas.notification import NotificationPreferencesRead, NotificationPreferencesUpdate, NotificationPreview
from app.services.notifications import (
    get_notification_preferences,
    get_notification_preview,
    update_notification_preferences,
)


router = APIRouter()


@router.get("/", response_model=NotificationPreferencesRead)
def get_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationPreferencesRead:
    return get_notification_preferences(db, current_user)


@router.put("/", response_model=NotificationPreferencesRead)
def save_preferences(
    payload: NotificationPreferencesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationPreferencesRead:
    return update_notification_preferences(db, current_user, payload)


@router.get("/preview", response_model=NotificationPreview)
def get_preview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationPreview:
    return get_notification_preview(db, current_user)
