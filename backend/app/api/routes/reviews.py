"""Review submission and retrieval endpoints."""
from __future__ import annotations

import csv
import io
from datetime import datetime
from typing import Any

from beanie import PydanticObjectId
from beanie.operators import In
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.encoders import jsonable_encoder
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.models import Review, Submission, SubmissionCreate, SubmissionStatus, User
from app.services import review_service
from app.services.review_service import ReviewQueueUnavailableError
from app.services.analytics import AnalyticsService
from app.services.auth import get_current_active_user
from app.services.rate_limit import rate_limiter

router = APIRouter(dependencies=[Depends(rate_limiter)])


class SubmissionQueuedResponse(BaseModel):
    id: str
    status: SubmissionStatus
    cached: bool = False
    request_id: str

    class Config:
        json_schema_extra = {
            "example": {
                "id": "665fd1a33e0a927b6e93a8e1",
                "status": SubmissionStatus.PENDING,
                "cached": False,
                "request_id": "c365a0f65454458d81249749bd8a3b4f",
            }
        }


@router.post("", status_code=status.HTTP_202_ACCEPTED, response_model=SubmissionQueuedResponse)
@router.post("/", status_code=status.HTTP_202_ACCEPTED, response_model=SubmissionQueuedResponse, include_in_schema=False)
async def create_review(
    submission: SubmissionCreate,
    current_user: User = Depends(get_current_active_user),
) -> SubmissionQueuedResponse:
    submission_doc = await review_service.create_submission(submission, str(current_user.id))

    cached = submission_doc.status == SubmissionStatus.CACHED
    if not cached:
        try:
            await review_service.enqueue_review(submission_doc)
        except ReviewQueueUnavailableError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Review queue is unavailable. Try again shortly.",
            ) from exc

    return SubmissionQueuedResponse(
        id=str(submission_doc.id),
        status=submission_doc.status,
        cached=cached,
        request_id=submission_doc.request_id,
    )


@router.get("")
@router.get("/", include_in_schema=False)
async def list_reviews(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    language: str | None = None,
    status_filter: str | None = Query(None, alias="status"),
    min_score: float | None = None,
    from_date: datetime | None = Query(None, alias="from"),
    to_date: datetime | None = Query(None, alias="to"),
    current_user: User = Depends(get_current_active_user),
) -> dict[str, object]:
    criteria: dict[str, Any] = {"user_id": str(current_user.id)}
    if language:
        criteria["language"] = language
    if status_filter:
        try:
            status_enum = SubmissionStatus(status_filter)
        except ValueError as exc:  # pragma: no cover - validation
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status filter") from exc
        criteria["status"] = status_enum
    created_at_filter: dict[str, Any] = {}
    if from_date:
        created_at_filter["$gte"] = from_date
    if to_date:
        created_at_filter["$lte"] = to_date
    if created_at_filter:
        criteria["created_at"] = created_at_filter

    total = await Submission.find(criteria).count()
    submissions = (
        await Submission
        .find(criteria)
        .sort(-Submission.created_at)
        .skip((page - 1) * page_size)
        .limit(page_size)
        .to_list()
    )

    submission_ids = [str(sub.id) for sub in submissions]
    reviews: list[Review] = []
    if submission_ids:
        reviews = await Review.find_many(
            Review.user_id == str(current_user.id),
            In(Review.submission_id, submission_ids),
        ).to_list()
    review_by_submission = {review.submission_id: review for review in reviews}

    filtered_items: list[dict[str, Any]] = []
    score_accumulator: list[float] = []
    for submission in submissions:
        review = review_by_submission.get(str(submission.id))
        if min_score is not None:
            valid = review is not None and review.score is not None and review.score >= min_score
            if not valid:
                continue
        if review and review.score is not None:
            score_accumulator.append(review.score)
        filtered_items.append(
            {
                "submission": submission,
                "review": review,
            }
        )

    avg_score = None
    if score_accumulator:
        avg_score = round(sum(score_accumulator) / len(score_accumulator), 2)

    summary = {
        "avgScore": avg_score,
        "pending": len([item for item in filtered_items if item["submission"].status in {SubmissionStatus.PENDING, SubmissionStatus.PROCESSING}]),
        "completed": len([item for item in filtered_items if item["submission"].status in {SubmissionStatus.COMPLETED, SubmissionStatus.CACHED}]),
        "failed": len([item for item in filtered_items if item["submission"].status == SubmissionStatus.FAILED]),
    }

    encoder_overrides = {PydanticObjectId: str}

    return {
        "items": jsonable_encoder(filtered_items, custom_encoder=encoder_overrides),
        "page": page,
        "pageSize": page_size,
        "total": total,
        "filteredTotal": len(filtered_items),
        "summary": jsonable_encoder(summary, custom_encoder=encoder_overrides),
    }


