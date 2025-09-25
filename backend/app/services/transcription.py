"""Audio transcription via WhisperAPI (lemonfox)."""
from __future__ import annotations

from typing import Any, Dict

import httpx

from app.core.config import get_settings


class TranscriptionService:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def transcribe(self, audio_payload: bytes, filename: str = "audio.wav") -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=60.0) as client:
            files = {"file": (filename, audio_payload)}
            response = await client.post(
                f"{self.settings.whisper_base_url}/transcribe",
                headers={"x-api-key": self.settings.whisper_api_key},
                files=files,
            )
            response.raise_for_status()
            return response.json()
