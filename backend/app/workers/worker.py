"""Celery worker entrypoint."""
from __future__ import annotations

import asyncio

from celery.signals import worker_process_init

from app.core.celery_app import celery_app


_worker_loop: asyncio.AbstractEventLoop | None = None


@worker_process_init.connect
def init_worker_db(*_args, **_kwargs) -> None:
	"""Ensure Beanie collections and event loop are initialised per worker process."""

	global _worker_loop
	if _worker_loop is None or _worker_loop.is_closed():
		_worker_loop = asyncio.new_event_loop()
		asyncio.set_event_loop(_worker_loop)

	from app.core.db import init_db
	from app.models import AnalyticsSnapshot, Review, Submission, User

	_worker_loop.run_until_complete(init_db([User, Submission, Review, AnalyticsSnapshot]))


def get_worker_event_loop() -> asyncio.AbstractEventLoop:
	"""Return the persistent event loop for this worker process."""

	global _worker_loop
	try:
		loop = asyncio.get_event_loop()
	except RuntimeError:
		loop = None

	if loop and not loop.is_closed():
		return loop

	if _worker_loop is None or _worker_loop.is_closed():
		_worker_loop = asyncio.new_event_loop()
		asyncio.set_event_loop(_worker_loop)
	return _worker_loop


__all__ = ["celery_app", "get_worker_event_loop"]
