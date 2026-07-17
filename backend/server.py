"""TruthLens AI - Backend API"""
import os
import io
import json
import uuid
import logging
import re
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional, List, Dict, Any
from urllib.parse import urlparse

import bcrypt
import jwt as pyjwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, Header
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
import httpx
from pypdf import PdfReader
from docx import Document as DocxDocument
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ------------------ DB ------------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# ------------------ App ------------------
app = FastAPI(title="TruthLens AI")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

JWT_SECRET = os.environ.get('JWT_SECRET', 'change-me')
JWT_ALG = 'HS256'
JWT_TTL_HOURS = 24 * 7
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ------------------ Models ------------------
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    session_id: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=6)


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    default_model: Optional[str] = None
    theme: Optional[str] = None


class AnalyzeRequest(BaseModel):
    headline: Optional[str] = ""
    text: str = ""
    url: Optional[str] = ""
    model: Optional[str] = "gpt-5.2"


class ChatRequest(BaseModel):
    message: str
    article_id: Optional[str] = None
    session_id: Optional[str] = None


class FeedbackRequest(BaseModel):
    article_id: str
    rating: int
    comment: Optional[str] = ""


# ------------------ Helpers ------------------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_TTL_HOURS),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


async def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Dict[str, Any]:
    if not creds:
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        payload = pyjwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALG])
    except pyjwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def require_admin(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ------------------ AI Analysis ------------------
ANALYSIS_SYSTEM = """You are TruthLens AI, an expert fake news detector and media literacy analyst.

Analyze the provided news article and return ONLY a valid JSON object with this exact structure:
{
  "prediction": "real" | "fake",
  "confidence": <int 50-99>,
  "credibility_score": <int 0-100>,
  "risk_level": "low" | "medium" | "high",
  "summary": "<2-3 sentence article summary>",
  "reasoning": "<paragraph explaining the classification>",
  "factors": {
    "writing_style": <int 0-100>,
    "headline_quality": <int 0-100>,
    "source_reputation": <int 0-100>,
    "language_complexity": <int 0-100>,
    "evidence_presence": <int 0-100>,
    "bias": <int 0-100>,
    "emotional_language": <int 0-100>,
    "historical_reliability": <int 0-100>
  },
  "highlights": [
    {"phrase": "<exact substring from article>", "category": "clickbait|emotional|bias|unsupported|sensational|contradiction", "reason": "<why flagged>"}
  ],
  "topics": ["politics"|"health"|"finance"|"technology"|"sports"|"entertainment"|"religion"|"world"],
  "recommendations": ["<fact-check step 1>", "<step 2>", "<step 3>"],
  "suspicious_statements": ["<statement 1>", "<statement 2>"]
}

Rules:
- credibility_score: 0=completely fake, 100=highly credible.
- risk_level: high = misinformation risk high (fake/low credibility), low = trustworthy content.
- Include 3-8 highlights that are EXACT substrings from the article text.
- Return ONLY the JSON, no markdown, no extra text.
"""


def extract_json(text: str) -> Dict[str, Any]:
    """Best-effort JSON extraction from LLM output."""
    text = text.strip()
    # Strip markdown fences
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    # Find first { ... last }
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("No JSON found in response")
    return json.loads(text[start:end + 1])


async def run_analysis(headline: str, article_text: str, url: str, model: str) -> Dict[str, Any]:
    session_id = f"analysis-{uuid.uuid4()}"
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=ANALYSIS_SYSTEM,
    ).with_model("openai", model or "gpt-5.2")

    parts = []
    if headline:
        parts.append(f"HEADLINE: {headline}")
    if url:
        parts.append(f"URL: {url}")
    parts.append(f"ARTICLE:\n{article_text}")
    prompt = "\n\n".join(parts)

    start = datetime.now(timezone.utc)
    response = await chat.send_message(UserMessage(text=prompt))
    elapsed = (datetime.now(timezone.utc) - start).total_seconds()

    try:
        result = extract_json(response)
    except Exception as e:
        logger.exception("Failed to parse LLM JSON")
        raise HTTPException(status_code=502, detail=f"AI parsing failed: {e}")

    result["time_taken_sec"] = round(elapsed, 2)
    result["model_used"] = model or "gpt-5.2"
    return result


