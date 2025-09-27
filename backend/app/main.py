"""FastAPI application factory."""
from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api import api_router
from app.core.config import get_settings
from app.core.db import init_db
from app.core.logging import setup_logging
from app.models import AnalyticsSnapshot, Review, Submission, User
from app.services.rate_limit import limiter, rate_limit_exception_handler

settings = get_settings()
setup_logging(settings.log_level)


def create_app() -> FastAPI:
    app = FastAPI(
        title="DeepReview API",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, rate_limit_exception_handler)
    app.add_middleware(SlowAPIMiddleware)
    app.include_router(api_router, prefix="/api")

    @app.on_event("startup")
    async def on_startup() -> None:
        await init_db([User, Submission, Review, AnalyticsSnapshot])

    return app


app = create_app()
