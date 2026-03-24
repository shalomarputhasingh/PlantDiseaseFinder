# Plant Health AI — Build Progress

Last updated: 2026-03-25

---

## Build Steps

| # | Step | Status | Notes |
|---|------|--------|-------|
| 1 | Flask backend + model loading | ✅ Done | Uses HuggingFace `transformers` for primary model |
| 2 | `class_labels.py` — 38-class label map | ✅ Done | Used by secondary (torchvision) model |
| 3 | Vision Classification Agent (`/api/agents/classify`) | ✅ Done | Uses `primary`/`secondary` response; HuggingFace labels |
| 4 | Explanation Agent (`/api/agents/explain`) | ✅ Done | OpenRouter llama-3.2-11b-vision-instruct |
| 5 | Chat Agent (`/api/agents/chat`) | ✅ Done | Groq llama-3.3-70b-versatile, streaming |
| 6 | Home page + QuoteCarousel | ✅ Done | Animated leaf SVG hero, 10s quote rotation |
| 7 | Analyze page — all states | ✅ Done | idle → analyzing → results |
| 8 | ResultCard + HealthBadge | ✅ Done | No plant name shown; disease details from knowledge base |
| 9 | ChatPanel — scrollable | ✅ Done | Fixed 600px height, sticky on desktop |
| 10 | Language toggle (EN / தமிழ்) | ✅ Done | Persisted in localStorage |
| 11 | Error handling | ✅ Done | Offline server, low confidence, rate limits |
| 12 | README | ✅ Done | Setup + startup instructions |

**Build status: ✅ All 12 steps complete — TypeScript build passes (0 errors)**

---

## Model Architecture

| Model | File | Library | Normalization | Labels |
|-------|------|---------|---------------|--------|
| Primary | `mobilenet_v2_1.0_224-plant-disease-identification/pytorch_model.bin` | `transformers` (HuggingFace) | mean=0.5, std=0.5 | Human-readable from `config.json` |
| Secondary | `mobilenetv2_plant.pth` | `torchvision` | ImageNet mean/std | `class_labels.py` (old-style) |

- Both run in **parallel** via `ThreadPoolExecutor`
- Primary result is authoritative; secondary modulates confidence (weighted 70/30)
- Secondary is optional — app works if it fails to load

---

## Key Files

```
backend/
  app.py                  — Flask server, model loading, /predict /health
  class_labels.py         — 38-class label map (torchvision secondary)
  requirements.txt        — flask, torch, torchvision, transformers, pillow

frontend/
  app/
    page.tsx              — Home page
    analyze/page.tsx      — Analysis page (4 states)
    api/agents/
      classify/route.ts   — Agent 1: Vision classification + ensemble
      explain/route.ts    — Agent 2: OpenRouter explanation
      chat/route.ts       — Agent 3: Groq streaming chat
  components/
    ResultCard.tsx        — Disease result with knowledge base details
    ChatPanel.tsx         — Scrollable chat (600px fixed height, sticky)
    HealthBadge.tsx       — Color-coded health level pill
    ImageUpload.tsx       — Drag-and-drop image input
    LanguageToggle.tsx    — EN / தமிழ் pill toggle
    QuoteCarousel.tsx     — Rotating quotes (10s fade)
  lib/
    diseaseKnowledge.ts   — Static disease info (cause, spread, treatment, prevention)
    groq.ts               — Groq client
    openrouter.ts         — OpenRouter client
  .env.local              — API keys (OPENROUTER_API_KEY, GROQ_API_KEY, FLASK_API_URL)
```

---

## Known Decisions

- **No plant name shown** — HuggingFace model includes plant in label (e.g. "Tomato with Early Blight"), shown as-is
- **Free tier APIs** — OpenRouter (llama-3.2-11b-vision-instruct) + Groq (llama-3.3-70b-versatile)
- **Models NOT in backend/models/** — stored at `../models/` relative to backend
- **Tamil support** — entire explanation + chat responds in natural Tamil when selected

---

## To Start

```bash
# Terminal 1
cd backend
pip install flask flask-cors torch torchvision transformers pillow
python app.py

# Terminal 2
cd frontend
npm run dev         # http://localhost:3000
```

---

## Pending / Future

- [ ] Test with real plant photos to validate model accuracy
- [ ] Add image quality detection (blur/dark) before sending to model
- [ ] Consider caching explanation results per image hash
- [ ] Mobile layout polish (ResultCard + ChatPanel stacking)
