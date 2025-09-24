# DeepReview Project Blueprint

## 1. Vision & Objectives
- **Mission:** Deliver an AI-assisted code review platform that helps developers catch issues, improve quality, and track long-term trends.
- **Primary Outcomes:**
  - End-to-end workflow from code submission to actionable feedback.
  - Highly responsive UI with syntax-aware editing and analytics.
  - Reliable, scalable backend with asynchronous processing and rate limiting.
  - Comprehensive monitoring, documentation, testing, and deployment story.
- **Guiding Principles:** Developer empathy, security-first mindset, observability, modular architecture, time-to-value.

## 2. High-Level Architecture
- **Client Apps:** React + TypeScript SPA hosted on Vercel.
- **API Layer:** FastAPI async services running on Render (primary) with fallback deployment option on Railway.
- **Task Processing:** Celery workers for background review jobs, deployed on Render free worker dyno; message broker + cache via Upstash Redis free tier.
- **AI Integration:** DeepSeek API (e.g., DeepSeek-V2) as primary LLM.
- **Database:** MongoDB Atlas M0 free-tier cluster with defined indexes; optional timeseries collection for metrics.
- **Storage:** MongoDB GridFS for large payloads if required; optional AWS S3-compatible storage via Cloudflare R2 (free tier) for attachments.
- **CI/CD:** GitHub Actions with reusable workflows, environments, and required approvals.
- **Monitoring:**
  - Application monitoring via Sentry (free tier).
  - Logging via Axiom/Logtail (free tier) or OpenTelemetry collector -> Grafana Cloud (free tier).
  - Health checks via UptimeRobot (free tier).
- **Analytics & BI:** Metabase (self-hosted on Render free Postgres) pulling from MongoDB via BI connector; optional startup.

### 2.1 Logical Component Diagram
```
Clients (Web, Future Mobile)
  ↕ (HTTPS)
API Gateway / FastAPI App
  ↘ Background Queue (Celery + Redis)
  ↘ MongoDB Atlas
  ↘ External AI Provider (DeepSeek)
  ↘ Observability Stack (Sentry, Grafana Cloud)
Deployments orchestrated via GitHub Actions → Render/Vercel.
```

## 2.2 Architectural Style & Patterns
- **Overall Style:** Modular monolith backed by FastAPI, organized by bounded contexts (submission, reviews, analytics, notifications). This keeps deployment simple for free-tier platforms while maintaining clear separation of concerns.
- **Evolution Path:** Critical services (AI review worker, analytics cruncher) are isolated via Celery; when scaling beyond free tiers we can promote them to dedicated microservices without heavy refactors.
- **Why Not Microservices Now:** Multiple deployables would exceed free-tier quotas, add inter-service auth/observability overhead, and complicate latency-sensitive calls. The modular monolith keeps infra lightweight yet still enforces domain boundaries.
- **Design Patterns:**
  - Hexagonal (Ports & Adapters) for the FastAPI app, isolating external services (MongoDB, DeepSeek, Whisper) behind interfaces.
  - CQRS-lite for read-heavy analytics (`/api/stats`) separated from write models.
  - Repository pattern with Beanie/Motor abstractions.
  - Event-driven hooks (domain events → Celery tasks) to keep side effects out of request cycle.
  - Feature flags (GrowthBook cloud) to opt-in future experiments safely.

## 3. Monorepo Structure
```
DeepReview/
├── frontend/ (React + TS, Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/ (API clients)
│   │   └── store/
│   ├── public/
│   ├── tests/ (Playwright + Vitest)
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── api/ (routers)
│   │   ├── core/ (config, logging)
│   │   ├── models/ (Pydantic, ODMantic or Beanie schemas)
│   │   ├── services/ (AI, rate limiting, analytics)
│   │   ├── tasks/ (Celery tasks)
│   │   └── workers/
│   ├── tests/ (Pytest + coverage + httpx async client)
│   ├── scripts/
│   ├── alembic/ (if relational needs; optional)
│   └── pyproject.toml
├── infra/
│   ├── github-actions/
│   │   ├── deploy-frontend.yml
│   │   ├── deploy-backend.yml
│   │   └── ci.yml
│   ├── docker/
│   │   ├── backend.Dockerfile
│   │   ├── worker.Dockerfile
│   │   └── frontend.Dockerfile
│   └── terraform/ or pulumi/ (optional IaC for future)
├── docs/
│   ├── architecture.md
│   ├── api-reference.md
│   └── operations-runbook.md
├── project_plan.md (this document)
└── README.md
```

## 4. Technology & Library Choices

