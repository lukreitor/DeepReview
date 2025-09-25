# DeepReview

DeepReview is an AI-assisted code review platform that enables developers to submit code (or audio that gets transcribed to code) for automated feedback, track review history, and analyse quality trends. This repository contains a monorepo with the frontend, backend, infrastructure, and documentation assets needed to deploy the system end-to-end on free-tier services.

## Repository Structure

```
frontend/   React + TypeScript SPA (Vite) for submission & analytics UI
backend/    FastAPI service with Celery workers, MongoDB, DeepSeek & Whisper integrations
infra/      Dockerfiles, GitHub Actions workflows, IaC experiments
.docs/      Architecture, API reference, and operations documentation
```

> See `project_plan.md` for the full architectural blueprint and roadmap.

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 9+
- Python 3.11+
- Poetry 1.8+
- Docker & Docker Compose

### Environment Variables

- `backend/.env.example` contains all FastAPI, Celery, MongoDB, Redis, and provider secrets. Copy it to `backend/.env` and adjust the values before running the API or worker:
	```bash
	cd backend
	cp .env.example .env
	```
- `frontend/.env.example` mirrors browser-facing configuration (API base URL, feature flags, Sentry). Copy it to `frontend/.env` before launching the SPA:
	```bash
	cd frontend
	cp .env.example .env
	```
- For CI/CD environments (Render, Vercel, GitHub Actions) store the same keys in each platform's secret manager.

### Local Development

```bash
# Backend API (FastAPI)
cd backend
poetry install
poetry run uvicorn app.main:app --reload

# Background worker (Celery)
poetry run celery -A app.workers.worker worker --loglevel=info

# Frontend SPA (React)
cd ../frontend
pnpm install
pnpm dev
```

Visit `http://localhost:3000` for the frontend and `http://localhost:8000/docs` for the FastAPI docs.

### Testing

```bash
# Backend
poetry run pytest --asyncio-mode=auto

# Frontend
pnpm test
pnpm lint
pnpm vitest run
pnpm playwright test
```

### Docker Compose

```bash
docker compose up --build
```

This starts the frontend, backend API, Celery worker, Redis, and Local MongoDB for development.

## Deployment

- Frontend: Vercel (Hobby tier)
- Backend API: Render (Free tier)
- Background workers: Render worker service or Railway
- MongoDB: MongoDB Atlas M0
- Redis / Queue: Upstash Redis free tier

Deployment pipelines are defined under `.github/workflows/` (see `ci.yml`, `deploy-backend.yml`, and `deploy-frontend.yml`). Secrets should be stored in GitHub environment secrets or Doppler.

## Documentation

- `docs/architecture.md`: System architecture and key design decisions
- `docs/api-reference.md`: REST API contracts and sample payloads
- `docs/operations-runbook.md`: On-call, troubleshooting, and rotation procedures

## Contributing

1. Fork / clone the repo
2. Copy `.env.example` to `.env`
3. Run `pnpm install` in `frontend/` and `poetry install` in `backend/`
4. Run `pre-commit install`
5. Create feature branches from `main`
6. Submit pull requests with passing tests & lint checks

## Licensing

See `LICENSE` for licensing information.
