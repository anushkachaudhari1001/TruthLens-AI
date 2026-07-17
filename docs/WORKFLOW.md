# TruthLens AI – Workflow

This document walks through every major user flow in TruthLens AI, from arrival on the landing page to receiving an explainable AI report.

---

## 1. Onboarding Flow

```
                                 ┌───────────────┐
                                 │   Landing /   │
                                 └───────┬───────┘
                              Sign up ▲  │  ▲ Sign in
                                      │  ▼  │
                    ┌─────────────────┴─────┴──────────────────┐
                    │                                          │
              ┌─────▼──────┐                            ┌──────▼──────┐
              │ /register  │                            │   /login    │
              └─────┬──────┘                            └──────┬──────┘
                    │                                          │
        ┌───────────┴────────────┐                ┌────────────┴────────────┐
        ▼                        ▼                ▼                         ▼
  [email/password]      [Continue with Google] [email/password]       [Continue with Google]
        │                        │                │                         │
        ▼                        ▼                ▼                         ▼
POST /api/auth/register  Google OAuth redirect  POST /api/auth/login   Google OAuth redirect
        │                        │                │                         │
        │      /dashboard#session_id=<id>         │      /dashboard#session_id=<id>
        │                        │                │                         │
        └────────────────┬───────┴────────────────┴──────────────┬──────────┘
                         │                                       │
                         ▼                                       ▼
                  POST /api/auth/google (session_id)   → JWT token issued
                                        │
                                        ▼
                                  /dashboard (Home)
```

### Roles (assigned at registration)

- **First registered user** → auto-promoted to `admin`
- **All subsequent users** → `user` (or `analyst` if promoted by admin)
- Admin sees additional **Admin** nav item and can manage users

### Forgot / Reset Password

```
/login  → click "Forgot?"
      → /forgot  → enter email  →  POST /api/auth/forgot-password
                                     ↓
                          returns reset_token (dev-mode: echoed in response;
                          in prod: would be emailed via SendGrid/Resend)
      → paste token + new password  →  POST /api/auth/reset-password
                                     ↓
                          bcrypt-rehashed → return to /login
```

---

## 2. Analyze Workflow — The Core Pipeline

This is the heart of TruthLens AI. Here's exactly what happens when a user hits **Analyze**:

```
┌──────────────────────────────────────────────────────────────────────┐
│  User Input  (choose ONE tab)                                        │
│                                                                      │
│   [Text]   ─→  headline + article text  (paste / clipboard / sample) │
│   [URL]    ─→  URL string  (backend fetches HTML → strips tags)      │
│   [File]   ─→  PDF / DOCX / TXT  (drag-drop or click)                │
└─────────────────────────────┬────────────────────────────────────────┘
                              │
                              ▼
                POST /api/analyze  OR  POST /api/upload  (JWT-authed)
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Backend Preprocessing                                               │
│                                                                      │
│   1. If URL       → httpx GET → strip <script>/<style>/tags → text   │
│   2. If PDF       → pypdf.PdfReader → per-page extract               │
│   3. If DOCX      → python-docx paragraphs                           │
│   4. If TXT       → decode UTF-8                                     │
│   5. Length check → reject < 30 chars (400 error)                    │
│   6. Truncate to 10 000 chars (LLM context safety)                   │
└─────────────────────────────┬────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│  AI Classification  (emergentintegrations.LlmChat → GPT-5.2)         │
│                                                                      │
│   SYSTEM_PROMPT + HEADLINE + URL + ARTICLE                           │
│         ↓                                                            │
│   GPT-5.2 returns a strict JSON payload:                             │
│   {                                                                   │
│     prediction: "real" | "fake",                                      │
│     confidence: 50–99,                                                │
│     credibility_score: 0–100,                                         │
│     risk_level: "low" | "medium" | "high",                            │
│     summary: "…",                                                     │
│     reasoning: "…",                                                   │
│     factors: {  writing_style, headline_quality, source_reputation,   │
│                 language_complexity, evidence_presence, bias,         │
│                 emotional_language, historical_reliability  },        │
│     highlights: [ { phrase, category, reason }, … 3–8 items ],        │
│     topics: [ "politics" | "health" | "finance" | … ],                │
│     recommendations: [ 3 fact-check steps ],                          │
│     suspicious_statements: [ … ]                                      │
│   }                                                                   │
│                                                                      │
│   extract_json()  →  best-effort strip of code fences & noise        │
│   time_taken_sec + model_used appended                               │
└─────────────────────────────┬────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Post-processing                                                     │
│                                                                      │
│   • If URL was provided:                                             │
│         rate_source(url) → lookup in TRUSTED_SOURCES dict            │
│         → { domain, trust, bias, score, historical_fake_rate }       │
│                                                                      │
│   • Persist article document to Mongo:                               │
│         { id: uuid, user_id, headline, text, url, source,            │
│           favorite=false, created_at: iso, …AI fields }              │
└─────────────────────────────┬────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Frontend Rendering (Analyze.jsx)                                    │
│                                                                      │
│   Three top cards:                                                   │
│    • Prediction badge  🔴 Fake / 🟢 Real  + confidence%              │
│    • Credibility Gauge  (animated SVG ring, color per score)          │
│    • Meta card (model, time, topics, source, Export PDF button)      │
│                                                                      │
│   Below:                                                              │
│    • Summary paragraph                                                │
│    • Reasoning paragraph                                              │
│    • Explainable-AI section:                                          │
│         renders article text with inline <span class="hl-…">         │
│         color-coded by category (clickbait / emotional / bias /       │
│         unsupported / sensational / contradiction) + tooltip = why    │
│    • Suspicious statements list                                       │
│    • Recommendations list (fact-check steps)                          │
│    • Credibility Factors  — animated horizontal bars 0–100            │
└──────────────────────────────────────────────────────────────────────┘
```