@router.get("/export", response_class=StreamingResponse)
async def export_reviews(
    current_user: User = Depends(get_current_active_user),
    language: str | None = None,
    status_filter: str | None = Query(None, alias="status"),
    min_score: float | None = None,
    from_date: datetime | None = Query(None, alias="from"),
    to_date: datetime | None = Query(None, alias="to"),
) -> StreamingResponse:
    criteria: dict[str, Any] = {"user_id": str(current_user.id)}
    if language:
        criteria["language"] = language
    if status_filter:
        try:
            status_enum = SubmissionStatus(status_filter)
        except ValueError as exc:  # pragma: no cover - validation
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status filter") from exc
        criteria["status"] = status_enum
    created_at_filter: dict[str, Any] = {}
    if from_date:
        created_at_filter["$gte"] = from_date
    if to_date:
        created_at_filter["$lte"] = to_date
    if created_at_filter:
        criteria["created_at"] = created_at_filter

    submissions = await Submission.find(criteria).sort(-Submission.created_at).to_list()
    submission_ids = [str(sub.id) for sub in submissions]
    reviews: list[Review] = []
    if submission_ids:
        reviews = await Review.find_many(
            Review.user_id == str(current_user.id),
            In(Review.submission_id, submission_ids),
        ).to_list()
    review_by_submission = {review.submission_id: review for review in reviews}

    buffer = io.StringIO()
    writer = csv.DictWriter(
        buffer,
        fieldnames=[
            "submission_id",
            "request_id",
            "status",
            "language",
            "score",
            "summary",
            "issues",
            "created_at",
        ],
    )
    writer.writeheader()
    for submission in submissions:
        review = review_by_submission.get(str(submission.id))
        if min_score is not None:
            valid = review is not None and review.score is not None and review.score >= min_score
            if not valid:
                continue
        issues_serialised = "; ".join(
            f"{issue.severity}:{issue.category}" for issue in (review.issues if review else [])
        )
        status_value = submission.status.value if isinstance(submission.status, SubmissionStatus) else submission.status
        writer.writerow(
            {
                "submission_id": str(submission.id),
                "request_id": submission.request_id,
                "status": status_value,
                "language": submission.language,
                "score": review.score if review else None,
                "summary": review.summary if review else None,
                "issues": issues_serialised,
                "created_at": submission.created_at.isoformat(),
            }
        )

    buffer.seek(0)
    headers = {
        "Content-Disposition": "attachment; filename=deepreview-export.csv",
    }
    return StreamingResponse(iter([buffer.getvalue()]), media_type="text/csv", headers=headers)


@router.get("/analytics/summary")
async def reviews_summary(
    current_user: User = Depends(get_current_active_user),
) -> dict[str, Any]:
    service = AnalyticsService()
    summary = await service.build_dashboard_stats(str(current_user.id))
    return jsonable_encoder(summary)


@router.get("/{submission_id}")
async def get_review(
    submission_id: str,
    current_user: User = Depends(get_current_active_user),
) -> dict[str, object]:
    submission = await Submission.get(submission_id)
    if submission is None or submission.user_id != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    review = await Review.find_one(
        (Review.submission_id == submission_id) & (Review.user_id == str(current_user.id))
    )

    status_value = submission.status.value if isinstance(submission.status, SubmissionStatus) else submission.status
    encoder_overrides = {PydanticObjectId: str}

    return jsonable_encoder(
        {
            "id": str(submission.id),
            "status": status_value,
            "submission": submission,
            "review": review,
        },
        custom_encoder=encoder_overrides,
    )


# Allow optional trailing slashes without relying on redirects to avoid CORS preflight failures.
router.add_api_route(
    "/",
    create_review,
    methods=["POST"],
    response_model=SubmissionQueuedResponse,
    status_code=status.HTTP_202_ACCEPTED,
    include_in_schema=False,
)
router.add_api_route(
    "/",
    list_reviews,
    methods=["GET"],
    include_in_schema=False,
)
router.add_api_route(
    "/export/",
    export_reviews,
    methods=["GET"],
    response_class=StreamingResponse,
    include_in_schema=False,
)
router.add_api_route(
    "/analytics/summary/",
    reviews_summary,
    methods=["GET"],
    include_in_schema=False,
)
router.add_api_route(
    "/{submission_id}/",
    get_review,
    methods=["GET"],
    include_in_schema=False,
)
