"""DeepSeek AI review integration."""
from __future__ import annotations

from typing import Any, Dict, Optional

import httpx
from pydantic import BaseModel

from app.core.config import get_settings


class ProviderResponse(BaseModel):
    provider: str
    payload: Dict[str, Any]


class AIReviewService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.client = httpx.AsyncClient(timeout=30.0)

    async def review_code(self, submission: Dict[str, Any]) -> ProviderResponse:
        prompt = self._build_prompt(submission)
        headers = {"Authorization": f"Bearer {self.settings.deepseek_api_key}"}
        response = await self.client.post(
            f"{self.settings.deepseek_base_url}/chat/completions",
            json=prompt,
            headers=headers,
        )
        response.raise_for_status()
        data = response.json()
        return ProviderResponse(provider="deepseek", payload=data)

    def _build_prompt(self, submission: Dict[str, Any]) -> Dict[str, Any]:
        template = (
            "You are an AI code reviewer. Provide a JSON response with keys: score, summary, "
            "issues (list of {severity, category, description, recommendation}), securityConcerns, "
            "performanceRecommendations, additionalSuggestions."
        )
        return {
            "model": "deepseek-chat",
            "messages": [
                {"role": "system", "content": template},
                {
                    "role": "user",
                    "content": f"Language: {submission['language']}\nCode:\n{submission['content']}",
                },
            ],
            "response_format": {"type": "json_object"},
        }

    async def aclose(self) -> None:
        await self.client.aclose()

    async def __aenter__(self) -> "AIReviewService":
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> Optional[bool]:
        await self.aclose()
        return None