### Explainable-AI Highlight Categories

| Category | Color band | Meaning |
|---|---|---|
| `clickbait` | 🟥 red | Sensational or misleading phrasing |
| `emotional` | 🟧 amber | Emotionally loaded language |
| `bias` | 🟪 purple | One-sided or biased framing |
| `unsupported` | 🟦 blue | Claim lacks cited evidence |
| `sensational` | 🟪 pink | Hyperbolic or shocking language |
| `contradiction` | 🟥 dark-red | Internal inconsistency with cited facts |

Every span carries a `title` tooltip explaining **why** the AI flagged it — this is the "explanation" layer.

### Credibility Score Formula (implicit)

The LLM produces the 0–100 score based on this weighted set of factors (each also returned individually 0–100):

| Factor | What it measures |
|---|---|
| Writing style | Grammar, tone, professionalism |
| Headline quality | Descriptive vs clickbait |
| Source reputation | Domain trust (if URL) |
| Language complexity | Sophistication / hyperbole |
| Evidence presence | Cited sources, quotes, data |
| Bias | Political or ideological leaning |
| Emotional language | Neutral vs inflammatory |
| Historical reliability | Past reliability of similar claims |

### Risk Level Mapping

- `low` — credibility ≥ 70 and prediction = real
- `medium` — mixed signals
- `high` — credibility < 40 or prediction = fake

---

## 3. History & Reports Workflow

```
/history
   ├── search input           → GET /api/history?q=…
   ├── prediction filter      → GET /api/history?prediction=fake
   ├── favorites toggle       → GET /api/history?favorite=true
   ├── per-row actions:
   │     ⭐ favorite           → POST /api/history/{id}/favorite
   │     👁 view (opens /analyze/{id} with pre-loaded data)
   │     🗑 delete             → DELETE /api/history/{id}
   └── click headline         → /analyze/{id}

/reports
   └── grid of past analyses; each card has:
         [PDF]  → GET /api/reports/{id}/pdf   (reportlab-generated)
         [JSON] → GET /api/reports/{id}/json
         [View] → /analyze/{id}
```

---

## 4. Trending & Sources

```
/trending
   → GET /api/trending  (last 500 articles across ALL users)
   → Stacked bar (real vs fake by topic)
   → Line chart (fake_rate % by topic)
   → Word cloud (topic size proportional to volume)

/sources
   → GET /api/sources  (returns 15 seeded domains, sorted by score DESC)
   → Table: domain / trust badge / bias / score
   → Domain checker input:
        GET /api/source-rating?url=<url>
        → known domain returns full rating
        → unknown domain returns { trust: "Unknown", score: 50 }
```

---

## 5. AI Chat Assistant

Floating button (bottom-right, all authenticated pages). Opens a glass panel:

```
User: "Why did you flag this article as fake?"
        │
        ▼
POST /api/chat { message, article_id?, session_id? }
        │
        ▼
Backend:
   • Build system prompt = CHAT_SYSTEM + (article context if article_id)
   • LlmChat.send_message() → GPT-5.2 response
   • Store { user_message, ai_response, article_id, session_id } in chat_messages
        │
        ▼
{ response, session_id }  → panel renders bubble
```

The `session_id` is remembered for follow-up messages so the LLM has conversational context (via LlmChat's built-in history).

---

## 6. Admin Workflow

Available only to users with `role: "admin"` (first registered user auto-promoted).

```
/admin
   ├── GET /api/admin/stats
   │     → { users, articles, fake_detected, feedback_count }
   ├── GET /api/admin/users  → full list (email, name, role, provider)
   └── DELETE /api/admin/users/{id}  → deletes user + all their articles
                                       (cannot delete self)
```

---

## 7. End-to-End Example: Analyzing a Sample "Fake" Article

1. User logs in with `test@truthlens.ai` / `test123`.
2. Navigates to `/analyze`, clicks **Sample fake**.
3. Article auto-populates:
   > "SHOCKING: Scientists Discover Miracle Cure Big Pharma Doesn't Want You to Know!"
4. Clicks **Analyze**.
5. `POST /api/analyze` returns in ~2–4 s:
   ```json
   {
     "prediction": "fake",
     "confidence": 94,
     "credibility_score": 18,
     "risk_level": "high",
     "summary": "The article uses sensational language …",
     "highlights": [
       { "phrase": "SHOCKING", "category": "clickbait", "reason": "All-caps sensationalism" },
       { "phrase": "miracle cure", "category": "sensational", "reason": "Unverified claim" },
       ...
     ],
     "topics": ["health"],
     ...
   }
   ```
6. UI renders 🔴 Likely Fake, gauge sweeps to `18` in red, article text renders with highlighted spans, credibility factor bars animate in.
7. User clicks **Export PDF** → downloads `truthlens-<id>.pdf`.
8. Analysis is now in `/history` and contributes to `/trending`.

That's the full loop. 🎯
