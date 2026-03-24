# 🌿 Plant Health AI System

> An AI-powered plant disease analysis system. Upload a leaf photo — instantly get a health assessment, disease diagnosis, plain-language explanation, and an interactive AI chat assistant. Supports **English** and **Tamil**.

---

## Table of Contents

1. [What It Does](#what-it-does)
2. [Tech Stack](#tech-stack)
3. [System Architecture](#system-architecture)
4. [Agent Design](#agent-design)
5. [ML Models](#ml-models)
6. [Health Level Logic](#health-level-logic)
7. [Project Structure](#project-structure)
8. [Prerequisites](#prerequisites)
9. [Installation — Step by Step](#installation--step-by-step)
   - [Step 1: Clone the Repository](#step-1-clone-the-repository)
   - [Step 2: Set Up Python Virtual Environment](#step-2-set-up-python-virtual-environment)
   - [Step 3: Install Python Dependencies](#step-3-install-python-dependencies)
   - [Step 4: Get API Keys](#step-4-get-api-keys)
   - [Step 5: Create and Configure the .env.local File](#step-5-create-and-configure-the-envlocal-file)
   - [Step 6: Install Node.js Dependencies](#step-6-install-nodejs-dependencies)
   - [Step 7: Start the Flask ML Server](#step-7-start-the-flask-ml-server)
   - [Step 8: Start the Next.js Frontend](#step-8-start-the-nextjs-frontend)
   - [Step 9: Open the App](#step-9-open-the-app)
10. [How to Use the App](#how-to-use-the-app)
11. [API Reference](#api-reference)
12. [Supported Plants & Diseases](#supported-plants--diseases)
13. [Troubleshooting](#troubleshooting)
14. [Environment Variables Reference](#environment-variables-reference)

---

## What It Does

| Feature | Description |
|---------|-------------|
| **Leaf Analysis** | Upload a JPG, PNG, or WEBP photo of a plant leaf |
| **Health Grading** | 4-level grading: Healthy / Mildly / Moderately / Severely Affected |
| **Disease ID** | Detects 38 different plant conditions across 14 crop types |
| **AI Explanation** | Plain-language explanation of the condition (via LLM) |
| **Disease Details** | Static knowledge base: cause, how it spreads, treatment type, prevention tips |
| **AI Chat** | Ask follow-up questions — streaming responses, full context-aware |
| **Dual Language** | All outputs available in English and Tamil (தமிழ்) |
| **Dual Model** | Two ML models run in parallel for better accuracy |

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend | Next.js (App Router) | 16.2.1 | UI, routing, API routes |
| Language | TypeScript | 5.x | Type safety |
| Styling | Tailwind CSS v4 | 4.x | Utility classes + CSS variables |
| Backend | Python Flask | 3.x | ML inference server |
| Primary ML | HuggingFace Transformers | 4.27+ | MobileNetV2 plant disease classifier |
| Secondary ML | PyTorch / torchvision | 2.2+ | MobileNetV2 (torchvision, PlantVillage) |
| Explanation LLM | OpenRouter | — | `meta-llama/llama-3.2-11b-vision-instruct` |
| Chat LLM | Groq | — | `llama-3.3-70b-versatile` (streaming) |
| Fonts | Google Fonts | — | Playfair Display + DM Sans |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER BROWSER                         │
│                    http://localhost:3000                     │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS / fetch
┌──────────────────────────▼──────────────────────────────────┐
│                  NEXT.JS APP (Frontend + API)                │
│                                                             │
│  ┌─────────────┐   ┌──────────────┐   ┌─────────────────┐  │
│  │  Agent 1    │   │   Agent 2    │   │    Agent 3      │  │
│  │  /classify  │   │  /explain    │   │    /chat        │  │
│  │             │   │              │   │                 │  │
│  │ Ensemble +  │   │  OpenRouter  │   │  Groq Streaming │  │
│  │ Health Map  │   │  LLM Prompt  │   │  Q&A w/ Context │  │
│  └──────┬──────┘   └──────────────┘   └─────────────────┘  │
└─────────┼───────────────────────────────────────────────────┘
          │ POST /predict
┌─────────▼───────────────────────────────────────────────────┐
│              FLASK ML SERVER (http://localhost:5000)         │
│                                                             │
│  ┌──────────────────────┐   ┌──────────────────────────┐   │
│  │  Primary Model       │   │  Secondary Model         │   │
│  │  HuggingFace         │   │  torchvision             │   │
│  │  MobileNetV2         │   │  MobileNetV2             │   │
│  │  (pytorch_model.bin) │   │  (mobilenetv2_plant.pth) │   │
│  │  ~9MB                │   │  ~9MB                    │   │
│  └──────────────────────┘   └──────────────────────────┘   │
│           Both run in PARALLEL (ThreadPoolExecutor)         │
└─────────────────────────────────────────────────────────────┘
```

**Data flow:**

1. User uploads leaf image on `/analyze`
2. Frontend converts image to base64
3. Next.js **Classify Agent** → POST to Flask `/predict`
4. Flask runs both models in parallel, returns `primary` + `secondary` results
5. Classify Agent runs ensemble logic → produces `classificationResult`
6. Next.js **Explain Agent** → calls OpenRouter LLM → returns explanation, symptoms, immediate action
7. Frontend renders results (ResultCard + ChatPanel)
8. User asks a question → **Chat Agent** → Groq streams response

---

## Agent Design

The system is built on a **3-agent architecture**. Each agent has exactly one responsibility and is a standalone Next.js API route.

### Agent 1 — Vision Classification Agent
**Route:** `POST /api/agents/classify`

- Receives base64 image from the frontend
- Forwards it to Flask `/predict`
- Flask runs both ML models in parallel
- Applies ensemble logic:
  - Primary model (HuggingFace) is authoritative
  - If secondary model agrees on healthy/diseased, confidence is blended 70/30
- Maps label → health level, confidence flag
- Returns: `classificationResult`

### Agent 2 — Explanation Agent
**Route:** `POST /api/agents/explain`
**LLM:** OpenRouter → `meta-llama/llama-3.2-11b-vision-instruct`

- Receives `classificationResult` + `language`
- Sends structured prompt to the LLM
- LLM returns JSON: `{ explanation, symptoms[], immediateAction }`
- Handles English and Tamil outputs
- Returns parsed explanation object

### Agent 3 — Chat Agent
**Route:** `POST /api/agents/chat`
**LLM:** Groq → `llama-3.3-70b-versatile`

- Receives full conversation history + `classificationResult` + `language`
- Builds a system prompt with plant/disease context
- Streams response back using Groq streaming API
- Frontend receives text chunks in real time
- Full conversation history is sent on every request (stateless server, stateful client)

---

## ML Models

### Primary Model — HuggingFace MobileNetV2

| Property | Value |
|----------|-------|
| Source | `linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification` (HuggingFace) |
| File | `models/mobilenet_v2_1.0_224-plant-disease-identification/pytorch_model.bin` |
| Architecture | `MobileNetV2ForImageClassification` (transformers library) |
| Input size | 224 × 224 px (center-cropped from 256px) |
| Normalization | mean = [0.5, 0.5, 0.5] · std = [0.5, 0.5, 0.5] |
| Output | 38 classes — human-readable labels (e.g. `"Tomato with Early Blight"`) |
| Eval accuracy | **78.6%** (8 epochs on PlantVillage) |
| Model size | ~9 MB |

### Secondary Model — torchvision MobileNetV2

| Property | Value |
|----------|-------|
| File | `models/mobilenetv2_plant.pth` |
| Architecture | `torchvision.models.mobilenet_v2`, final layer replaced with Linear(1280, 38) |
| Input size | 224 × 224 px |
| Normalization | ImageNet — mean = [0.485, 0.456, 0.406] · std = [0.229, 0.224, 0.225] |
| Output | 38 classes — PlantVillage-style labels (e.g. `"Tomato___Early_blight"`) |
| Model size | ~9 MB |

### Ensemble Logic

```
Flask returns:
  primary   → { label: "Tomato with Early Blight", confidence: 0.91 }  ← authoritative
  secondary → { label: "Tomato___Early_blight",    confidence: 0.85 }  ← optional

If secondary is available AND agrees (healthy/diseased match):
  final_confidence = primary.confidence × 0.70 + secondary.confidence × 0.30

Confidence flag:
  ≥ 0.85  → "high"     (shown in green)
  0.60–0.84 → "moderate" (shown in amber)
  < 0.60  → "low"      (warning box shown)
```

---

## Health Level Logic

| Health Level | Condition |
|-------------|-----------|
| 🟢 **Healthy** | Model predicted a healthy class |
| 🟡 **Mildly Affected** | Diseased + confidence < 70% |
| 🟠 **Moderately Affected** | Diseased + confidence 70–84% |
| 🔴 **Severely Affected** | Diseased + confidence ≥ 85%, OR severe disease keywords (late blight, virus, curl, greening, esca) with confidence ≥ 70% |

---

## Project Structure

```
PlantDisease/
│
├── README.md                          ← You are here
├── PROGRESS.md                        ← Build tracking
│
├── models/                            ← ML model files (source)
│   ├── mobilenet_v2_1.0_224-plant-disease-identification/
│   │   ├── pytorch_model.bin          ← Primary model weights (~9MB)
│   │   ├── config.json                ← Model config + id2label map
│   │   └── preprocessor_config.json   ← Image preprocessing config
│   └── mobilenetv2_plant.pth          ← Secondary model weights (~9MB)
│
├── backend/                           ← Python Flask ML server
│   ├── app.py                         ← Main Flask app (model loading + /predict)
│   ├── class_labels.py                ← 38-class label list (secondary model)
│   ├── requirements.txt               ← Python dependencies
│   └── models/                        ← Symlinked / copied model files
│       ├── mobilenet_v2_1.0_224-plant-disease-identification/
│       └── mobilenetv2_plant.pth
│
└── frontend/                          ← Next.js 16 app
    ├── .env.local                     ← API keys (YOU MUST EDIT THIS)
    ├── package.json
    ├── next.config.ts
    ├── tsconfig.json
    │
    ├── app/
    │   ├── layout.tsx                 ← Root layout (Google Fonts loaded here)
    │   ├── globals.css                ← Design tokens, animations, scrollbar
    │   ├── page.tsx                   ← Home page (/ route)
    │   ├── analyze/
    │   │   └── page.tsx               ← Analysis page (/analyze route)
    │   └── api/
    │       └── agents/
    │           ├── classify/
    │           │   └── route.ts       ← Agent 1: Vision Classification
    │           ├── explain/
    │           │   └── route.ts       ← Agent 2: Explanation (OpenRouter)
    │           └── chat/
    │               └── route.ts       ← Agent 3: Chat (Groq streaming)
    │
    ├── components/
    │   ├── ChatPanel.tsx              ← Scrollable streaming chat UI (600px)
    │   ├── HealthBadge.tsx            ← Color-coded health level pill
    │   ├── ImageUpload.tsx            ← Drag-and-drop image dropzone
    │   ├── LanguageToggle.tsx         ← EN / தமிழ் pill toggle
    │   ├── QuoteCarousel.tsx          ← Rotating nature quotes (10s fade)
    │   └── ResultCard.tsx             ← Full result card with disease details
    │
    └── lib/
        ├── diseaseKnowledge.ts        ← Static knowledge base (38 diseases)
        ├── groq.ts                    ← Groq SDK client
        └── openrouter.ts              ← OpenRouter (OpenAI-compatible) client
```

---

## Prerequisites

Before you begin, make sure you have these installed on your machine:

| Requirement | Minimum Version | How to Check | Download |
|-------------|----------------|--------------|----------|
| **Python** | 3.10 | `python --version` | [python.org](https://www.python.org/downloads/) |
| **pip** | 21+ | `pip --version` | Comes with Python |
| **Node.js** | 18.x | `node --version` | [nodejs.org](https://nodejs.org/) |
| **npm** | 9.x | `npm --version` | Comes with Node.js |
| **Git** | Any | `git --version` | [git-scm.com](https://git-scm.com/) |

You also need free API keys from:
- **OpenRouter** — for the explanation LLM
- **Groq** — for the chat LLM

Both are free to sign up with no credit card required.

---

## Installation — Step by Step

### Step 1: Clone the Repository

Open a terminal and run:

```bash
git clone https://github.com/shalomarputhasingh/PlantDiseaseFinder.git
cd PlantDiseaseFinder
```

After cloning, verify your folder structure looks like this:

```
PlantDiseaseFinder/
├── backend/
│   ├── app.py
│   ├── class_labels.py
│   └── requirements.txt
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── package.json
├── models/
│   ├── mobilenet_v2_1.0_224-plant-disease-identification/
│   │   ├── pytorch_model.bin     ← primary model weights
│   │   └── config.json
│   └── mobilenetv2_plant.pth     ← secondary model weights
└── README.md
```

> If any model file is missing, re-run `git pull` to make sure everything downloaded correctly.

---

### Step 2: Set Up Python Virtual Environment

A virtual environment keeps the project's Python packages isolated from your system Python. This is strongly recommended.

**On Windows (Command Prompt or PowerShell):**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
```

**On Windows (Git Bash):**
```bash
cd backend
python -m venv venv
source venv/Scripts/activate
```

**On macOS / Linux:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

After activation you will see `(venv)` at the start of your terminal prompt:
```
(venv) C:\...\backend>
```

> Keep this terminal open — you will run `python app.py` here in Step 7.
> To deactivate later: run `deactivate`

---

### Step 3: Install Python Dependencies

With the virtual environment active, install all required packages:

```bash
pip install -r requirements.txt
```

This installs:

| Package | Version | Purpose |
|---------|---------|---------|
| `flask` | ≥ 3.0 | Web framework for the ML API server |
| `flask-cors` | ≥ 4.0 | Allow Next.js (port 3000) to call Flask (port 5000) |
| `torch` | ≥ 2.2 | PyTorch deep learning framework |
| `torchvision` | ≥ 0.17 | Image transforms + secondary MobileNetV2 architecture |
| `transformers` | ≥ 4.27 | HuggingFace library — loads the primary model |
| `pillow` | ≥ 10.0 | Image decoding (JPEG, PNG, WEBP) |

Expected output ends with:
```
Successfully installed flask-3.x torch-2.x torchvision-0.x transformers-4.x ...
```

> **PyTorch download is large (~2GB).** The first install may take 5–15 minutes on a slow connection. Be patient — it only happens once.

> **GPU acceleration (optional):** If you have an NVIDIA GPU, install the CUDA build for faster inference:
> ```bash
> pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
> ```
> The app works fine on CPU — CUDA is optional.

---

### Step 4: Get Your API Keys

This app needs two free API keys — one for generating explanations, one for the chat assistant. Both are completely free to sign up for, no credit card required.

---

#### 4a. OpenRouter API Key (for the Explanation Agent)

The Explanation Agent uses `meta-llama/llama-3.2-11b-vision-instruct` via OpenRouter.

1. Open your browser and go to **https://openrouter.ai**
2. Click **Sign In** in the top right → choose Google, GitHub, or email
3. Once logged in, click your avatar → **Keys**
4. Click **+ Create Key**, give it a name like `PlantHealthAI`
5. Copy the key immediately — it looks like:
   ```
   sk-or-v1-a1b2c3d4e5f6...
   ```
   > You can only see the full key once. Save it somewhere before closing the page.

The free tier provides enough credits to run this app for personal use.

---

#### 4b. Groq API Key (for the Chat Agent)

The Chat Agent uses `llama-3.3-70b-versatile` via Groq for fast streaming responses.

1. Go to **https://console.groq.com**
2. Click **Sign Up** → create an account with Google or email
3. After logging in, click **API Keys** in the left sidebar
4. Click **+ Create API Key**, name it `PlantHealthAI`
5. Copy the key — it looks like:
   ```
   gsk_a1b2c3d4e5f6...
   ```
   > Save it before closing — it won't be shown again.

Groq's free tier is very generous and more than sufficient for this app.

---

### Step 5: Create and Configure the `.env.local` File

The frontend needs your API keys in a special environment file called `.env.local`. This file is **never committed to git** (it's in `.gitignore`) — you create it yourself on each machine.

**Option A — Create it manually:**

Navigate to the `frontend/` folder and create a new file called `.env.local`:

```
frontend/
└── .env.local    ← create this file
```

Paste the following into it, replacing the placeholder values with your real keys:

```env
# .env.local — DO NOT commit this file to git

# OpenRouter API key (from Step 4a)
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-key-here

# Groq API key (from Step 4b)
GROQ_API_KEY=gsk_your-groq-key-here

# Flask ML server URL (leave as-is for local development)
FLASK_API_URL=http://localhost:5000
```

**Option B — Create it from the terminal:**

```bash
# From the project root
cd frontend

# On Windows (PowerShell):
@"
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-key-here
GROQ_API_KEY=gsk_your-groq-key-here
FLASK_API_URL=http://localhost:5000
"@ | Out-File -Encoding utf8 .env.local

# On macOS / Linux / Git Bash:
cat > .env.local << 'EOF'
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-key-here
GROQ_API_KEY=gsk_your-groq-key-here
FLASK_API_URL=http://localhost:5000
EOF
```

Then open the file in a text editor and replace the placeholder values with your actual keys from Step 4.

**Verify the file looks correct:**
```bash
cat .env.local
# Should print your three variables — make sure none say "your-key-here"
```

> **Important:** The file must be named exactly `.env.local` (with the leading dot). If you name it `env.local` or `.env`, it will not be loaded.

> **Security:** Never share this file or commit it to GitHub. Your keys are private.

---

### Step 6: Install Node.js Dependencies

Open a **second terminal** (keep the Python venv terminal from Step 2 open separately).

```bash
cd frontend
npm install
```

This installs all frontend packages including Next.js, React, the Groq SDK, and OpenAI SDK (used to talk to OpenRouter).

Expected output ends with something like:
```
added 384 packages, and audited 385 packages in 2m
found 0 vulnerabilities
```

---

### Step 7: Start the Flask ML Server

Go back to your **first terminal** (the one with the Python venv active).

Make sure you are inside the `backend` folder:
```bash
cd backend        # if not already there
python app.py
```

You should see output like:
```
2026-03-25 10:00:00 INFO Loading primary model (HuggingFace MobileNetV2) from ../models/...
2026-03-25 10:00:08 INFO Primary model loaded successfully on cpu.
2026-03-25 10:00:08 INFO Loading secondary model (torchvision MobileNetV2) from ../models/...
2026-03-25 10:00:09 INFO Secondary model loaded successfully on cpu.
2026-03-25 10:00:09 INFO Model loading complete — primary=True  secondary=True  device=cpu
 * Running on http://0.0.0.0:5000
```

**Verify it is running** — open a third terminal and run:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "primary_loaded": true,
  "secondary_loaded": true,
  "device": "cpu"
}
```

> Keep this terminal running. The Flask server must stay running the entire time you use the app.

> **First startup is slower** — the HuggingFace model takes ~5–10 seconds to load on CPU the first time. Subsequent starts are faster.

---

### Step 8: Start the Next.js Frontend

In your **second terminal** (inside the `frontend` folder):

```bash
npm run dev
```

You should see:
```
  ▲ Next.js 16.2.1
  - Local:        http://localhost:3000
  - Environments: .env.local

 ✓ Starting...
 ✓ Ready in 1234ms
```

> Keep this terminal running too.

---

### Step 9: Open the App

Open your browser and go to:

```
http://localhost:3000
```

You should see the home page with the animated leaf background and rotating quotes.

Click **"Analyze Your Plant →"** to start using the app.

---

## How to Use the App

### Home Page (`/`)
- Displays rotating nature quotes with a blurred leaf background
- Click **"Analyze Your Plant →"** to go to the analysis page
- Scroll down to see "How It Works", health level explanations, and a footer with language toggle

### Analysis Page (`/analyze`)

**Step 1 — Upload**
- Drag and drop a leaf image, or click the dropzone to browse
- Accepted formats: JPG, PNG, WEBP
- Preview appears below the dropzone
- Select language: **English** or **தமிழ்** (Tamil) using the toggle in the top nav

**Step 2 — Analyze**
- Click the **"Analyze Plant"** button
- Status messages rotate while the AI works:
  - "Reading leaf patterns..."
  - "Running AI analysis..."
  - "Preparing your report..."

**Step 3 — Results (left panel)**
- **Health badge** (color-coded: green/yellow/orange/red)
- **Confidence percentage** (green = high, amber = moderate, red = low)
- If diseased:
  - Full condition name (e.g. "Tomato with Early Blight")
  - Risk level badge
  - Cause, how it spreads, treatment type
  - Prevention tips
- AI-generated explanation, visible symptoms, and immediate action

**Step 4 — Chat (right panel)**
- Starter chips: "What caused this?", "How do I treat it?", "Is it serious?", "How do I prevent it?"
- Click a chip or type your own question
- Responses stream in real time
- Full scroll history is kept
- Switch language mid-chat with the toggle

---

## API Reference

### Flask ML Server

#### `GET /health`
Returns server and model status.

**Response:**
```json
{
  "status": "ok",
  "primary_loaded": true,
  "secondary_loaded": true,
  "device": "cpu"
}
```

#### `POST /predict`
Run both ML models on an image.

**Request (JSON body):**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQ..."
}
```

**Request (multipart form):**
```
image: <file>
```

**Response:**
```json
{
  "primary": {
    "label": "Tomato with Early Blight",
    "confidence": 0.9134
  },
  "secondary": {
    "label": "Tomato___Early_blight",
    "confidence": 0.8876
  },
  "inference_time_ms": 312
}
```

---

### Next.js Agents

#### `POST /api/agents/classify`
**Request:**
```json
{ "image": "<base64 string>" }
```

**Response:**
```json
{
  "rawLabel": "Tomato with Early Blight",
  "cleanDiseaseName": "Early Blight",
  "isHealthy": false,
  "healthLevel": "Severely Affected",
  "confidence": 91,
  "confidenceFlag": "high",
  "inference_time_ms": 312,
  "models": { "primary": {...}, "secondary": {...} }
}
```

#### `POST /api/agents/explain`
**Request:**
```json
{
  "classificationResult": { ... },
  "language": "en"
}
```

**Response:**
```json
{
  "explanation": "Your tomato leaf shows signs of Early Blight...",
  "symptoms": ["Dark spots with yellow rings", "Lower leaves affected first"],
  "immediateAction": "Remove and destroy all infected leaves immediately.",
  "language": "en"
}
```

#### `POST /api/agents/chat`
**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "How serious is this?" }
  ],
  "classificationResult": { ... },
  "language": "en"
}
```

**Response:** Plain text stream (`Content-Type: text/plain; charset=utf-8`)

---

## Supported Plants & Diseases

The system can identify 38 conditions across 14 plant types:

| Plant | Diseases Covered |
|-------|-----------------|
| **Apple** | Apple Scab, Black Rot, Cedar Apple Rust, Healthy |
| **Blueberry** | Healthy |
| **Cherry** | Powdery Mildew, Healthy |
| **Corn (Maize)** | Gray Leaf Spot, Common Rust, Northern Leaf Blight, Healthy |
| **Grape** | Black Rot, Esca (Black Measles), Leaf Blight, Healthy |
| **Orange** | Citrus Greening (HLB) |
| **Peach** | Bacterial Spot, Healthy |
| **Bell Pepper** | Bacterial Spot, Healthy |
| **Potato** | Early Blight, Late Blight, Healthy |
| **Raspberry** | Healthy |
| **Soybean** | Healthy |
| **Squash** | Powdery Mildew |
| **Strawberry** | Leaf Scorch, Healthy |
| **Tomato** | Bacterial Spot, Early Blight, Late Blight, Leaf Mold, Septoria Leaf Spot, Spider Mites, Target Spot, Yellow Leaf Curl Virus, Mosaic Virus, Healthy |

> **Best accuracy** on tomato, potato, and corn — these classes have the most training data in PlantVillage.

---

## Troubleshooting

### Flask server issues

| Problem | Solution |
|---------|----------|
| `python: command not found` | Use `python3` instead, or check PATH |
| `ModuleNotFoundError: No module named 'flask'` | Virtual env not activated — run `venv\Scripts\activate` (Win) or `source venv/bin/activate` (Mac/Linux) |
| `ModuleNotFoundError: No module named 'transformers'` | Run `pip install transformers` |
| `FileNotFoundError: ../models/...` | Run `app.py` from inside the `backend/` folder, not the root |
| Port 5000 already in use | Kill the process using port 5000 or change Flask port in `app.py` |
| Models loading very slowly | Normal on first run — HuggingFace downloads metadata. Subsequent runs are faster |

### Frontend issues

| Problem | Solution |
|---------|----------|
| `npm install` fails | Make sure you are inside the `frontend/` folder |
| `OPENROUTER_API_KEY is not defined` | Edit `frontend/.env.local` with your real keys |
| "Analysis server is offline" error | Flask server is not running — go to backend terminal and run `python app.py` |
| Explanation doesn't load | Check OpenRouter API key; free tier may have rate limits |
| Chat gives no response | Check Groq API key; try refreshing |
| Tamil text not rendering | Make sure Google Fonts loaded — check internet connection |

### Image quality tips

- Use **natural daylight** — avoid flash or harsh shadows
- Keep the leaf **in focus** and filling most of the frame
- Avoid **blurry or dark** images (low confidence warning will appear)
- Use a **plain background** if possible
- Capture a **single leaf** rather than a whole plant

### Low confidence results

If you see the amber/red confidence indicator:
- Retake the photo with better lighting
- Get closer to the leaf
- Make sure the leaf is one of the 14 supported plant types
- Results below 60% show a warning — consult an agricultural expert for certainty

---

## Environment Variables Reference

All variables go in `frontend/.env.local`:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `OPENROUTER_API_KEY` | Yes | Your OpenRouter API key | `sk-or-v1-abc123...` |
| `GROQ_API_KEY` | Yes | Your Groq API key | `gsk_abc123...` |
| `FLASK_API_URL` | Yes | URL of the Flask ML server | `http://localhost:5000` |

> Change `FLASK_API_URL` if you deploy Flask to a different machine or port.

---

## Running Both Servers — Quick Reference

After the first setup, to start the app again:

**Terminal 1 — Backend:**
```bash
cd backend
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux
python app.py
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Then open **http://localhost:3000**

---

*Built with Next.js · Flask · HuggingFace Transformers · OpenRouter · Groq*
