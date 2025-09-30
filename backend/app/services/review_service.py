"""Submission management and orchestration of review jobs."""
from __future__ import annotations

import base64
import hashlib
from datetime import datetime
from typing import Any

from app.models import (
    Review,
    Submission,
    SubmissionCreate,
    SubmissionSource,
    SubmissionStatus,
)
from app.services.cache import ReviewCache
from app.services.notifications import NotificationService
from app.services.transcription import TranscriptionService
from app.tasks.review import process_review_submission


async def create_submission(payload: SubmissionCreate, user_id: str) -> Submission:
    metadata = dict(payload.metadata or {})
    language = payload.language or "unknown"
    content = payload.content or ""
    transcript_text: str | None = None
    transcript_confidence: float | None = None

    if payload.source == SubmissionSource.AUDIO:
        audio_base64 = payload.audio_base64 or ""
        if "," in audio_base64:
            audio_base64 = audio_base64.split(",", 1)[1]
        audio_bytes = base64.b64decode(audio_base64)
        transcription = await TranscriptionService().transcribe(audio_bytes)
        transcript_text = transcription.get("text")
        transcript_confidence = transcription.get("confidence")
        content = transcript_text or ""
        language = payload.language or transcription.get("language") or transcription.get("detected_language") or "unknown"
        metadata.update({
            "transcription": transcription,
            "audioBytes": len(audio_bytes),
        })

    code_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
    submission = Submission(
        user_id=user_id,
        language=language,
        source=payload.source,
        content=content,
        metadata=metadata,
        status=SubmissionStatus.PENDING,
        code_hash=code_hash,
        transcript_text=transcript_text,
        transcript_confidence=transcript_confidence,
    )

    async with ReviewCache() as cache:
        cached_review = await cache.get(code_hash)
        if cached_review:
            submission.status = SubmissionStatus.CACHED
            submission.updated_at = datetime.utcnow()
            await submission.create()
            await _store_cached_review(submission, cached_review)
            await _publish_update(submission, cached_review, cached=True)
            return submission

    await submission.create()
    return submission


async def enqueue_review(submission: Submission) -> None:
    submission.status = SubmissionStatus.PROCESSING
    submission.updated_at = datetime.utcnow()
    await submission.save()
    await _publish_update(submission, {})
    process_review_submission.delay(str(submission.id))


async def store_review(submission: Submission, data: dict[str, Any]) -> Review:
    review = Review(
        submission_id=str(submission.id),
        user_id=submission.user_id,
        provider=data.get("provider", "deepseek"),
        score=data.get("score"),
        summary=data.get("summary"),
        issues=data.get("issues", []),
        security_concerns=data.get("securityConcerns", []),
        performance_recommendations=data.get("performanceRecommendations", []),
        additional_suggestions=data.get("additionalSuggestions", []),
        improved_code=data.get("improvedCode"),
        raw_response=data,
    )
    await review.create()

    submission.status = SubmissionStatus.COMPLETED
    submission.updated_at = datetime.utcnow()
    await submission.save()

    async with ReviewCache() as cache:
        await cache.set(submission.code_hash, _build_cache_payload(review))

    await _publish_update(submission, _build_cache_payload(review))

    return review


async def _store_cached_review(submission: Submission, data: dict[str, Any]) -> Review:
    review = Review(
        submission_id=str(submission.id),
        user_id=submission.user_id,
        provider=data.get("provider", "deepseek"),
        score=data.get("score"),
        summary=data.get("summary"),
        issues=data.get("issues", []),
        security_concerns=data.get("securityConcerns", []),
        performance_recommendations=data.get("performanceRecommendations", []),
        additional_suggestions=data.get("additionalSuggestions", []),
        improved_code=data.get("improvedCode"),
        raw_response=data,
    )
    await review.create()
    return review


async def _publish_update(submission: Submission, data: dict[str, Any], *, cached: bool = False) -> None:
    status = submission.status
    if isinstance(status, SubmissionStatus):
        status_value = status.value
    else:
        status_value = status

    payload = {
        "submissionId": str(submission.id),
        "status": status_value,
        "cached": cached,
        "summary": data.get("summary"),
        "score": data.get("score"),
        "provider": data.get("provider", "deepseek"),
    }
    async with NotificationService() as notifier:
        await notifier.publish(submission.user_id, payload)


def _build_cache_payload(review: Review) -> dict[str, Any]:
    return {
        "provider": review.provider,
        "score": review.score,
        "summary": review.summary,
        "issues": [issue.model_dump() for issue in review.issues],
        "securityConcerns": review.security_concerns,
        "performanceRecommendations": review.performance_recommendations,
        "additionalSuggestions": review.additional_suggestions,
        "improvedCode": review.improved_code,
    }
