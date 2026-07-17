# TruthLens AI

> AI-powered fake news detection with explainable credibility analysis.

TruthLens AI is a full-stack web application that analyzes any news article (text, URL, or file upload) and returns a fake/real prediction, a 0–100 credibility score, an explainable AI heatmap, source reputation, and downloadable PDF/JSON reports. Powered by GPT-5.2 via the Emergent Universal LLM key.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Quick Start](#quick-start)
4. [Environment Variables](#environment-variables)
5. [Project Structure](#project-structure)
6. [Documentation](#documentation)
7. [Test Credentials](#test-credentials)

---

## Features

| Feature | Description |
|---|---|
| 🎯 **Fake News Detection** | GPT-5.2 classifies articles as `real` or `fake` with 50–99% confidence |
| 📊 **Credibility Score** | 0–100 score weighting writing style, sources, evidence, bias, emotional language, historical reliability |
| 🧠 **Explainable AI** | Inline color-coded highlights: clickbait, emotional language, bias, unsupported claims, sensational terms, contradictions |
| ⚡ **Trend Analytics** | Live dashboard with fake/real pie, timeline, credibility distribution, confidence histogram, topic breakdown |
| 📄 **Report Generation** | PDF (reportlab) and JSON export of every analysis |
| 🌐 **Source Reliability** | Instant trust/bias/score ratings for 15+ seeded major news domains |
| 💬 **AI Chat Assistant** | Floating GPT-5.2 chat with per-article context; ask "why suspicious?", "how to verify?" |
| 🔐 **Auth** | JWT email/password + Emergent Google OAuth; role-based (admin/analyst/user); forgot-password flow |
| 👨‍💼 **Admin Panel** | Platform stats, user management, article moderation |
| 📁 **Multi-input** | Text paste, URL fetch, drag-drop upload (PDF/DOCX/TXT) |

## Tech Stack

**Frontend**: React 19 (CRA), React Router 7, Tailwind CSS, shadcn/ui, Framer Motion, Recharts, Axios, Lucide icons, Sonner toasts.

**Backend**: FastAPI, Motor (async MongoDB), PyJWT + bcrypt, `emergentintegrations` (LlmChat → GPT-5.2), reportlab (PDF), pypdf + python-docx (file extraction), httpx.

**Database**: MongoDB (collections: `users`, `articles`, `password_resets`, `chat_messages`, `feedback`).

**AI**: OpenAI GPT-5.2 via Emergent Universal LLM key.

## Quick Start

```bash
# 1. Backend .env is pre-configured in /app/backend/.env with:
#    MONGO_URL, DB_NAME, CORS_ORIGINS, EMERGENT_LLM_KEY, JWT_SECRET

# 2. Services run under supervisor:
sudo supervisorctl restart backend
sudo supervisorctl restart frontend

# 3. Access the app:
#    Frontend: https://<your-preview-domain>
#    Backend:  https://<your-preview-domain>/api
```

**First-time flow:**
1. Visit `/register` → create account (first user auto-becomes admin)
2. Land on `/dashboard`
3. Click **Analyze** → paste article or drop file → get instant analysis
4. Explore **History**, **Trending**, **Sources**, **Reports**

## Environment Variables

Backend (`/app/backend/.env`):

| Var | Purpose | Required |
|---|---|---|
| `MONGO_URL` | MongoDB connection string | ✅ |
| `DB_NAME` | Database name | ✅ |
| `CORS_ORIGINS` | Comma-separated allowed origins (default `*`) | ✅ |
| `EMERGENT_LLM_KEY` | Universal LLM key for GPT-5.2 | ✅ |
| `JWT_SECRET` | Secret for signing JWT tokens | ✅ |

Frontend (`/app/frontend/.env`):

| Var | Purpose |
|---|---|
| `REACT_APP_BACKEND_URL` | External backend URL (proxied via `/api`) |

## Project Structure

```
/app
├── backend/
│   ├── server.py            # All FastAPI routes + AI + auth logic
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.js           # Route setup + AuthProvider
│   │   ├── index.css        # Global styles + design tokens
│   │   ├── lib/
│   │   │   ├── api.js       # Axios client w/ JWT interceptor
│   │   │   ├── auth.jsx     # AuthProvider + useAuth hook
│   │   │   └── utils.js
│   │   ├── components/
│   │   │   ├── DashboardLayout.jsx   # Sidebar + main outlet
│   │   │   ├── CredibilityGauge.jsx  # Animated SVG gauge
│   │   │   ├── AIAssistant.jsx       # Floating chat panel
│   │   │   └── ui/                   # shadcn/ui primitives
│   │   └── pages/
│   │       ├── Landing.jsx
│   │       ├── Login.jsx / Register.jsx / ForgotPassword.jsx
│   │       ├── Dashboard.jsx
│   │       ├── Analyze.jsx
│   │       ├── History.jsx
│   │       ├── Reports.jsx
│   │       ├── Trending.jsx
│   │       ├── Sources.jsx
│   │       ├── Settings.jsx
│   │       └── Admin.jsx
│   └── package.json
├── memory/
│   ├── PRD.md
│   └── test_credentials.md
└── docs/
    ├── ARCHITECTURE.md
    ├── API.md
    ├── WORKFLOW.md
    ├── DATABASE.md
    ├── DEPLOYMENT.md
    └── TROUBLESHOOTING.md
```

## Documentation

| Doc | Purpose |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System architecture, data flow, module responsibilities |
| [`docs/WORKFLOW.md`](docs/WORKFLOW.md) | End-to-end user + AI analysis workflow |
| [`docs/API.md`](docs/API.md) | Complete REST API reference (all `/api/*` endpoints) |
| [`docs/DATABASE.md`](docs/DATABASE.md) | MongoDB collections and document schemas |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Deploy to Emergent, Render, Railway, AWS |
| [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md) | Common issues + fixes |

## Test Credentials

See `/app/memory/test_credentials.md`.

- **Admin**: `test@truthlens.ai` / `test123`
- **User**: `newtest@truthlens.ai` / `test123`

## License

Proprietary — for demonstration purposes only.
