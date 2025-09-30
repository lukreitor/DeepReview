"""Celery task handling DeepSeek review processing."""
from __future__ import annotations

import asyncio
import json
from datetime import datetime

from app.core.celery_app import celery_app
from app.models import Submission, SubmissionStatus
from app.services.ai import AIReviewService
from app.workers.worker import get_worker_event_loop


@celery_app.task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
    name="app.tasks.review.process_review_submission",
)
def process_review_submission(self, submission_id: str) -> None:
    loop = _get_or_create_event_loop()
    loop.run_until_complete(_process_submission(submission_id))


def _get_or_create_event_loop() -> asyncio.AbstractEventLoop:
    loop = None
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = None

    if loop and not loop.is_closed():
        return loop

    return get_worker_event_loop()


async def _process_submission(submission_id: str) -> None:
    submission = await Submission.get(submission_id)
    if not submission:
        return

    try:
        async with AIReviewService() as ai:
            response = await ai.review_code({
                "language": submission.language,
                "content": submission.content,
            })
    except Exception:
        submission.status = SubmissionStatus.FAILED
        submission.updated_at = datetime.utcnow()
        await submission.save()
        raise

    payload = response.payload
    if "choices" in payload:
        try:
            message = payload["choices"][0]["message"]["content"]
            payload_json = json.loads(message)
            payload_json.setdefault("provider", response.provider)
        except (KeyError, json.JSONDecodeError):
            payload_json = {"summary": "Unable to parse AI response", "provider": response.provider}
    else:
        payload_json = payload

    from app.services.review_service import store_review

    await store_review(submission, payload_json)
