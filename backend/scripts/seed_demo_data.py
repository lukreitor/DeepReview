"""Utility script for seeding demo data into MongoDB."""
import asyncio

from app.core.config import get_settings
from app.core.db import init_db
from app.models import Review, Submission


async def main() -> None:
    await init_db([Submission, Review])
    submission = Submission(language="python", source="code", content="print('hello world')")
    await submission.create()
    print("Seeded submission", submission.id)


if __name__ == "__main__":
    asyncio.run(main())