### Frontend (React + TypeScript)
- Framework: Vite + React 18 + TypeScript.
- UI: Chakra UI or Mantine (accessible, themeable) + Tailwind CSS for utility classes.
- Editor: Monaco Editor or CodeMirror 6 with language packs for syntax highlighting.
- Syntax Highlighting: `react-syntax-highlighter` or `prism-react-renderer` for read-only render.
- State Management: Zustand or Redux Toolkit (with RTK Query for API cache).
- Networking: Axios or `fetch` wrapper with React Query for caching and retries.
- Routing: React Router v6.
- Forms: React Hook Form + Zod for validations.
- Internationalization: `i18next` (future enhancement).
- Charts: Recharts or ECharts for analytics dashboard.
- CSV Export: `papaparse` or `json2csv`.
- Testing: Vitest + Testing Library; Playwright for E2E.

### Backend (FastAPI)
- Server: FastAPI + Uvicorn (ASGI) with Hypercorn alternative.
- Data Layer: Beanie ODM (async, Pydantic-based) or Motor with custom repositories.
- Task Queue: Celery with Redis broker + backend (Upstash Redis free tier) or Dramatiq as lighter alternative.
- Background Execution: Celery Beat or APScheduler for scheduled tasks.
- Rate Limiting: SlowAPI or Starlette-Limiter with Redis storage.
- Auth (future): FastAPI Users with JWT, magic link optional.
- Validation: Pydantic v2 models.
- Testing: Pytest + httpx AsyncClient + pytest-asyncio.
- Logging: Structlog + Loguru integration; OpenTelemetry instrumentation.
- Configuration: Pydantic Settings with multi-env support.
- Documentation: Auto-generated OpenAPI + ReDoc + Stoplight elements via docs site.

### AI Integration (DeepSeek & Whisper)
- API Clients: Async HTTPX with backoff for DeepSeek (`https://api.deepseek.com/v1`) and WhisperAPI via Lemonfox (`https://api.lemonfox.ai`).
- Prompt Framework: Guidance or Instructor for structured replies from DeepSeek.
- Audio Transcription: WhisperAPI converts uploaded audio to text, enabling voice-based submissions prior to AI review.
- Output Schema: Pydantic to enforce structure (score, issues, security, performance, suggestions) for DeepSeek responses.
- Caching: Redis for prompt/response caching and deduped transcripts.
- Fallback: Optional OpenAI or HuggingFace inference endpoints when DeepSeek SLA is breached.

### DevOps & Tooling
- Package Management: pnpm for frontend; Poetry for backend.
- Static Analysis: ESLint + Prettier; Ruff + MyPy + Black (or Ruff formatting) on backend.
- Commit Hooks: pre-commit configured for both stacks.
- Secrets: Doppler (free developer plan) or GitHub Encrypted Secrets.
- Secret Hygiene: Secrets never committed; rotations captured in runbook; GitGuardian free tier watches on repo and pipelines.
- Containerization: Docker Compose for local dev (frontend, backend, worker, redis).
- Docs: Docusaurus site (optional) from `docs/` folder.

## 5. Platform Selections (Free-Tier Friendly)
- **Database:** MongoDB Atlas M0 (shared cluster, 512MB) with VPC Peering optional.
- **Cache/Queue:** Upstash Redis (free tier supports 1GB data / 10k requests daily) — ensure quotas align.
- **Backend Deployment:** Render free web service (750 hours/month) or Railway free tier (limited hours, watch usage). Provide H12 keep-alive via cron.
- **Worker Deployment:** Separate Render worker or Railway service; schedule restarts for free tier limitations.
- **Frontend Deployment:** Vercel Hobby Plan (unlimited prev deploys, analytics optional) or Netlify free as fallback.
- **CI/CD:** GitHub Actions (2,000 minutes/month on free tier) with concurrency controls.
- **Monitoring:** Sentry free, Grafana Cloud (3 users), UptimeRobot (50 monitors), Logtail/Axiom (1GB/day).
- **Analytics:** MongoDB Charts (free) for quick dashboards; Metabase for advanced queries.
- **Domain & Certificates:** Cloudflare free tier for DNS and SSL.
- **Secret Management:** GitHub Secrets + Doppler/Infisical free plan.
- **Design Collaboration:** Figma free team plan for UI mockups.

## 6. Feature Breakdown & Implementation Strategy

### 6.1 Core Features (MVP Scope)
1. **Code Submission Interface**
   - Monaco/CodeMirror editor with language dropdown (predefined languages + auto-detect via `highlight.js`).
   - Form validation using Zod; API call via React Query mutation with optimistic status updates.
   - Status indicator component reflecting pending/in-progress/completed/failed (via SSE/WebSocket or polling).
   - Loading skeletons, toast notifications (Chakra UI Toast).

2. **AI Code Review Service**
   - FastAPI endpoint `/api/reviews` triggers Celery task with payload ID.
   - Task constructs structured prompt with instructions to DeepSeek, expecting JSON schema.
   - Response validated via Pydantic; store results & any parsing fallback (LLM guardrails via JSON Schema enforcement).
   - Timeout + retry with exponential backoff (Tenacity) and circuit breaker pattern (PyCircuitBreaker).

