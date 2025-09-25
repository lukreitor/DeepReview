# API Reference (Draft)

This document outlines the REST endpoints provided by the DeepReview backend. The FastAPI auto-generated docs (Swagger + ReDoc) will always be the source of truth, but this file captures request/response contracts and notes for collaboration.

## Base URL
- Local development: `http://localhost:8000/api`
- Production: `https://<render-app>.onrender.com/api`

## Authentication
- Phase 1 (MVP): No authentication (rate-limited by IP).
- Phase 2: Planned JWT-based user accounts with optional OAuth login.

---

## POST `/reviews`
Submit a new code (or audio) snippet for AI review.

### Request Body
```json
{
  "language": "python",
  "source": "code",
  "content": "def add(a, b):\n    return a+b",
  "metadata": {
    "projectId": "abc123",
    "branch": "feature/login"
  }
}
```
- `source`: `code` | `audio` (audio triggers Whisper transcription).
- `content`: For audio submissions, this will be a base64-encoded payload or pre-uploaded file reference (TBD).

### Response
```json
{
  "id": "65f538beecf3c67f88ad4d4a",
  "status": "pending",
  "createdAt": "2025-09-24T10:20:48.123Z"
}
```

### Errors
- `422` Validation error
- `429` Rate limit exceeded
- `500` Provider failure (with correlation ID)

---

## GET `/reviews/{id}`
Retrieve status and feedback for a submission.

### Response
```json
{
  "id": "65f538beecf3c67f88ad4d4a",
  "status": "completed",
  "submission": {
    "language": "python",
    "createdAt": "2025-09-24T10:20:48.123Z"
  },
  "review": {
    "score": 7.8,
    "summary": "Function works but lacks error handling.",
    "issues": [
      {
        "severity": "medium",
        "category": "robustness",
        "description": "Division by zero when list is empty.",
        "recommendation": "Guard against empty input."}
    ],
    "securityConcerns": [],
    "performanceRecommendations": [],
    "provider": "deepseek"
  }
}
```

---

## GET `/reviews`
List reviews with pagination and filtering.

### Query Parameters
- `page`, `pageSize`
- `language`
- `status`
- `from`, `to` (ISO timestamps)
- `minScore`

### Response
```json
{
  "items": [ { "id": "...", "status": "completed", ... } ],
  "page": 1,
  "pageSize": 20,
  "total": 148
}
```

---

## GET `/stats`
Aggregate statistics powering the analytics dashboard.

### Response
```json
{
  "avgScore": 7.1,
  "throughput": {
    "daily": [ { "date": "2025-09-22", "count": 42 } ]
  },
  "topLanguages": ["python", "javascript"],
  "commonIssues": [
    {
      "category": "security",
      "count": 12,
      "examples": ["Input validation missing", "Hard-coded secrets"]
    }
  ],
  "lastUpdated": "2025-09-24T09:15:00.000Z"
}
```

---

## GET `/health`
Provides health information for uptime monitors.

### Response
```json
{
  "status": "ok",
  "components": {
    "mongo": "ok",
    "redis": "ok",
    "deepseek": "ok",
    "whisper": "ok"
  },
  "timestamp": "2025-09-24T10:21:01.451Z"
}
```

---

## Future Endpoints (Planned)
- `POST /webhooks/github`
- `GET /reviews/{id}/events`
- `POST /auth/token`
- `GET /teams/{id}/stats`

Keep this file synchronized with the Pydantic models and the generated OpenAPI schema.