# ------------------ Source Reliability ------------------
TRUSTED_SOURCES = {
    "reuters.com": {"score": 95, "trust": "Trusted", "bias": "Center"},
    "apnews.com": {"score": 94, "trust": "Trusted", "bias": "Center"},
    "bbc.com": {"score": 90, "trust": "Trusted", "bias": "Center-Left"},
    "nytimes.com": {"score": 85, "trust": "Mostly Trusted", "bias": "Left"},
    "wsj.com": {"score": 88, "trust": "Trusted", "bias": "Center-Right"},
    "npr.org": {"score": 89, "trust": "Trusted", "bias": "Center-Left"},
    "theguardian.com": {"score": 84, "trust": "Mostly Trusted", "bias": "Left"},
    "bloomberg.com": {"score": 88, "trust": "Trusted", "bias": "Center"},
    "cnn.com": {"score": 72, "trust": "Mostly Trusted", "bias": "Left"},
    "foxnews.com": {"score": 65, "trust": "Questionable", "bias": "Right"},
    "breitbart.com": {"score": 35, "trust": "Questionable", "bias": "Far-Right"},
    "infowars.com": {"score": 15, "trust": "Questionable", "bias": "Far-Right"},
    "washingtonpost.com": {"score": 86, "trust": "Trusted", "bias": "Center-Left"},
    "economist.com": {"score": 92, "trust": "Trusted", "bias": "Center"},
    "aljazeera.com": {"score": 78, "trust": "Mostly Trusted", "bias": "Center-Left"},
}


def rate_source(url: str) -> Dict[str, Any]:
    if not url:
        return {"domain": None, "score": None, "trust": "Unknown", "bias": "Unknown", "known": False}
    try:
        domain = urlparse(url if url.startswith("http") else f"http://{url}").netloc.lower().replace("www.", "")
    except Exception:
        domain = url
    info = TRUSTED_SOURCES.get(domain)
    if info:
        return {"domain": domain, **info, "known": True, "historical_fake_rate": round(100 - info["score"], 1)}
    return {"domain": domain, "score": 50, "trust": "Unknown", "bias": "Unknown", "known": False, "historical_fake_rate": None}


# ------------------ File Extraction ------------------
async def extract_upload_text(f: UploadFile) -> str:
    data = await f.read()
    fname = (f.filename or "").lower()
    if fname.endswith(".pdf"):
        reader = PdfReader(io.BytesIO(data))
        return "\n".join((p.extract_text() or "") for p in reader.pages)
    if fname.endswith(".docx"):
        doc = DocxDocument(io.BytesIO(data))
        return "\n".join(p.text for p in doc.paragraphs)
    if fname.endswith(".txt"):
        return data.decode("utf-8", errors="ignore")
    raise HTTPException(status_code=400, detail="Unsupported file type. Use PDF, DOCX, or TXT.")


