"""User persistence model."""
from __future__ import annotations

from datetime import datetime

from beanie import Document
from pydantic import EmailStr, Field


class User(Document):
    email: EmailStr = Field(index=True, unique=True)
    hashed_password: str
    full_name: str | None = None
    is_active: bool = True
    is_superuser: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"
        use_revision = False

    class Config:
        json_schema_extra = {
            "example": {
                "email": "jane@example.com",
                "full_name": "Jane Doe",
                "is_active": True,
                "is_superuser": False,
            }
        }
