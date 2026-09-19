# PausePay — implementation checklist

## Audit (done)

- Framework: Next.js 15 App Router, React 19, TypeScript strict, Tailwind v4 (`@tailwindcss/postcss`), `next-themes`, `lucide-react`.
- Styling: hand-written design tokens in `frontend/tokens.css` (oklch palette, spacing, type scale, motion) + component CSS in `frontend/styles/globals.css`. No Tailwind utility classes are used in components; everything is BEM-ish class names. Fonts are referenced by name only (no `next/font`).
- Routes that exist: `/` (landing page), `/analytics` + `/scenarios` (redirects), `/review/[paymentId]` (placeholder), two `501` API stubs.
- Real components: `ContextCanvas`, `ScenarioLab` (hard-coded fake scores), `ThemeToggle`. Every other component/lib file is 0 bytes.
- Backend: every file 0 bytes (TS risk-engine, prisma, evaluation `.py`). Nothing to reuse.
- Existing fake logic to remove/replace: `ScenarioLab` static scores; `501` API stubs.
- Reusable: tokens, `.button`, `.mono-label`, `.level-badge--*`, `.risk-chip`, `.evidence-list`, `.score`, header/footer, theme toggle.

## Phase 1 — Backend foundation
- [x] `backend/` FastAPI app: `main.py`, `database.py`, `config.py`, `models/`, `schemas/`, `routes/`, `services/`
- [x] Endpoints: `POST /api/analyze-message`, `POST /api/verify-payee`, `POST /api/report-fraud`, `GET /api/risk/{identifier}`, `GET /api/analysis-history`, `GET /api/health`, `POST /api/payments/{id}/decision`, `GET /api/dashboard`
- [x] `requirements.txt`, `.env.example`, CORS for the Next dev server

## Phase 2 — Synthetic dataset
- [x] `backend/scripts/generate_dataset.py` (seeded, reproducible, ≥3,000 rows, 15 intents, EN + Hinglish)
- [x] `backend/data/payment_messages.csv`

## Phase 3 — Intent classifier
- [x] `backend/scripts/train_model.py` (TF-IDF word+char → LogisticRegression, stratified split, metrics JSON)
- [x] `backend/models_store/intent_model.joblib` loaded once at startup
- [x] `backend/data/model_metrics.json` (computed, not typed by hand)

## Phase 4 — Entity extraction
- [x] `services/entity_extractor.py`: phone (+91/0 normalisation), UPI IDs, ₹ amounts (incl. `4,999`, `4.5k`, `Rs 500`), URLs, keyword signals

## Phase 5 — Risk engine
- [x] `services/risk_engine.py`: deterministic weighted signals → 0–100 → LOW/MEDIUM/HIGH

## Phase 6 — Risk store
- [x] SQLAlchemy models: `MessageAnalysis`, `IdentifierRisk`, `FraudReport`, `PaymentVerification`
- [x] Accumulating evidence per identifier, uncertainty bands, seed confirmed-fraud list

## Phase 7 — Message → payment correlation
- [x] `services/correlation_engine.py`: identifier match, amount match, recency, report count

## Phase 8 — Messenger experience
- [x] `/app/messages` conversation list + thread; messages analysed via API on open; subtle risk indicator + "why" sheet

## Phase 9 — Manual message verifier
- [x] `/app/check` paste → Analyze → result card

## Phase 10 — UPI simulator
- [x] `/app/pay` payee → amount → verify (calls `/api/verify-payee`) → result

## Phase 11 — Interruption UI
- [x] Bottom sheet: warning, score, signals, Cancel & Report / Continue (+ second confirm)

## Phase 12 — Explanation engine
- [x] `services/explanation_engine.py`: strongest 1–3 evidence-based reasons

## Phase 13 — Demo scenarios
- [x] Seeded conversations A–D; scenario shortcuts on `/app/pay`

## Phase 14 — Dashboard / history
- [x] `/app/activity`: analyses, payment checks, high-risk identifiers, cancelled/continued/reported

## Phase 15 — API integration
- [x] `frontend/lib/api.ts` typed client with timeout + unavailable state; fake `ScenarioLab` scores replaced by live calls

## Phase 16 — Real-time feel
- [x] "Checking payment context…" states; no artificial delays

## Phase 17 — Privacy / realism
- [x] Simulated-source notices; privacy line

## Phase 18 — Tests
- [x] `backend/tests/` pytest: extraction, normalisation, intent, risk, correlation, reporting, unknown payee, end-to-end critical flow

## Phase 19 — Docs
- [x] `README.md`, `walkthrough.md`

## Final acceptance
- [x] Frontend typecheck + build (`tsc --noEmit` clean, `next build` OK)
- [x] Backend tests green (39 passed)
- [x] Critical flow verified end-to-end in the browser (scenarios A–D, cancel & report, continue after warning, offline state)
