# 10-Minute Demo Script (read verbatim)

Use this exact wording while recording the Loom walkthrough.

## 0:00 – 0:45 · Introduction
"Hi everyone! My name is <YOUR NAME>, and I’m excited to walk you through DeepReview, our AI-assisted code review platform. In the next ten minutes I’ll demo the live application, highlight the submission and review pipeline, explore analytics, and wrap with a quick technical overview. Let’s jump in."

## 0:45 – 2:15 · Application overview
"I’m loading the production frontend. Across the top we expose the primary navigation, the left sidebar keeps contextual shortcuts, and the hero section points new users straight to the review workflow. Authentication supports both self-serve registration and the published demo credentials. Once you sign in, Zustand keeps your session in local storage so refreshes don’t force a relog."

## 2:15 – 4:30 · Code submission and queue
"I’ll open the Submit page. The form includes a language selector and the Monaco editor for real-time syntax highlighting. I’ll paste a Python snippet—note that we enforce a 10-character minimum to avoid empty submissions—and click **Submit for review**. Buttons disable while the request is pending, and Chakra toasts confirm success or failures.

Now I’ll switch to the Audio tab. I’ll upload a short `.m4a` file and mention that the backend strips the Data URI prefix, sends the bytes to Whisper for transcription, and then feeds the normalized code back into the same review pipeline. When I click **Transcribe and review**, we fire the exact same mutation and acknowledge it with a toast."

"At the bottom we surface the live review queue. Each card shows the submission ID, whether the response was served from cache, the current status, and the AI score when available. Watch the lifecycle advance from `pending` to `processing`, and finally to `completed` or `cached` when the Celery worker and the LLM return."

## 4:30 – 7:00 · Analytics dashboard
"Let’s hop to the Dashboard. Filters for language, status, minimum score, and date range sit at the top; they’re wired into React Query so the dataset refreshes automatically and the counts update in the header. These KPI cards display the average quality score, queue backlog, and average turnaround time.

Below, the throughput line chart shows daily submissions for the past week, and the bar chart ranks the most common issue categories the AI detected. If I click **Export CSV**, the backend streams a filtered CSV so teams can audit reviews offline.

Scrolling further, the Recent Reviews list exposes each submission. You can see the status, the AI summary, severity badges for every issue, and a split diff rendered by the `ReviewDiff` component comparing raw and improved code side by side."

## 7:00 – 8:30 · Technical deep dive
"Under the hood, FastAPI handles HTTP and WebSocket traffic, while Celery workers process reviews asynchronously. Persistence lives in MongoDB Atlas using Beanie ODM. Redis, hosted on Upstash, acts as our cache, rate-limit store, and pub/sub backbone. We call DeepSeek for the code review itself and Whisper for audio transcription.

Every submission is hashed. If the hash exists in Redis we immediately return a cached review with status `cached`. Otherwise we enqueue `process_review_submission`. The worker wraps the DeepSeek call with tenacity retries and validates the JSON payload before persisting it as a `Review` document. Once stored, we publish an event through Redis so connected WebSocket clients update in real time.

Rate limiting via SlowAPI enforces 10 reviews per IP per hour, JWT auth guards every API route, and the health endpoint checks MongoDB, Redis, DeepSeek, and Whisper so we can surface degraded states quickly."

## 8:30 – 9:30 · Deployment and operations
"In production we deploy the frontend on Vercel, the FastAPI service on a Render Web Service, and the Celery worker on a separate Render worker. MongoDB Atlas M0 hosts our data, and Upstash Redis powers caching and WebSockets. The full step-by-step guide—including environment variables and seeding instructions—is in `docs/deployment-guide.md`.

Operational playbooks live in `docs/operations-runbook.md`, and optional Sentry and PostHog hooks are already wired for observability."

## 9:30 – 10:00 · Closing summary
"To wrap up: DeepReview delivers multimodal submissions, structured AI feedback, real-time analytics, and WebSocket-driven notifications. We shipped beyond the baseline with caching, diff visualization, and a full documentation suite. With more time I’d expand end-to-end automated tests and introduce multi-tenant workspaces, but today’s solution satisfies every mandatory and bonus requirement and runs comfortably on free-tier infrastructure.

Thanks for watching! Once I finish recording I’ll email the Loom link, repository, and live URLs to sid@quizard.ai."
