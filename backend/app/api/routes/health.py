"""Health check endpoints."""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter

from app.services.health import HealthService

router = APIRouter()


@router.get("/", summary="Health check")
async def get_health() -> dict[str, object]:
    service = HealthService()
    status = await service.check_all()
    return {
        "status": "ok" if all(component == "ok" for component in status.values()) else "degraded",
        "components": status,
        "timestamp": datetime.utcnow().isoformat(),
    }
