# Test Scenarios Catalogue

The following manual and automated test scenarios cover both frontend and backend behaviours. Reference IDs align with the acceptance criteria in `docs/requirements-coverage.md`.

## Frontend

| ID | Scenario | Steps | Expected Outcome |
| --- | --- | --- | --- |
| FE-01 | Submit code review (happy path) | Login → Open Submit page → Select `Python` → Paste 20+ lines of code → Click **Submit for review** | Toast confirmation, queue shows `pending` item, request recorded in MongoDB. |
| FE-02 | Form validation | Without logging in, click **Submit for review** | Warning toast prompts login; request not sent. |
| FE-03 | Language validation | Clear Monaco content → Submit | Error message "Provide at least 10 characters" appears; button disabled until resolved. |
| FE-04 | Audio upload | Switch to **Audio** tab → Upload `.m4a` file → Submit | Toast confirms upload, queue contains audio submission. |
| FE-05 | Queue live updates | With an active job, observe queue as worker completes review | Status transitions `pending → processing → completed`, score badge displayed. |
| FE-06 | Review history filters | Navigate to Dashboard → Apply language=Python, status=Completed, score>=7 | Table shows filtered results, header indicates counts. |
| FE-07 | CSV export | Apply arbitrary filters → Click **Export CSV** | Browser downloads `deepreview-export-<date>.csv` containing filtered rows. |
| FE-08 | Auth persistence | Login → Refresh browser | Zustand store rehydrates token/profile from `localStorage`; user remains logged in. |
| FE-09 | Session logout | Click avatar menu → Sign out | Token cleared, redirected to login, protected routes inaccessible. |
| FE-10 | WebSocket fallback | Disable WebSocket in DevTools → Submit review | Queue still updates after API polling refresh interval. |
| FE-11 | Feature flag hook | Toggle example flag via `useFeatureFlag` mock | UI responds per mocked flag state. |
| FE-12 | Responsive layout | Resize to mobile width (<768px) | Mobile nav appears, sidebar collapses, queue cards stack vertically. |

## Backend

| ID | Scenario | Steps | Expected Outcome |
| --- | --- | --- | --- |
| BE-01 | Health check | `GET /api/health` | Returns JSON with `status: ok` when dependencies reachable. |
| BE-02 | Rate limit | Issue 11 submissions from same IP within 60 minutes | Final request returns `429` with retry hint. |
| BE-03 | Auth register/login | `POST /api/auth/register` → `POST /api/auth/token` | Register returns token; login with same credentials returns new JWT. |
| BE-04 | Submit code | `POST /api/reviews` with valid payload | Response `202` with submission ID, status `pending`. |
| BE-05 | Submit audio | Provide base64 audio | Submission stored with `source=audio`, transcription metadata attached. |
| BE-06 | Duplicate cache hit | Submit identical code twice | Second response returns `status=cached`; review reused without Celery job. |
| BE-07 | Review listing filters | `GET /api/reviews?language=python&status=completed&min_score=7` | Returns filtered list, summary aggregates reflect filter. |
| BE-08 | Review export | `GET /api/reviews/export` | Streaming CSV with headings, respects filters/min score. |
| BE-09 | Analytics summary | `GET /api/reviews/analytics/summary` after multiple submissions | JSON provides averages, throughput data, issue histogram. |
| BE-10 | Stats endpoint alias | `GET /api/stats` | Mirrors analytics summary payload. |
| BE-11 | WebSocket auth failure | Connect to `/ws/reviews` with invalid token | Connection closes with `4401`. |
| BE-12 | Worker retry | Force DeepSeek failure (mock 500) | Celery retries up to 3 times with exponential backoff, submission marked `failed` after final retry. |
| BE-13 | Mongo index usage | Inspect Atlas metrics during list queries | Query planner shows indexed lookups on `user_id`, `status`, `code_hash`. |
| BE-14 | Background seed script | Run `scripts/seed_demo_data.py` | Inserts demo user/submissions, idempotent on repeated runs. |

## Cross-Cutting

| ID | Scenario | Steps | Expected Outcome |
| --- | --- | --- | --- |
| CC-01 | End-to-end smoke | Deploy to Vercel/Render/Upstash/Atlas → Register → Submit code | Full flow succeeds, analytics dashboard updates within minutes. |
| CC-02 | Security sanity | Attempt to access another user’s review via direct ID | API returns `404`, logs audit event. |
| CC-03 | Latency budget | Measure p95 response for `/api/reviews` under load (Artillery/Gatling) | Remains <250ms with cached Redis lookups and Mongo indexes. |
| CC-04 | Accessibility | Run Lighthouse/axe audits | No critical accessibility issues (color contrast, ARIA labels) detected. |
| CC-05 | Observability | Trigger Sentry/PostHog (if configured) | Events appear in respective dashboards for tracing. |

Automate these scenarios incrementally via Playwright, Vitest, and Pytest to keep parity with manual validation.
