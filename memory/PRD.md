# TruthLens AI - Product Requirements Document

## Original Problem Statement
Build a production-ready, full-stack AI-powered web application "TruthLens AI" that detects fake news using NLP, ML, and Explainable AI. Include: landing page, auth, dashboard w/ analytics, analyze page (text/URL/file), prediction + explainability + credibility score, history, PDF/JSON reports, trending topics, source ratings, AI chat assistant, settings, admin panel.

## User Choices (Feb 2026)
- Stack: FastAPI + React (CRA) + MongoDB (platform default)
- Detection: LLM-based (GPT-5.2 via Emergent Universal Key)
- Auth: Both JWT email/password AND Emergent Google OAuth
- Scope: All primary features (deferred: browser extension, Celery, Docker CI, live fact-check APIs)

## Architecture
- **Backend**: FastAPI at `/api/*`, MongoDB via motor, JWT (pyjwt+bcrypt), emergentintegrations LlmChat (openai/gpt-5.2), reportlab (PDF), pypdf + python-docx (file extraction)
- **Frontend**: React 19 + React Router 7, Tailwind + shadcn/ui, framer-motion, Recharts, sonner (toasts), axios (with JWT interceptor)
- **DB collections**: users, articles, password_resets, chat_messages, feedback

## Personas
1. **Journalist / Fact-checker** — needs fast credibility scores & source ratings.
2. **Casual reader** — pastes suspicious articles to verify before sharing.
3. **Admin** — manages users, monitors platform stats.

## Implemented (Feb 6, 2026 – First Finish)
- Landing page: hero, 8 feature cards, workflow steps, tech section, footer, glassmorphism nav
- Auth: register (first user → admin), login, forgot/reset password (dev-mode token), Google OAuth via Emergent
- Dashboard: 4 stat cards + 5 charts (pie fake/real, line timeline, bar credibility, bar confidence, top topics)
- Analyze: 3 tabs (text/URL/file), drag-drop upload (PDF/DOCX/TXT), sample buttons, paste clipboard
- Prediction result: 🟢/🔴 badge, confidence %, credibility gauge (animated SVG), risk badge, factors bars
- Explainable AI: inline color-coded highlights (clickbait/emotional/bias/unsupported/sensational/contradiction) with tooltips
- AI summary + reasoning + suspicious statements + fact-check recommendations
- History: search, prediction filter, favorites, view, delete
- Reports: PDF export (reportlab) + JSON export
- Trending: stacked bar (real/fake by topic), fake-rate line chart, topic cloud
- Source Reliability: 15 seeded domains, URL rating lookup with trust/bias/score
- AI Chat Assistant: floating panel with persistent sessions, article context awareness
- Settings: name, default model, theme (light/dark/system)
- Admin panel: user list, stats, delete users
- All endpoints protected with JWT; role-based admin gating (403 for non-admin)
- Backend test coverage: 100% (28/28 endpoints passing) via testing_agent_v3

## Backlog (Not implemented in first pass)
### P1
- Dark mode toggle wiring (theme variable exists in DB, needs frontend theme provider)
- Browser extension (Chrome MV3 skeleton)
- Docker + docker-compose + Nginx configs
- GitHub Actions CI

### P2
- Live fact-check API integration (e.g., Google Fact Check Tools)
- Word cloud with proper visualization library
- Batch CSV import for bulk analysis
- Email delivery for password-reset tokens
- Real-time streaming of LLM responses (SSE)
- Sentence Transformers / DistilBERT integration for offline classification

## Deferred Features (User's original list beyond MVP)
- Multiple sklearn/BERT models with switching (LLM-only MVP suffices)
- SHAP/LIME plots (replaced by inline highlight explanations)
- Keyboard shortcuts
- Help center / 404 pages beyond default routing
