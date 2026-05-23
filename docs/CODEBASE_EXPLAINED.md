# ReviewMind AI — Complete Codebase Explanation

> **Purpose:** This document explains every single file in the project — what it does, how it works, every function and key block, and how everything connects together. Written so you can walk an interviewer through the entire codebase confidently.

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Backend — Entry Point](#2-backend--entry-point-backendmainpy)
3. [Backend — State Models](#3-backend--state-models-backendmodelsstatedpy)
4. [Backend — LLM Wrapper](#4-backend--llm-wrapper-backendutilsllmpy)
5. [Backend — Helpers](#5-backend--helpers-backendutilshelperspy)
6. [Backend — Vector Store](#6-backend--vector-store-backenddbvectorstoredpy)
7. [Backend — Dashboard Agents](#7-backend--dashboard-agents-backendagentsdashboardpy)
8. [Backend — Chat Agent](#8-backend--chat-agent-backendagentschatpy)
9. [Backend — Orchestrator](#9-backend--orchestrator-backendservicesorchestratordpy)
10. [Backend — PDF Reporter](#10-backend--pdf-reporter-backendservicesreporterdpy)
11. [Frontend — Entry Point](#11-frontend--entry-point-frontendsrcmainjsx)
12. [Frontend — App Router](#12-frontend--app-router-frontendsrcappjsx)
13. [Frontend — Firebase Config](#13-frontend--firebase-config-frontendsfcfirebasejs)
14. [Frontend — Auth Context](#14-frontend--auth-context-frontendsrcauthcontextjsx)
15. [Frontend — Profile Dropdown](#15-frontend--profile-dropdown-frontendsrccomponentsprofiledropdownjsx)
16. [Frontend — Landing Page](#16-frontend--landing-page-frontendsrcpageslanding_darkjsx)
17. [Frontend — Login Page](#17-frontend--login-page-frontendsrcpageslogin_darkjsx)
18. [Frontend — File Upload Page](#18-frontend--file-upload-page-frontendsrcpagesfileupload_darkjsx)
19. [Frontend — Dashboard Page](#19-frontend--dashboard-page-frontendsrcpagesdashboard_darkjsx)
20. [Frontend — Analysis Results Page](#20-frontend--analysis-results-page-frontendsrcpagesanalysisresults_darkjsx)
21. [Frontend — Chat Interface Page](#21-frontend--chat-interface-page-frontendsrcpageschatinterface_darkjsx)
22. [Frontend — Review Detail Page](#22-frontend--review-detail-page-frontendsrcpagesreviewdetail_darkjsx)
23. [Config & Infrastructure Files](#23-config--infrastructure-files)
24. [Data Flow: End-to-End Walkthrough](#24-data-flow-end-to-end-walkthrough)

---

## 1. System Architecture Overview

ReviewMind AI is a **full-stack web application** split into two independent processes:

```
Browser (React)  ←──── HTTP / REST API ────→  FastAPI Server (Python)
                                                      │
                                               LangChain Agents
                                                      │
                                         Groq Cloud (LLaMA 3.1 LLM)
                                                      │
                                          FAISS Vector Index (local)
```

**How the layers communicate:**
- The **React frontend** (running on port 5173) makes `fetch()` API calls to the **FastAPI backend** (running on port 8000).
- Every request from the frontend includes an `x-user-id` HTTP header containing the Firebase UID of the logged-in user. This is how the backend separates data between users.
- The backend stores each user's FAISS index and analysis results in a folder under `data/faiss_index/<user_id>/<product_id>/`.

---

## 2. Backend — Entry Point: `backend/main.py`

**Role:** This is the heart of the backend. It creates the FastAPI web server, defines all the HTTP API routes, and handles the full file upload and processing pipeline.

### Imports & Setup (lines 1–34)
```python
load_dotenv()         # Reads the .env file at startup — loads GROQ_API_KEY into environment
app = FastAPI(...)    # Creates the web server instance
app.add_middleware(CORSMiddleware, allow_origins=["*"], ...)
# CORS = Cross-Origin Resource Sharing. This allows the React app (port 5173) to talk
# to the FastAPI server (port 8000). Without this, the browser would block requests.
load_vector_db()      # Pre-loads the default FAISS index into memory at server startup
```

### `ChatRequest` (line 36)
A Pydantic model (data validator) that defines the shape of the JSON body the `/chat` endpoint expects: `{ message: str, thread_id: str }`. Pydantic auto-validates and type-checks the incoming request.

### `process_content(content, user_id)` — Core Upload Pipeline (lines 40–138)
This async function is the most complex piece of `main.py`. It runs every time a file is uploaded.

**Step 0 — SHA-256 Fingerprint:**
```python
content_hash = hashlib.sha256(content).hexdigest()
```
Creates a unique hash of the raw file bytes. This is used later to detect if the same file is re-uploaded, avoiding redundant re-analysis.

**Step 1 — Heuristic Kill Switch (lines 46–53):**
Before any LLM call, the first 1,000 characters of the file are checked for HTML tags and JavaScript patterns. If found, the file is rejected instantly — cheap and fast.

**Step 2 — Format Detection (lines 58–91):**
Three-tier cascade to extract the list of review strings:
1. **JSON** — if the text starts with `{` or `[`, parse as JSON and look for a `reviews` array or a list of objects
2. **CSV** — use Pandas `read_csv()` and find a column whose name contains "review", "text", or "content"
3. **Plain Text** — split by newline, filter out lines under 10 characters, lines starting with `<` (HTML), or `{` (code)

**Step 3 — LLM Validation Gate (lines 97–102):**
Calls `validate_node()` (from the dashboard agent) with a small sample of reviews. The LLM decides if the content is genuine product reviews. If not, an error is returned immediately — before anything is saved to disk.

**Step 4 — Product Identity (lines 104–110):**
If the JSON metadata didn't include a product name, calls `run_identity_agent()` with the first 10 reviews to extract the product name using the LLM.

**Step 5 — Hash Deduplication (lines 115–122):**
Compares the SHA-256 hash of the uploaded file against the stored hash for this product. If they match, the existing FAISS index is reloaded and no re-indexing happens. This saves significant LLM API cost and processing time.

**Step 6 — FAISS Indexing (lines 125–130):**
Each review string is wrapped in a LangChain `Document` object. `FAISS.from_documents()` embeds all of them using the `sentence-transformers/all-MiniLM-L6-v2` model and stores the resulting vector index to disk.

### API Endpoints

#### `POST /upload` (line 170)
Accepts a multipart file upload from the browser. Reads the raw bytes, calls `process_content()`, returns a success or error JSON.

#### `POST /upload_sample` (line 178)
Loads one of the pre-built sample review files from `docs/sample_files/` so users can try the app without having their own data.

#### `GET /analyze` (line 193)
The main analysis trigger. When the frontend calls this:
1. Checks if cached `analysis.json` exists → returns it immediately if so (no LLM calls)
2. Otherwise builds an empty `DashboardState` dict and runs `dashboard_orchestrator.invoke()` — this fires all 7 AI agents via LangGraph
3. Saves the result to `analysis.json`
4. Returns the full analysis as JSON

#### `POST /chat` (line 140)
Receives a message and a `thread_id` (used for conversation memory). Calls `chat_orchestrator.invoke()` which runs the RAG retrieval + LLM answer generation. Returns the AI reply.

#### `GET /products` (line 154)
Returns the list of all products this user has previously uploaded. Used by the dashboard's product switcher dropdown.

#### `POST /select_product` (line 160)
Switches the active FAISS index in memory to a previously uploaded product. This allows users to analyse multiple products without re-uploading.

#### `GET /export_pdf` (line 240)
Loads the stored `analysis.json` for a product, calls `generate_report_pdf()` from the reporter service, and streams the raw PDF bytes back to the browser using `StreamingResponse`. The browser triggers a download.

---

## 3. Backend — State Models: `backend/models/state.py`

**Role:** Defines the data structures that flow through the LangGraph pipelines.

### `ChatState` (TypedDict)
```python
class ChatState(TypedDict):
    messages: Annotated[List[Any], operator.add]   # Conversation history (auto-appended)
    context: str                                     # Retrieved FAISS snippets for current query
```
- `Annotated[List[Any], operator.add]` tells LangGraph to **merge** (append) the messages lists from different nodes rather than replace them — this is how conversation memory accumulates.

### `DashboardState` (TypedDict)
Holds all the data that flows between dashboard analysis nodes:
- `query` — the search query used to retrieve reviews from FAISS
- `retrieved_reviews` — the raw list of review strings fetched from FAISS
- `total_reviews` — total count (used in UI display)
- `product_name`, `predicted_rating` — set by the identity agent
- `short_summary`, `detailed_summary` — set by the descriptive agent
- `pros`, `cons` — strengths/weaknesses lists
- `keyword_analysis` — comma-separated top keywords
- `sentiment_analysis` — text summary of sentiment counts
- `sentiment_distribution` — dict `{positive, neutral, negative}` with counts
- `sentiment_trend` — list of `{date, score}` objects for the timeline chart
- `aspect_analysis` — scored product attributes (Display, Battery, etc.)
- `fake_review_analysis` — authenticity audit output
- `is_valid`, `validation_error` — gatekeeper flags set by `validate_node`
- `key_metrics` — dict with `{key_strength, top_complaint, emerging_request}`

---

## 4. Backend — LLM Wrapper: `backend/utils/llm.py`

**Role:** Provides a single, resilient LLM instance that all agents use.

### `RetryingChatGroq` class
Extends LangChain's `ChatGroq` with a custom `_generate()` method that wraps every LLM call in an **exponential backoff retry loop**.

```python
max_retries: int = 5
initial_delay: float = 2.0   # starts at 2 seconds, doubles each retry
```

When the Groq API returns a `429 RateLimitError`, the agent:
1. Catches the exception
2. Waits `delay` seconds (2, 4, 8, 16, 32...)
3. Retries up to 5 times
4. Only raises the error if all retries are exhausted

Any other exception type is re-raised immediately.

### `get_llm(temperature=0.1)` function
Factory function called by agents to get an LLM instance. `temperature` controls randomness:
- `temperature=0.0` → used by agents that need deterministic, precise outputs (validation, scoring, timeline, security, identity)
- `temperature=0.1` → used by the descriptive agent which needs slightly more natural language
- `temperature=0.3` → used by the chat agent which needs slightly more conversational responses

The model is always `llama-3.1-8b-instant` — Groq's fastest inference model.

---

## 5. Backend — Helpers: `backend/utils/helpers.py`

**Role:** Two small but critical utilities used across all agents.

### `SYSTEM_RESTRICTION` constant
A string appended to every system prompt sent to the LLM:
```
"CRITICAL: Do not include any internal thought process, <think> tags, or 'thinking' blocks..."
```
Some LLM models (especially reasoning models) output their chain-of-thought wrapped in `<think>...</think>` XML tags before the actual answer. This instruction prevents that from appearing in user-facing output.

### `clean_llm_output(text)` function
A post-processing regex cleaner that:
1. Removes all complete `<think>...</think>` blocks using a DOTALL regex (matches across newlines)
2. Removes any remaining orphaned `<think>` or `</think>` tags (in case the tag was unclosed due to token truncation)
3. Returns the cleaned, stripped text

This is called on every single LLM response before it's used or stored.

---

## 6. Backend — Vector Store: `backend/db/vectorstore.py`

**Role:** Manages all reading and writing of the FAISS vector database and analysis cache to disk. Acts as the data persistence layer.

### Module-level constants
```python
FAISS_BASE_PATH = "data/faiss_index"
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
```
- `FAISS_BASE_PATH` is the root folder where all user/product indices are stored
- `embeddings` is the sentence transformer model. It converts text into 384-dimensional vectors. This object is **module-level** (created once at import time) so it's not re-loaded on every request — HuggingFace model loading is slow.
- `global_vector_db` — the currently active FAISS index held in memory

### Folder Structure
```
data/faiss_index/
  └── <firebase_user_uid>/
        └── <product_id>/
              ├── index.faiss      ← raw FAISS binary index
              ├── index.pkl        ← LangChain metadata mapping
              ├── analysis.json    ← cached dashboard analysis result
              └── data_hash.txt    ← SHA-256 fingerprint of the uploaded file
```

### Functions

**`get_db()`** — Returns the current in-memory `global_vector_db`. Used by agents and the chat endpoint to perform similarity searches.

**`get_user_path(user_id)`** — Returns `data/faiss_index/<user_id>` — the root folder for a specific user.

**`load_vector_db(product_id, user_id)`** — Loads a previously saved FAISS index from disk into memory using `FAISS.load_local()`. The `allow_dangerous_deserialization=True` flag is required because FAISS uses Python pickle internally.

**`save_vector_db(db, product_name, user_id)`** — Sanitises the product name into a safe folder name (replaces non-alphanumeric chars with underscores), creates the directory, and calls `db.save_local()` to write the FAISS binary files.

**`get_product_name(product_id, user_id)`** — First tries to read the `product_name` field from `analysis.json`. Falls back to cleaning up the folder name (replacing underscores with spaces).

**`get_all_products(user_id)`** — Lists all subdirectories under the user's FAISS folder and returns a list of `{id, name}` objects for the product switcher dropdown.

**`save_analysis_data(data, product_id, user_id)`** — Serialises the full `DashboardState` dict to a `analysis.json` file using `json.dump()`. Called at the end of `GET /analyze`.

**`load_analysis_data(product_id, user_id)`** — Reads and deserialises `analysis.json`. Called first in `GET /analyze` to serve cached results without re-running agents.

**`save_data_hash(content_hash, ...)`** / **`get_data_hash(...)`** — Write/read the SHA-256 fingerprint of the raw uploaded file bytes to `data_hash.txt`. Used for change detection.

---

## 7. Backend — Dashboard Agents: `backend/agents/dashboard.py`

**Role:** Contains all 7 AI analysis agents that run when a product is analysed. This is the largest and most important backend file.

### Two LLM instances at module level
```python
llm_0 = get_llm(0.0)   # Deterministic — for classification, validation, scoring
llm_1 = get_llm(0.1)   # Slightly creative — for summaries and prose text
```

### `validate_node(state)` — The AI Gatekeeper
**What it does:** Takes a sample of up to 15 reviews from the state (picking beginning, middle, and end for representation) and asks the LLM: "Are these genuine product reviews?"

**Why it samples:** Sending all reviews would be expensive. A well-distributed sample is sufficient to detect garbage content.

**Output format enforcement:** The LLM is asked to respond in strict JSON: `{"is_valid": true/false, "reason": "..."}`. The function then strips any markdown code fences and parses the JSON.

**Fail-safe:** If the LLM call itself fails (network error, parse error), the function returns `{"is_valid": True}` — it errs on the side of allowing content rather than blocking legitimate users due to a transient error.

### `ingest_node(state)` — Review Fetcher
Performs a FAISS similarity search using `state["query"]` (which is always `"general product feedback"` for dashboard analysis) with `k = total documents`. This effectively retrieves **all reviews** from the index into the state for the agents to process.

### `run_identity_agent(state)` — Product Name + Rating
- Uses only the first 20 reviews (identity doesn't need the full dataset)
- If a product name already exists in the state (detected from JSON metadata), instructs the LLM to use it
- Parses the LLM response with `re.search()` for `NAME:` and `RATING:` patterns
- Returns `product_name` and `predicted_rating`

### `run_descriptive_agent(state)` — The Big Text Agent
The most complex agent. Uses a 30-review representative sample (10 from start, 10 from middle, 10 from end).

**Output it produces:**
- `[[SHORT]]` — 3-sentence executive summary
- `[[DETAILED]]` — structured breakdown under 400 words
- `[[PROS]]` — bulleted strength list
- `[[CONS]]` — bulleted weakness list
- `[[KEYWORDS]]` — exactly 5 unique product features, comma-separated
- `[[STRENGTH]]` — single biggest strength phrase
- `[[COMPLAINT]]` — single biggest complaint phrase
- `[[REQUEST]]` — most requested feature phrase

**`extract_section(text, start_marker, end_markers)`** — The key internal parsing function. Uses a complex regex that handles:
- `[[MARKER]]` style headers
- `**MARKER**` bold headers
- `## MARKER` heading-style headers
- Line-start `- MARKER:` list-style headers

This regex was carefully built to handle the many different ways the LLM might format its output.

**Fail-safe fallbacks:** If any section comes back empty or as "Analysis failed.", hardcoded sensible defaults are used. This ensures the frontend never shows broken data.

### `run_scoring_agent(state)` — Sentiment + Aspects
**Sentiment classification — batch processing:**
All reviews are de-duplicated using `dict.fromkeys()` (which preserves order), then processed in batches of 50. For each batch, the LLM classifies every review as POSITIVE, NEGATIVE, or NEUTRAL using a detailed rubric that accounts for edge cases like "forgiven flaws" and "accessory complaints."

**Weighted score formula:**
```python
score = ((pos + 0.5 * neu) / total_for_score) * 10
```
Neutrals count half as much as positives — a product with all-neutral reviews scores 5/10.

**Aspect analysis:**
A separate LLM call on the first 100 reviews extracts product attributes (e.g., Performance, Display, Battery) and scores each on a 1–10 scale. Output is `**Attribute**: X/10` format.

### `run_timeline_agent(state)` — Historical Sentiment Trend
Processes reviews in batches of 100. For each batch, asks the LLM to extract:
- The date of each review
- A sentiment score (1–10) for that review

Uses `re.findall(r"(?:-\s*)?([\d-]{10}):\s*([\d.]+)", out)` to parse date-score pairs. Results are sorted by date to produce a chronological trend array for the line chart.

### `run_security_agent(state)` — Authenticity Audit
Analyses the first 30 reviews for signs of fake/spam content. Looks for:
- Overly generic praise
- Promotional links
- Suspicious patterns

Returns a structured trust score and flagged review list.

### `compile_dashboard(state)` — Terminal Node
Simply returns the state unchanged. This is a required terminal node in the LangGraph pipeline — all branches must converge here before the graph reaches `END`.

---

## 8. Backend — Chat Agent: `backend/agents/chat.py`

**Role:** Implements the two-node RAG (Retrieval-Augmented Generation) pipeline for the Q&A chat feature.

### `llm = get_llm(0.3)` — Module Level
One LLM instance shared across all chat calls. Temperature 0.3 gives slightly more natural, conversational responses while still being factually grounded.

### `retrieve_chat_context(state)` — Node 1: Retrieval
```python
latest_query = state["messages"][-1].content   # The user's latest message
```

**Query augmentation:** If the user's question is fewer than 5 words (e.g., "battery?"), the product name is prepended: `"ZenithBook Pro 14 battery?"`. This dramatically improves FAISS retrieval relevance for vague queries.

```python
docs = db.similarity_search(search_query, k=5)
```
Retrieves the 5 most semantically similar reviews to the query. These become the "context" passed to the LLM.

### `generate_chat_answer(state)` — Node 2: Generation
Builds a `ChatPromptTemplate` with:
- A system prompt identifying the product and instructing strict Markdown formatting
- `{context}` — the 5 retrieved review snippets
- `MessagesPlaceholder` — the full conversation history (LangChain handles this automatically)

The chain is `qa_prompt | llm` — LangChain's pipe operator connects the prompt template to the LLM. The LLM receives the formatted prompt and returns a response. `clean_llm_output()` strips any `<think>` tags.

---

## 9. Backend — Orchestrator: `backend/services/orchestrator.py`

**Role:** Assembles the individual agent functions into executable LangGraph directed graphs (state machines).

### `get_dashboard_orchestrator()`

Creates a `StateGraph(DashboardState)` — a directed graph where nodes are the agent functions and edges define the execution order.

**Graph topology:**
```
START → ingest → validate ──(valid)──→ identity ──┬──→ descriptive ──→ compile → END
                          └─(invalid)──→ compile   ├──→ scoring    ──→ compile
                                                   ├──→ timeline   ──→ compile
                                                   └──→ security   ──→ compile
```

Key design decisions:
- **Conditional edge after `validate`:** Uses `check_validity()` to route to `identity` if valid, or skip directly to `compile` if invalid (saving all LLM cost)
- **Fan-out from `identity`:** `identity` fans out to `descriptive`, `scoring`, `timeline`, and `security` — LangGraph runs these in parallel (fan-out). All four then converge back at `compile`
- **`compile` merges state:** When multiple branches write to the same state keys, LangGraph merges them automatically. `compile_dashboard()` just returns the already-merged state

### `get_chat_orchestrator()`

A simpler two-node graph: `retrieve → answer`. The key addition is:
```python
memory = MemorySaver()
return chat_workflow.compile(checkpointer=memory)
```
`MemorySaver` is an in-memory checkpointer that stores conversation state keyed by `thread_id`. This is what gives the chat feature **multi-turn memory** — each new message appends to the existing `messages` list for that thread.

### Module-level instances
```python
dashboard_orchestrator = get_dashboard_orchestrator()
chat_orchestrator = get_chat_orchestrator()
```
These are created once when the module is first imported. Compiled LangGraph graphs are reusable and thread-safe.

---

## 10. Backend — PDF Reporter: `backend/services/reporter.py`

**Role:** Takes the analysis JSON from disk and generates a polished, multi-section PDF executive report using the ReportLab library.

### `generate_report_pdf(analysis)` function

**Document setup:**
```python
doc = SimpleDocTemplate(buffer, pagesize=letter, ...)
story = []   # List of ReportLab "flowables" (paragraphs, tables, spacers, etc.)
```
A `BytesIO` buffer is used instead of a file — the PDF is generated entirely in memory and streamed directly to the browser.

**Report sections built in order:**

1. **Blue header banner** — A 2-cell `Table` with a solid `#005cbb` background. Uses `TableStyle` to apply colour and padding. The product name and generation metadata sit inside.

2. **Metadata grid** — A 2×2 table showing product name, date, total reviews, and predicted rating.

3. **Executive Summary box** — The short summary text in a styled `KeepTogether` block (prevents page breaks splitting it).

4. **Keywords container** — The top keywords displayed as styled "pill" badges laid out in a nested `Table`.

5. **Strengths & Weaknesses grid** — A 2-column table where left column = pros (green theme), right column = cons (red theme). Each item is parsed from the bulleted pros/cons strings using regex.

6. **Aspect Analysis scorecards** — For each aspect attribute (parsed from the aspect_analysis string), a scorecard row is rendered with a filled progress bar using `Table` cells with background colours.

7. **Authenticity Audit section** — The fake review analysis text, rendered in a styled box.

8. **Page break** then **Detailed Summary** on a second page.

The final `doc.build(story)` call writes all flowables to the `BytesIO` buffer, which is then returned as bytes.

---

## 11. Frontend — Entry Point: `frontend/src/main.jsx`

```jsx
createRoot(document.getElementById('root')).render(
  <StrictMode><App /></StrictMode>
)
```
This is the absolute starting point of the React application. It:
1. Finds the `<div id="root">` in `index.html`
2. Creates a React root DOM node there
3. Renders `<App />` wrapped in `<StrictMode>` (which enables extra runtime warnings in development)
4. Imports `index.css` which loads the Tailwind CSS utility classes

---

## 12. Frontend — App Router: `frontend/src/App.jsx`

**Role:** Defines the URL routing for the entire single-page application using React Router.

```jsx
<AuthProvider>          ← Wraps everything in the global auth context
  <Router>              ← BrowserRouter — uses the HTML5 History API for URL changes
    <Routes>            ← Renders only the first matching route
      <Route path="/" element={<LandingDark />} />
      <Route path="/login" element={<LoginDark />} />
      <Route path="/dashboard" element={<DashboardDark />} />
      <Route path="/upload" element={<FileUploadDark />} />
      <Route path="/analysis" element={<AnalysisResultsDark />} />
      <Route path="/chat" element={<ChatInterfaceDark />} />
      <Route path="/review" element={<ReviewDetailDark />} />
    </Routes>
  </Router>
</AuthProvider>
```

`AuthProvider` must be the outermost wrapper so that any page component can access the logged-in user via `useAuth()`. The router uses client-side navigation — clicking links changes the URL and swaps the rendered component without a full page reload.

---

## 13. Frontend — Firebase Config: `frontend/src/firebase.js`

**Role:** Initialises the Firebase SDK and exports authentication utilities.

```js
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  ...
}
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
```

- `import.meta.env.VITE_*` — Vite's way of reading environment variables from `frontend/.env`. Variables must be prefixed `VITE_` to be exposed to the browser bundle.
- `auth` — the Firebase Auth instance, used by `AuthContext` to listen for login state
- `googleProvider` — the Google OAuth provider config, used by `signInWithPopup`

### Exported functions

**`signInWithGoogle()`** — Triggers the Google OAuth popup. On success, returns the Firebase `user` object (which contains `uid`, `email`, `displayName`, `photoURL`).

**`logout()`** — Calls `signOut(auth)` which clears the Firebase session token from `localStorage` and triggers the `onAuthStateChanged` listener with `null`.

---

## 14. Frontend — Auth Context: `frontend/src/AuthContext.jsx`

**Role:** Creates a React Context that makes the current user object available to any component in the tree without prop drilling.

### `AuthProvider` component
```jsx
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);   // null = logged out, User object = logged in
    setLoading(false);
  });
  return () => unsubscribe();  // Cleanup: stop listening when component unmounts
}, []);
```

`onAuthStateChanged` is a Firebase real-time listener. It fires:
- On initial app load (reads from Firebase's persisted local session)
- Whenever the user logs in
- Whenever the user logs out

The `loading` state prevents the app from rendering until Firebase has confirmed the auth state — this prevents a flash of the wrong UI (e.g., showing login button briefly before recognising a logged-in user).

`{!loading && children}` — only renders child components after auth state is known.

### `useAuth()` hook
```jsx
export const useAuth = () => useContext(AuthContext);
```
A custom hook that any component can call to get `{ user, loading }`.

---

## 15. Frontend — Profile Dropdown: `frontend/src/components/ProfileDropdown.jsx`

**Role:** The user profile button and dropdown menu shown in every page's navigation bar.

### Conditional rendering
```jsx
if (!user) {
  return <Link to="/login">Login</Link>;  // Show Login button if not authenticated
}
```

When logged in, displays:
- **Google profile photo** via `<img src={user.photoURL} referrerPolicy="no-referrer" />` — the `referrerPolicy` attribute is required to prevent Google from blocking the image load
- **Fallback avatar** — if no photo URL, shows the user's initial letter in a styled circle
- **Click to toggle** — `useState(false)` controls whether the dropdown card is visible

### Dropdown card contents
- User's display name and email
- "Go to Landing Page" link
- "View Dashboard" link
- "Sign Out" button — calls `logout()` then uses React Router's `navigate('/')` to redirect to home

### Click-outside backdrop
```jsx
{isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
```
An invisible full-screen div sits behind the dropdown but above the page content. Clicking anywhere outside the dropdown triggers this div's `onClick`, closing the dropdown — standard UX pattern.

---

## 16. Frontend — Landing Page: `frontend/src/pages/Landing_Dark.jsx`

**Role:** The public home/marketing page at `/`. Introduces the product and its features.

### Key sections

**Navigation bar** — Uses `ProfileDropdown` — shows Login or avatar based on auth state. If the user is already logged in, shows the profile icon instead of a login button.

**Hero section** — Large headline, subheadline, two CTA buttons (Upload Reviews → `/upload`, Explore Dashboard → `/dashboard`), and animated background gradient orbs.

**"Experience the Workflow" carousel** — A custom-built carousel (no external library):
- `steps` array defines 4 workflow cards (Upload & Validate, AI Analysis, PDF Export, Q&A Engine)
- `activeStep` state controls which card is visible
- The sliding container uses `transform: translateX(-${activeStep * 100}%)` — a pure CSS translation that moves all 4 cards in a row, revealing one at a time
- Each card has a custom visual preview (upload dropzone, metrics display, PDF mockup, chat interface)
- Navigation arrows + clickable dot indicators below the box

**Feature highlights grid** — Cards for each key feature (Gatekeeper, Multi-Agent, Dashboard, PDF, Q&A, Auth)

**"Complex data, curated for clarity" section** — Left text + right interactive feature preview

**Footer** — Links and copyright

---

## 17. Frontend — Login Page: `frontend/src/pages/Login_Dark.jsx`

**Role:** The authentication page at `/login`.

### `handleGoogleLogin()`
```jsx
const user = await signInWithGoogle();   // Opens Google OAuth popup
navigate('/dashboard');                  // Redirect after successful login
```

Error state is stored in `useState` and displayed as a red banner if the OAuth flow fails.

### UI structure
- **Google Sign-In button** — Uses the official Google SVG logo colours
- **Disabled email/password fields** — Visual placeholders shown at 50% opacity with `disabled` attribute. These indicate future functionality without being interactive.
- **Background ambient glows** — Two large blurred `div` elements with primary/tertiary colours create the depth effect

---

## 18. Frontend — File Upload Page: `frontend/src/pages/FileUpload_Dark.jsx`

**Role:** The upload interface at `/upload`. Handles drag-and-drop, file selection, sample loading, and displays the gatekeeper validation result.

### Key state
- `file` — the selected `File` object
- `uploadStatus` — `'idle' | 'uploading' | 'success' | 'error'`
- `message` — response text from the backend

### `handleUpload()`
```jsx
const formData = new FormData();
formData.append('file', file);
const response = await fetch('http://localhost:8000/upload', {
  method: 'POST',
  headers: { 'x-user-id': user.uid },   // Firebase UID for user isolation
  body: formData
});
```
Sends the file as multipart form data. The `x-user-id` header tells the backend which user's FAISS folder to write to.

### Drag & Drop
`onDragOver`, `onDragLeave`, `onDrop` event handlers manage a `isDragging` boolean state that applies a visual highlight to the drop zone border.

### Sample Files
Buttons for `laptop_reviews.txt` and `smartphone_reviews.txt` call the `/upload_sample` endpoint with the filename as a query parameter — no file selection needed.

### Post-upload navigation
On success, a "Go to Dashboard" button appears that navigates to `/dashboard`.

---

## 19. Frontend — Dashboard Page: `frontend/src/pages/Dashboard_Dark.jsx`

**Role:** The main analytics dashboard at `/dashboard`. The largest frontend file — renders all the charts and metrics from the analysis result.

### Data flow
On mount, `useEffect` calls `GET /analyze` with the user's UID header:
```jsx
const res = await fetch('http://localhost:8000/analyze', {
  headers: { 'x-user-id': user.uid }
});
const data = await res.json();
setAnalysis(data);
```

If analysis is already cached, this returns instantly. Otherwise it waits for all LangGraph agents to complete.

### Product switcher
Calls `GET /products` to get the list and `POST /select_product?product_id=...` to switch the active index. After switching, triggers a re-analysis.

### Visualisation components (all built with vanilla CSS/divs — no chart library)

**Sentiment Donut Chart:**
- Uses CSS `conic-gradient()` to render a donut chart: `conic-gradient(#4CAF50 0% 65%, #FF9800 65% 80%, #F44336 80% 100%)`
- The percentages are calculated from the `sentiment_distribution` counts

**Historical Sentiment Timeline:**
- Renders a line chart using absolutely positioned `div` elements with `bottom` percentage
- Each data point is a small circle, connected by a line using `width` and CSS `transform: rotate()`

**Aspect Scorecards:**
- Parses the `**Aspect Name**: X/10` format from the LLM output using regex
- Renders each as a labelled progress bar using `width: ${score * 10}%`

**Top Keywords:**
- Splits the comma-separated `keyword_analysis` string
- Renders each as a styled badge/chip

**Strengths & Weaknesses cards:**
- Parses the bulleted `pros`/`cons` strings line by line
- Renders each bullet as a list item with green/red colour coding

### PDF Export button
Calls `GET /export_pdf?product_id=...` with the user's UID. Uses `window.URL.createObjectURL(blob)` to create a temporary download link and triggers a click programmatically — standard browser download pattern.

---

## 20. Frontend — Analysis Results Page: `frontend/src/pages/AnalysisResults_Dark.jsx`

**Role:** A detailed analysis view at `/analysis` showing in-depth text content from the analysis.

Shows:
- Product header with rating badge
- Full detailed summary (multi-paragraph)
- Strengths and Weaknesses cards (matching dashboard)
- Aspect attribute scores
- Authenticity/fake review audit section
- Export PDF button

The page reads from the same `GET /analyze` endpoint as the dashboard, so the data is always consistent and cached.

---

## 21. Frontend — Chat Interface Page: `frontend/src/pages/ChatInterface_Dark.jsx`

**Role:** The conversational Q&A interface at `/chat`.

### State
- `messages` — array of `{role: 'user'|'assistant', content: string}` objects
- `input` — current text in the input box
- `isLoading` — shows typing indicator when waiting for API

### `sendMessage()`
```jsx
const res = await fetch('http://localhost:8000/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': user.uid
  },
  body: JSON.stringify({
    message: input,
    thread_id: threadId   // Stable UUID generated once per page load
  })
});
```
The `thread_id` is generated with `crypto.randomUUID()` when the component mounts. The same thread_id is used for all messages in the session — this is how the backend's `MemorySaver` maintains conversational context.

### Message rendering
Assistant responses contain Markdown (bold text, bullet points, headers). These are rendered using `react-markdown` which converts Markdown syntax to proper HTML elements.

### Auto-scroll
`useEffect` on the `messages` array calls `messagesEndRef.current?.scrollIntoView()` to automatically scroll to the bottom when a new message arrives.

---

## 22. Frontend — Review Detail Page: `frontend/src/pages/ReviewDetail_Dark.jsx`

**Role:** A supplementary page at `/review` that shows individual review details. Receives review data via React Router's location state (passed as `navigate('/review', { state: { review } })`).

Shows the full text of a single review with formatting, source metadata, and a back navigation button.

---

## 23. Config & Infrastructure Files

### `frontend/src/main.jsx`
React's entry point — mounts `<App />` into the HTML root div.

### `frontend/index.html`
The single HTML file for the entire app. Contains:
- Google Fonts link for `Inter` and `Outfit` typography
- Material Symbols icon font CDN link
- Tailwind CSS CDN link
- `<div id="root">` — where React mounts
- `<script type="module" src="/src/main.jsx">` — Vite's module entry point

### `frontend/vite.config.js`
```js
export default defineConfig({ plugins: [react()] })
```
Minimal Vite config — just enables the React plugin (which handles JSX transpilation and React Fast Refresh for hot module replacement).

### `frontend/package.json`
Key runtime dependencies:
- `react` + `react-dom` v19 — the UI framework
- `react-router-dom` v7 — client-side routing
- `firebase` v12 — Google OAuth authentication
- `react-markdown` — renders LLM Markdown responses as HTML
- `lucide-react` — icon components

### `.env.example` (backend root)
Template showing the single required `GROQ_API_KEY` plus optional `LANGCHAIN_*` tracing variables.

### `frontend/.env.example`
Template for the 6 Firebase `VITE_*` variables needed for Google Auth.

### `requirements.txt`
Pinned Python dependencies for reproducible installs, grouped by category (web framework, LangChain, embeddings, PDF, data, HTTP, utilities).

### `.gitignore`
Ensures the following are never committed:
- `.env` files (contain secrets)
- `venv/` (Python environment — machine-specific)
- `data/` (runtime FAISS indices — user data)
- `__pycache__/` (Python bytecode)
- `node_modules/` (npm packages)
- `dist/` (production build output)
- Generated PDF test files

---

## 24. Data Flow: End-to-End Walkthrough

Here is the complete journey of a user from first visit to getting an AI answer:

```
1. User visits http://localhost:5173/
   → Landing_Dark.jsx renders
   → AuthProvider checks Firebase session (auto-login if previously signed in)

2. User clicks "Login" → /login
   → Login_Dark.jsx renders
   → User clicks "Continue with Google"
   → Firebase opens Google OAuth popup
   → On success: Firebase stores session token in localStorage
   → onAuthStateChanged fires → AuthContext.user is set
   → navigate('/dashboard') is called

3. User goes to /upload
   → FileUpload_Dark.jsx renders
   → User drops "laptop_reviews.txt" on the dropzone
   → handleUpload() called:
       → POST /upload with file bytes + x-user-id: firebase_uid
       → Backend: process_content() runs:
           → SHA-256 hash computed
           → Heuristic check (not HTML/code)
           → Format detected (plain text, split by newlines)
           → validate_node() called → LLM confirms it's reviews
           → run_identity_agent() → extracts "ZenithBook Pro 14"
           → Hash check → no existing hash → new product
           → FAISS index created from embedded reviews
           → Saved to data/faiss_index/<uid>/ZenithBook_Pro_14/
   → Response: { message: "Successfully loaded 48 reviews...", product_id: "ZenithBook_Pro_14" }

4. User clicks "Go to Dashboard" → /dashboard
   → Dashboard_Dark.jsx renders
   → useEffect: GET /analyze with x-user-id header
   → Backend: no cached analysis.json found → runs dashboard_orchestrator
       → ingest_node: retrieves all 48 reviews from FAISS
       → validate_node: confirms still valid
       → identity: "ZenithBook Pro 14", "4/5 Stars"
       ↓ Fan-out (parallel):
       → descriptive: summary, pros, cons, keywords
       → scoring: 31 positive, 10 neutral, 7 negative → sentiment_distribution
       → timeline: 48 date-score pairs → sentiment_trend
       → security: "Trust Score: 82%"
       ↓ compile: merges all results
   → save_analysis_data(result) → writes analysis.json
   → Returns full analysis JSON
   → Dashboard renders: donut chart, timeline, scorecards, keywords, pros/cons

5. User clicks "Export PDF"
   → GET /export_pdf?product_id=ZenithBook_Pro_14
   → Backend: loads analysis.json → generate_report_pdf() → streams PDF bytes
   → Browser: blob URL created → file download triggered

6. User goes to /chat
   → ChatInterface_Dark.jsx renders
   → User types "What do people say about the battery?"
   → POST /chat { message: "...", thread_id: "abc-123" }
   → Backend: chat_orchestrator.invoke():
       → retrieve_chat_context: FAISS similarity_search("ZenithBook Pro 14 battery?", k=5)
           → Returns 5 most relevant review snippets
       → generate_chat_answer: LLM answers using those 5 snippets as context
   → Response: "Based on 15 reviewers, battery life is decent for office work but drops significantly under gaming load..."
   → react-markdown renders the response with bold headers and bullet points
```

---

*This document covers every file, function, and design decision in the ReviewMind AI codebase. Use it to explain the architecture, justify technical choices, and walk through any part of the system in an interview.*
