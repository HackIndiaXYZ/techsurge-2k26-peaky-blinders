# PausePay

### A pause-before-payment verification layer for UPI-style payments

> **A message asked you to pay. PausePay remembers it when you actually try to.**

PausePay is a working fraud-prevention prototype that sits between suspicious payment requests (messages) and the user's final UPI payment decision. It analyses payment-related messages, remembers the UPI IDs and phone numbers behind risky ones, and checks that memory again the moment the user tries to pay. If the payee matches a suspicious message, a fraud report or the seeded confirmed-fraud list, the payment is **paused** — not blocked — with a short, evidence-based explanation.

The user keeps two choices: **Cancel payment & report** or **Continue payment**.

> Risk ≠ fraud verdict. PausePay shows evidence and uncertainty; it never decides for the user.

---

## Table of contents

- [Problem](#problem)
- [What works today](#what-works-today)
- [Architecture](#architecture)
- [How detection works](#how-detection-works)
  - [Synthetic dataset](#synthetic-dataset)
  - [ML intent classifier](#ml-intent-classifier)
  - [Entity extraction](#entity-extraction)
  - [Risk engine](#risk-engine)
  - [Risk store](#risk-store)
  - [Message → payment correlation](#message--payment-correlation)
  - [Explanation engine](#explanation-engine)
- [Frontend](#frontend)
- [Backend](#backend)
- [API](#api)
- [Database](#database)
- [Running it](#running-it)
- [Training the model](#training-the-model)
- [Tests](#tests)
- [Demo scenarios](#demo-scenarios)
- [Limitations](#limitations)
- [Future real-world integration](#future-real-world-integration)
- [Privacy](#privacy)

---

## Problem

Authorised push-payment scams are hard to stop because the payment itself is valid: the victim enters the payee, the amount, and their PIN. The fraud lives in the **message that convinced them** — the fake KYC deadline, the prize that needs a "processing fee", the refund that was "sent by mistake".

Payment apps see the payment. Messaging apps see the message. Nobody connects the two at the moment it matters.

## What works today

Everything in the core pipeline is real code you can read, run and test:

| Capability | Status |
|---|---|
| Message intent classification (15 intents, scikit-learn) | ✅ trained model, loaded at startup |
| Scam-vs-legit probability | ✅ second classifier on the same features |
| Entity extraction (UPI IDs, Indian mobile numbers, ₹ amounts, links, keyword groups) | ✅ regex/rules, normalised |
| Deterministic risk engine (named signals → 0–100 → LOW/MEDIUM/HIGH) | ✅ no randomness anywhere |
| Identifier risk store with accumulating evidence | ✅ SQLite via SQLAlchemy |
| Message → payment correlation (identifier + amount + recency) | ✅ real DB lookup at verify time |
| Evidence-based explanations | ✅ generated from signals, not templates of "AI detected fraud" |
| Fraud reporting that changes future checks | ✅ |
| Simulated Messenger and UPI app calling the real API | ✅ |
| Activity view (analyses, checks, flagged identifiers, decisions) | ✅ |
| Backend tests incl. the critical end-to-end flow | ✅ 39 tests |

What is **simulated**: the messenger threads and the UPI app UI. No real chat app is read and no real money moves. A real integration would call the same `POST /api/analyze-message` and `POST /api/verify-payee` endpoints.

## Architecture

```text
                MESSAGE (simulated messenger / manual paste / future OS source)
                   │
                   ▼
        POST /api/analyze-message
                   │
                   ▼
      Intent classifier (TF-IDF + LogReg)         services/intent_detector.py
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
  Entity extraction      Keyword / pattern signals   services/entity_extractor.py
         │                   │
         └─────────┬─────────┘
                   ▼
              Risk engine  ──── identifier history   services/risk_engine.py
                   │
                   ▼
           Explanation engine                        services/explanation_engine.py
                   │
                   ▼
   MessageAnalysis + IdentifierRisk rows (SQLite)    services/fraud_lookup.py


USER → UPI simulator → POST /api/verify-payee
                              │
                              ▼
                     Identifier lookup (IdentifierRisk)
                              │
                              ▼
                 Context correlation (MessageAnalysis)   services/correlation_engine.py
                              │
                              ▼
                       Risk assessment
                        /          \
                     LOW            HIGH / MEDIUM
                      │                  │
              "PausePay check      PausePay warning sheet
               complete"            /            \
                                Cancel &        Continue
                                report          (recorded)
                                  │
                          POST /api/report-fraud
```

## How detection works

### Synthetic dataset

`backend/scripts/generate_dataset.py` builds `backend/data/payment_messages.csv` (4,000 rows by default, seed 42) from intent-specific templates with randomised names, UPI handles, banks, amounts (₹4,999 / Rs 500 / 500/- / 2k / bare numbers), phone formats, urgency phrases, consequences, English and Hinglish. Nothing is hand-typed row by row; regenerate with a different `--seed` or `--rows` at any time.

Labels per row: `message, intent, is_payment_related, is_fraud, risk_label, phone_number, upi_id, amount, urgency, impersonation, suspicious_keywords`. The entity columns are filled by the real extractor, so extraction is exercised across the whole dataset.

Intents: `PAYMENT_REQUEST, REFUND_SCAM, KYC_SCAM, PRIZE_SCAM, IMPERSONATION, URGENCY_PAYMENT, INVESTMENT_SCAM, JOB_SCAM, MARKETPLACE_PAYMENT, QR_SCAM, BANK_REQUEST, BILL_PAYMENT, FRIEND_FAMILY_PAYMENT, MERCHANT_PAYMENT, NON_PAYMENT`. `MARKETPLACE_PAYMENT` deliberately mixes genuine buyers with advance-fee / "army officer" scams so intent and fraud are not the same label.

There is also `backend/data/holdout_messages.csv`: 52 free-form messages written by hand, never generated from templates. It exists because a templated test split is easy by construction.

### ML intent classifier

`backend/scripts/train_model.py` trains two scikit-learn pipelines on the same features (word 1–2-grams + character 3–5-grams TF-IDF, with handles/numbers/amounts masked to placeholder tokens so the model learns *shape*, not specific identifiers):

- **intent model** — multi-class `LogisticRegression` over the 15 intents
- **fraud model** — binary `LogisticRegression` over `is_fraud`

Evaluation uses a stratified 80/20 split plus the hand-written holdout. All numbers are computed and written to `backend/data/model_metrics.json`; `/api/health` and the landing page read that file. From the last run:

| Set | Metric | Value |
|---|---|---|
| Templated test split (800 rows) | intent accuracy / macro-F1 | 100% / 100% |
| Templated test split | scam precision / recall | 100% / 100% |
| Hand-written holdout (52 msgs) | intent accuracy | 98.1% |
| Hand-written holdout | payment-related accuracy | 100% |
| Hand-written holdout | scam precision / recall / F1 | 100% / 96% / 98% |
| Inference | avg latency (both models) | ~2.5 ms |

The templated split is saturated (the templates are learnable); the holdout is the honest number. The one holdout miss is a Hinglish "Mom's new number" impersonation predicted as a family transfer — the risk engine's keyword signals still catch that pattern.

The saved bundle `backend/models_store/intent_model.joblib` (~2 MB) is loaded once at startup; no request retrains anything.

### Entity extraction

`backend/services/entity_extractor.py` — rules, because these shapes are rigid:

- Indian mobiles: `9876543210`, `+91 98765 43210`, `+919876543210`, `098765-43210` → all normalise to `+919876543210`
- UPI IDs: `name@handle` with a bare PSP token (e-mails like `a@gmail.com` are excluded); lower-cased
- Amounts: `₹4,999`, `Rs. 500/-`, `INR 2500`, `300 rupees`, `5k`, `2 lakh`; when several amounts appear the one following a request verb ("pay ₹499") wins over the bait ("₹25,000 cashback")
- URLs, and keyword groups: urgency, kyc_credential, reward, refund, impersonation, upfront_fee, qr_link, investment, job, marketplace

### Risk engine

`backend/services/risk_engine.py` sums named, weighted signals and caps at 100 (LOW ≤ 34, MEDIUM 35–64, HIGH ≥ 65). No `random` anywhere.

Message signals include: scam-intent pattern (weight scaled by model confidence), ML scam probability, urgency, account-block threats, KYC language, impersonation, reward bait, upfront fee, refund pressure, PIN/OTP mentions, "scan/approve to *receive* money", links, guaranteed returns, marketplace advance, large amount, plus what the risk store already knows about the identifiers.

Guard rails: a `NON_PAYMENT` message is capped at LOW no matter which words it contains ("went to the bank for KYC today"); a benign payment with a single weak keyword cannot cross into MEDIUM; a concrete "send ₹250 to x@y" is treated as payment-related even if the classifier disagrees.

Payment-time signals: context match (75% of the matched message's score), amount match, recency, repeated messages, and identifier evidence weighted more heavily than at message time (confirmed-fraud list 70, high-risk 45, suspicious 20) because the message text is not available at the payment step.

### Risk store

`backend/services/fraud_lookup.py` keeps one `IdentifierRisk` row per normalised UPI ID / phone number:

```
UNKNOWN     nothing on record
LOW         seen only in ordinary payment context
SUSPICIOUS  appeared in at least one risky message, or one report
HIGH_RISK   repeated risky messages, ≥2 reports, a report + a risky message, or on the seeded confirmed-fraud list
```

Score = 0.6 × strongest message score + repetition bonus (capped) + 18 per report (capped). One weak signal never brands an identifier as fraud; evidence accumulates. `backend/data/known_fraud_identifiers.json` is a small, clearly fictional seed list loaded at startup with `status = CONFIRMED_FRAUD` — the only identifiers ever described as "confirmed".

Simulated messenger messages carry a `source_ref`; the backend de-duplicates on it so reopening a thread never double-counts evidence.

### Message → payment correlation

`backend/services/correlation_engine.py`: at verify time, find `MessageAnalysis` rows whose `upi_id` or `phone_number` equals the normalised payee, restricted to payment-related MEDIUM/HIGH results, prefer an amount match, else the strongest. Returns the match, whether the amount agrees (±1%), and hours since the message. Phone-number payees correlate exactly the same way.

### Explanation engine

`backend/services/explanation_engine.py` turns signals into 1–3 short reasons and a one-line summary that names the evidence:

- "This UPI ID and the ₹4,999 amount match an earlier suspicious message (KYC / account verification demand)."
- "This number has 2 fraud report(s) and appeared in 1 suspicious message(s)."
- "No suspicious messages or reports are linked to this UPI ID. PausePay has no evidence against it — this is not a guarantee it is safe."

## Frontend

Next.js 15 (App Router) · React 19 · TypeScript · the project's existing token system (`frontend/tokens.css`, `styles/globals.css`) extended with `styles/app.css`. The landing page (`/`) keeps its editorial design; the product lives under `/app` as a phone-width, mobile-first shell shown inside a device frame on desktop.

| Route | Purpose |
|---|---|
| `/` | Landing page. The scenario lab and metrics block call the live backend. |
| `/app/messages` | Simulated messenger. Opening a thread sends every inbound message to `/api/analyze-message`; risky ones get a quiet "PausePay detected a risky payment request · Why?" line and a "Pay via UPI" shortcut. |
| `/app/check` | Manual verifier: paste any message → intent, entities, score, band, reasons, identifier history. |
| `/app/pay` | UPI simulator: payee → amount → **Verify payee & pay** (`/api/verify-payee`) → normal confirmation, or the PausePay warning sheet with **Cancel payment & report** / **Continue payment** (+ a second lightweight confirmation for high risk). |
| `/app/activity` | Recent analyses, payment checks, flagged identifiers, cancelled / continued / reported. |

`frontend/lib/api.ts` is the only place that talks to the backend: typed functions, 8 s timeout, `ApiUnavailableError` on network/5xx. There is **no fake fallback** — if the backend is down every screen shows "PausePay verification temporarily unavailable." and the header pill turns red.

## Backend

FastAPI · Pydantic v2 · SQLAlchemy 2 · SQLite · scikit-learn · pandas · joblib.

```
backend/
  main.py                 app factory, CORS, lifespan (DB init, model load, seed list)
  config.py               pydantic-settings (PAUSEPAY_* env vars, .env)
  database.py             engine / session / init_db
  models/entities.py      MessageAnalysis, IdentifierRisk, FraudReport, PaymentVerification
  schemas/api.py          request / response contracts
  routes/                 health, analysis, payments, reports, dashboard, simulator
  services/
    intent_detector.py    model bundle loader + prediction
    text_normaliser.py    shared preprocessing (training + inference)
    entity_extractor.py   phones / UPI / amounts / URLs / keywords + normalisation
    risk_engine.py        deterministic scoring for messages and payments
    fraud_lookup.py       identifier risk store, seeding, evidence accumulation
    correlation_engine.py message → payment correlation
    explanation_engine.py human explanations
    analysis_service.py   orchestration + persistence
  scripts/
    generate_dataset.py   synthetic dataset
    train_model.py        training + evaluation
    smoke_flow.py         end-to-end run without a server
  data/                   dataset, holdout, metrics, seed list, demo conversations, SQLite file
  models_store/           trained model bundle
  tests/                  pytest suite
```

## API

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/health` | status, model + engine version, measured metrics |
| `POST` | `/api/analyze-message` | `{message, source?, source_ref?, sender_label?}` → intent, entities, score, band, signals, reasons, identifier risks |
| `POST` | `/api/verify-payee` | `{identifier, amount, payee_name?}` → `decision` (ALLOW / REVIEW / INTERRUPT), score, band, title, summary, reasons, signals, `matched_message`, `identifier_risk` |
| `POST` | `/api/payments/{id}/decision` | record `PAID`, `CANCELLED`, `CANCELLED_REPORTED`, `CONTINUED_AFTER_WARNING` |
| `POST` | `/api/report-fraud` | `{identifier, reason?, amount?, verification_id?}` → report + updated identifier risk |
| `GET` | `/api/risk/{identifier}` | identifier profile (or an explicit UNKNOWN record) |
| `GET` | `/api/analysis-history` | recent analyses and payment checks |
| `GET` | `/api/dashboard` | totals + lists for the activity view |
| `GET` | `/api/conversations` | the simulated messenger threads |

Interactive docs: http://127.0.0.1:8000/docs

Example:

```bash
curl -X POST http://127.0.0.1:8000/api/analyze-message -H "Content-Type: application/json" \
  -d '{"message":"Your KYC expires today. Pay ₹4,999 immediately to secureverify@upi or your account will be suspended."}'

curl -X POST http://127.0.0.1:8000/api/verify-payee -H "Content-Type: application/json" \
  -d '{"identifier":"secureverify@upi","amount":4999}'
# → "decision": "INTERRUPT", "summary": "This UPI ID and the ₹4,999 amount match an earlier suspicious message (kyc / account verification demand)."
```

## Database

SQLite file `backend/data/pausepay.db` (WAL mode), created on first start by `Base.metadata.create_all`. Tables:

- `message_analyses` — message, source, intent + confidence, entities, score, band, signals, reasons, summary, timestamp
- `identifier_risks` — per identifier: type, score, band, status, suspicious/total message counts, strongest message score, report count, last intent/amount, sources
- `fraud_reports` — identifier, reason, amount, source (USER / PAYMENT_CANCEL / SEED), linked verification
- `payment_verifications` — payee, amount, decision, score, band, matched message, signals, reasons, user action + timestamp

Delete the `.db` file to reset the demo; the seed list is re-applied at startup.

## Running it

Prerequisites: Node 18+ (tested on 24), Python 3.11+ (tested on 3.13).

**Backend**

```bash
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt      # Windows
# source .venv/bin/activate && pip install -r requirements.txt   # macOS/Linux
```

The trained model and dataset are committed, so you can start straight away:

```bash
.venv\Scripts\python -m uvicorn main:app --reload --port 8000
```

(or `..\run-backend.ps1` / `./run-backend.sh` from the repo root, which also trains the model if it is missing). Health check: http://127.0.0.1:8000/api/health

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 (Next falls back to 3001 if 3000 is busy; the backend accepts any localhost origin). The API base URL defaults to `http://127.0.0.1:8000`; override with `NEXT_PUBLIC_PAUSEPAY_API_URL` in `frontend/.env.local`.

## Training the model

```bash
cd backend
.venv\Scripts\python scripts\generate_dataset.py --rows 4000 --seed 42
.venv\Scripts\python scripts\train_model.py
```

`train_model.py` prints accuracy, macro precision/recall/F1, the 15×15 confusion matrix, the scam-model metrics, holdout results (with every misclassified holdout message) and inference latency, and writes `data/model_metrics.json` + `models_store/intent_model.joblib`. Restart the backend to pick up a new model.

## Tests

```bash
cd backend
.venv\Scripts\python -m pytest -q
```

39 tests cover phone/UPI/amount extraction, normalisation, intent prediction, risk scoring and thresholds, determinism, identifier accumulation, fraud lookup, reporting, unknown identifiers, de-duplication, validation errors, and the critical flow:

1. analyse a suspicious message containing `fraudtest@upi`
2. assert the identifier becomes SUSPICIOUS/HIGH_RISK
3. call `/api/verify-payee` for `fraudtest@upi`
4. assert `decision == "INTERRUPT"` and the explanation references the earlier KYC context and amount
5. cancel & report → report stored, identifier HIGH_RISK, dashboard updated

…and the restraint case: a normal "Send ₹300 for lunch to rahul@oksbi" must not create a high-risk identifier and must be allowed.

Frontend: `npm run typecheck` and `npm run build`.

## Demo scenarios

All threads are in `backend/data/demo_conversations.json`; the same payees are one tap away on the Pay screen.

| | Message | Payment | Expected |
|---|---|---|---|
| **A · Genuine** | "Send ₹300 for lunch to rahul@oksbi" (Rahul Verma) | `rahul@oksbi`, ₹300 | LOW · "PausePay check complete" · payment proceeds |
| **B · KYC fraud** | "Your bank KYC expires today. Pay ₹4,999 immediately to secureverify@upi or your account will be blocked." (unknown sender) | `secureverify@upi`, ₹4,999 | KYC_SCAM · HIGH · payment interrupted: "This UPI ID and the ₹4,999 amount match an earlier suspicious message" |
| **C · Reward scam** | "Congratulations! You won ₹25,000 cashback. Pay ₹499 processing fee to rewards.claim@upi…" (Rewards Desk) | `rewards.claim@upi`, ₹499 | PRIZE_SCAM · HIGH · interrupted |
| **D · Unknown payee** | none | `meera.iyer@okhdfcbank`, ₹1,200 | UNKNOWN · ALLOW · "PausePay has no evidence against it — this is not a guarantee it is safe" |
| Refund scam + seed list | "I accidentally sent ₹5,000… return it to refund.desk@ybl" | `refund.desk@ybl`, ₹5,000 | REFUND_SCAM · confirmed-fraud list · interrupted |
| Restraint | Lakeview Hospital deposit ₹18,000 "due today" | `lakeviewhospital@icici` | LOW — urgency alone is not a scam signal |
| Restraint | Mom: "Went to the SBI branch for KYC today…" | — | NON_PAYMENT · LOW — "KYC" in chat creates no risk |

See `walkthrough.md` for the judge-facing script.

## Limitations

- **Synthetic data.** The classifier is trained on templated messages; 98% on 52 hand-written holdout messages is encouraging, not a real-world claim. Real scam text is more varied, multilingual and adversarial.
- **Simulated sources.** The messenger and UPI app are simulators inside the web app. PausePay does not read WhatsApp/SMS or intercept any payment app.
- **Single-user, local store.** One SQLite database, no accounts, no shared reputation network, no rate limiting or auth on the API.
- **Rules can be gamed.** Keyword signals are explainable but brittle; a determined scammer avoids the words. The ML layer and stored identifier evidence are the more robust parts.
- **Identifier churn.** Scammers rotate UPI IDs; evidence attached to one handle does not transfer to the next.
- **No ledger/behavioural context yet.** Amount vs. usual spend, payee age, time-of-day and incoming-transfer verification are natural next signals.

## Future real-world integration

The backend is already the integration surface. A real deployment would:

- feed messages from an OS-level notification listener / SMS permission (Android), a messaging-platform business API, or a bank's own in-app chat into `POST /api/analyze-message` with a `source` and `source_ref`;
- call `POST /api/verify-payee` from a payment app's pre-confirmation hook (PSP SDK / bank app) and render the same warning contract (`decision`, `summary`, `reasons`, `signals`);
- replace the seed list with shared reputation data (NPCI / bank fraud-reporting feeds, 1930 helpline data) while keeping the same `IdentifierRisk` shape;
- move SQLite to Postgres, add auth and per-user isolation, and retrain the classifier on labelled real reports.

## Privacy

PausePay analyses payment-related context to identify suspicious payment requests. In this prototype only the synthetic demo threads and whatever you paste into **Check** are stored, locally, in `backend/data/pausepay.db`. No credentials, PINs or OTPs are ever requested or stored.
