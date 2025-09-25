"""Analytics snapshot model."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict

from beanie import Document
from pydantic import Field


class AnalyticsSnapshot(Document):
    kind: str = Field(index=True)
    payload: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "analytics_snapshots"
        use_revision = False
