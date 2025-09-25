"""Submission management and orchestration of review jobs."""
from __future__ import annotations

from typing import Any

from app.models import Review, Submission, SubmissionCreate
from app.tasks.review import process_review_submission


async def create_submission(payload: SubmissionCreate, user_id: str) -> Submission:
    submission = Submission(
        user_id=user_id,
        language=payload.language,
        source=payload.source,
        content=payload.content,
        metadata=payload.metadata or {},
    )
    await submission.create()
    return submission


async def enqueue_review(submission: Submission) -> None:
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
        raw_response=data,
    )
    await review.create()
    submission.status = "completed"
    await submission.save()
    return review
