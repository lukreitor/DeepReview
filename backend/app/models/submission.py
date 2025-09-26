"""MongoDB document models for submissions."""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional
from uuid import uuid4

from beanie import Document
from pydantic import BaseModel, Field, field_validator, model_validator


class SubmissionSource(str, Enum):
    CODE = "code"
    AUDIO = "audio"


class SubmissionStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    CACHED = "cached"
    FAILED = "failed"


class Submission(Document):
    user_id: str = Field(index=True)
    language: str = Field(index=True)
    source: SubmissionSource = SubmissionSource.CODE
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    status: SubmissionStatus = SubmissionStatus.PENDING
    code_hash: str = Field(index=True)
    transcript_text: str | None = None
    transcript_confidence: float | None = None
    request_id: str = Field(default_factory=lambda: uuid4().hex, index=True)
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
                "status": SubmissionStatus.PENDING.value,
                "metadata": {"projectId": "abc123"},
                "user_id": "64f538beecf3c67f88ad4d4a",
                "code_hash": "f1fa78...",
            }
        }
        use_enum_values = True


class SubmissionCreate(BaseModel):
    language: str | None = None
    source: SubmissionSource
    content: str | None = None
    audio_base64: str | None = Field(None, description="Base64 encoded audio payload")
    metadata: Optional[Dict[str, Any]] = None

    @model_validator(mode="after")
    def validate_payload(self) -> "SubmissionCreate":
        if self.source == SubmissionSource.CODE and not self.content:
            raise ValueError("content is required when source is 'code'")
        if self.source == SubmissionSource.AUDIO and not self.audio_base64:
            raise ValueError("audio_base64 is required when source is 'audio'")
        return self

    @field_validator("language")
    @classmethod
    def enforce_language_for_code(cls, value: str | None, info) -> str | None:
        if info.data.get("source") == SubmissionSource.CODE and not value:
            raise ValueError("language is required when source is 'code'")
        return value
