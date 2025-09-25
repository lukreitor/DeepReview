"""Analytics endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.models import User
from app.services.analytics import AnalyticsService
from app.services.auth import get_current_active_user

router = APIRouter()


@router.get("/")
async def get_stats(current_user: User = Depends(get_current_active_user)) -> dict[str, object]:
    service = AnalyticsService()
    return await service.build_dashboard_stats(str(current_user.id))
