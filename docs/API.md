# TruthLens AI – REST API Reference

**Base URL**: `${REACT_APP_BACKEND_URL}/api`

**Auth**: All endpoints except `/auth/register`, `/auth/login`, `/auth/google`, `/auth/forgot-password`, `/auth/reset-password`, and `/` require an HTTP `Authorization: Bearer <token>` header.

**Content Type**: All request/response bodies are `application/json` unless noted (`/upload` uses `multipart/form-data`; `/reports/{id}/pdf` returns `application/pdf`).

**Error format**:
```json
{ "detail": "human-readable error message" }
```
HTTP status codes: `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `502 Bad Gateway` (AI parse failure), `500 Internal Server Error`.

---

## Auth

### `POST /api/auth/register`

Create a new account. **First registered user auto-promotes to `admin`.**

**Body**:
```json
{ "email": "user@example.com", "password": "min6chars", "name": "Jane Doe" }
```

**Response 200**:
```json
{
  "token": "eyJhbGci…",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Jane Doe",
    "role": "user",           // or "admin" for first user
    "auth_provider": "local",
    "theme": "light",
    "default_model": "gpt-5.2",
    "created_at": "2026-02-06T…"
  }
}
```

**Errors**: `400 "Email already registered"`.

---

### `POST /api/auth/login`

**Body**: `{ "email": "…", "password": "…" }`

**Response 200**: same shape as register.

**Errors**: `401 "Invalid credentials"`.

---

### `POST /api/auth/google`

Exchange an Emergent-managed Google OAuth `session_id` for a JWT.

**Body**: `{ "session_id": "<from URL hash>" }`

**Response 200**: same shape as login. Creates the user if they don't exist yet.

**Errors**: `401 "Google auth failed"`.

---

### `POST /api/auth/forgot-password`

**Body**: `{ "email": "…" }`

**Response 200 (dev mode)**:
```json
{
  "ok": true,
  "reset_token": "uuid",
  "message": "Use this token to reset your password (dev mode)."
}
```
In production this token would be emailed, not returned.

---

### `POST /api/auth/reset-password`

**Body**: `{ "token": "<from forgot>", "new_password": "min6chars" }`

**Response 200**: `{ "ok": true }`.

**Errors**: `400 "Invalid or expired token"`.

---

### `GET /api/auth/me`

**Response 200**: current user object (no password).

---

### `PUT /api/auth/profile`

Update mutable fields.

**Body** (all optional): `{ "name": "…", "default_model": "gpt-5.2", "theme": "light" }`

**Response 200**: full updated user object.

---

## Analyze

### `POST /api/analyze`

Analyze text and/or URL content.

**Body**:
```json
{
  "headline": "optional headline",
  "text": "article body (30+ chars) — OR leave blank and provide url",
  "url": "https://example.com/article",
  "model": "gpt-5.2"       // optional; defaults to gpt-5.2
}
```

If `url` is provided and `text` is empty, backend fetches and extracts article body via `httpx`.

**Response 200**: see [Analysis Object](#analysis-object) below.

**Errors**: `400 "Article text too short."`, `400 "URL fetch failed: …"`, `502 "AI parsing failed: …"`.

---

### `POST /api/upload`

Upload a file and analyze it.

**Content-Type**: `multipart/form-data`

**Form fields**:
- `file` (required) — `.pdf`, `.docx`, or `.txt`
- `headline` (optional string)

**Response 200**: [Analysis Object](#analysis-object).

**Errors**: `400 "Unsupported file type."`, `400 "Extracted text too short."`.

---

### Analysis Object

Every analysis (from `/analyze`, `/upload`, `/history/{id}`) has this shape:

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "headline": "…",
  "text": "…truncated to 10000 chars…",
  "url": "…",
  "filename": "article.pdf",       // only on /upload
  "created_at": "2026-02-06T12:34:56+00:00",
  "favorite": false,
  "source": {                        // only when URL was provided
    "domain": "reuters.com",
    "score": 95,
    "trust": "Trusted",
    "bias": "Center",
    "known": true,
    "historical_fake_rate": 5
  },
  "prediction": "real",            // "real" or "fake"
  "confidence": 92,                // 50–99
  "credibility_score": 87,         // 0–100
  "risk_level": "low",             // "low" | "medium" | "high"
  "summary": "Two-sentence summary…",
  "reasoning": "Paragraph explaining classification…",
  "factors": {
    "writing_style": 88,
    "headline_quality": 90,
    "source_reputation": 95,
    "language_complexity": 82,
    "evidence_presence": 88,
    "bias": 25,
    "emotional_language": 15,
    "historical_reliability": 92
  },
  "highlights": [
    { "phrase": "exact substring", "category": "clickbait", "reason": "…" }
  ],
  "topics": ["finance"],
  "recommendations": ["Verify with primary source X", "…"],
  "suspicious_statements": ["Statement 1", "…"],
  "time_taken_sec": 2.1,
  "model_used": "gpt-5.2"
}
```

