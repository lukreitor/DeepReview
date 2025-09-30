"""DeepSeek AI review integration."""
from __future__ import annotations

import logging
from typing import Any, Dict, Optional

import httpx
from httpx import HTTPStatusError
from pydantic import BaseModel
from tenacity import (
    AsyncRetrying,
    RetryError,
    retry_if_exception,
    stop_after_attempt,
    wait_exponential,
)

from app.core.config import get_settings


logger = logging.getLogger(__name__)


class ProviderResponse(BaseModel):
    provider: str
    payload: Dict[str, Any]


class AIReviewService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.client = httpx.AsyncClient(timeout=30.0)

    async def review_code(self, submission: Dict[str, Any]) -> ProviderResponse:
        if self._using_stubbed_credentials():
            logger.warning(
                "Using stubbed DeepSeek response because DEEPSEEK_API_KEY is not configured."
            )
            return self._build_stub_response(submission)

        prompt = self._build_prompt(submission)
        headers = {"Authorization": f"Bearer {self.settings.deepseek_api_key}"}

        try:
            async for attempt in AsyncRetrying(
                retry=retry_if_exception(_is_retryable_exception),
                stop=stop_after_attempt(3),
                wait=wait_exponential(multiplier=1, min=2, max=10),
                reraise=True,
            ):
                with attempt:
                    response = await self.client.post(
                        f"{self.settings.deepseek_base_url}/chat/completions",
                        json=prompt,
                        headers=headers,
                    )
                    response.raise_for_status()
        except RetryError as exc:  # pragma: no cover - surfaced to caller
            if exc.last_attempt.result() is not None:
                raise exc.last_attempt.result()
            raise
        except HTTPStatusError as exc:
            if exc.response.status_code in {401, 403}:
                logger.error("DeepSeek authentication failed: %s", exc.response.text)
            raise

        data = response.json()
        return ProviderResponse(provider="deepseek", payload=data)

    def _using_stubbed_credentials(self) -> bool:
        api_key = (self.settings.deepseek_api_key or "").strip()
        return not api_key or "replace-with" in api_key.lower()

    def _build_prompt(self, submission: Dict[str, Any]) -> Dict[str, Any]:
        template = (
            "You are an AI code reviewer. Provide a JSON response with the following keys: "
            "score (0-10 float), summary (string), issues (list of objects with severity, category, "
            "description, recommendation), securityConcerns (string[]), performanceRecommendations (string[]), "
            "additionalSuggestions (string[]), and improvedCode (string) containing fully formatted code "
            "with the suggested improvements applied. Ensure the JSON is valid and escaped."
        )
        return {
            "model": self.settings.deepseek_model,
            "messages": [
                {"role": "system", "content": template},
                {
                    "role": "user",
                    "content": f"Language: {submission['language']}\nCode:\n{submission['content']}",
                },
            ],
            "response_format": {"type": "json_object"},
        }

    def _build_stub_response(self, submission: Dict[str, Any]) -> ProviderResponse:
        preview = submission.get("content", "").splitlines()
        summary_snippet = preview[0][:120] if preview else "No content provided."
        payload: Dict[str, Any] = {
            "provider": "deepseek-stub",
            "score": 8.5,
            "summary": (
                "Stubbed AI feedback for development. Configure DEEPSEEK_API_KEY for real reviews."
            ),
            "issues": [
                {
                    "severity": "medium",
                    "category": "style",
                    "description": "Walk through demo credentials and replace them in production.",
                    "recommendation": "Set real provider keys in backend/.env before deploying.",
                }
            ],
            "securityConcerns": [
                "Avoid committing real secrets; use environment variables instead."
            ],
            "performanceRecommendations": [
                "Use dependency injection to share clients across requests for better reuse.",
            ],
            "additionalSuggestions": [
                f"Snippet preview: {summary_snippet}",
            ],
            "improvedCode": submission.get("content", ""),
        }
        return ProviderResponse(provider="deepseek-stub", payload=payload)

    async def aclose(self) -> None:
        await self.client.aclose()

    async def __aenter__(self) -> "AIReviewService":
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> Optional[bool]:
        await self.aclose()
        return None


def _is_retryable_exception(exc: BaseException) -> bool:
    if isinstance(exc, HTTPStatusError) and exc.response.status_code in {401, 403}:
        return False
    return True
