# Operations Runbook

This runbook supports engineers during incident response and routine maintenance for DeepReview.

## On-Call Quick Links
- Render dashboard (API + worker)
- Vercel project (frontend)
- MongoDB Atlas cluster
- Upstash Redis console
- Sentry issues
- Grafana Cloud dashboards
- Doppler / GitHub secrets portal
- UptimeRobot monitors

## Health Checks
- `/api/health` (Render) — used by UptimeRobot.
- `celery inspect ping` — verifies worker heartbeats.
- `GET /reviews?status=pending` — monitor for backlogs.

## Incident Response Checklist
1. **Acknowledge alert** via Slack/email.
2. **Assess impact:** Check Sentry, Grafana dashboards, Render logs.
3. **Stabilize:**
   - Restart worker (`Render > Worker service > Restart`).
   - Scale queue workers if backlog > 100 for >10 minutes.
   - Switch AI provider (toggle GrowthBook flag) if DeepSeek outage persists.
4. **Communicate:** Update incident channel with findings every 15 minutes.
5. **Mitigate:** Apply hotfix or rollback via Render deploy history / Vercel previous deployment.
6. **Post-Incident:** File incident report, create follow-up tasks.

## Common Scenarios

### AI Provider Failure
- **Symptoms:** `/api/reviews` returning 500, Sentry logging provider errors.
- **Actions:**
  - Verify DeepSeek status page.
  - Fallback to OpenAI/HuggingFace by toggling feature flag.
  - Ensure exponential backoff is functioning (`tenacity` logs).
  - Communicate expected delays to stakeholders.

### Queue Backlog
- **Symptoms:** Many `pending` submissions, Celery queue depth rising.
- **Actions:**
  - Inspect Celery queue via Flower (if enabled) or Redis CLI.
  - Temporarily scale worker concurrency (Render worker CPU limits permitting).
  - Investigate slow tasks (AI latency, MongoDB bottlenecks).
  - Offload analytics snapshot job if competing for resources.

### MongoDB Connectivity Issues
- **Symptoms:** API returning 500 with connection errors.
- **Actions:**
  - Check Atlas cluster status.
  - Validate IP allowlist (Render IP may have changed).
  - Fallback to cached responses (Redis) where possible.

### Rate Limit Spikes
- **Symptoms:** Frequent 429 responses, Sentry alerts on rate limit exceptions.
- **Actions:**
  - Confirm legitimate traffic vs abuse.
  - Temporarily raise per-user quota (config override) if controlled load test.
  - Review IP addresses in logs; block via Cloudflare if malicious.

## Maintenance Tasks
- Rotate `DEEPSEEK_API_KEY` and `WHISPER_API_KEY` quarterly.
- Run dependency upgrades monthly (`poetry update`, `pnpm update`).
- Review GitGuardian and Snyk reports weekly.
- Recalculate analytics snapshots nightly (Celery beat job).
- Back up MongoDB via Atlas snapshots (daily) and export to S3 monthly.

## Deployment Checklist
1. Ensure PR checks (CI workflow) have passed.
2. Merge to `main`.
3. Confirm Render deploy succeeded; verify `/api/health`.
4. Verify Vercel frontend deployment (preview + production).
5. Smoke test main user flows.
6. Update release notes (GitHub Releases / Release Drafter).

## Contacts
- **Engineering Lead:** TBD
- **DevOps Liaison:** TBD
- **Product Owner:** TBD
- **Security Contact:** TBD

Update this document as processes evolve.
