# Tutor Lab

Tutor Lab is a full-stack web app that turns lecture audio (recorded live or uploaded) into structured notes, then links the lecture to relevant learning resources using a lightweight RAG-style retrieval pipeline.

## What’s implemented

### Frontend (user-facing)
- **Authentication UI**
  - Email + password registration and login
  - Google OAuth login (redirect-based)
  - Persistent session using JWT access/refresh tokens stored in `localStorage`
- **Workspace (lecture processing)**
  - Record audio from the microphone and auto-transcribe (after recording stops)
  - Upload an audio file and transcribe
  - Generate:
    - A summary
    - Editable key points
    - Auto tags (`subject`, `topic`, `difficulty`)
  - **“Doubt Now”**: select/highlight text and request an AI explanation using the lecture transcript as context
  - **Session history sidebar**: create, load, rename, and delete saved sessions
- **Notes board**
  - Aggregates key points from past sessions
  - Draggable sticky notes
  - Inline editing with debounced sync back to the backend

### Backend (APIs)
- **Auth & users**
  - Email/password register + login
  - JWT access + refresh tokens
  - `GET /auth/me` for current user
  - Google OAuth flow that redirects back to the frontend with tokens
- **Lecture AI utilities**
  - Lecture transcript processing in one call (summary, key points, tags, related resource queries)
  - Summarization, topic extraction, keyword extraction, difficulty classification
  - Doubt explanation (with optional context)
- **Audio transcription**
  - Whisper-based audio transcription via file upload or base64
- **File processing**
  - PDF/DOCX/TXT text extraction
  - Image OCR using PaddleOCR
  - Upload endpoint that optionally runs AI analysis on extracted text
- **Sessions storage**
  - CRUD for lecture sessions (per-user)
  - Stores transcript, summary, key points, tags, and related resources
- **Resource recommendations (retrieval)**
  - Semantic + lexical retrieval for resources using:
    - Sentence-transformer embeddings
    - FAISS vector index
    - BM25 index
    - Cross-encoder re-ranking
  - Optional ingestion to populate resources from:
    - YouTube
    - Google Books
    - arXiv

## Tech stack / tools used

### Frontend
- **React 18** + **Vite**
- **React Router** for routing
- **Tailwind CSS** (with `tailwindcss-animate`)
- **Axios** for API calls (with access token + refresh handling)
- UI helpers:
  - `lucide-react` icons
  - `framer-motion` animations
  - `react-markdown` + `remark-gfm` for Markdown rendering
  - `sonner` toast notifications

### Backend
- **FastAPI** + **Uvicorn**
- **Pydantic v2** + `pydantic-settings` for configuration
- **PostgreSQL** + **SQLAlchemy** for user accounts
- **MongoDB (PyMongo)** for sessions, notes, and resource storage
- **Ollama** for LLM generation (defaults to `llama3.2:3b`)
- **Whisper** (`faster-whisper`) for speech-to-text
- **Retrieval / RAG components**
  - `sentence-transformers` (embeddings + cross-encoder)
  - FAISS (vector search)
  - `rank-bm25` (lexical search)
  - `numpy`
- **OCR / document processing**
  - `rapidocr-onnxruntime`
  - `Pillow`, `opencv-python`, `PyPDF2`, `pdf2image`, `python-docx`

## Repository layout

- `backend/` — FastAPI app, DB connections, AI + retrieval services
- `frontend/` — React app (Vite + Tailwind)

## Getting started

### Prerequisites
- **Node.js** 18+ (for the frontend)
- **Python** 3.10+ (recommended)
- **PostgreSQL** (for users)
- **MongoDB** (for sessions/resources)
- **Ollama** running locally (or reachable) and the configured model pulled
  - Example: `ollama pull llama3.2:3b`

### 1) Backend setup

From the repo root:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create/edit `backend/.env` (this repo’s `.gitignore` excludes it). Minimum required keys:

### Example `backend/.env`

```env
# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=student_db

# MongoDB
MONGODB_URL=mongodb://...
MONGODB_DB=texts_db

# Ollama
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b

# Auth / CORS
SECRET_KEY=change-me
FRONTEND_ORIGIN=http://localhost:5173

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
# Redirect is used by the backend and defaults to:
# http://localhost:8000/api/v1/auth/google/callback

# Optional (resource ingestion)
YOUTUBE_API_KEY=
GOOGLE_BOOKS_API_KEY=
```

Initialize PostgreSQL tables:

```powershell
python init_db.py
```

Run the API:

```powershell
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API docs:
- Swagger UI: http://localhost:8000/docs
- OpenAPI JSON: http://localhost:8000/openapi.json

### 2) Frontend setup

```powershell
cd frontend
npm install
npm run dev
```

Open: http://localhost:5173

## API overview

All endpoints are under `/api/v1`.

- **Auth** (`/auth`)
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/refresh`
  - `GET /auth/me`
  - `GET /auth/google/url`
  - `GET /auth/google/callback`
- **AI** (`/ai`)
  - `POST /ai/process-lecture`
  - `POST /ai/summarize`
  - `POST /ai/explain-doubt`
  - `POST /ai/extract-topics`
  - `POST /ai/extract-keywords`
  - `POST /ai/classify-difficulty`
  - `POST /ai/transcribe-audio` (multipart)
  - `POST /ai/transcribe-audio-base64`
  - `POST /ai/upload-file` (multipart)
  - `POST /ai/ocr-analyze-image` (multipart)
  - `POST /ai/analyze-with-context` (multipart)
  - `POST /ai/expand-micronote`
- **Sessions** (`/sessions`)
  - `POST /sessions/`
  - `GET /sessions/`
  - `GET /sessions/{session_id}`
  - `PUT /sessions/{session_id}`
  - `DELETE /sessions/{session_id}`
- **Recommendations** (`/recommendations`)
  - `POST /recommendations/recommend`
  - `POST /recommendations/ingest`

## Notes on data & indexing
- Vector/BM25 indices are stored under `backend/data/` and are ignored by git.
- On backend startup, the app:
  - Verifies MongoDB connectivity
  - Loads the embedding model
  - Builds/loads the FAISS + BM25 indices

## Common issues
- **Ollama not running**: ensure `OLLAMA_HOST` is reachable and the model is pulled.
- **Google OAuth redirect mismatch**: confirm your Google Console OAuth redirect URI matches the backend callback URL.
- **Missing ingestion results**: resource ingestion requires valid API keys and network access.

---