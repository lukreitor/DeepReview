"""Real-time notifications backed by Redis pub/sub."""
from __future__ import annotations

import json
from typing import Any

from redis.asyncio import Redis

from app.core.config import get_settings


class NotificationService:
    def __init__(self) -> None:
        settings = get_settings()
        self._redis = Redis.from_url(settings.redis_url, decode_responses=True)
        self._prefix = settings.websocket_channel_prefix

    def channel_for_user(self, user_id: str) -> str:
        return f"{self._prefix}:user:{user_id}"

    async def publish(self, user_id: str, event: dict[str, Any]) -> None:
        await self._redis.publish(self.channel_for_user(user_id), json.dumps(event))

    async def close(self) -> None:
        await self._redis.close()

    async def __aenter__(self) -> "NotificationService":
        return self

    async def __aexit__(self, exc_type, exc, tb) -> None:
        await self.close()