3. **Review Management**
   - MongoDB collections: `submissions`, `reviews`, `analytics_snapshots`.
   - Indexes: `{ userId, createdAt }`, `{ status }`, text index on code metadata.
   - Rate limiting: SlowAPI decorator `@limiter.limit("10/hour")` keyed by IP/User.
   - Background jobs: Celery worker handles AI calls, updates review document; optional event-based notifications.

4. **Analytics Dashboard**
   - Filters bar (language, date range, min score) using Chakra UI components.
   - Aggregation API `/api/reviews` with query params; use MongoDB Aggregation Pipeline for stats.
   - Aggregate endpoint `/api/stats` returning average score, trending issues, top languages, throughput.
   - CSV export using backend `pandas` or `pyarrow` (fast) streamed to client.

### 6.2 Optional Features (Planned Enhancements)
1. **WebSocket Real-Time Updates** via FastAPI WebSocket or Socket.IO (powered by Redis pub/sub).
2. **Code Diff Visualization:** integrate `react-diff-viewer` for before/after suggestions.
3. **User Authentication:** Auth0 free tier or NextAuth + Supabase auth; store user-specific history.
4. **Caching for Repeated Submissions:** Use Redis hashed by code checksum; allow manual bypass.
5. **Dockerization:** Multi-stage Dockerfiles, docker-compose for local dev and deployment.
6. **Unit & Integration Tests:** Achieve >85% coverage backend; Playwright flows for UI.

### 6.3 Additional Suggested Features
- **Multi-AI Strategy:** Allow user to choose DeepSeek vs OpenAI vs local HuggingFace with caching.
- **GitHub Integration:** Connect repositories, run PR-based reviews (webhooks).
- **Team Workspaces:** Multi-user organizations, shared analytics, RBAC.
- **Customizable Review Templates:** Save prompt presets per team/project.
- **Notification Channels:** Slack, email (Resend free tier), or MS Teams connectors.
- **Policy Checks:** OWASP dependency scanning (OWASP Dependency-Check) + Semgrep static analysis pipeline.
- **LLM Fine-Tuning:** Collect dataset for targeted tuning via DeepSeek training endpoints.
- **Audit Logs:** Append-only logs with immutability (e.g., MongoDB change streams to AWS QLDB free tier alternative or simple S3 archival).
- **Accessibility Review:** Lint UI components with axe-core.
- **Localization:** Support EN/PT via i18next to appeal to global teams.
- **Voice Submissions:** Allow users to upload audio snippets; WhisperAPI transcribes and feeds into the same review pipeline.
- **Feature Flags:** GrowthBook cloud (free tier) to gradually expose experimental analytics or AI prompts.


## 7. AI Workflow Details
1. **Prompt Template:** Provide code snippet, language, context, guidelines (security, performance, maintainability) and require JSON output.
2. **Structured Output:**
   - `score` (1-10, float)
   - `summary`
   - `issues[]` with `severity`, `category`, `description`, `recommendation`
   - `securityConcerns[]`
   - `performanceRecommendations[]`
   - `additionalSuggestions[]`
3. **Guardrails:** Use Instructor/`pydantic_ai` for schema-constrained responses; fallback to re-prompt on validation failure.
4. **Caching:** Store hashed prompts to Redis for 24h to avoid duplicate charges.
5. **Token Management:** Track approximate cost per review; enforce quotas per user/team.
6. **Observability:** Log prompt/response metadata with PII scrubbing; use OpenTelemetry span for AI latency.
7. **Model Selection:** Default DeepSeek-V2; degrade to smaller DeepSeek-chat for high load; allow custom API key injection per user.

## 8. Data Modeling
- **Collections:**
  - `submissions`: metadata, raw code (optionally truncated), user info, status.
  - `reviews`: reference to submission, structured feedback, timestamps, AI metadata.
  - `review_events`: status transitions for timeline and WebSocket updates.
  - `analytics_snapshots`: aggregated stats for fast dashboard load.
  - `users`, `teams` (optional), `api_keys` for auth.
- **Indexes:** TTL index for ephemeral data (e.g., temporary tokens); compound indexes on `(language, createdAt)`, `(teamId, status)`.

## 9. API & Background Processing
- **REST Endpoints:** (All prefixed with `/api`)
  - `POST /reviews`: create submission, enqueue task.
  - `GET /reviews/{id}`: fetch submission + review details.
  - `GET /reviews`: list with pagination, filters `language`, `status`, `from`, `to`, `minScore`.
  - `GET /stats`: aggregate metrics.
  - `GET /health`: returns Mongo, Redis, AI status.
  - `POST /webhooks/github` (optional) for repo integration.
