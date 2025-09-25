"""Health check service."""
from __future__ import annotations

import asyncio
from typing import Dict

import httpx
from motor.motor_asyncio import AsyncIOMotorClient
from redis.asyncio import Redis

from app.core.config import get_settings


class HealthService:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def check_all(self) -> Dict[str, str]:
        results = await asyncio.gather(
            self._check_mongo(),
            self._check_redis(),
            self._check_deepseek(),
            self._check_whisper(),
            return_exceptions=True,
        )
        return {
            "mongo": "ok" if results[0] is True else "error",
            "redis": "ok" if results[1] is True else "error",
            "deepseek": "ok" if results[2] is True else "error",
            "whisper": "ok" if results[3] is True else "error",
        }

    async def _check_mongo(self) -> bool:
        client = AsyncIOMotorClient(self.settings.mongodb_uri, serverSelectionTimeoutMS=1000)
        await client.server_info()
        return True

    async def _check_redis(self) -> bool:
        async with Redis.from_url(self.settings.redis_url) as redis:
            pong = await redis.ping()
        return bool(pong)

    async def _check_deepseek(self) -> bool:
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.get(
                f"{self.settings.deepseek_base_url}/models",
                headers={"Authorization": f"Bearer {self.settings.deepseek_api_key}"},
            )
        return response.status_code < 500

    async def _check_whisper(self) -> bool:
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.get(
                f"{self.settings.whisper_base_url}/status",
                headers={"x-api-key": self.settings.whisper_api_key},
            )
        return response.status_code < 500
