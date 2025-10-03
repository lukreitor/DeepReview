"""Caching helpers leveraging Redis for review deduplication.

Supports standard Redis protocol endpoints and (read-only) Upstash REST fallback for GET operations
when only an HTTP REST token/URL pair is available. WRITE operations require Redis protocol and
will raise if only REST credentials are configured.
"""
from __future__ import annotations

import json
from typing import Any, Optional

from redis.asyncio import Redis
import httpx

from app.core.config import get_settings


class ReviewCache:
    """Provides a lightweight JSON cache for completed reviews keyed by code hash."""

    def __init__(self) -> None:
        settings = get_settings()
        self._settings = settings
        self._ttl = settings.review_cache_ttl_seconds
        self._key_prefix = settings.review_cache_prefix
        self._rest_url = None
        self._rest_token = None

        # Detect REST-style Upstash usage (REDIS_URL mistakenly set to HTTPS) and allow read-only fallback.
        if settings.redis_url.startswith("http://") or settings.redis_url.startswith("https://"):
            self._rest_url = settings.redis_url.rstrip("/")
            self._rest_token = getattr(settings, "upstash_redis_rest_token", None)
            self._redis = None  # type: ignore[assignment]
        else:
            self._redis = Redis.from_url(settings.redis_url, decode_responses=True)

    def _build_key(self, code_hash: str) -> str:
        return f"{self._key_prefix}:{code_hash}"

    async def get(self, code_hash: str) -> Optional[dict[str, Any]]:
        # REST fallback (GET /GET/{key})
        if self._rest_url and self._rest_token:
            key = self._build_key(code_hash)
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(f"{self._rest_url}/get/{key}", headers={"Authorization": f"Bearer {self._rest_token}"})
                if resp.status_code == 404:
                    return None
                resp.raise_for_status()
                data = resp.json()
                value = data.get("result")
                if value is None:
                    return None
                return json.loads(value)
        # Standard Redis protocol path
        payload = await self._redis.get(self._build_key(code_hash))  # type: ignore[union-attr]
        if not payload:
            return None
        return json.loads(payload)

    async def set(self, code_hash: str, payload: dict[str, Any]) -> None:
        if self._rest_url and self._rest_token:
            raise RuntimeError(
                "Write operation not supported in REST fallback mode. Configure REDIS_URL with a rediss:// endpoint."
            )
        await self._redis.set(self._build_key(code_hash), json.dumps(payload), ex=self._ttl)  # type: ignore[union-attr]

    async def close(self) -> None:
        if self._redis:
            await self._redis.close()  # type: ignore[union-attr]

    async def __aenter__(self) -> "ReviewCache":
        return self

    async def __aexit__(self, exc_type, exc, tb) -> None:
        await self.close()