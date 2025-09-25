"""MongoDB document model for AI review results."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from beanie import Document
from pydantic import BaseModel, Field


class Issue(BaseModel):
    severity: str
    category: str
    description: str
    recommendation: str


class Review(Document):
    submission_id: str = Field(index=True)
    user_id: str = Field(index=True)
    provider: str = "deepseek"
    score: float | None = None
    summary: Optional[str] = None
    issues: List[Issue] = Field(default_factory=list)
    security_concerns: List[str] = Field(default_factory=list)
    performance_recommendations: List[str] = Field(default_factory=list)
    additional_suggestions: List[str] = Field(default_factory=list)
    raw_response: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "reviews"
        use_revision = False
