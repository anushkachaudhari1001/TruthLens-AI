# TruthLens AI – Architecture

## 1. High-Level Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                        BROWSER (React 19 SPA)                       │
│                                                                     │
│  ┌───────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │  Landing  │  │  Auth    │  │Dashboard │  │ Analyze  │  … pages │
│  └───────────┘  └──────────┘  └──────────┘  └──────────┘          │
│         │             │              │             │              │
│         └─────────────┴──────────────┴─────────────┘              │
│                          axios (JWT header)                        │
└──────────────────────────────┬──────────────────────────────────────┘
                               │  HTTPS   /api/*
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│                    FASTAPI BACKEND  (Uvicorn)                       │
│                                                                     │
│  Routers                                                            │
│   • /api/auth/*      register / login / google / me / profile      │
│   • /api/analyze     text + URL analysis                            │
│   • /api/upload      file upload (PDF / DOCX / TXT)                 │
│   • /api/history/*   list / get / delete / favorite                 │
│   • /api/analytics   aggregated stats + charts data                 │
│   • /api/trending    topic aggregation                              │
│   • /api/source(s)   domain reliability lookup                      │
│   • /api/chat        AI assistant (session-based)                   │
│   • /api/reports/*   PDF + JSON export                              │
│   • /api/feedback    user feedback storage                          │
│   • /api/admin/*     admin-only management                          │
│                                                                     │
│  Middleware:  CORS  +  JWT-Bearer auth (HTTPBearer)                 │
└──────────┬────────────────────────────────────────┬────────────────┘
           │                                        │
           ▼                                        ▼
   ┌─────────────────┐                    ┌───────────────────────┐
   │    MongoDB      │                    │  emergentintegrations │
   │   (Motor async) │                    │      LlmChat          │
   │                 │                    │                       │
   │ • users         │                    │  → OpenAI GPT-5.2     │
   │ • articles      │                    │  (Emergent Universal  │
   │ • password_     │                    │   LLM key)            │
   │   resets        │                    │                       │
   │ • chat_messages │                    │  Used for:            │
   │ • feedback      │                    │  – analyze()          │
   └─────────────────┘                    │  – chat()             │
                                          └───────────────────────┘
```

## 2. Module Responsibilities

### Frontend (`/app/frontend/src/`)

| Module | Responsibility |
|---|---|
| `App.js` | React Router setup, protected route wrappers (`<Private>`, `<AdminOnly>`), global providers |
| `lib/api.js` | Axios instance with JWT interceptor; auto-redirects to `/login` on 401 |
| `lib/auth.jsx` | `AuthProvider` context; login/register/googleAuth/logout; persists to localStorage + reads Google session_id from URL hash |
| `components/DashboardLayout.jsx` | Sidebar nav, header, user card, `<Outlet />` for child routes; renders floating `<AIAssistant />` |
| `components/CredibilityGauge.jsx` | Animated SVG ring gauge (Framer Motion) with color transitions Danger → Warning → Success |
| `components/AIAssistant.jsx` | Floating chat panel; persists session_id in state; POSTs to `/api/chat` |
| `pages/Analyze.jsx` | Text / URL / File tabs, drag-drop, sample loader, live result rendering with inline highlights |
| Other pages | Thin wrappers around API calls; charts via Recharts, tables via native divs |

### Backend (`/app/backend/server.py`)

Single file for simplicity, logically grouped:

1. **DB / App bootstrapping** — motor client, FastAPI app, `/api` router, CORS
2. **Pydantic models** — request/response schemas
3. **Auth helpers** — `hash_password`, `verify_password`, `create_token`, `get_current_user`, `require_admin`
4. **AI analysis** — `run_analysis()` builds structured prompt → `LlmChat.send_message()` → `extract_json()` → returns typed dict
5. **Source rating** — hard-coded `TRUSTED_SOURCES` dict + domain parser
6. **File extraction** — `extract_upload_text()` handles PDF/DOCX/TXT; `fetch_url_text()` uses httpx + regex HTML strip
7. **Route handlers** — each endpoint validates auth, does DB I/O, returns JSON

## 3. Auth Flow

```
[user] → POST /api/auth/register  (email, password, name)
         ↓
  backend: bcrypt-hash password → insert user (role=admin if first user, else user)
         ↓
         issue JWT (sub=user_id, role, exp=7d, HS256)
         ↓
  return { token, user }
         ↓
  frontend: localStorage.setItem("tl_token", token)
            axios attaches "Authorization: Bearer <token>" on every request

Subsequent request:
  → API called with Bearer header
  → get_current_user() decodes JWT, looks up user in DB, injects into route
  → Admin routes additionally require role == "admin" (403 otherwise)
```

**Google OAuth (Emergent-managed):**

```
[frontend] → window.location = https://auth.emergentagent.com/?redirect=<preview_url>/dashboard
[Emergent] → user completes Google login → redirects to <preview_url>/dashboard#session_id=xxx
[frontend AuthProvider useEffect] → detects #session_id= → POST /api/auth/google { session_id }
[backend] → GET https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data (X-Session-ID)
           → get { email, name, picture } → upsert user → issue JWT
[frontend] → save token → navigate to /dashboard
```

## 4. Analyze Data Flow

See [`WORKFLOW.md`](WORKFLOW.md#analyze-workflow) for the full step-by-step pipeline.

Short version:
```
input (text / URL / file)
    ↓ optional URL fetch (httpx) or file extraction (pypdf / python-docx)
    ↓ send to LlmChat (gpt-5.2) with strict JSON schema prompt
    ↓ extract_json() → validate keys → attach { time_taken_sec, model_used }
    ↓ compute source rating (if URL) → insert into `articles` collection
    ↓ return full JSON to frontend
```

## 5. Design System

- **Tailwind** base with CSS variables in `src/index.css`
- Primary blue `#2563EB`, Accent teal `#14B8A6`, semantics green/amber/red
- Typography: `Outfit` (display) + `Inter` (body)
- Glassmorphism: `bg-white/70 backdrop-blur-2xl` in nav/floating panels
- Radii: `rounded-3xl` for cards, `rounded-full` for CTAs
- Framer Motion for page transitions and gauge/factor bar animations
- All interactive elements carry `data-testid` for e2e testing

## 6. Security Model

| Layer | Protection |
|---|---|
| Passwords | `bcrypt.gensalt()` hashing; never returned in API responses |
| Tokens | JWT HS256, 7-day expiry; stored in localStorage (XSS-tolerant, no CSRF-vulnerable cookies) |
| Auth guard | HTTPBearer dependency on every non-public endpoint |
| Admin guard | `require_admin` dependency returns 403 for non-admin |
| Input validation | Pydantic models; text length checks; MIME check on uploads (PDF/DOCX/TXT only) |
| MongoDB | `id` field is UUIDv4; `_id` (ObjectId) is stripped from every response |
| CORS | Configurable via `CORS_ORIGINS` env |
| Rate limit | (Deferred to reverse proxy — Nginx/Cloudflare in production) |