async def fetch_url_text(url: str) -> str:
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as c:
            r = await c.get(url, headers={"User-Agent": "Mozilla/5.0 TruthLensAI"})
            r.raise_for_status()
            html = r.text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"URL fetch failed: {e}")
    # crude HTML->text
    text = re.sub(r"<script.*?</script>", " ", html, flags=re.S | re.I)
    text = re.sub(r"<style.*?</style>", " ", text, flags=re.S | re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text[:12000]


# ------------------ AUTH ROUTES ------------------
@api_router.post("/auth/register")
async def register(body: RegisterRequest):
    if await db.users.find_one({"email": body.email.lower()}):
        raise HTTPException(status_code=400, detail="Email already registered")
    user_count = await db.users.count_documents({})
    role = "admin" if user_count == 0 else "user"
    user = {
        "id": str(uuid.uuid4()),
        "email": body.email.lower(),
        "name": body.name,
        "password": hash_password(body.password),
        "role": role,
        "auth_provider": "local",
        "theme": "light",
        "default_model": "gpt-5.2",
        "created_at": now_iso(),
    }
    await db.users.insert_one(user)
    token = create_token(user["id"], role)
    user.pop("_id", None)
    return {"token": token, "user": {k: v for k, v in user.items() if k != "password"}}


@api_router.post("/auth/login")
async def login(body: LoginRequest):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not verify_password(body.password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user["id"], user.get("role", "user"))
    user.pop("_id", None)
    user.pop("password", None)
    return {"token": token, "user": user}


@api_router.post("/auth/forgot-password")
async def forgot_password(body: ForgotPasswordRequest):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user:
        # Do not reveal existence
        return {"ok": True, "message": "If this email exists, a reset token was created."}
    token = str(uuid.uuid4())
    await db.password_resets.insert_one({
        "token": token,
        "user_id": user["id"],
        "created_at": now_iso(),
        "used": False,
    })
    # In MVP: return token in response (would email in production)
    return {"ok": True, "reset_token": token, "message": "Use this token to reset your password (dev mode)."}


@api_router.post("/auth/reset-password")
async def reset_password(body: ResetPasswordRequest):
    rec = await db.password_resets.find_one({"token": body.token, "used": False})
    if not rec:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    await db.users.update_one(
        {"id": rec["user_id"]},
        {"$set": {"password": hash_password(body.new_password)}},
    )
    await db.password_resets.update_one({"token": body.token}, {"$set": {"used": True}})
    return {"ok": True}


@api_router.post("/auth/google")
async def google_auth(body: GoogleAuthRequest):
    """Emergent-managed Google Auth session exchange."""
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": body.session_id},
            )
            r.raise_for_status()
            data = r.json()
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Google auth failed: {e}")

    email = (data.get("email") or "").lower()
    if not email:
        raise HTTPException(status_code=401, detail="No email from Google session")

    user = await db.users.find_one({"email": email})
    if not user:
        user_count = await db.users.count_documents({})
        role = "admin" if user_count == 0 else "user"
        user = {
            "id": str(uuid.uuid4()),
            "email": email,
            "name": data.get("name", email.split("@")[0]),
            "picture": data.get("picture"),
            "role": role,
            "auth_provider": "google",
            "theme": "light",
            "default_model": "gpt-5.2",
            "created_at": now_iso(),
        }
        await db.users.insert_one(user)

    token = create_token(user["id"], user.get("role", "user"))
    user.pop("_id", None)
    user.pop("password", None)
    return {"token": token, "user": user}


@api_router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user


@api_router.put("/auth/profile")
async def update_profile(body: UpdateProfileRequest, user=Depends(get_current_user)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if updates:
        await db.users.update_one({"id": user["id"]}, {"$set": updates})
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password": 0})
    return updated


# ------------------ ANALYZE ------------------
@api_router.post("/analyze")
async def analyze(body: AnalyzeRequest, user=Depends(get_current_user)):
    text = body.text or ""
    if body.url and not text:
        text = await fetch_url_text(body.url)
    if not text or len(text.strip()) < 30:
        raise HTTPException(status_code=400, detail="Article text too short. Provide at least 30 characters.")

    result = await run_analysis(body.headline or "", text[:10000], body.url or "", body.model or "gpt-5.2")
    source = rate_source(body.url) if body.url else None

    article_id = str(uuid.uuid4())
    doc = {
        "id": article_id,
        "user_id": user["id"],
        "headline": body.headline or "",
        "text": text[:10000],
        "url": body.url or "",
        "created_at": now_iso(),
        "favorite": False,
        "source": source,
        **result,
    }
    await db.articles.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), headline: str = Form(""), user=Depends(get_current_user)):
    text = await extract_upload_text(file)
    if len(text.strip()) < 30:
        raise HTTPException(status_code=400, detail="Extracted text too short.")
    result = await run_analysis(headline, text[:10000], "", "gpt-5.2")
    article_id = str(uuid.uuid4())
    doc = {
        "id": article_id,
        "user_id": user["id"],
        "headline": headline or file.filename,
        "text": text[:10000],
        "url": "",
        "filename": file.filename,
        "created_at": now_iso(),
        "favorite": False,
        "source": None,
        **result,
    }
    await db.articles.insert_one(doc)
    doc.pop("_id", None)
    return doc


