"""FastAPI application factory."""
from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, Query, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api import api_router
from app.core.config import get_settings
from app.core.db import init_db
from app.core.logging import setup_logging
from app.models import AnalyticsSnapshot, Review, Submission, User
from app.services.bootstrap import ensure_demo_user
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

    primary_origin = str(settings.frontend_url).rstrip("/")
    derived_origins: set[str] = {primary_origin}

    # When developing locally it's common to access the UI via different localhost aliases or ports.
    if settings.frontend_url.host in {"localhost", "127.0.0.1"}:
        host_variants = {"localhost", "127.0.0.1"}
        common_ports = {3000, 4173, 5173, settings.frontend_url.port or 80}
        for host in host_variants:
            derived_origins.add(f"http://{host}")
            derived_origins.add(f"https://{host}")
            for port in common_ports:
                if port in {80, 443, None}:
                    continue
                derived_origins.add(f"http://{host}:{port}")
                derived_origins.add(f"https://{host}:{port}")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=sorted(derived_origins),
        allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, rate_limit_exception_handler)
    app.add_middleware(SlowAPIMiddleware)
    app.include_router(api_router, prefix="/api")

    @app.websocket("/ws/reviews")
    async def websocket_reviews_root(websocket: WebSocket, token: str = Query(...)) -> None:
        from app.api.routes.ws import reviews_updates

        await reviews_updates(websocket, token=token)

    @app.websocket("/ws/reviews/")
    async def websocket_reviews_root_slash(websocket: WebSocket, token: str = Query(...)) -> None:
        from app.api.routes.ws import reviews_updates

        await reviews_updates(websocket, token=token)

    @app.on_event("startup")
    async def on_startup() -> None:
        await init_db([User, Submission, Review, AnalyticsSnapshot])
        await ensure_demo_user()

    return app


app = create_app()
