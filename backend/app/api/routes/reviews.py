"""Review submission and retrieval endpoints."""
from __future__ import annotations

from typing import Any

from beanie.odm.operators.find import In
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.encoders import jsonable_encoder

from app.models import Review, Submission, SubmissionCreate, User
from app.services import review_service
from app.services.auth import get_current_active_user
from app.services.rate_limit import rate_limiter

router = APIRouter(dependencies=[Depends(rate_limiter)])


@router.post("/", status_code=status.HTTP_202_ACCEPTED)
async def create_review(
    submission: SubmissionCreate,
    current_user: User = Depends(get_current_active_user),
) -> dict[str, str]:
    submission_doc = await review_service.create_submission(submission, str(current_user.id))
    await review_service.enqueue_review(submission_doc)
    return {"id": str(submission_doc.id), "status": submission_doc.status}


@router.get("/{submission_id}")
async def get_review(
    submission_id: str,
    current_user: User = Depends(get_current_active_user),
) -> dict[str, object]:
    submission = await Submission.get(submission_id)
    if submission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
    if submission.user_id != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    review = await Review.find_one(
        (Review.submission_id == submission_id) & (Review.user_id == str(current_user.id))
    )
    return jsonable_encoder({
        "id": str(submission.id),
        "status": submission.status,
        "submission": submission,
        "review": review,
    })


@router.get("/")
async def list_reviews(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    language: str | None = None,
    status_filter: str | None = Query(None, alias="status"),
    min_score: float | None = None,
    current_user: User = Depends(get_current_active_user),
) -> dict[str, object]:
    query = Submission.find(Submission.user_id == str(current_user.id))
    if language:
        query = query.find(Submission.language == language)
    if status_filter:
        query = query.find(Submission.status == status_filter)

    submissions = await query.sort(-Submission.created_at).skip((page - 1) * page_size).limit(page_size).to_list()

    submission_ids = [str(sub.id) for sub in submissions]
    reviews: list[Review] = []
    if submission_ids:
        reviews = await Review.find(
            (Review.user_id == str(current_user.id)) & In(Review.submission_id, submission_ids)
        ).to_list()
    review_by_submission = {review.submission_id: review for review in reviews}

    filtered_items: list[dict[str, Any]] = []
    for submission in submissions:
        review = review_by_submission.get(str(submission.id))
        if min_score is not None:
            if review is None or review.score is None or review.score < min_score:
                continue
        filtered_items.append({
            "submission": submission,
            "review": review,
        })

    total = await query.count()
    return {
        "items": jsonable_encoder(filtered_items),
        "page": page,
        "pageSize": page_size,
        "total": total,
    }
