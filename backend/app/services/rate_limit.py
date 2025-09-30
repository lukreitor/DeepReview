"""Rate limiting utilities using SlowAPI."""
from __future__ import annotations

from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.core.config import get_settings

settings = get_settings()
default_limits: list[str] = [] if settings.environment == "development" else [settings.rate_limit]
limiter = Limiter(key_func=get_remote_address, default_limits=default_limits)


def rate_limiter() -> None:
    """Dependency hook for FastAPI routes."""
    return None


async def rate_limit_exception_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """Return a friendly response when clients exceed the rate limit."""
    headers = {}
    retry_after = getattr(exc, "detail", None)
    if retry_after:
        headers["Retry-After"] = str(retry_after)

    return JSONResponse(
        status_code=429,
        content={
            "detail": "Rate limit exceeded. Please wait before trying again.",
        },
        headers=headers,
    )
