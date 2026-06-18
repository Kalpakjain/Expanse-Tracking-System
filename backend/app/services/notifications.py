from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import NotificationPreference, User
from app.schemas.notification import NotificationPreferencesRead, NotificationPreferencesUpdate


def get_notification_preferences(db: Session, user: User) -> NotificationPreferencesRead:
    preferences = _get_or_create_preferences(db, user)
    return _to_notification_preferences_read(preferences)


def update_notification_preferences(
    db: Session,
    user: User,
    payload: NotificationPreferencesUpdate,
) -> NotificationPreferencesRead:
    preferences = _get_or_create_preferences(db, user)
    preferences.phone_number = payload.phone_number.strip()
    preferences.daily_digest_enabled = payload.daily_digest_enabled
    preferences.budget_alerts_enabled = payload.budget_alerts_enabled
    preferences.weekly_report_enabled = payload.weekly_report_enabled
    preferences.preferred_send_hour = payload.preferred_send_hour
    preferences.timezone = payload.timezone.strip()
    preferences.currency_code = payload.currency_code.upper()
    db.add(preferences)
    db.commit()
    db.refresh(preferences)
    return _to_notification_preferences_read(preferences)


def _get_or_create_preferences(db: Session, user: User) -> NotificationPreference:
    preferences = db.scalar(select(NotificationPreference).where(NotificationPreference.user_id == user.id).limit(1))
    if preferences is not None:
        return preferences

    preferences = NotificationPreference(
        user_id=user.id,
        phone_number="",
        daily_digest_enabled=True,
        budget_alerts_enabled=True,
        weekly_report_enabled=False,
        preferred_send_hour=20,
        timezone="Asia/Kolkata",
        currency_code="INR",
    )
    db.add(preferences)
    db.commit()
    db.refresh(preferences)
    return preferences


def _to_notification_preferences_read(
    preferences: NotificationPreference,
) -> NotificationPreferencesRead:
    return NotificationPreferencesRead(
        id=preferences.id,
        phone_number=preferences.phone_number,
        daily_digest_enabled=preferences.daily_digest_enabled,
        budget_alerts_enabled=preferences.budget_alerts_enabled,
        weekly_report_enabled=preferences.weekly_report_enabled,
        preferred_send_hour=preferences.preferred_send_hour,
        timezone=preferences.timezone,
        currency_code=preferences.currency_code,
        created_at=preferences.created_at,
        updated_at=preferences.updated_at,
    )
