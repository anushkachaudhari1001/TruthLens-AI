# TruthLens AI – Troubleshooting

Common issues and their fixes.

---

## Login / Auth

### `401 Invalid credentials`
- Verify credentials in `/app/memory/test_credentials.md`.
- Register a fresh user via `POST /api/auth/register` if the DB was wiped.

### `Google auth failed`
- The Emergent OAuth session token is single-use and expires quickly.
- If the URL hash contains `#session_id=…` but login fails, the token has already been consumed. Restart the flow from the login page.

### `Missing token` / `Invalid token`
- Frontend axios interceptor drops the token on 401 and redirects to `/login`. Simply sign in again.
- Check `localStorage.tl_token` exists in browser DevTools.

### First user isn't admin
- The `admin` role is only granted to the **very first** row inserted into the `users` collection. If seeding was done manually, run:
```javascript
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } });
```

---

## Analyze / AI

### `502 AI parsing failed: …`
- The LLM returned non-JSON output. This is usually transient — retry.
- Check backend logs: `tail -n 100 /var/log/supervisor/backend.err.log`
- If persistent, verify `EMERGENT_LLM_KEY` is set correctly in `/app/backend/.env`.

### `Article text too short. Provide at least 30 characters.`
- Paste more content, or use one of the **Sample fake / Sample real** buttons to test.

### `URL fetch failed: …`
- Target site may block bots. Try copy-pasting the text into the Text tab.
- Check the URL is publicly accessible (no login wall).

### `Unsupported file type. Use PDF, DOCX, or TXT.`
- Only these three MIME types are supported. Convert others first.

### Analysis takes > 15 seconds
- Large articles (up to 10 000 chars) can take 5–10 s with GPT-5.2. Longer waits usually mean network issues to the LLM provider.
- Reduce article length or try again.

---

## Emergent LLM Key

### `EMERGENT_LLM_KEY` errors / low balance
- Universal-key balance is running low. Top-up:
  **Profile → Universal Key → Add Balance** (or enable Auto Top-up).
- Alternatively replace with your own OpenAI key in the code (see `run_analysis`).

---

## Database

### Getting `ObjectId is not iterable` errors from API
- **Should not happen** in current code — `_id` is stripped everywhere. If it does, verify no route directly returns a document without `.pop("_id", None)` or `{"_id": 0}` projection.

### History empty after logout/login
- History is scoped by `user_id`. If you register a new account, you start fresh.

### DB got wiped / need to seed
- Just register a new user via the UI — the first one automatically becomes admin.
- Then use the **Sample real / Sample fake** buttons in `/analyze` to generate history.

---

## Frontend

### Blank white page / red error overlay
1. Check browser DevTools Console for the exception.
2. Check `tail -n 50 /var/log/supervisor/frontend.err.log`.
3. If build failed, look for missing imports or unresolved variables (like the past `theme is not defined` bug from partial revert).

### "Cannot read properties of null" reading user
- User is not logged in but a protected component rendered. Check that the component sits inside `<Private>` in `App.js`.

### Charts render blank
- Analytics endpoints return empty arrays for new users. Analyze a few articles first.

### AI Assistant panel doesn't respond
- Check backend logs — LLM call may have failed.
- Confirm the JWT is attached (Network tab → `/api/chat` request has `Authorization` header).

---

## Deployment

### Preview works but production doesn't
- Changes in preview are not automatically pushed to production. Click **Deploy** in the Emergent UI.
- Verify env vars are set in the production environment (they're separate from preview).

### CORS errors in production
- Set `CORS_ORIGINS` to your production frontend URL (comma-separated).
- Restart the backend after changing `.env`: `sudo supervisorctl restart backend`.

### Backend won't start after env change
```bash
tail -n 200 /var/log/supervisor/backend.err.log
```
Common causes:
- `.env` syntax error (comment on same line as value, missing quotes)
- Missing key referenced in code (e.g. `os.environ['MONGO_URL']` will `KeyError` if not set)

Fix and restart:
```bash
sudo supervisorctl restart backend
```

---

## Debug Commands

```bash
# Backend health
curl $REACT_APP_BACKEND_URL/api/

# Quick login test
curl -X POST $REACT_APP_BACKEND_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@truthlens.ai","password":"test123"}'

# View service status
sudo supervisorctl status

# View recent backend logs
tail -n 100 /var/log/supervisor/backend.err.log
tail -n 100 /var/log/supervisor/backend.out.log

# View recent frontend logs
tail -n 100 /var/log/supervisor/frontend.err.log

# Inspect MongoDB
mongosh
> use test_database
> db.users.find().pretty()
> db.articles.count()
```

---

## Reporting Bugs

When reporting an issue:

1. **Environment**: preview or production?
2. **Steps to reproduce**: exact clicks / inputs.
3. **Expected vs actual behavior**.
4. **Screenshots** (especially for UI issues).
5. **Console errors** (browser DevTools → Console tab).
6. **Backend logs** (last 50 lines of `backend.err.log`).

This dramatically speeds up the fix.
