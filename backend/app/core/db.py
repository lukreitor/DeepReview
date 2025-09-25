"""Database connection helpers."""
from typing import Sequence, Type

from beanie import Document, init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import get_settings


async def init_db(document_models: Sequence[Type[Document]]) -> None:
    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongodb_uri)
    await init_beanie(database=client[settings.mongodb_db], document_models=document_models)
