"""Startup helpers to bootstrap default data."""
from __future__ import annotations

from loguru import logger

from app.core.config import get_settings
from app.models import User
from app.services.auth import get_user_by_email, hash_password


async def ensure_demo_user() -> None:
    """Create the configured demo user if it does not exist."""
    settings = get_settings()
    email = settings.demo_user_email
    password = settings.demo_user_password

    if not email or not password:
        logger.debug("Demo user provisioning skipped: missing email or password")
        return

    existing = await get_user_by_email(email)
    if existing:
        logger.debug("Demo user already present with id=%s", existing.id)
        return

    demo_user = User(
        email=email,
        hashed_password=hash_password(password),
        full_name=settings.demo_user_full_name,
        is_active=True,
        is_superuser=False,
    )
    await demo_user.create()
    logger.info("Demo user created with email=%s", email)
