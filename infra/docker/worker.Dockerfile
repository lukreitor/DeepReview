# syntax=docker/dockerfile:1.6
FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VERSION=1.8.3

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN curl -sSL https://install.python-poetry.org | python - "--version" "$POETRY_VERSION" \
    && ln -s /root/.local/bin/poetry /usr/local/bin/poetry

WORKDIR /app

COPY backend/pyproject.toml ./pyproject.toml

RUN poetry config virtualenvs.create false \
    && poetry install --no-root --no-interaction --no-ansi

COPY backend/app ./app

CMD ["poetry", "run", "celery", "-A", "app.workers.worker", "worker", "--loglevel", "info"]
