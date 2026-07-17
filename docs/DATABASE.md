# TruthLens AI – Database Schema

Database engine: **MongoDB** (accessed via `motor` async driver).

Database name: from env `DB_NAME`.

## Conventions

- Every document has a **string** `id` field (`uuid.uuid4()`) — used as the public primary key.
- MongoDB's `_id` (BSON ObjectId) is present but **never returned** by any API endpoint (stripped via `{"_id": 0}` projection or `pop("_id", None)`).
- Timestamps are stored as ISO-8601 strings (e.g. `"2026-02-06T12:34:56.789+00:00"`) so they are JSON-serializable.
- No indexes are declared explicitly; consider adding these for production scale:
  - `users.email` unique
  - `articles.user_id + created_at` compound
  - `articles.topics` multikey
  - `chat_messages.session_id`

---

## Collections

### 1. `users`

Registered users. First user auto-promoted to `admin`.

| Field | Type | Notes |
|---|---|---|
| `id` | string (uuid) | Public primary key |
| `email` | string (lowercase) | Unique |
| `name` | string | Display name |
| `password` | string (bcrypt hash) | **Never returned by API**. Absent for Google-auth users. |
| `role` | string | `"admin"` \| `"analyst"` \| `"user"` |
| `auth_provider` | string | `"local"` \| `"google"` |
| `picture` | string \| null | Set from Google OAuth if applicable |
| `theme` | string | `"light"` \| `"dark"` \| `"system"` |
| `default_model` | string | e.g. `"gpt-5.2"` |
| `created_at` | ISO string | |

---

### 2. `articles`

Every analysis (from `/analyze` or `/upload`) is stored here.

| Field | Type | Notes |
|---|---|---|
| `id` | string (uuid) | |
| `user_id` | string | FK → `users.id` |
| `headline` | string | Optional user-provided title |
| `text` | string | Truncated to 10 000 chars |
| `url` | string | Empty if none provided |
| `filename` | string | Only if from `/upload` |
| `favorite` | bool | Toggled via POST `/history/{id}/favorite` |
| `created_at` | ISO string | |
| `source` | object \| null | See below — populated only when URL was provided |
| **AI fields (from LLM)** | | |
| `prediction` | string | `"real"` \| `"fake"` |
| `confidence` | int | 50–99 |
| `credibility_score` | int | 0–100 |
| `risk_level` | string | `"low"` \| `"medium"` \| `"high"` |
| `summary` | string | 2–3 sentence summary |
| `reasoning` | string | Paragraph explanation |
| `factors` | object | 8 keys, each 0–100 |
| `highlights` | array | `[ { phrase, category, reason } ]` |
| `topics` | array of string | e.g. `["politics", "finance"]` |
| `recommendations` | array of string | Fact-check steps |
| `suspicious_statements` | array of string | |
| `time_taken_sec` | float | LLM latency |
| `model_used` | string | e.g. `"gpt-5.2"` |

`source` sub-document:
```json
{
  "domain": "reuters.com",
  "score": 95,
  "trust": "Trusted",
  "bias": "Center",
  "known": true,
  "historical_fake_rate": 5
}
```

`factors` sub-document (keys always the same):
```json
{
  "writing_style": 88,
  "headline_quality": 90,
  "source_reputation": 95,
  "language_complexity": 82,
  "evidence_presence": 88,
  "bias": 25,
  "emotional_language": 15,
  "historical_reliability": 92
}
```

---

### 3. `password_resets`

Ephemeral tokens for the forgot/reset password flow.

| Field | Type | Notes |
|---|---|---|
| `token` | string (uuid) | Sent to user |
| `user_id` | string | FK → `users.id` |
| `created_at` | ISO string | |
| `used` | bool | Set true when consumed |

*(In production, add a TTL index to auto-expire tokens after 1 hour.)*

---

### 4. `chat_messages`

Persistent AI Chat Assistant history. One document per user↔AI turn.

| Field | Type | Notes |
|---|---|---|
| `id` | string (uuid) | |
| `session_id` | string | Groups a conversation (`chat-<user_id>` by default) |
| `user_id` | string | FK → `users.id` |
| `user_message` | string | |
| `ai_response` | string | |
| `article_id` | string \| null | If chat was tied to a specific article |
| `created_at` | ISO string | |

---

### 5. `feedback`

User feedback submitted via `POST /api/feedback`.

| Field | Type | Notes |
|---|---|---|
| `id` | string (uuid) | |
| `user_id` | string | FK → `users.id` |
| `article_id` | string | FK → `articles.id` |
| `rating` | int | 1–5 (or thumbs) |
| `comment` | string | Optional |
| `created_at` | ISO string | |

---

## Sample Documents

### Sample `articles` doc (fake news detected)

```json
{
  "_id": "$oid stripped from all API responses",
  "id": "1a2b3c-…",
  "user_id": "u-uuid",
  "headline": "SHOCKING: Miracle Cure Big Pharma Hides!",
  "text": "BREAKING! In a stunning revelation…",
  "url": "",
  "favorite": false,
  "created_at": "2026-02-06T12:34:56.789+00:00",
  "source": null,
  "prediction": "fake",
  "confidence": 96,
  "credibility_score": 15,
  "risk_level": "high",
  "summary": "The article uses sensational language and unverifiable claims…",
  "reasoning": "The piece exhibits multiple hallmarks of misinformation…",
  "factors": { "writing_style": 25, "headline_quality": 10, "source_reputation": 20,
               "language_complexity": 15, "evidence_presence": 5, "bias": 90,
               "emotional_language": 95, "historical_reliability": 10 },
  "highlights": [
    { "phrase": "SHOCKING", "category": "clickbait", "reason": "Sensationalized all-caps trigger word" },
    { "phrase": "miracle cure", "category": "sensational", "reason": "Vague unverifiable claim" },
    { "phrase": "Doctors HATE this", "category": "clickbait", "reason": "Common misinformation trope" }
  ],
  "topics": ["health"],
  "recommendations": [
    "Check the claim against WHO or CDC official statements",
    "Search for the source publication's reputation on MediaBiasFactCheck",
    "Look for peer-reviewed studies supporting the alleged 'cure'"
  ],
  "suspicious_statements": ["'one weird trick will change EVERYTHING'"],
  "time_taken_sec": 2.4,
  "model_used": "gpt-5.2"
}
```

---

## Recommended Indexes (Production)

```javascript
db.users.createIndex({ email: 1 }, { unique: true });
db.articles.createIndex({ user_id: 1, created_at: -1 });
db.articles.createIndex({ topics: 1 });
db.articles.createIndex({ prediction: 1 });
db.chat_messages.createIndex({ session_id: 1, created_at: 1 });
db.password_resets.createIndex({ created_at: 1 }, { expireAfterSeconds: 3600 });
```