---

## History

### `GET /api/history`

**Query params** (all optional):
- `q` — full-text search on headline / text
- `prediction` — `real` | `fake`
- `favorite` — `true`
- `topic` — filter by topic string
- `limit` — default 100

**Response 200**: `[ AnalysisObject, … ]` sorted newest first.

---

### `GET /api/history/{id}`

**Response 200**: single AnalysisObject.

**Errors**: `404 "Not found"`.

---

### `DELETE /api/history/{id}`

**Response 200**: `{ "ok": true }`.

---

### `POST /api/history/{id}/favorite`

Toggles favorite flag.

**Response 200**: `{ "favorite": true }` (new value).

---

## Analytics

### `GET /api/analytics`

**Response 200**:
```json
{
  "total": 42,
  "real": 30,
  "fake": 12,
  "avg_confidence": 84.5,
  "avg_credibility": 71.2,
  "today": 3,
  "timeline":  [ { "date": "2026-02-04", "count": 5 }, … ],
  "credibility_buckets": [
    { "range": "0-20",   "count": 4 },
    { "range": "21-40",  "count": 6 },
    { "range": "41-60",  "count": 8 },
    { "range": "61-80",  "count": 14 },
    { "range": "81-100", "count": 10 }
  ],
  "confidence_histogram": [
    { "range": "50-60", "count": 2 },
    { "range": "60-70", "count": 5 },
    { "range": "70-80", "count": 12 },
    { "range": "80-90", "count": 15 },
    { "range": "90-100","count": 8 }
  ],
  "top_topics": [ { "topic": "politics", "count": 12 }, … ],
  "fake_topics": [ { "topic": "health", "count": 4 }, … ]
}
```

---

### `GET /api/trending`

Global (all users, last 500 articles) topic aggregation.

**Response 200**:
```json
{
  "trending": [
    { "topic": "politics", "total": 20, "fake": 8, "real": 12, "fake_rate": 40.0 },
    …
  ],
  "total_articles": 500
}
```

---

## Sources

### `GET /api/sources`

**Response 200**: full seeded list of 15 domains sorted by score DESC.

```json
[
  { "domain": "reuters.com", "score": 95, "trust": "Trusted", "bias": "Center" },
  { "domain": "economist.com", "score": 92, "trust": "Trusted", "bias": "Center" },
  …
]
```

---

### `GET /api/source-rating?url=<url>`

**Response 200 (known)**:
```json
{ "domain": "reuters.com", "score": 95, "trust": "Trusted", "bias": "Center",
  "known": true, "historical_fake_rate": 5 }
```

**Response 200 (unknown)**:
```json
{ "domain": "obscure-blog.xyz", "score": 50, "trust": "Unknown",
  "bias": "Unknown", "known": false, "historical_fake_rate": null }
```

---

## Reports

### `GET /api/reports/{id}/pdf`

Returns `application/pdf` (Content-Disposition: attachment).

---

### `GET /api/reports/{id}/json`

Returns raw AnalysisObject.

---

## Chat

### `POST /api/chat`

**Body**:
```json
{
  "message": "Why is this article suspicious?",
  "article_id": "uuid (optional — loads that article as context)",
  "session_id": "chat-<userId> (optional — reuse to continue a conversation)"
}
```

**Response 200**: `{ "response": "AI reply…", "session_id": "chat-…" }`.

---

## Feedback

### `POST /api/feedback`

**Body**: `{ "article_id": "uuid", "rating": 5, "comment": "…" }`

**Response 200**: `{ "ok": true }`.

---

## Admin

**All routes require `role: "admin"` — return `403 "Admin only"` otherwise.**

### `GET /api/admin/users`
Returns list of all users (no passwords).

### `GET /api/admin/stats`
```json
{ "users": 42, "articles": 512, "fake_detected": 187, "feedback_count": 23 }
```

### `DELETE /api/admin/users/{user_id}`
Deletes user + all their articles. Cannot delete yourself (400).

---

## Rate Limits

None enforced at the API layer (deferred to reverse proxy in production).

## OpenAPI

FastAPI auto-generates OpenAPI docs at:
- **Swagger UI**: `${BACKEND_URL}/docs`
- **ReDoc**: `${BACKEND_URL}/redoc`
- **Schema JSON**: `${BACKEND_URL}/openapi.json`
