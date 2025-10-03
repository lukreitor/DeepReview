# syntax=docker/dockerfile:1.6
FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VERSION=1.8.3

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN update-ca-certificates

RUN curl -sSL https://install.python-poetry.org | python - --version "$POETRY_VERSION" \
    && ln -s /root/.local/bin/poetry /usr/local/bin/poetry

WORKDIR /app

# Ajuste: copiar do diretório backend
COPY backend/pyproject.toml ./pyproject.toml
# COPY backend/poetry.lock ./poetry.lock  # se existir

RUN poetry config virtualenvs.create false \
    && poetry install --no-root --no-interaction --no-ansi

COPY backend/app ./app

# (Opcional) reduzir tamanho limpando caches:
# RUN find /usr/local/lib/python3.11 -name '__pycache__' -prune -exec rm -rf {} +

CMD ["poetry", "run", "celery", "-A", "app.workers.worker", "worker", "--loglevel", "info"]