# GramSetu AI (ग्रामीण नागरिक सेतु)

> **AI-Powered Civic Assistance Platform** empowering Indian citizens to discover government welfare schemes, understand statutory eligibility with deterministic accuracy, audit required documents, and receive step-by-step application guidance.

---

## 🏗️ Project Architecture

```
gramsetu-ai/
├── backend/                  # FastAPI Python Backend
│   ├── app/
│   │   ├── api/v1/          # Endpoints (Health, Eligibility, KagazCheck, Parchaa, VaniBot)
│   │   ├── core/            # Config and Settings
│   │   ├── data/            # Verified statutory schemes dataset
│   │   ├── database/        # SQLAlchemy Engine & Session
│   │   ├── models/          # Scheme & Rule SQLAlchemy models
│   │   ├── schemas/         # Pydantic Schemas & DTOs
│   │   └── services/        # YojanaMatch, KagazCheck OCR, Parchaa PDF, VaniBot
│   ├── .env.example         # Backend environment template
│   ├── requirements.txt     # Python dependencies
│   └── tests/               # Unit and integration test suites
│
├── frontend/                 # React 19 + Vite + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/      # UI Components (Navbar, Hero, VaniBot, KagazCheck, Parchaa, etc.)
│   │   ├── services/api.ts  # Axios API Client & TypeScript Interfaces
│   │   ├── App.tsx          # Main Dashboard View Router
│   │   └── main.tsx         # Root Application Entry
│   ├── .env.example         # Frontend environment template
│   └── package.json         # Node dependencies (pnpm)
│
└── README.md
```

---

## 🚀 Quick Start & How to Run

### 1. Backend Setup (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (if not already created)
py -m venv .venv

# Activate virtual environment
# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# On Windows Command Prompt:
.\.venv\Scripts\activate.bat
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from .env.example
cp .env.example .env

# Start FastAPI server (runs on port 8000)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

> **Backend API Docs**: Once running, access Swagger UI at `http://localhost:8000/docs` or ReDoc at `http://localhost:8000/redoc`.

---

### 2. Frontend Setup (React 19 + Vite)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies with pnpm
pnpm install

# Create .env file from .env.example
cp .env.example .env

# Start Vite development server (runs on port 5173)
pnpm dev
```

> **Web Application**: Access the web app in your browser at `http://localhost:5173`.

---

## 🌟 Key Features

1. **YojanaMatch (Deterministic Eligibility Engine)**:
   - Evaluates citizen parameters (age, income, occupation, landholding, state, category, BPL status) against official statutory rules.
   - Provides clear criteria breakdowns for matched and unmet conditions.

2. **Vani-Bot (Multilingual Conversational Voice Assistant)**:
   - Voice and text interactions in Kannada (ಕನ್ನಡ), Hindi (हिन्दी), and Indian English.
   - Real-time speech-to-text, audio visualization, text-to-speech audio playback, and grounded scheme recommendations.

3. **KagazCheck (Multimodal Document Auditor)**:
   - Live camera and file upload for Aadhaar cards, Land Records (RoR/Khasra), Bank Passbooks, and certificates.
   - Privacy-first in-memory processing with automatic PII masking.

4. **Parchaa Generator (One-Click Application Dossier)**:
   - Compiles a single-page printable A4 application dossier and downloadable PDF with administrative office details and required document checklists.

5. **My Applications Lifecycle Tracker**:
   - Track application preparation stages, required certificates readiness, and official portal submission links.

---

## 📄 License & Civic Mission
GramSetu AI is free and open-source civic technology dedicated to bridging citizens with government welfare initiatives without intermediaries or broker fees.
