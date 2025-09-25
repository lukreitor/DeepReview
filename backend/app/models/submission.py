"""MongoDB document models for submissions."""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional

from beanie import Document
from pydantic import BaseModel, Field


class SubmissionSource(str, Enum):
    CODE = "code"
    AUDIO = "audio"


class Submission(Document):
    user_id: str = Field(index=True)
    language: str = Field(index=True)
    source: SubmissionSource = SubmissionSource.CODE
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    status: str = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "submissions"
        use_revision = False

    class Config:
        json_schema_extra = {
            "example": {
                "language": "python",
                "source": "code",
                "content": "def foo():\n    return 1",
                "status": "pending",
                "metadata": {"projectId": "abc123"},
                "user_id": "64f538beecf3c67f88ad4d4a",
            }
        }


class SubmissionCreate(BaseModel):
    language: str
    source: SubmissionSource
    content: str
    metadata: Optional[Dict[str, Any]] = None
