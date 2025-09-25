"""Celery task handling DeepSeek review processing."""
from __future__ import annotations

import json

from celery import shared_task

from app.models import Submission
from app.services.ai import AIReviewService
from app.services.review_service import store_review


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 3})
async def process_review_submission(self, submission_id: str) -> None:  # type: ignore[override]
    submission = await Submission.get(submission_id)
    if not submission:
        return

    async with AIReviewService() as ai:
        response = await ai.review_code({
            "language": submission.language,
            "content": submission.content,
        })

    payload = response.payload
    if "choices" in payload:
        try:
            message = payload["choices"][0]["message"]["content"]
            payload_json = json.loads(message)
        except (KeyError, json.JSONDecodeError):
            payload_json = {"summary": "Unable to parse AI response", "provider": response.provider}
    else:
        payload_json = payload

    await store_review(submission, payload_json)