- **Background Tasks:**
  - Celery worker consumes queue, calls AI, updates DB, publishes notifications.
  - Scheduled job to recompute analytics snapshots hourly.
  - Scheduled job to clean up stale submissions (older than 7 days without completion).

## 10. Rate Limiting & Security
- Rate limiting via SlowAPI + Redis (10 reviews/hour/IP) with per-user override.
- Additional quotas enforced per API key (teams) using custom middleware.
- Input sanitization for code submissions; size limit enforced.
- Secure headers via Starlette middleware, CORS with whitelisted origins.
- Secrets stored in environment variables, rotated regularly.
- Use HTTPS everywhere; rely on platform-managed TLS (Vercel/Render).

## 11. Testing & Quality Strategy
- **Backend:** Pytest, coverage report, contract tests for AI schema (mocked responses), load tests via Locust.
- **Frontend:** Unit tests (Vitest), integration tests (React Testing Library), E2E (Playwright across browsers), visual regression (Chromatic optional).
- **CI:** Matrix builds (node 18/20, python 3.11/3.12). Lint, type check, tests, build.
- **QA:** Manual smoke checklist, API docs verification, Postman collection.

## 12. CI/CD Pipeline Design
1. **`ci.yml`:** Lint + test + build preview on PR.
2. **`deploy-backend.yml`:** On merge to `main`, build Docker image, push to Render via deploy hook, run migrations.
3. **`deploy-frontend.yml`:** Trigger Vercel deployment via CLI or webhook after backend success.
4. **Secrets Management:** Use GitHub Environments `staging`/`production`; branch protections require PR reviews.
5. **Notifications:** GitHub Deployment status + Slack notification via webhook.
6. **Automation:** Auto-tag releases, generate changelog with Release Drafter.

## 13. Deployment Strategy
- **Environments:** `dev` (local docker-compose), `staging` (Render/Vercel preview), `production` (main branch).
- **Provisioning:** Manual setup for MVP; consider Terraform (AWS Lightsail/Vercel/Render providers) later.
- **Blue/Green Deploy:** For backend via Render deploy hooks with health check gate.
- **Rollback Plan:** Keep previous deploy active, use Render dashboard for fallback.

## 14. Monitoring & Analytics
- **Metrics:** Response time, queue depth, AI latency, rate limit hits, review throughput, average scores.
- **Dashboards:** Grafana Cloud dashboards reading from OpenTelemetry Collector; MongoDB Charts for product analytics.
- **Alerts:** Sentry issues, uptime monitors, Slack notifications for queue backlog > threshold.
- **Product Insights:** Mixpanel/Amplitude free tier or PostHog self-hosted for user behavior (optional).

## 15. Documentation & Developer Experience
- **Docs:**
  - README with quickstart, architecture, deployment links.
  - API reference via FastAPI docs + exported OpenAPI JSON.
  - `docs/` site with Docusaurus for guides and runbook.
- **Developer Setup:**
  - `.env.example` with placeholders.
  - Task runner (Justfile or Makefile) for common commands.
  - Dev containers (`.devcontainer`) for VS Code remote setup.
- **Design System:** Figma file + Storybook for UI components (Chromatic for hosting).

## 16. Roadmap & Milestones
- **Week 1:** Project scaffolding, environment setup, DB schema, basic submission flow.
- **Week 2:** AI integration, review storage, analytics endpoints, frontend dashboards.
- **Week 3:** Rate limiting, background tasks hardening, optional features (WebSockets, diff viewer).
- **Week 4:** Testing coverage, CI/CD automation, documentation polish, deployment, monitoring.
- **Buffer:** User testing, bug fixes, performance tuning.

## 17. Risk & Mitigation
- **Free Tier Limits:** Monitor usage; create alerts; plan paid upgrade path.
- **AI Latency/Failures:** Implement retries, fallback models, user-facing error handling.
- **Queue Backlog:** Autoscale worker count; apply admission control.
- **Security:** Regular dependency scans, OWASP ZAP in CI, strict CORS, audit logs.
- **Complexity:** Modular architecture, feature flags, progressive rollout.

## 18. Immediate Next Steps
1. Confirm platform accounts (MongoDB Atlas, Upstash, Vercel, Render, Sentry, GitHub Actions).
2. Set up repository with monorepo layout, initialize frontend/backend scaffolding.
3. Implement shared UI kit and API client base layer.
4. Draft detailed prompt templates and schema validators for DeepSeek responses.
5. Establish CI pipelines and pre-commit tooling before major feature work begins.
6. Prepare design wireframes in Figma for submission flow and analytics dashboard.

---
**Note:** This blueprint covers mandatory requirements, all optional features listed in the assignment, and proposes additional enhancements to future-proof the DeepReview platform. Adapt platform selections if free-tier constraints change, documenting trade-offs in the README and architecture notes.
