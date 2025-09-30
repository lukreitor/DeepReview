"""Celery task package initialization."""

from app.tasks.review import process_review_submission

__all__ = ["process_review_submission"]
