# Authorised to Lose

### A contextual safety layer for UPI-style authorised push payments

> **A second opinion before you pay.**

Authorised to Lose is a FinTech safety prototype designed to detect **social-engineering and authorised push-payment scam risk before a user confirms a payment**.

Instead of treating a transaction as an isolated event, the system examines the context around it — messages, transaction history, payee relationships, ledger context, behavioural signals, and timing — and turns those signals into an explainable risk assessment.

The user remains in control.

> **Risk ≠ fraud verdict.**

The system produces a risk signal and explains the evidence. It does not claim to prove that a payment is fraudulent.

---

## Table of Contents

- [Problem](#problem)
- [Solution](#solution)
- [Core Idea](#core-idea)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Example](#example)
- [Risk Engine](#risk-engine)
- [Explainability](#explainability)
- [User Decision](#user-decision)
- [Synthetic Data](#synthetic-data)
- [Evaluation](#evaluation)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Demo](#demo)
- [API](#api)
- [Testing](#testing)
- [Limitations](#limitations)
- [Future Scope](#future-scope)
- [Safety & Privacy](#safety--privacy)
- [Team / Hackathon](#team--hackathon)

---

## Problem

Authorised push-payment scams are difficult to stop because the payment itself may be technically valid:

- the user enters the payment details,
- the user authorises the transaction,
- the payment system processes it normally.

The problem is often the **social context surrounding the payment**.

For example:

```text
"I accidentally sent ₹5,000 to you.
Please return it immediately to rahul@upi."
```

A user may see a familiar-looking request and act quickly without checking whether the claimed incoming payment actually exists.

Traditional transaction-only detection can miss this because:

```text
Amount: ₹5,000
Recipient: valid UPI-style identifier
User: authorised the payment
```

All three facts can be technically normal.

The suspicious part is the **relationship between the message, claimed transfer, recipient, timing, and ledger state**.

---

## Solution

Authorised to Lose adds a contextual safety layer immediately before payment confirmation.

```text
Payment Intent
      ↓
Context Aggregation
      ↓
Contextual Payment Graph
      ↓
Feature Extraction
      ↓
Risk Engine
      ↓
Risk Band + Evidence
      ↓
Plain-Language Explanation
      ↓
User Decision
      ↓
Audit Trace
```

The system asks:

> **"Does the story surrounding this payment make sense?"**

rather than simply:

> "Is this transaction unusual?"

---

## Core Idea

### Contextual Payment Graph

The core concept is a **Contextual Payment Graph**.

Instead of analysing:

```text
₹5,000 → Rahul
```

in isolation, the system connects related events:

```text
                    Message
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
    Claimed Sender  ₹5,000       Urgency
          │            │
          └──────┬─────┘
                 ▼
        Claimed Incoming Transfer
                 │
                 │  no matching credit
                 ▼
          User Payment Intent
                 │
                 ▼
          Rahul Sharma
           rahul@upi
```

This lets the system reason about relationships such as:

- claimed sender vs actual recipient,
- claimed amount vs payment amount,
- message timing vs payment timing,
- incoming payment vs refund request,
- new payee vs established payee,
- message-derived recipient vs known contact.

---

# How It Works

## 1. User Starts a Payment

A simulated UPI-style payment is created:

```text
₹5,000
        ↓
Rahul Sharma
rahul@upi
```

No real payment is initiated.

---

## 2. System Collects Context

The system retrieves synthetic contextual information:

```text
Transaction
Message
Payment History
Payee History
Ledger
User Behaviour
```

---

## 3. Contextual Payment Graph

Related entities and events are connected to identify relationships.

Example:

```text
Message
  ├── claimed sender
  ├── claimed amount
  ├── requested recipient
  └── urgency
          │
          ▼
Payment Intent
  ├── amount
  ├── recipient
  └── timestamp
          │
          ▼
Ledger
  └── matching incoming payment?
```

---

## 4. Feature Extraction

Raw context becomes structured features.

### Transaction / Behaviour

```text
FIRST_TIME_PAYEE
HIGH_AMOUNT_RELATIVE_TO_BASELINE
SHORT_LATENCY_AFTER_MESSAGE
UNUSUAL_TRANSACTION_TIMING
```

### Social Engineering

```text
MISTAKEN_TRANSFER_CLAIM
URGENCY_PRESSURE
REFUND_LANGUAGE
PAYMENT_REQUEST_IN_MESSAGE
```

### Identity

```text
COUNTERPARTY_MISMATCH
NEW_PAYEE
UNVERIFIED_COUNTERPARTY
```

### Ledger

```text
INBOUND_CREDIT_UNVERIFIED
AMOUNT_ECHO
NO_MATCHING_INCOMING_PAYMENT
```

### Mitigating Evidence

```text
ESTABLISHED_PAYEE
VERIFIED_INCOMING_PAYMENT
KNOWN_CONTACT
RECURRING_PAYMENT_PATTERN
VERIFIED_MERCHANT_CONTEXT
```

Mitigating signals are important because not every unusual payment is malicious.

---

# Risk Engine

The risk engine is intentionally **deterministic and inspectable**.

The LLM does not directly decide whether a transaction is fraudulent.

```text
Structured Features
        ↓
Signal Evaluation
        ↓
Weighted Evidence
        ↓
Risk Score
        ↓
LOW / MEDIUM / HIGH
```

The prototype's weights are expert-designed/tuned parameters for the evaluation environment. They are **not presented as scientifically validated fraud probabilities**.

## Risk Bands

| Risk | Behaviour |
|---|---|
| LOW | Continue with little or no friction |
| MEDIUM | Show contextual warning |
| HIGH | Interrupt and require explicit user decision |

A HIGH result means:

> Multiple contextual risk indicators were detected.

It does **not** mean:

> Fraud has been proven.

---

# Explainability

The warning is evidence-first.

Instead of:

```text
AI Confidence: 91%
```

the user sees:

```text
⚠️ This payment looks unusual.

Why we're warning you:

• We couldn't find a matching incoming ₹5,000 payment.
• The recipient differs from the person mentioned as the sender.
• This is a new recipient for you.
• The payment was started shortly after the message.

This is a risk signal, not a fraud determination.
```

The explanation prioritises:

1. Strongest evidence
2. Evidence the user can verify
3. Plain language
4. Actionable next steps

---

# User Decision

The system does not autonomously block the payment.

```text
                    HIGH RISK
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
          GO BACK          CONTINUE ANYWAY
             │                   │
             ▼                   ▼
       Payment stopped       User proceeds
```

Both outcomes are recorded.

This makes the product a **decision-support and intervention layer**, rather than an autonomous payment blocker.

---

# Synthetic Data

The prototype uses synthetic data only.

No real:

- bank account data,
- UPI credentials,
- UPI PINs,
- OTPs,
- payment credentials,
- banking API integrations

are required.

The **scenario taxonomy** is based on documented digital-payment/social-engineering fraud patterns, while the actual transaction records, users, messages, and payment histories used in the prototype are synthetic.

This distinction is important:

```text
Real-world fraud patterns
          ↓
Scenario taxonomy
          ↓
Synthetic conversations
          ↓
Synthetic transactions
          ↓
Evaluation dataset
```

The ₹5,000 example used in the demo is therefore a **synthetic representation of a real-world scam pattern**, not a claim that this exact transaction happened to a real victim.

---

# Example Scenario

## High-Risk Scenario

### Message

```text
I accidentally sent ₹5,000 to you.
Please return it immediately to rahul@upi.
```

### Payment

```text
Amount:       ₹5,000
Recipient:    Rahul Sharma
UPI:          rahul@upi
```

### Context

```text
✓ No matching ₹5,000 incoming credit
✓ Recipient differs from claimed sender
✓ New payee
✓ Payment amount matches message amount
✓ Payment started shortly after message
```

### Result

```text
HIGH RISK
```

The user receives the explanation and can choose:

```text
GO BACK
CONTINUE ANYWAY
```

---

# Legitimate Lookalike

The system also tests legitimate scenarios that resemble scams.

Example:

```text
Message:
"Please send ₹5,000 to Rahul for the group booking."

Payment:
₹5,000 → Rahul Sharma
```

Additional context:

```text
✓ Known contact
✓ Established payee
✓ Prior legitimate transactions
✓ Consistent conversation
```

This tests whether the engine can use **mitigating evidence** instead of assuming:

```text
new/large/urgent payment = scam
```

---

# Evaluation

The same production risk engine used by the application is used for offline evaluation.

```text
Synthetic Dataset
       │
       ├── Development Set
       ├── Holdout Set
       └── Adversarial Set
                │
                ▼
          Same Risk Engine
                │
                ▼
        Predictions + Metrics
```

## Metrics

The evaluation measures:

- Accuracy
- Precision
- Recall
- F1 Score
- False Positive Rate
- False Negative Rate
- Response Latency

Scenario-family breakdowns can also be generated.

---

## Dataset Strategy

Evaluation should not rely only on cases that were created from the exact same templates as the risk rules.

The dataset therefore includes variations such as:

```text
Different message wording
Different names
Different amounts
Different timing
Legitimate high-value payments
Legitimate new payees
Obfuscated scam language
Combinations of weak signals
```

This provides a stronger test of whether the system generalises beyond the obvious demo case.

---

# Architecture

```text
┌───────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                        │
│                                                               │
│ Message Context → Simulated Payment → Review Payment          │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                     CONTEXT AGGREGATOR                        │
│                                                               │
│ Transaction • Message • Behaviour • Payee • Ledger           │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                  CONTEXTUAL PAYMENT GRAPH                     │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                      FEATURE EXTRACTOR                        │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                        RISK ENGINE                            │
│                                                               │
│             Evidence → Score → Risk Band                     │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                    EXPLANATION ENGINE                         │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                     USER INTERVENTION                         │
│                                                               │
│              Go Back  ←→  Continue Anyway                     │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                        AUDIT TRACE                             │
└───────────────────────────────────────────────────────────────┘
```

---

# Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Backend | Next.js Route Handlers |
| Validation | Zod |
| Risk Engine | Pure TypeScript |
| ORM | Prisma |
| Database | SQLite |
| Testing | Vitest |
| Evaluation | Python |
| Data Analysis | pandas + scikit-learn |
| Visualisation | Recharts / Matplotlib |
| Optional NLP | LLM structured extraction |

The architecture is intentionally local-first for reliable hackathon demonstration.

---

# Project Structure

```text
authorised-to-lose/
│
├── apps/
│   └── web/
│       ├── app/
│       │   ├── page.tsx
│       │   ├── review/
│       │   ├── scenarios/
│       │   ├── analytics/
│       │   └── api/
│       │
│       ├── components/
│       │   ├── payment/
│       │   ├── risk/
│       │   ├── graph/
│       │   ├── audit/
│       │   ├── scenarios/
│       │   └── ui/
│       │
│       ├── lib/
│       └── styles/
│
├── packages/
│   ├── risk-engine/
│   │   ├── src/
│   │   │   ├── types/
│   │   │   ├── context/
│   │   │   ├── features/
│   │   │   ├── signals/
│   │   │   ├── scoring/
│   │   │   └── explanation/
│   │   └── tests/
│   │
│   └── schemas/
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│
├── data/
│   ├── scenarios/
│   ├── development.json
│   ├── holdout.json
│   └── adversarial.json
│
├── evaluation/
│   ├── evaluate.py
│   ├── metrics.py
│   ├── confusion_matrix.py
│   ├── category_analysis.py
│   ├── latency.py
│   └── results/
│
├── scripts/
├── tests/
├── docs/
│   ├── architecture.md
│   ├── evaluation.md
│   ├── scenarios.md
│   └── demo.md
│
├── .env.example
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

---

# Getting Started

## Prerequisites

- Node.js 20+
- pnpm
- Python 3.10+
- Git

---

## 1. Clone

```bash
git clone <repository-url>
cd authorised-to-lose
```

---

## 2. Install Dependencies

```bash
pnpm install
```

---

## 3. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

For Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

The prototype should work without any real financial integration.

If optional LLM/NLP functionality is enabled, configure the relevant provider key in `.env`.

---

## 4. Initialise Database

```bash
pnpm prisma generate
pnpm prisma migrate dev
```

Seed the synthetic data:

```bash
pnpm prisma db seed
```

---

## 5. Start Development Server

```bash
pnpm dev
```

Open the local application shown by Next.js.

---

# Demo

The recommended demonstration flow is:

```text
1. Open the simulated message
          ↓
2. Show the claimed ₹5,000 transfer
          ↓
3. Open the payment screen
          ↓
4. Enter/select Rahul Sharma
          ↓
5. Click "Review Payment"
          ↓
6. Show contextual analysis
          ↓
7. Reveal risk signals
          ↓
8. Show plain-language warning
          ↓
9. Choose "Go Back"
          ↓
10. Open legitimate lookalike scenario
          ↓
11. Show mitigating evidence
          ↓
12. Show evaluation results
```

### Pitch line

> **"Our system doesn't ask whether a payment is unusual. It asks whether the context around that payment makes sense."**

---

# API

## Review Payment

```http
POST /api/payments/:id/review
```

The endpoint:

1. Loads the payment
2. Aggregates contextual data
3. Constructs the contextual payment representation
4. Extracts features
5. Evaluates risk
6. Generates an explanation
7. Persists the assessment
8. Returns the assessment

Example:

```json
{
  "assessmentId": "assessment_123",
  "riskBand": "HIGH",
  "riskScore": 82,
  "signals": [
    "MISTAKEN_TRANSFER_CLAIM",
    "NO_MATCHING_INCOMING_PAYMENT",
    "COUNTERPARTY_MISMATCH",
    "FIRST_TIME_PAYEE"
  ],
  "explanation": [
    "No matching incoming payment was found.",
    "The recipient differs from the claimed sender.",
    "This is a new recipient for you."
  ]
}
```

---

## Record User Decision

```http
POST /api/assessments/:id/decision
```

Request:

```json
{
  "decision": "GO_BACK"
}
```

or:

```json
{
  "decision": "CONTINUE_ANYWAY"
}
```

---

# Testing

Run unit tests:

```bash
pnpm test
```

Run with coverage:

```bash
pnpm test:coverage
```

The most important tests cover:

```text
Feature extraction
Risk signal activation
Mitigator behaviour
Risk-band thresholds
Explanation generation
Scam scenarios
Legitimate lookalikes
API review flow
User decision recording
```

---

# Evaluation Commands

A typical evaluation flow:

```bash
pnpm generate:scenarios
pnpm evaluate
```

Or run the Python evaluator directly:

```bash
python evaluation/evaluate.py
```

Expected outputs may include:

```text
Accuracy
Precision
Recall
F1
False Positive Rate
False Negative Rate
Average Latency
Confusion Matrix
Scenario Breakdown
```

---

# Limitations

This is a hackathon prototype and should not be interpreted as a production fraud-prevention system.

### 1. Synthetic Data

Synthetic evaluation does not establish performance on real-world financial fraud.

### 2. False Positives

Legitimate transactions can contain signals associated with scams.

For example:

```text
new payee
+
large amount
+
urgent message
```

can still be legitimate.

### 3. False Negatives

Sophisticated scams may avoid the patterns represented in the prototype.

### 4. Rule Tuning

The risk weights are prototype parameters and require validation using real-world data before production deployment.

### 5. NLP Errors

Message interpretation may be incorrect or ambiguous.

### 6. Incomplete Context

A production financial institution may have access to signals unavailable to this prototype.

### 7. No Real Payment Integration

The application intentionally uses simulated payments.

---

# Safety & Privacy

Authorised to Lose is designed to avoid collecting sensitive financial credentials.

The prototype does **not** require:

- UPI PIN
- OTP
- bank passwords
- card credentials
- real bank account access
- real UPI payment execution

All demonstration data should remain synthetic.

The project is intended for:

- education,
- research,
- hackathon demonstration,
- evaluation of contextual risk reasoning.

It is not a production financial service.

---

# Future Scope

A production-grade implementation could extend the prototype with:

```text
Real-time payment event streams
        ↓
Identity / counterparty verification
        ↓
Behavioural baselines
        ↓
Advanced graph analysis
        ↓
ML-assisted feature extraction
        ↓
Deterministic risk policy
        ↓
Real-time intervention
        ↓
Auditable decision infrastructure
```

Potential additions:

- streaming event ingestion,
- stronger counterparty identity signals,
- graph-based anomaly detection,
- model-assisted NLP,
- feature stores,
- model/rule versioning,
- human-review workflows,
- privacy-preserving analytics,
- real-time monitoring,
- production audit infrastructure.

---

# Why This Architecture?

The architecture deliberately separates:

```text
Understanding
     ↓
Evidence
     ↓
Risk
     ↓
Explanation
     ↓
Decision
```

This provides several advantages:

### Inspectability

Every risk decision can be traced back to concrete signals.

### Explainability

The user sees why the warning appeared.

### Reproducibility

The deterministic risk engine can produce the same result for the same context.

### Evaluation

The same engine can be benchmarked against synthetic holdout and adversarial datasets.

### User Agency

The system warns rather than silently deciding for the user.

### Extensibility

NLP/LLM capabilities can be added without giving the LLM direct authority over the final risk decision.

---

# Architecture Principles

1. **Context over isolated transaction features**
2. **Risk signal over fraud verdict**
3. **Evidence over opaque confidence**
4. **Deterministic decision layer over direct LLM decisions**
5. **User intervention over autonomous blocking**
6. **Synthetic data for the prototype**
7. **Auditability by default**
8. **False-positive control through mitigating evidence**
9. **Evaluation separate from development examples**
10. **Local-first architecture for reliable demonstration**

---

# One-Line Summary

> **Authorised to Lose is a contextual payment safety layer that combines transaction, message, behavioural, payee, and ledger evidence into an inspectable risk signal, explains the reasons before confirmation, and lets the user make the final decision.**

---

## Hackathon Positioning

### Problem

Social engineering can make a technically valid payment unsafe.

### Insight

The strongest evidence may exist **outside the transaction itself**.

### Solution

Connect the payment with its surrounding context before confirmation.

### Differentiator

**Contextual reasoning + evidence trace + user-controlled intervention.**

### Demo Moment

```text
Message
   ↓
₹5,000 Payment
   ↓
"Review Payment"
   ↓
Contextual Graph
   ↓
Risk Signals
   ↓
⚠️ Explainable Warning
   ↓
Go Back / Continue Anyway
```

---

## License

Add the project's chosen license here before public release.
