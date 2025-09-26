"""API router registrations."""
from fastapi import APIRouter

from app.api.routes import auth, health, reviews, stats, ws

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
api_router.include_router(stats.router, prefix="/stats", tags=["stats"])
api_router.include_router(ws.router, prefix="/ws", tags=["websocket"])
