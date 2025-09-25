import pytest
from httpx import AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_health_endpoint(monkeypatch):
    async def fake_check_all(self):
        return {"mongo": "ok", "redis": "ok", "deepseek": "ok", "whisper": "ok"}

    monkeypatch.setattr("app.services.health.HealthService.check_all", fake_check_all)

    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/health/")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
