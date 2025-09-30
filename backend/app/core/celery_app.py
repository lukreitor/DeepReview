"""Celery application shared between API and worker processes."""
from __future__ import annotations

from celery import Celery

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "deepreview",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    broker_url=settings.redis_url,
    result_backend=settings.redis_url,
    broker_connection_retry_on_startup=True,
    task_default_queue=settings.celery_default_queue,
    task_default_exchange=settings.celery_default_queue,
    task_default_exchange_type="direct",
    task_default_routing_key=settings.celery_default_queue,
    task_time_limit=300,
)

if settings.celery_task_always_eager:
    celery_app.conf.task_always_eager = True
    celery_app.conf.task_eager_propagates = settings.celery_task_eager_propagates

celery_app.autodiscover_tasks(["app.tasks"])

__all__ = ["celery_app"]
