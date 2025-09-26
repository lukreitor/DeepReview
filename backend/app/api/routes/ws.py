"""WebSocket endpoints for live review updates."""
from __future__ import annotations

import asyncio
from typing import Optional

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from redis.asyncio import Redis

from app.core.config import get_settings
from app.services.auth import get_current_user

router = APIRouter()


@router.websocket("/reviews")
async def reviews_updates(websocket: WebSocket, token: str = Query(...)) -> None:
    await websocket.accept()
    try:
        user = await get_current_user(token=token)
    except Exception:  # pragma: no cover - handshake failure
        await websocket.close(code=4401)
        return

    settings = get_settings()
    redis = Redis.from_url(settings.redis_url, decode_responses=True)
    channel = f"{settings.websocket_channel_prefix}:user:{user.id}"
    pubsub = redis.pubsub()
    await pubsub.subscribe(channel)

    try:
        # Inform the client the subscription is ready
        await websocket.send_json({"type": "ready", "channel": channel})
        while True:
            message: Optional[dict[str, str]] = await pubsub.get_message(
                ignore_subscribe_messages=True,
                timeout=5.0,
            )
            if message and message.get("data"):
                await websocket.send_text(message["data"])
            else:
                await asyncio.sleep(0.5)
    except WebSocketDisconnect:  # pragma: no cover - network interruption
        pass
    finally:
        await pubsub.unsubscribe(channel)
        await redis.close()