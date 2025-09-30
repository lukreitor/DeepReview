from __future__ import annotations

from types import SimpleNamespace
from typing import Callable, Iterator

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.models import SubmissionStatus
from app.services import review_service
from app.services.auth import get_current_active_user


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> Iterator[TestClient]:
    async def fake_init_db(models: list[object]) -> None:  # pragma: no cover - startup stub
        return None

    async def fake_ensure_demo_user() -> None:  # pragma: no cover - startup stub
        return None

    monkeypatch.setattr("app.core.db.init_db", fake_init_db)
    monkeypatch.setattr("app.main.init_db", fake_init_db)
    monkeypatch.setattr("app.services.bootstrap.ensure_demo_user", fake_ensure_demo_user)
    monkeypatch.setattr("app.main.ensure_demo_user", fake_ensure_demo_user)

    app = create_app()

    async def fake_current_user() -> SimpleNamespace:
        return SimpleNamespace(id="user-123", email="demo@example.com", is_active=True)

    app.dependency_overrides[get_current_active_user] = fake_current_user

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def _patch_review_service(
    monkeypatch: pytest.MonkeyPatch,
    *,
    submission_factory: Callable[[], SimpleNamespace],
    enqueue_side_effect: Callable[[SimpleNamespace], None] | None = None,
) -> None:
    async def fake_create_submission(payload, user_id):
        return submission_factory()

    async def fake_enqueue(submission):
        if enqueue_side_effect:
            enqueue_side_effect(submission)

    monkeypatch.setattr(review_service, "create_submission", fake_create_submission)
    monkeypatch.setattr(review_service, "enqueue_review", fake_enqueue)


def test_create_review_returns_cached_response(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    submission = SimpleNamespace(
        id="submission-1",
        status=SubmissionStatus.CACHED,
        request_id="req-cached",
    )

    enqueue_called = False

    def record_enqueue(_: SimpleNamespace) -> None:
        nonlocal enqueue_called
        enqueue_called = True

    _patch_review_service(
        monkeypatch,
        submission_factory=lambda: submission,
        enqueue_side_effect=record_enqueue,
    )

    response = client.post(
        "/api/reviews",
        json={"source": "code", "content": "print('cached')"},
    )

    assert response.status_code == 202
    payload = response.json()
    assert payload["cached"] is True
    assert payload["id"] == "submission-1"
    assert SubmissionStatus(payload["status"]) is SubmissionStatus.CACHED
    assert payload["request_id"] == "req-cached"
    assert enqueue_called is False


def test_create_review_enqueues_non_cached_submission(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    submission = SimpleNamespace(
        id="submission-2",
        status=SubmissionStatus.PENDING,
        request_id="req-fresh",
    )

    enqueue_called = False

    def record_enqueue(received: SimpleNamespace) -> None:
        nonlocal enqueue_called
        enqueue_called = True
        assert received.id == submission.id

    _patch_review_service(
        monkeypatch,
        submission_factory=lambda: submission,
        enqueue_side_effect=record_enqueue,
    )

    response = client.post(
        "/api/reviews",
        json={"source": "code", "content": "print('new review')"},
    )

    assert response.status_code == 202
    payload = response.json()
    assert payload["cached"] is False
    assert payload["id"] == "submission-2"
    assert SubmissionStatus(payload["status"]) is SubmissionStatus.PENDING
    assert payload["request_id"] == "req-fresh"
    assert enqueue_called is True
