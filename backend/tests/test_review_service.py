from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

import pytest

from app.models.submission import SubmissionCreate, SubmissionSource, SubmissionStatus
from app.services import review_service


class FakeSubmission:
    def __init__(
        self,
        *,
        user_id: str,
        language: str,
        source: SubmissionSource,
        content: str,
        metadata: Optional[Dict[str, Any]] = None,
        status: SubmissionStatus = SubmissionStatus.PENDING,
        code_hash: str,
        id: Optional[str] = None,
        **extra: Any,
    ) -> None:
        self.user_id = user_id
        self.language = language
        self.source = source
        self.content = content
        self.metadata = metadata or {}
        self.status = status
        self.code_hash = code_hash
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        self.id = id or "fake-id"
        self._creates: List[FakeSubmission] = []
        self._saves: List[SubmissionStatus] = []
        for key, value in extra.items():
            setattr(self, key, value)

    async def create(self) -> None:
        self._creates.append(self)

    async def save(self) -> None:
        self._saves.append(self.status)


@pytest.mark.asyncio
async def test_create_submission_uses_cache(monkeypatch):
    cached_payload = {"score": 9.2, "summary": "Reusable", "issues": []}
    stored_reviews: List[Any] = []
    published_events: List[Any] = []
    created_instances: List[FakeSubmission] = []

    class FakeReviewCache:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def get(self, code_hash: str):
            assert code_hash
            return cached_payload

        async def set(self, code_hash: str, payload):  # pragma: no cover - not used
            return None

    def fake_submission_factory(**kwargs):
        submission = FakeSubmission(**kwargs)
        created_instances.append(submission)
        return submission

    async def fake_store(submission, data):
        stored_reviews.append((submission, data))

    async def fake_publish(submission, data, *, cached: bool = False):
        published_events.append((submission, data, cached))

    monkeypatch.setattr(review_service, "ReviewCache", lambda: FakeReviewCache())
    monkeypatch.setattr(review_service, "Submission", fake_submission_factory)
    monkeypatch.setattr(review_service, "_store_cached_review", fake_store)
    monkeypatch.setattr(review_service, "_publish_update", fake_publish)

    payload = SubmissionCreate(
        language="python",
        source=SubmissionSource.CODE,
        content="print('cached')",
    )
    submission = await review_service.create_submission(payload, user_id="user-123")

    assert submission.status == SubmissionStatus.CACHED
    assert created_instances, "Submission factory should be invoked"
    assert stored_reviews and stored_reviews[0][1] == cached_payload
    assert published_events and published_events[0][2] is True


@pytest.mark.asyncio
async def test_create_submission_without_cache(monkeypatch):
    class FakeReviewCache:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def get(self, code_hash: str):
            return None

        async def set(self, code_hash: str, payload):  # pragma: no cover - not used
            return None

    created_instances: List[FakeSubmission] = []

    def fake_submission_factory(**kwargs):
        submission = FakeSubmission(**kwargs)
        created_instances.append(submission)
        return submission

    monkeypatch.setattr(review_service, "ReviewCache", lambda: FakeReviewCache())
    monkeypatch.setattr(review_service, "Submission", fake_submission_factory)

    payload = SubmissionCreate(
        language="python",
        source=SubmissionSource.CODE,
        content="print('compute')",
    )
    submission = await review_service.create_submission(payload, user_id="user-456")

    assert submission.status == SubmissionStatus.PENDING
    assert created_instances, "Submission should be created when cache misses"


@pytest.mark.asyncio
async def test_enqueue_review_updates_status_and_triggers_worker(monkeypatch):
    saved_statuses: List[SubmissionStatus] = []
    published_events: List[Any] = []
    delayed_jobs: List[str] = []

    def fake_submission_factory(**kwargs):
        return FakeSubmission(**kwargs)

    async def fake_publish(submission, data, *, cached: bool = False):
        published_events.append((submission, data, cached))

    def fake_apply_async(*, args, queue):
        delayed_jobs.append((args, queue))

    monkeypatch.setattr(review_service, "Submission", fake_submission_factory)
    monkeypatch.setattr(review_service, "_publish_update", fake_publish)
    class FakeTask:
        def apply_async(self, args: tuple[str, ...], queue: str) -> None:
            fake_apply_async(args=args, queue=queue)

    monkeypatch.setattr(review_service, "_get_process_review_submission", lambda: FakeTask())

    submission = FakeSubmission(
        user_id="user-1",
        language="python",
        source=SubmissionSource.CODE,
        content="print('worker')",
        metadata={},
        status=SubmissionStatus.PENDING,
        code_hash="hash-123",
        id="submission-123",
    )

    async def fake_save(self):
        saved_statuses.append(self.status)

    monkeypatch.setattr(submission, "save", fake_save.__get__(submission, FakeSubmission))

    await review_service.enqueue_review(submission)

    assert submission.status == SubmissionStatus.PROCESSING
    assert saved_statuses == [SubmissionStatus.PROCESSING]
    assert delayed_jobs == [(("submission-123",), review_service.settings.celery_default_queue)]
    assert published_events, "publish update should be called"


@pytest.mark.asyncio
async def test_store_review_persists_result_and_notifies(monkeypatch):
    stored_reviews: List[Dict[str, Any]] = []
    cache_entries: Dict[str, Dict[str, Any]] = {}
    notifications: List[Dict[str, Any]] = []

    class FakeReviewModel:
        def __init__(self, **kwargs: Any) -> None:
            stored_reviews.append(kwargs)
            for key, value in kwargs.items():
                setattr(self, key, value)
            self.issues = getattr(self, "issues", [])
            self.security_concerns = getattr(self, "security_concerns", [])
            self.performance_recommendations = getattr(self, "performance_recommendations", [])
            self.additional_suggestions = getattr(self, "additional_suggestions", [])
            self.improved_code = getattr(self, "improved_code", None)

        async def create(self) -> None:  # pragma: no cover - trivial
            return None

    class FakeNotificationService:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def publish(self, channel: str, payload: Dict[str, Any]) -> None:
            notifications.append({"channel": channel, "payload": payload})

    class FakeReviewCache:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def set(self, key: str, value: Dict[str, Any]) -> None:
            cache_entries[key] = value

    monkeypatch.setattr(review_service, "Review", FakeReviewModel)
    monkeypatch.setattr(review_service, "NotificationService", lambda: FakeNotificationService())
    monkeypatch.setattr(review_service, "ReviewCache", lambda: FakeReviewCache())

    submission = FakeSubmission(
        user_id="user-111",
        language="python",
        source=SubmissionSource.CODE,
        content="print('done')",
        metadata={},
        status=SubmissionStatus.PROCESSING,
        code_hash="hash-done",
        id="submission-999",
    )

    payload = {
        "summary": "Looks good",
        "score": 9.1,
        "issues": [],
        "provider": "deepseek",
    }

    await review_service.store_review(submission, payload)

    assert submission.status == SubmissionStatus.COMPLETED
    assert stored_reviews and stored_reviews[0]["submission_id"] == "submission-999"
    assert cache_entries and "hash-done" in cache_entries
    assert notifications and notifications[0]["channel"] == "user-111"
