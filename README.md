# 🧠 ReviewMind AI

> **An intelligent, multi-agent product review analysis platform powered by LangChain, Groq LLaMA 3, and FAISS.**

ReviewMind AI transforms raw customer reviews into structured, actionable intelligence. Upload a batch of reviews and the platform will automatically identify the product, analyze sentiment, surface key strengths and weaknesses, benchmark aspect performance, and let you interrogate the data through a natural language Q&A engine — all without writing a single line of code.

---

## ✨ Features

### 🛡️ AI Gatekeeper Validation
Before any analysis begins, an AI Validation Agent screens every uploaded file. It automatically rejects non-review content such as source code, HTML, random text, or garbage files — ensuring only legitimate customer reviews enter the pipeline.

### 🤖 Multi-Agent AI Analysis
A coordinated system of specialized LangChain agents runs in parallel to extract deep insights:
- **Identity Agent** — detects the product name from review content automatically
- **Sentiment Agent** — calculates positive, neutral, and negative sentiment distribution
- **Rating Agent** — predicts an overall star rating (1–5) from review tone
- **Trend Agent** — builds a historical sentiment timeline to show how opinion has shifted over time
- **Pros & Cons Agent** — extracts the most commonly praised strengths and cited weaknesses
- **Aspect Agent** — scores specific product dimensions (Display, Performance, Battery, Build, Value, etc.) on a 0–100 scale
- **Keywords Agent** — surfaces the top keywords most frequently mentioned across all reviews

### 📊 Interactive Dashboard
A rich, real-time dashboard visualises all analysis output:
- Predicted star rating with animated display
- Sentiment distribution donut chart
- Historical sentiment timeline
- Strengths & Weaknesses comparison cards
- Aspect attribute radar/bar scorecards
- Top keywords chip cloud

### 📄 Premium PDF Report Export
Download a corporate-grade executive intelligence report compiled by ReportLab:
- Deep-blue branded header banner
- Product metadata grid
- Executive summary box
- Top keywords attribution container
- Strengths & Weaknesses side-by-side layout
- Aspect benchmark scorecards with color-coded performance bars
- Authenticity & bias audit section

### 💬 Natural Language Q&A Engine
Query your entire review corpus in plain English using a semantic RAG (Retrieval-Augmented Generation) pipeline:
- Reviews are chunked and embedded into a **FAISS** vector index
- Questions are answered using **Groq LLaMA 3.1** with full context retrieval
- Every answer includes reviewer source citations
- Conversational memory maintains context across multiple turns

### 🔐 Google Authentication
- Secure sign-in via Firebase Google OAuth
- Session persistence — no repeated logins within the same session
- Profile picture from Google account displayed in the nav bar
- One-click logout from any page

### 📱 Mobile Responsive Design
- Full responsiveness across all screens and devices
- Slide-out mobile sidebar with hamburger navigation menu
- Touch-optimized scrolling and custom data table scroll wrappers

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 (Vite), Tailwind CSS, React Router |
| **Backend** | FastAPI, Python 3.10+ |
| **AI Agents** | LangChain, LangGraph, Groq (LLaMA 3.1 8B Instant) |
| **Embeddings** | `sentence-transformers/all-MiniLM-L6-v2` (HuggingFace) |
| **Vector Store** | FAISS (CPU) |
| **PDF Generation** | ReportLab |
| **Authentication** | Firebase (Google OAuth) |
| **Data Processing** | Pandas, NumPy |

---

## 📁 Project Structure

```
Review-Analyzer/
├── backend/
│   ├── agents/          # LangChain/LangGraph agent definitions (chat + dashboard)
│   ├── db/              # FAISS vector store management
│   ├── models/          # Pydantic/TypedDict state models for LangGraph
│   ├── services/        # Graph orchestrator & ReportLab PDF reporter
│   ├── utils/           # Groq LLM wrapper + helper utilities
│   └── main.py          # FastAPI app entry point & all API endpoints
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components (ProfileDropdown)
│   │   ├── pages/       # Route-level page components
│   │   ├── AuthContext.jsx  # Global Firebase auth state provider
│   │   └── firebase.js  # Firebase initialisation (reads .env)
│   ├── .env.example     # Frontend env variable template
│   └── index.html       # Vite HTML entry point
├── docs/
│   ├── sample_files/    # Example review files for testing (CSV, TXT)
│   ├── USER_GUIDE.txt   # End-user guide for the platform
│   ├── CODEBASE_EXPLAINED.md  # Full file-by-file code walkthrough
│   └── Project_Specifications.pdf  # Original project spec document
├── data/                # Runtime FAISS indices & analysis cache (git-ignored)
├── .env.example         # Backend env variable template
├── .gitignore           # Git ignore rules
├── requirements.txt     # Python backend dependencies
└── README.md            # Project introduction & setup guide
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher
- A [Groq API key](https://console.groq.com/keys) (free tier available)
- A [Firebase project](https://console.firebase.google.com/) with Google Auth enabled

---

### 1. Clone the repository

```bash
git clone https://github.com/your-username/Review-Analyzer.git
cd Review-Analyzer
```

### 2. Backend setup

```bash
# Create and activate a Python virtual environment
python -m venv venv

# Windows
.\venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy and fill in the backend environment file
cp .env.example .env
# → Open .env and set your GROQ_API_KEY
```

### 3. Frontend setup

```bash
cd frontend

# Install Node dependencies
npm install

# Copy and fill in the frontend environment file
cp .env.example .env
# → Open .env and set all VITE_FIREBASE_* values from your Firebase console
```

### 4. Run the application

Open **two terminal windows**:

**Terminal 1 — Backend:**
```bash
# From the project root
.\venv\Scripts\activate          # Windows
uvicorn backend.main:app --port 8000 --reload
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Then open **http://localhost:5173** in your browser.

### 5. (Optional) Custom Loading Screen

The application features a glowing neon progress bar when processing reviews. The original `Loading-screen.mp4` background asset is extremely large (>100MB) and has been ignored by Git to save repository space. 

The app functions perfectly without it (it falls back to a clean dark theme and the neon progress bar still works seamlessly). However, if you want the full custom video loader experience, simply place your own `Loading-screen.mp4` video file into the `frontend/public/` directory. The loader will automatically detect and play it!

---

## 🔑 Environment Variables

### Backend (`.env` in project root)

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | ✅ | API key from [console.groq.com](https://console.groq.com/keys) |
| `BACKEND_HOST` | Optional | Server host (default: `127.0.0.1`) |
| `BACKEND_PORT` | Optional | Server port (default: `8000`) |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | ✅ | From Firebase Project Settings |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ | `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | ✅ | Your Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | ✅ | `your-project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅ | From Firebase app config |
| `VITE_FIREBASE_APP_ID` | ✅ | From Firebase app config |

See [`.env.example`](.env.example) and [`frontend/.env.example`](frontend/.env.example) for full templates.

---

## 📖 Supported Review File Formats

| Format | Notes |
|---|---|
| `.csv` | Must contain a `review` or `text` column |
| `.json` / `.jsonl` | Array of objects or one-per-line with a `review` / `text` field |
| `.txt` | One review per line |

The AI Gatekeeper will reject files that contain HTML, source code, or non-review content.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License.

---

<p align="center">Built with ❤️ using LangChain · Groq · FastAPI · React</p>