# ------------------ HISTORY ------------------
@api_router.get("/history")
async def history(
    user=Depends(get_current_user),
    q: str = "", prediction: str = "", topic: str = "", favorite: str = "",
    limit: int = 100,
):
    query = {"user_id": user["id"]}
    if prediction in ("real", "fake"):
        query["prediction"] = prediction
    if favorite == "true":
        query["favorite"] = True
    if topic:
        query["topics"] = topic
    if q:
        query["$or"] = [
            {"headline": {"$regex": q, "$options": "i"}},
            {"text": {"$regex": q, "$options": "i"}},
        ]
    items = await db.articles.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return items


@api_router.get("/history/{article_id}")
async def get_article(article_id: str, user=Depends(get_current_user)):
    doc = await db.articles.find_one({"id": article_id, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return doc


@api_router.delete("/history/{article_id}")
async def delete_article(article_id: str, user=Depends(get_current_user)):
    await db.articles.delete_one({"id": article_id, "user_id": user["id"]})
    return {"ok": True}


@api_router.post("/history/{article_id}/favorite")
async def toggle_favorite(article_id: str, user=Depends(get_current_user)):
    doc = await db.articles.find_one({"id": article_id, "user_id": user["id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    new_val = not doc.get("favorite", False)
    await db.articles.update_one({"id": article_id}, {"$set": {"favorite": new_val}})
    return {"favorite": new_val}


# ------------------ ANALYTICS ------------------
@api_router.get("/analytics")
async def analytics(user=Depends(get_current_user)):
    q = {"user_id": user["id"]}
    total = await db.articles.count_documents(q)
    real = await db.articles.count_documents({**q, "prediction": "real"})
    fake = await db.articles.count_documents({**q, "prediction": "fake"})

    pipeline_conf = [{"$match": q}, {"$group": {"_id": None, "avg_conf": {"$avg": "$confidence"}, "avg_cred": {"$avg": "$credibility_score"}}}]
    agg = await db.articles.aggregate(pipeline_conf).to_list(1)
    avg_conf = round(agg[0]["avg_conf"], 1) if agg else 0
    avg_cred = round(agg[0]["avg_cred"], 1) if agg else 0

    today = datetime.now(timezone.utc).date().isoformat()
    today_count = await db.articles.count_documents({**q, "created_at": {"$regex": f"^{today}"}})

    # Articles over last 14 days
    from collections import Counter
    items = await db.articles.find(q, {"created_at": 1, "prediction": 1, "credibility_score": 1, "topics": 1, "confidence": 1, "_id": 0}).sort("created_at", -1).limit(500).to_list(500)
    by_day = Counter()
    for it in items:
        d = it["created_at"][:10]
        by_day[d] += 1
    timeline = [{"date": d, "count": c} for d, c in sorted(by_day.items())][-14:]

    # Credibility buckets
    buckets = {"0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0}
    for it in items:
        cs = it.get("credibility_score", 0)
        if cs <= 20: buckets["0-20"] += 1
        elif cs <= 40: buckets["21-40"] += 1
        elif cs <= 60: buckets["41-60"] += 1
        elif cs <= 80: buckets["61-80"] += 1
        else: buckets["81-100"] += 1

    # Confidence histogram
    conf_hist = {"50-60": 0, "60-70": 0, "70-80": 0, "80-90": 0, "90-100": 0}
    for it in items:
        c = it.get("confidence", 0)
        if c < 60: conf_hist["50-60"] += 1
        elif c < 70: conf_hist["60-70"] += 1
        elif c < 80: conf_hist["70-80"] += 1
        elif c < 90: conf_hist["80-90"] += 1
        else: conf_hist["90-100"] += 1

    # Top topics
    topic_counter = Counter()
    fake_topics = Counter()
    for it in items:
        for t in it.get("topics", []) or []:
            topic_counter[t] += 1
            if it.get("prediction") == "fake":
                fake_topics[t] += 1

    return {
        "total": total,
        "real": real,
        "fake": fake,
        "avg_confidence": avg_conf,
        "avg_credibility": avg_cred,
        "today": today_count,
        "timeline": timeline,
        "credibility_buckets": [{"range": k, "count": v} for k, v in buckets.items()],
        "confidence_histogram": [{"range": k, "count": v} for k, v in conf_hist.items()],
        "top_topics": [{"topic": t, "count": c} for t, c in topic_counter.most_common(8)],
        "fake_topics": [{"topic": t, "count": c} for t, c in fake_topics.most_common(8)],
    }


@api_router.get("/trending")
async def trending(user=Depends(get_current_user)):
    items = await db.articles.find({}, {"topics": 1, "prediction": 1, "credibility_score": 1, "_id": 0}).sort("created_at", -1).limit(500).to_list(500)
    from collections import Counter
    all_topics = Counter()
    fake_by_topic = Counter()
    real_by_topic = Counter()
    for it in items:
        for t in it.get("topics", []) or []:
            all_topics[t] += 1
            if it.get("prediction") == "fake":
                fake_by_topic[t] += 1
            else:
                real_by_topic[t] += 1
    trending = []
    for t, c in all_topics.most_common(10):
        trending.append({
            "topic": t,
            "total": c,
            "fake": fake_by_topic.get(t, 0),
            "real": real_by_topic.get(t, 0),
            "fake_rate": round(fake_by_topic.get(t, 0) * 100 / c, 1) if c else 0,
        })
    return {"trending": trending, "total_articles": len(items)}


@api_router.get("/source-rating")
async def source_rating(url: str, user=Depends(get_current_user)):
    return rate_source(url)


@api_router.get("/sources")
async def list_sources(user=Depends(get_current_user)):
    return [
        {"domain": d, **info} for d, info in sorted(TRUSTED_SOURCES.items(), key=lambda x: -x[1]["score"])
    ]


# ------------------ FEEDBACK ------------------
@api_router.post("/feedback")
async def feedback(body: FeedbackRequest, user=Depends(get_current_user)):
    await db.feedback.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "article_id": body.article_id,
        "rating": body.rating,
        "comment": body.comment,
        "created_at": now_iso(),
    })
    return {"ok": True}


# ------------------ REPORT EXPORT ------------------
@api_router.get("/reports/{article_id}/pdf")
async def export_pdf(article_id: str, user=Depends(get_current_user)):
    doc = await db.articles.find_one({"id": article_id, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")

    buf = io.BytesIO()
    pdf = SimpleDocTemplate(buf, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    story.append(Paragraph("TruthLens AI - Analysis Report", styles["Title"]))
    story.append(Spacer(1, 12))
    story.append(Paragraph(f"<b>Headline:</b> {doc.get('headline', 'N/A')}", styles["Normal"]))
    story.append(Paragraph(f"<b>Date:</b> {doc.get('created_at')}", styles["Normal"]))
    story.append(Paragraph(f"<b>Model:</b> {doc.get('model_used')}", styles["Normal"]))
    story.append(Spacer(1, 12))
    story.append(Paragraph(f"<b>Prediction:</b> {doc.get('prediction', '').upper()}", styles["Heading2"]))
    story.append(Paragraph(f"<b>Confidence:</b> {doc.get('confidence')}%", styles["Normal"]))
    story.append(Paragraph(f"<b>Credibility Score:</b> {doc.get('credibility_score')}/100", styles["Normal"]))
    story.append(Paragraph(f"<b>Risk Level:</b> {doc.get('risk_level', '').upper()}", styles["Normal"]))
    story.append(Spacer(1, 12))
    story.append(Paragraph("<b>Summary</b>", styles["Heading3"]))
    story.append(Paragraph(doc.get("summary", ""), styles["Normal"]))
    story.append(Spacer(1, 8))
    story.append(Paragraph("<b>Reasoning</b>", styles["Heading3"]))
    story.append(Paragraph(doc.get("reasoning", ""), styles["Normal"]))
    story.append(Spacer(1, 8))
    story.append(Paragraph("<b>Suspicious Statements</b>", styles["Heading3"]))
    for s in doc.get("suspicious_statements", []) or []:
        story.append(Paragraph(f"• {s}", styles["Normal"]))
    story.append(Spacer(1, 8))
    story.append(Paragraph("<b>Recommendations</b>", styles["Heading3"]))
    for r in doc.get("recommendations", []) or []:
        story.append(Paragraph(f"• {r}", styles["Normal"]))
    pdf.build(story)
    buf.seek(0)
    return StreamingResponse(buf, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=truthlens-{article_id[:8]}.pdf"})


@api_router.get("/reports/{article_id}/json")
async def export_json(article_id: str, user=Depends(get_current_user)):
    doc = await db.articles.find_one({"id": article_id, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return doc


# ------------------ CHAT ASSISTANT ------------------
CHAT_SYSTEM = """You are TruthLens AI Assistant, a helpful media literacy expert. Help users understand fake news detection, article analysis, and verification steps. Keep answers concise, clear, and actionable. If given article context, reference it specifically."""


@api_router.post("/chat")
async def chat_message(body: ChatRequest, user=Depends(get_current_user)):
    session_id = body.session_id or f"chat-{user['id']}"
    context = ""
    if body.article_id:
        art = await db.articles.find_one({"id": body.article_id, "user_id": user["id"]}, {"_id": 0})
        if art:
            context = f"\n\nARTICLE CONTEXT:\nHeadline: {art.get('headline')}\nPrediction: {art.get('prediction')} ({art.get('confidence')}%)\nCredibility: {art.get('credibility_score')}/100\nSummary: {art.get('summary')}\n"

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=CHAT_SYSTEM + context,
    ).with_model("openai", "gpt-5.2")

    response = await chat.send_message(UserMessage(text=body.message))

    await db.chat_messages.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": session_id,
        "user_id": user["id"],
        "user_message": body.message,
        "ai_response": response,
        "article_id": body.article_id,
        "created_at": now_iso(),
    })
    return {"response": response, "session_id": session_id}


# ------------------ ADMIN ------------------
@api_router.get("/admin/users")
async def admin_list_users(admin=Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "password": 0}).sort("created_at", -1).to_list(500)
    return users


@api_router.get("/admin/stats")
async def admin_stats(admin=Depends(require_admin)):
    users = await db.users.count_documents({})
    articles = await db.articles.count_documents({})
    fake = await db.articles.count_documents({"prediction": "fake"})
    feedback = await db.feedback.count_documents({})
    return {"users": users, "articles": articles, "fake_detected": fake, "feedback_count": feedback}


@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, admin=Depends(require_admin)):
    if user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete self")
    await db.users.delete_one({"id": user_id})
    await db.articles.delete_many({"user_id": user_id})
    return {"ok": True}


@api_router.get("/")
async def root():
    return {"message": "TruthLens AI API", "version": "1.0"}


# ------------------ Include & CORS ------------------
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
