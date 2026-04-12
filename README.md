# Tutor Lab

Tutor Lab is a full-stack web app that turns lecture audio (recorded live or uploaded) into structured notes, then links the lecture to relevant learning resources using a lightweight RAG-style retrieval pipeline.

## Current implementation

### Frontend
- Authentication
  - Email/password register and login
  - Google OAuth callback flow
  - Access/refresh token handling with auto-refresh support
- Landing + protected app routes
  - Public landing page at `/`
  - Protected routes: `/workspace`, `/notes`, `/scanner`
- Workspace (lecture studio)
  - Live mic recording + transcription
  - Audio upload + transcription
  - AI lecture processing: summary, key points, tags, related resources
  - Session timeline sidebar: create, load, rename, delete
  - "Doubt Now" flow: highlight text and get contextual explanation
- Notes board
  - Aggregated key points from saved sessions
  - Sticky-note style cards with inline editing
  - Debounced persistence to backend sessions API
- Smart Scanner
  - Upload images/docs/media through a unified uploader
  - OCR/file text extraction + AI summary/key points

### Backend
- Auth and users
  - Email/password register/login
  - OAuth2-compatible `/auth/token` endpoint for docs login
  - Access/refresh JWT issuance and refresh
  - Google OAuth URL + callback
  - Current-user and public stats endpoints
- AI endpoints
  - General generate/chat endpoints
  - Unified lecture processing endpoint
  - Task-specific analysis endpoints (summary, topics, keywords, difficulty, doubt explanation)
  - Audio transcription (file and base64)
  - File upload and OCR analysis endpoints
  - Draft notes and micronotes expansion/listing
- Sessions
  - Per-user CRUD for lecture sessions in MongoDB
- Recommendations
  - Retrieval from vector/lexical index
  - Optional ingestion from YouTube, Google Books, arXiv

## Tech stack / tools used

### Frontend
- **React 18** + **Vite**
- **React Router** for routing
- **Tailwind CSS** (with `tailwindcss-animate`)
- **Axios** for API calls (with access token + refresh handling)
- UI helpers:
  - `lucide-react` icons
  - `framer-motion` animations
  - `@radix-ui/*` primitives
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
  - `Pillow`, `opencv-python`, `PyPDF2`, `pdf2image`, `python-docx`, `aiofiles`

## Repository layout

```text
.
|-- backend/
|   |-- app/
|   |   |-- api/
|   |   |   |-- endpoints/      # ai.py, auth.py, recommendations.py, sessions.py
|   |   |   `-- routes.py
|   |   |-- core/               # config + security
|   |   |-- crud/
|   |   |-- db/                 # postgres + mongodb connectors
|   |   |-- models/
|   |   |-- schemas/
|   |   `-- services/           # ocr/transcription/ollama/embedding/faiss/ingestion
|   |-- data/                   # index artifacts
|   |-- init_db.py
|   |-- main.py
|   `-- requirements.txt
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- contexts/
|   |   |-- pages/              # LandingPage, Home, Notes, Scanner, Auth pages
|   |   `-- services/
|   |-- index.html
|   `-- package.json
|-- package.json
`-- README.md
```

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
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

FAISS note for Windows:
- `requirements.txt` intentionally skips `faiss-cpu` on Windows.
- Install with Conda if needed: `conda install -c conda-forge faiss-cpu`

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
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback

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
  - `POST /auth/token`
  - `POST /auth/refresh`
  - `GET /auth/me`
  - `GET /auth/google/url`
  - `GET /auth/google/callback`
  - `GET /auth/stats`
- **AI** (`/ai`)
  - `POST /ai/generate`
  - `POST /ai/chat`
  - `POST /ai/process`
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
  - `POST /ai/generate-draft-notes`
  - `POST /ai/save-edited-notes` (multipart form)
  - `POST /ai/expand-micronote`
  - `GET /ai/draft-notes`
  - `GET /ai/micronotes`
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
