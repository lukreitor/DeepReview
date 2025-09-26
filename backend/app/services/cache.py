"""Caching helpers leveraging Redis for review deduplication."""
from __future__ import annotations

import json
from typing import Any, Optional

from redis.asyncio import Redis

from app.core.config import get_settings


class ReviewCache:
    """Provides a lightweight JSON cache for completed reviews keyed by code hash."""

    def __init__(self) -> None:
        settings = get_settings()
        self._redis = Redis.from_url(settings.redis_url, decode_responses=True)
        self._ttl = settings.review_cache_ttl_seconds
        self._key_prefix = settings.review_cache_prefix

    def _build_key(self, code_hash: str) -> str:
        return f"{self._key_prefix}:{code_hash}"

    async def get(self, code_hash: str) -> Optional[dict[str, Any]]:
        payload = await self._redis.get(self._build_key(code_hash))
        if not payload:
            return None
        return json.loads(payload)

    async def set(self, code_hash: str, payload: dict[str, Any]) -> None:
        await self._redis.set(self._build_key(code_hash), json.dumps(payload), ex=self._ttl)

    async def close(self) -> None:
        await self._redis.close()

    async def __aenter__(self) -> "ReviewCache":
        return self

    async def __aexit__(self, exc_type, exc, tb) -> None:
        await self.close()