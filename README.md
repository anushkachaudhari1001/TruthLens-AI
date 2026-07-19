<div align="center">

# 🧠 TruthLens AI

### AI-Powered Fake News Detection & Credibility Analysis Platform

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python)
![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)
![OpenRouter](https://img.shields.io/badge/OpenRouter-AI-purple)
![Render](https://img.shields.io/badge/Backend-Render-blue)
![Vercel](https://img.shields.io/badge/Frontend-Vercel-black)
![License](https://img.shields.io/badge/License-MIT-green)

### Detect misinformation using Open-Source Large Language Models (LLMs)

---

### 🌐 Live Demo

**Frontend**

https://truth-lens-ai-nine.vercel.app/

**Backend API**

https://truthlens-ai-backend-ldbq.onrender.com

**Swagger Documentation**

https://truthlens-ai-backend-ldbq.onrender.com/docs

</div>

---

# 📖 Table of Contents

- Overview
- Motivation
- Core Features
- Workflow
- Architecture
- Tech Stack
- Project Structure
- Installation
- Environment Variables
- Deployment
- API Endpoints
- Testing
- Security
- Screenshots
- Future Improvements
- Contributing
- License

---

# 📖 Overview

TruthLens AI is an AI-powered fake news detection and credibility analysis platform that helps users evaluate whether a news article is trustworthy or misleading.

Using open-source Large Language Models through the OpenRouter API, the system analyzes news articles, generates credibility scores, explains the reasoning behind predictions, summarizes content, identifies suspicious claims, and allows users to interact with an AI assistant for deeper insights.

Users can analyze news from plain text, URLs, or uploaded documents while maintaining a complete analysis history.

---

# 🎯 Motivation

The rapid spread of misinformation across the internet has made it increasingly difficult for users to distinguish trustworthy news from misleading content.

TruthLens AI was developed to provide an accessible AI-powered assistant that evaluates news articles, explains its reasoning, and encourages critical thinking rather than blind trust.

---

# ✨ Core Features

| Feature | Status |
|----------|--------|
| User Authentication | ✅ |
| Fake News Detection | ✅ |
| Credibility Score | ✅ |
| Confidence Score | ✅ |
| AI Generated Summary | ✅ |
| AI Reasoning | ✅ |
| Suspicious Claims Detection | ✅ |
| URL Analysis | ✅ |
| PDF Upload | ✅ |
| DOCX Upload | ✅ |
| TXT Upload | ✅ |
| AI Chat Assistant | ✅ |
| Download PDF Report | ✅ |
| Dashboard | ✅ |
| History | ✅ |
| Favorites | ✅ |
| MongoDB Storage | ✅ |
| Responsive UI | ✅ |

---

# 🔄 Workflow

1. User registers or logs into the platform.
2. User submits article text, URL, or document.
3. Backend extracts article content.
4. OpenRouter AI analyzes credibility.
5. AI generates:
   - Prediction
   - Credibility Score
   - Confidence
   - Summary
   - Reasoning
   - Recommendations
6. Analysis is stored in MongoDB Atlas.
7. User can ask follow-up questions using the AI Chat Assistant.
8. Reports can be downloaded as PDF.

---

# 🏗️ Architecture

```text
                    +-----------------------+
                    |    React Frontend     |
                    |       (Vercel)        |
                    +-----------+-----------+
                                |
                                |
                                ▼
                    +-----------------------+
                    |   FastAPI Backend     |
                    |      (Render)         |
                    +-----------+-----------+
                                |
                +---------------+---------------+
                |                               |
                ▼                               ▼
      +------------------+          +-----------------------+
      | MongoDB Atlas    |          | OpenRouter API        |
      | User Database    |          | AI Reasoning Model    |
      +------------------+          +-----------------------+
```

---

# 🛠️ Tech Stack

## Frontend

- React 19
- React Router
- Tailwind CSS
- ShadCN UI
- Axios
- Framer Motion
- Recharts

## Backend

- FastAPI
- Python
- JWT Authentication
- bcrypt
- Motor
- ReportLab
- PyPDF
- python-docx

## Artificial Intelligence

- OpenRouter API
- Qwen3 32B (Free Model)
- Open-source Large Language Models

## Database

- MongoDB Atlas

## Deployment

- Vercel
- Render

---

# 📂 Project Structure

```text
TruthLens-AI
│
├── backend
│   ├── server.py
│   ├── requirements.txt
│   └── .env
│
├── frontend
│   ├── src
│   ├── public
│   └── package.json
│
├── docs
├── memory
├── tests
└── README.md
```

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/anushkachaudhari1001/TruthLens-AI.git

cd TruthLens-AI
```

---

## Backend Setup

```bash
cd backend

pip install -r requirements.txt

uvicorn server:app --reload
```

Backend

```
http://127.0.0.1:8000
```

Swagger

```
http://127.0.0.1:8000/docs
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm start
```

Frontend

```
http://localhost:3000
```

---

# ⚙️ Environment Variables

Create a `.env` file inside the backend folder.

```env
MONGO_URL=your_mongodb_connection_string

DB_NAME=truthlens_ai

JWT_SECRET=your_secret_key

OPENROUTER_API_KEY=your_openrouter_api_key

CORS_ORIGINS=http://localhost:3000,https://truth-lens-ai-nine.vercel.app
```

---

# ☁️ Deployment

| Component | Platform |
|------------|----------|
| Frontend | Vercel |
| Backend | Render |
| Database | MongoDB Atlas |
| AI Model | OpenRouter |

---

# 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/register` | POST | Register User |
| `/api/login` | POST | User Login |
| `/api/analyze` | POST | Analyze News |
| `/api/chat` | POST | AI Chat |
| `/api/history` | GET | User History |
| `/api/history/{id}` | DELETE | Delete History |
| `/api/report/{id}` | GET | Download PDF |
| `/api/favorites` | GET | Favorite Articles |

---

# 🧪 Testing Checklist

- ✅ Register a new account
- ✅ Login
- ✅ Analyze article text
- ✅ Analyze URL
- ✅ Upload PDF
- ✅ Upload DOCX
- ✅ Upload TXT
- ✅ Chat with AI
- ✅ Download PDF Report
- ✅ View History
- ✅ Add Favorites
- ✅ Delete History

---

# 🔒 Security

- JWT Authentication
- Password Hashing (bcrypt)
- Protected API Routes
- Environment Variables
- MongoDB Atlas Authentication
- CORS Protection

---

# 📸 Screenshots

> Add screenshots inside a `screenshots/` folder and update the image paths below.

### Landing Page

![Landing Page 1](TruthLens_ss/home.png)

### Login Page

![Login Page 1](TruthLens_ss/login.png)

### Dashboard

![Dashboard Page 1](TruthLens_ss/dashboard.png)

![Dashboard Page 2](TruthLens_ss/dashboard(1).png)

### AI Analysis

![Analysis Page 1](TruthLens_ss/analyze.png)

![Analysis Page 2](TruthLens_ss/Analyze(1).png)

![Analysis Page 3](TruthLens_ss/Analyze(2).png)

### AI Chat

![AI Chat Page 1](TruthLens_ss/assistant.png)

![AI Chat Page 2](TruthLens_ss/assistant(1).png)

### History

![History Page 1](TruthLens_ss/history.png)

### PDF Report

![Report Page 1](TruthLens_ss/reports.png)

---

# 🚀 Future Improvements

- Browser Extension
- Mobile Application
- OCR Support
- Live Fact-check APIs
- Explainable AI
- Multi-language Support
- Source Reputation Database
- Multiple AI Model Selection
- Voice-based Analysis

---

# 👩‍💻 Developer

Developed as a hackathon project focused on combating misinformation using Artificial Intelligence, FastAPI, React, MongoDB Atlas, and OpenRouter.

---

# 🤝 Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Push the branch.
5. Open a Pull Request.

---

# 📄 License

This project is licensed under the MIT License.

---

<div align="center">

### ⭐ If you found this project useful, please consider giving it a Star!

**TruthLens AI — Helping users identify misinformation through AI-powered credibility analysis.**

</div>