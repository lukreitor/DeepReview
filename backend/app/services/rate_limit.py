"""Rate limiting utilities using SlowAPI."""
from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import get_settings

settings = get_settings()
limiter = Limiter(key_func=get_remote_address, default_limits=[settings.rate_limit])


def rate_limiter() -> None:
    """Dependency hook for FastAPI routes."""
    return None
