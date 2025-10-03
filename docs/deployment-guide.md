# Deployment Guide

This walkthrough explains how to promote DeepReview to production using the recommended free-tier services.

## 1. Provision Managed Services

### MongoDB Atlas (M0)
1. Create or sign in to https://cloud.mongodb.com/ and create a new project.
2. Launch a free M0 cluster in the region closest to your users.
3. Add a database user (`deepreview-app`) with a strong password and `Read/Write` access to the `deepreview` database.
4. Add your Vercel/Render IPs (or `0.0.0.0/0` during testing) to the network access list.
   - In Render, look under **Settings → General → Region** to note where your service runs (e.g. "Oregon – US West").
   - Match the region to the [Render static outbound IP list](https://render.com/docs/static-outbound-ip-addresses) and add every IP (or CIDR block) shown for that region to Atlas. MongoDB treats each entry as a single address, so paste the full CIDR value such as `208.52.170.192/27`.
   - Atlas changes can take a couple of minutes to propagate—wait for the green "Active" badge before redeploying.
5. Copy the SRV connection string and replace the placeholder credentials; this becomes `MONGODB_URI`.

### Upstash Redis
1. Visit https://console.upstash.com/ and create a new Redis database.
2. Choose the `Global` network type to maximize compatibility.
3. Copy the REST URL and token; convert it to the standard URI form: `rediss://:<token>@<hostname>:<port>`.
4. Store this URI as `REDIS_URL` for the API and worker.

### DeepSeek & Whisper Keys
- Generate API keys for DeepSeek (https://platform.deepseek.com/) and Whisper/Transcription provider (Lemonfox in this project).
- Store them securely; they are required for both backend and worker services.

## 2. Configure the Backend (Render)
1. Push the repository to GitHub and make it public/private as needed.
2. In Render, create a **Web Service**:
   - Repo: `DeepReview`
   - Branch: `feature-full-project-front-end-bundle` (or `main` after merge)
   - Build command: `poetry install`
   - Start command: `poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000`
   - Environment: `Python 3.11`
3. Create a **Background Worker** service in Render using the same repo:
   - Build command: `poetry install`
   - Start command: `poetry run celery -A app.workers.worker worker --loglevel=info`
4. Define the following environment variables on both services (use Render Secrets Manager):
   - `ENVIRONMENT=production`
   - `FRONTEND_URL=https://your-vercel-domain.vercel.app`
   - `BACKEND_URL=https://your-render-domain.onrender.com`
   - `MONGODB_URI=<atlas-connection-string>`
   - `MONGODB_DB=deepreview`
   - `REDIS_URL=<upstash-redis-uri>`
   - `DEEPSEEK_API_KEY=<deepseek-key>`
   - `DEEPSEEK_BASE_URL=https://api.deepseek.com/v1`
   - `DEEPSEEK_MODEL=deepseek-chat`
   - `WHISPER_API_KEY=<lemonfox-key>`
   - `WHISPER_BASE_URL=https://api.lemonfox.ai`
   - `JWT_SECRET=<64-char-random-string>`
   - `RATE_LIMIT=10/hour`
   - `REVIEW_CACHE_TTL_SECONDS=86400`
   - `REVIEW_CACHE_PREFIX=deepreview:review-cache`
   - `WEBSOCKET_CHANNEL_PREFIX=deepreview:ws`
   - (Optional) `SENTRY_DSN`, `GROWTHBOOK_CLIENT_KEY`, `POSTHOG_API_KEY`
5. Set Render health checks to `/api/health`.
6. Once deployed, note the Render base URL for the API (`https://<service>.onrender.com`).

## 3. Deploy the Frontend (Vercel)
1. Import the GitHub repository into Vercel.
2. Set the framework preset to **Vite** and the root directory to `frontend`.
3. Configure build/output:
   - Install command: `pnpm install --frozen-lockfile`
   - Build command: `pnpm build`
   - Output directory: `dist`
4. Define the environment variables in the Vercel project:
   - `VITE_API_BASE_URL=https://<render-backend>/api`
   - `VITE_WS_BASE_URL=wss://<render-backend>/ws`
   - `VITE_DEMO_USER_EMAIL=demo@deepreview.dev`
   - `VITE_DEMO_USER_PASSWORD=DeepReview!123`
   - (Optional) analytics keys like `VITE_POSTHOG_KEY`
5. Trigger a production deployment. Vercel will expose `https://<project>.vercel.app`.

## 4. Seed Demo Data (Optional)
1. From your local machine, create a `.env` file in `backend/` with the same production credentials.
2. Run `poetry run python scripts/seed_demo_data.py` to insert seed submissions and reviews.
3. Verify the new data appears in MongoDB Atlas.

## 5. Update Environment Cross-References
- In Render, update `FRONTEND_URL` to the Vercel domain.
- In Vercel, update `VITE_API_BASE_URL` and `VITE_WS_BASE_URL` if Render reassigns the domain.

## 6. Smoke Test the Live Stack
1. Visit the Vercel URL and register a test account.
2. Submit code and confirm it transitions through the queue.
3. Monitor Render logs (web + worker) for Celery activity.
4. Confirm MongoDB Atlas receives new documents and Upstash Redis shows key activity.

## 7. Ongoing Operations
- Monitor `docs/operations-runbook.md` for troubleshooting.
- Rotate API keys regularly and re-deploy when secrets change.
- Scale Render services beyond free tier if you need more concurrency.
