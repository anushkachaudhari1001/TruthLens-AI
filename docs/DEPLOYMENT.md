# TruthLens AI – Deployment Guide

TruthLens AI is currently deployed to the **Emergent** platform (preview + production). This document covers Emergent deployment plus reference recipes for Render, Railway, and AWS.

---

## 1. Emergent (recommended)

The app is already configured for Emergent. Two environments exist:

| Env | URL |
|---|---|
| Preview (dev) | `https://<preview-subdomain>.preview.emergentagent.com` |
| Production | `https://<subdomain>.emergent.host` |

### Deploying updates to production

1. Make changes in preview (auto hot-reloads via supervisor).
2. Test in preview.
3. From the Emergent platform UI, click **Deploy** to promote preview → production.
4. Verify at the production URL.

### Env vars (already set)

Backend (`/app/backend/.env`):
```
MONGO_URL=mongodb://…
DB_NAME=…
CORS_ORIGINS=*
EMERGENT_LLM_KEY=sk-emergent-…
JWT_SECRET=<random string>
```

Frontend (`/app/frontend/.env`):
```
REACT_APP_BACKEND_URL=https://<subdomain>.preview.emergentagent.com
```

### Service management

```bash
sudo supervisorctl status                 # check running services
sudo supervisorctl restart backend        # after .env change
sudo supervisorctl restart frontend       # after package.json / .env change
tail -n 100 /var/log/supervisor/backend.err.log
tail -n 100 /var/log/supervisor/frontend.err.log
```

---

## 2. Docker (self-hosted reference)

*(Docker files are not yet in the repo — this is a reference to add later.)*

### `backend/Dockerfile`

```dockerfile
FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/ -r requirements.txt
COPY . .
EXPOSE 8001
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

### `frontend/Dockerfile`

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### `docker-compose.yml`

```yaml
version: "3.9"
services:
  mongo:
    image: mongo:7
    volumes: [ "mongo_data:/data/db" ]
    ports: [ "27017:27017" ]

  backend:
    build: ./backend
    env_file: ./backend/.env
    environment:
      MONGO_URL: mongodb://mongo:27017
      DB_NAME: truthlens
    depends_on: [ mongo ]
    ports: [ "8001:8001" ]

  frontend:
    build: ./frontend
    ports: [ "80:80" ]
    depends_on: [ backend ]

volumes:
  mongo_data:
```

### `frontend/nginx.conf`

```nginx
server {
  listen 80;
  location / {
    root   /usr/share/nginx/html;
    try_files $uri /index.html;
  }
  location /api/ {
    proxy_pass http://backend:8001/api/;
    proxy_set_header Host $host;
    proxy_http_version 1.1;
  }
}
```

Run locally:

```bash
docker-compose up --build
# → http://localhost/  (React)  → http://localhost/api  (FastAPI)
```

---

## 3. Render

Two services + one database:

| Service | Type | Config |
|---|---|---|
| Backend | Web Service (Docker or Python) | `pip install -r requirements.txt` → `uvicorn server:app --host 0.0.0.0 --port $PORT` |
| Frontend | Static Site | Build: `yarn install && yarn build`; Publish dir: `build` |
| MongoDB | Add-on or MongoDB Atlas | Copy connection string to `MONGO_URL` |

Backend env vars: same list as above.

Frontend env var: `REACT_APP_BACKEND_URL=https://<backend>.onrender.com`.

CORS: set backend `CORS_ORIGINS=https://<frontend>.onrender.com` (or `*`).

---

## 4. Railway

1. Create a new project → **Deploy from GitHub**.
2. Add three services:
   - **MongoDB** plugin
   - **Backend** — root `backend/`, start: `uvicorn server:app --host 0.0.0.0 --port $PORT`
   - **Frontend** — root `frontend/`, start: `serve -s build -l $PORT` (or use Vercel/Netlify for static hosting)
3. Reference the Mongo plugin: `MONGO_URL=${{MongoDB.MONGO_URL}}` in backend service vars.
4. Deploy.

---

## 5. AWS

**Backend** on ECS Fargate or EC2:
- Push backend Docker image to ECR.
- Deploy behind ALB (HTTPS).
- Store secrets in AWS Secrets Manager.

**Frontend** on S3 + CloudFront:
- `yarn build` → sync `build/` to S3 bucket.
- CloudFront distribution serves the SPA.

**MongoDB**: Use **MongoDB Atlas** (recommended) or self-host on EC2.

**Environment variables**: use ECS task-definition or AWS Systems Manager Parameter Store.

---

## 6. Production Checklist

- [ ] `JWT_SECRET` set to a long random string (not the dev default).
- [ ] `CORS_ORIGINS` restricted to your frontend domain(s).
- [ ] Backend runs behind HTTPS (Nginx / CloudFront / Emergent-managed).
- [ ] MongoDB has authentication enabled (Atlas or `mongod --auth`).
- [ ] Backups configured for MongoDB.
- [ ] Rate limiting configured at the reverse-proxy layer (nginx `limit_req` or Cloudflare).
- [ ] Add recommended MongoDB indexes (see [DATABASE.md](DATABASE.md#recommended-indexes-production)).
- [ ] Add TTL index on `password_resets.created_at` (1h expiry).
- [ ] Configure email delivery (SendGrid/Resend) for real password-reset emails — currently returned in the API response for dev only.
- [ ] Log aggregation (CloudWatch / Datadog / etc.).
- [ ] Alerting on 5xx spike and LLM error rate.
- [ ] Set `EMERGENT_LLM_KEY` (or replace with direct OpenAI key) and monitor cost.

---

## 7. Rollback

- **Emergent**: use the platform's rollback UI to revert to a previous deployment.
- **Docker/K8s**: keep versioned image tags; `kubectl rollout undo deployment/<name>`.
- **Render**: use the "Manual Deploy" → previous commit button.

---

## 8. Health Checks

Backend exposes a simple health endpoint:

```
GET /api/  →  200 { "message": "TruthLens AI API", "version": "1.0" }
```

Use this for load balancer / uptime monitoring.
