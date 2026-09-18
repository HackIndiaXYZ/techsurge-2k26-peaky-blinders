# PausePay — what was built and how to demo it

## What was implemented

Starting point: a designed landing page ("Authorised to Lose") with hard-coded scenario scores, and a backend folder of 0-byte placeholder files.

Now:

**Backend (`backend/`, FastAPI + SQLite)** — a real pipeline: `POST /api/analyze-message` runs a trained scikit-learn intent classifier + scam classifier, regex entity extraction (UPI ID, phone, ₹ amount, links, keyword groups), a deterministic weighted risk engine, an explanation engine, and persists everything while updating a per-identifier risk profile. `POST /api/verify-payee` looks the payee up in that store, correlates it with earlier suspicious messages (identifier + amount + recency), scores the payment and returns `ALLOW / REVIEW / INTERRUPT` with evidence. `POST /api/report-fraud` and `POST /api/payments/{id}/decision` record what the user chose. 39 pytest tests, including the critical end-to-end flow.

**Data + model** — `scripts/generate_dataset.py` produces a seeded 4,000-row Indian-payment-message dataset across 15 intents (English + Hinglish, scams and legitimate lookalikes). `scripts/train_model.py` trains TF-IDF + logistic regression, evaluates on a stratified split **and** a hand-written 52-message holdout (98.1% intent accuracy, 100% payment-related accuracy, scam F1 98%), and writes `data/model_metrics.json`. Nothing in the UI shows a number that was typed by hand.

**Frontend (`frontend/`, Next.js 15)** — the landing page keeps its design; its scenario lab and metrics now come from the live API. A new mobile-first product shell at `/app` (phone frame on desktop) adds:
- **Messages** — simulated messenger; inbound messages are analysed by the API on open; risky ones get a quiet flag with a "Why?" sheet and a "Pay via UPI" shortcut.
- **Check** — paste any message → intent, entities, score, band, reasons, identifier history.
- **Pay** — UPI simulator; "Verify payee & pay" calls the backend before confirmation; high risk opens the PausePay warning sheet (Cancel & report / Continue → second confirm).
- **Activity** — analyses, payment checks, flagged identifiers, cancelled / continued decisions.

`frontend/lib/api.ts` is the single typed client with timeouts; if the backend is down the UI says "PausePay verification temporarily unavailable." — no fake fallback.

Branding note: the repo's wordmark was "Authorised to Lose"; per the brief it is now **PausePay**. Visual tokens, typography, layout and motion were kept.

## Start (two terminals)

```bash
# Terminal 1 — backend
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt        # first time only
.venv\Scripts\python -m uvicorn main:app --reload --port 8000
```

```bash
# Terminal 2 — frontend
cd frontend
npm install                                          # first time only
npm run dev
```

Open http://localhost:3000/app/messages (or :3001 if Next picks it). The header pill must say **Engine online**.

To reset the demo between runs: stop the backend, delete `backend/data/pausepay.db*`, start it again.

## Demo script (≈4 minutes)

**0. Frame it (20 s).** "Payment apps see the payment. Chat apps see the message. PausePay connects them at the moment you press Pay."

**1. The scam message (45 s).** Messages → open **+91 90000 00001** ("Your bank KYC expires today. Pay ₹4,999 immediately to secureverify@upi…").
- The line under the bubble appears within milliseconds: *PausePay detected a risky payment request · Why?*
- Tap **Why?** → intent *KYC / account verification demand*, score ~80/100, three plain reasons, extracted `secureverify@upi` and ₹4,999, identifier now **Suspicious**.
- Point out: this was a real API call — the model, extractor and risk engine ran on the backend.

**2. The paused payment (60 s).** Tap **Pay ₹4,999 via UPI** (or Pay tab → chip *secureverify@upi · ₹4,999*). Tap **Verify payee & pay**.
- The PausePay warning sheet opens: *High-risk payment — This UPI ID and the ₹4,999 amount match an earlier suspicious message (KYC / account verification demand).* It quotes the earlier message and lists the detected signals.
- Tap **Cancel payment & report** → "Payment cancelled. Identifier reported. This UPI ID now has 1 report and will be flagged in future checks."

**3. Restraint (45 s).** Messages → **Rahul Verma** ("Send ₹300 for lunch to rahul@oksbi"). No warning, just a small *Checked* chip. Tap **Pay ₹300 via UPI** → Verify → *PausePay check complete · 5 ms* → **Pay ₹300** → done. Same engine, no drama.

**4. Unknown payee (20 s).** Pay tab → chip *Unknown payee · ₹1,200* → Verify. Result: *No suspicious messages or reports are linked to this UPI ID. PausePay has no evidence against it — this is not a guarantee it is safe.* PausePay does not call unknown things fraud.

**5. User agency (30 s).** Check tab → sample **Cashback claim** → Analyze → *Prize / reward claim, HIGH* → **Simulate paying ₹499** → Verify → warning → **Continue payment** → second confirm *"PausePay considers this payment high risk. Do you still want to continue?"* → **Yes, continue anyway**. The payment goes through and the override is recorded.

**6. Evidence trail (20 s).** Activity tab: counts of analysed messages, paused payments, cancelled & reported, continued after warning; the *Flagged IDs* list shows `secureverify@upi` and `rewards.claim@upi` with their evidence, plus the seeded confirmed-fraud entries.

**Optional extras**
- Paste anything into **Check** — Hinglish works ("Papa ke dawai ke liye 3000 bhej dena mummy@okaxis" is LOW).
- Refund scam thread (+91 98123 40001) hits the seeded confirmed-fraud list: `refund.desk@ybl` interrupts even with no prior message.
- Landing page (`/`): the three scenario tabs and the metrics block are live backend calls.
- Stop the backend mid-demo: every screen degrades honestly to "PausePay verification temporarily unavailable."

## Talking points for judges

- **Actually works end-to-end**: message analysed at T0 causes a payment to the same UPI ID/phone at T1 to be paused — backend correlation, not frontend state.
- **Explainable by construction**: every score is a sum of named signals with weights; explanations cite the evidence ("appeared in an earlier KYC message", "amount matches").
- **Uncertainty is represented**: identifiers move UNKNOWN → LOW → SUSPICIOUS → HIGH_RISK as evidence accumulates; only the seeded list is ever "confirmed".
- **Restraint is tested**: normal payment requests, urgent-but-genuine hospital deposits, and chat containing "KYC" all stay LOW; the test suite asserts it.
- **Honest metrics**: computed by `train_model.py`, including a hand-written holdout that is harder than the templated split.
- **Integration-ready**: the messenger and UPI app are simulators calling the same two endpoints a real message source or payment SDK would call.

## Verification performed

- `backend: pytest -q` → 39 passed
- `frontend: npx tsc --noEmit` → clean; `npx next build` → all routes build
- Browser run of scenarios A–D, cancel & report, continue-after-warning, activity view, landing scenario lab, and the backend-offline state.
