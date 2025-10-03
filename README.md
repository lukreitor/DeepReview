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

## Feature Highlights

- **Multimodal submissions:** Developers can send code or voice notes from the Submit page; Monaco powers syntax highlighting while Whisper transcription normalizes audio.
- **AI-assisted reviews:** Celery workers call DeepSeek with resilient retries, producing structured scores, issues, and improved code stored in MongoDB.
- **Real-time feedback:** Redis-backed WebSockets stream queue updates into the Review Queue component so users watch statuses change without refreshes, now enriched with AI summaries, issues, transcripts, and actionable recommendations inline.
- **Analytics dashboard:** Recharts visualizes throughput and issue trends, filters refine history, and exports produce CSV snapshots for audits.
- **Operational guardrails:** SlowAPI enforces per-IP rate limits, Redis caches duplicate reviews, and health endpoints check every dependency.

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

## Requirement Checklist

### Core features

- [x] **Code submission interface** – `SubmitPage.tsx` offers language-aware Monaco editing, audio uploads, validation, and clear error states.
- [x] **AI review service** – Celery workers (`app/tasks/review.py`) call `AIReviewService` (DeepSeek/Whisper) and persist structured feedback in MongoDB.
- [x] **Review management** – Beanie models track submission status transitions, SlowAPI enforces per-IP quotas, and Celery handles background processing.
- [x] **Analytics dashboard** – `DashboardPage.tsx` provides filters, paginated history, throughput/issue charts with empty states, and CSV export respecting current filters.

### Bonus features

- [x] **WebSocket status updates** – `/ws/reviews` pushes live events consumed via `useReviewStream` for the live queue.
- [x] **Code diff visualisation** – `ReviewDiff` component renders AI-improved snippets side-by-side.
- [x] **User authentication & history** – JWT-based FastAPI auth with Zustand-backed session handling surfaces per-user review history.
- [x] **Caching for duplicate submissions** – Redis `ReviewCache` deduplicates repeated code hashes and serves cached reviews instantly.
- [x] **Docker containerisation** – `docker-compose.yml` plus service-specific Dockerfiles enable local and CI builds.
- [x] **Automated tests** – `poetry run pytest` covers backend services; Vitest and React Testing Library support frontend specs (see `frontend/tests/`).

Progress beyond the checklist includes a rich Review Queue summarising AI output (security, performance, transcript confidence) and retry-aware hydration so completed jobs always display full detail before dismissal.

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

To rebuild every container without stale layers you can run:

```powershell
# Windows PowerShell 5.1
.\scripts
ebuild-all.ps1

# or explicitly
powershell -ExecutionPolicy Bypass -File .\scripts\rebuild-all.ps1

# PowerShell 7+
pwsh ./scripts/rebuild-all.ps1
```

The script stops existing containers, rebuilds each image (pass `-NoCache` to force cache eviction), and relaunches the stack in detached mode.

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
- `docs/requirements-coverage.md`: Detailed mapping from assignment requirements to implementation
- `docs/feature-checklist.md`: Checkbox summary of core and bonus features
- `docs/test-scenarios.md`: Exhaustive manual/automated test catalogue
- `docs/deployment-guide.md`: Production-ready Vercel + Render + Atlas + Upstash rollout steps
- `docs/demo-script.md`: 10-minute Loom recording script covering every demo milestone

## Contributing

1. Fork / clone the repo
2. Copy `.env.example` to `.env`
3. Run `pnpm install` in `frontend/` and `poetry install` in `backend/`
4. Run `pre-commit install`
5. Create feature branches from `main`
6. Submit pull requests with passing tests & lint checks

## Licensing

See `LICENSE` for licensing information.

## Implementation Narrative (≤500 words)

**Architecture decisions made and why.** The solution is structured as a monorepo with FastAPI + Celery on Python 3.11 and a Vite-powered React/TypeScript SPA. Chakra UI ensures consistent responsive layouts, while Zustand persists auth state between refreshes. Monaco was chosen for the submission editor to deliver language-aware highlighting with minimal integration effort. On the backend, Beanie ODM maps submissions and reviews to MongoDB with indexed fields for user, status, and hash deduplication. Redis is shared across rate limiting, caching, and pub/sub so we reuse a single managed service.

**Challenges and how they were solved.** Parsing LLM responses required hardening: the Celery worker wraps DeepSeek calls with tenacity retries and validates JSON before storage, falling back to a human-readable summary if parsing fails. Handling duplicate submissions demanded a fast-path cache, so we hash the code snippet and short-circuit the pipeline when a cached review exists. Cross-origin and local testing quirks were addressed by dynamically expanding the CORS whitelist for localhost variants. For audio uploads we strip Data URI prefixes before decoding to avoid malformed bytes.

**Scalability considerations.** All networked components are async, and heavy work is delegated to Celery workers to keep API latencies predictable. MongoDB queries rely on indexed fields (`user_id`, `status`, `code_hash`) and pagination to avoid large scans. Redis-backed WebSockets allow horizontal API scaling because each instance subscribes to the same channel namespace. The review cache TTL and rate limiting guard the LLM provider against bursts, and configuration lives in environment variables so additional workers or queues can be added without code changes.

**Improvements with more time.** Expand automated coverage with end-to-end Playwright suites, contract tests for AI responses, and synthetic monitoring that exercises the real queue. Introduce team-based workspaces with role management, plus audit logging surfaced in the dashboard. Explore incremental diff rendering using tree-sitter to better visualize structural changes.

**Trade-offs due to time constraints.** Real-time transcription quality depends on Whisper’s external service rather than an in-house model, prioritizing delivery speed over fine-grained control. The analytics summary recomputes on demand instead of pre-aggregating; this keeps implementation simpler but may need batching for very large datasets. Background jobs currently run on a single Celery queue to minimize operational overhead—partitioned queues could be introduced later as traffic grows. Despite these trade-offs, the current system satisfies all mandatory and optional requirements while remaining deployable on free-tier infrastructure.
