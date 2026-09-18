# Architecture — Authorised to Lose

## 1. Overview

**Authorised to Lose** is a pre-payment safety layer for UPI-style authorised push payments.

The system does not attempt to prove that a transaction is fraudulent. Instead, it evaluates the **context surrounding a payment**, produces a structured risk signal, explains the evidence in plain language, and gives the user the final decision.

> **Core principle:** Risk ≠ fraud verdict.

The prototype uses **synthetic transaction, message, payment-history, and user-behaviour data**. It does not connect to real banks, UPI rails, or payment accounts.

---

## 2. Design Goal

The primary question is not:

> "Is this transaction unusual?"

It is:

> **"Does the story surrounding this payment make sense?"**

For example, a payment may become high-risk when several pieces of context form a coherent social-engineering pattern:

- A message claims that money was accidentally sent.
- No corresponding incoming payment exists.
- The requested recipient is different from the claimed sender.
- The recipient is new to the user.
- The payment amount matches the amount mentioned in the message.
- The payment is initiated shortly after the message.

Each signal is inspectable and contributes to the final risk assessment.

---

## 3. High-Level Architecture

```text
┌───────────────────────────────────────────────────────────────┐
│                 Simulated Host Applications                  │
│                                                               │
│  Messages App → Payment App → Review with Authorised to Lose  │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                     Payment Intent Layer                      │
│                                                               │
│  amount • payee • payment time • source • user action         │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                    Context Aggregator                         │
│                                                               │
│  Transaction Context                                          │
│  Message Context                                              │
│  User Behaviour / History                                     │
│  Payee / Counterparty Context                                 │
│  Ledger Context                                               │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                  Contextual Payment Graph                     │
│                                                               │
│  Message → Claimed Transfer → User Action → Payment           │
│          ↘ Claimed Sender / Requested Recipient ↙             │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                      Feature Extractor                        │
│                                                               │
│  new_payee • amount_echo • counterparty_mismatch              │
│  inbound_unverified • urgency • short_latency                  │
│  payee_from_message • mistaken_transfer_claim                  │
│  established_payee • verified_incoming                        │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                        Risk Engine                            │
│                                                               │
│  Structured Signals → Weighted Evidence → Risk Score          │
│                              ↓                                │
│                    LOW / MEDIUM / HIGH                        │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                    Explanation Engine                         │
│                                                               │
│  Risk band + evidence + contributing signals                  │
│              → plain-language warning                         │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                     User Intervention                         │
│                                                               │
│             Go Back  ←→  Continue Anyway                      │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                        Audit Trace                             │
│                                                               │
│  Payment → Context → Features → Signals → Score → Warning    │
│                      → User Decision → Outcome                │
└───────────────────────────────────────────────────────────────┘
```

---

## 4. Simulated Host Application Architecture

### Purpose

The hackathon prototype demonstrates Authorised to Lose as a **safety layer around a payment decision** without pretending to have unrestricted access to real third-party applications.

The prototype contains simulated host applications:

```text
┌──────────────────────────────┐
│       Simulated Messages     │
│                              │
│ Rahul:                       │
│ "I accidentally sent ₹5,000. │
│  Please return it to         │
│  rahul@upi immediately."     │
│                              │
│ [ Review with Authorised     │
│   to Lose ]                  │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│   Authorised to Lose Layer   │
│                              │
│ Message context attached     │
│ automatically in the demo    │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│       Simulated Payment      │
│                              │
│ ₹5,000                       │
│ Rahul Sharma                 │
│ rahul@upi                    │
│                              │
│ [ Review Payment ]           │
└──────────────┬───────────────┘
               │
               ▼
       Contextual Risk Analysis
```

The intended experience is:

```text
See → Review → Understand → Decide
```

rather than:

```text
Copy → Paste → Analyse
```

### What is simulated?

The prototype simulates the integration boundary between a messaging application, a payment application, and the Authorised to Lose safety layer.

The host applications are **not real third-party applications**. The prototype does not claim to monitor or inject UI into WhatsApp, SMS, Google Pay, PhonePe, Paytm, or another real application.

### Production vision

In a production system, the safety layer could be integrated through supported OS, messaging, and payment-provider mechanisms. The exact mechanism would depend on the capabilities and policies of the relevant platform or payment provider.

This hackathon implementation deliberately keeps that boundary simulated so the team can demonstrate the product concept without requiring real banking or third-party application access.

---

## 5. Core Request Flow

### Step 1 — Host-App Context

The user sees a message inside the **simulated Messages app** and selects the contextual review action. The demo passes the message context directly to Authorised to Lose — there is no copy-paste step.

```text
Simulated Messages
       ↓
Review with Authorised to Lose
       ↓
Context attached
```

### Step 2 — Payment Intent

The user starts a simulated UPI-style payment.

The system captures:

```text
paymentId
userId
amount
payee
payeeVpa
timestamp
source
```

No real payment is initiated.

---

### Step 3 — Context Aggregation

Before confirmation, the system collects the available synthetic context.

```text
Payment
├── current transaction
├── recent transaction history
├── payee history
├── incoming ledger entries
├── message/conversation context
└── recent user behaviour
```

The goal is to evaluate the payment in context rather than treating it as an isolated transaction.

---

### Step 4 — Contextual Payment Graph

The system converts related events into a contextual relationship graph.

Example:

```text
Message
   │
   ├── claimed sender: Amit
   ├── claimed amount: ₹5,000
   └── urgency: high
          │
          ▼
Claimed Incoming Transfer
   │
   └── ₹5,000 not found
          │
          ▼
User Payment Intent
   │
   ├── ₹5,000
   └── Rahul Sharma
          │
          ▼
Recipient
   └── rahul@upi
```

This makes relationships such as **amount matching**, **identity mismatch**, and **temporal proximity** explicit.

---

## 6. Feature Extraction

Feature extraction converts raw context into structured signals.

### Transaction / Behavioural Signals

Examples:

- `FIRST_TIME_PAYEE`
- `HIGH_AMOUNT_RELATIVE_TO_BASELINE`
- `SHORT_LATENCY_AFTER_MESSAGE`
- `UNUSUAL_TRANSACTION_TIMING`
- `RAPID_REPEATED_ACTION`

### Message / Social-Engineering Signals

Examples:

- `MISTAKEN_TRANSFER_CLAIM`
- `URGENCY_PRESSURE`
- `REFUND_LANGUAGE`
- `PAYMENT_REQUEST_IN_MESSAGE`
- `PAYEE_SOURCED_FROM_MESSAGE`

### Payee / Identity Signals

Examples:

- `COUNTERPARTY_MISMATCH`
- `NEW_PAYEE`
- `UNVERIFIED_COUNTERPARTY`
- `LOOKALIKE_VPA` *(optional)*

### Ledger / Context Signals

Examples:

- `INBOUND_CREDIT_UNVERIFIED`
- `AMOUNT_ECHO`
- `NO_MATCHING_INCOMING_PAYMENT`
- `CLAIMED_SENDER_NOT_FOUND`

### Mitigating Signals

The engine must also model evidence that makes a transaction more consistent with legitimate behaviour:

- `ESTABLISHED_PAYEE`
- `VERIFIED_INCOMING_PAYMENT`
- `KNOWN_CONTACT`
- `RECURRING_PAYMENT_PATTERN`
- `VERIFIED_MERCHANT_CONTEXT`

Mitigators are important for controlling false positives.

---

## 7. Risk Engine

The risk engine is deterministic and inspectable.

The LLM must **not** directly decide whether a payment is fraudulent.

Conceptually:

```text
features
   ↓
signal evaluation
   ↓
weighted evidence
   ↓
risk score
   ↓
risk band
```

Example conceptual model:

```text
Risk Score =
    positive risk signals
    - mitigating evidence
```

The exact weights are implementation parameters and should be described as **expert-designed/tuned for the prototype**, not as universally correct fraud probabilities.

### Risk Bands

| Band | Intended behaviour |
|---|---|
| LOW | Continue with little or no friction |
| MEDIUM | Show a passive contextual warning |
| HIGH | Interrupt the payment flow and require an explicit user decision |

A HIGH score means:

> "The surrounding context contains multiple risk indicators."

It does **not** mean:

> "This transaction has been proven fraudulent."

---

## 8. Explanation Engine

The explanation layer converts structured evidence into a user-understandable explanation.

Example:

```text
⚠️ This payment looks unusual.

Why we're warning you:

• We couldn't find a matching incoming ₹5,000 payment.
• The recipient is different from the person mentioned as the sender.
• This is a new recipient for you.
• The payment was started shortly after the message.

This is a risk signal, not a fraud determination.
```

The explanation should prioritize:

1. strongest evidence,
2. evidence the user can verify,
3. plain language,
4. actionable next step.

The system should avoid opaque explanations such as:

```text
AI confidence: 87.4%
```

unless accompanied by the underlying evidence.

---

## 9. User Decision Layer

The final decision remains with the user.

```text
                    HIGH RISK
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
          GO BACK          CONTINUE ANYWAY
             │                   │
             ▼                   ▼
       payment abandoned     payment proceeds
```

Both outcomes are recorded for the audit trail.

The product is therefore an **intervention and decision-support layer**, not an autonomous payment blocker.

---

## 10. Auditability

Every assessment should be reconstructable.

```text
Assessment
│
├── payment intent
├── context snapshot
├── extracted features
├── triggered signals
├── mitigating signals
├── risk score
├── risk band
├── explanation
├── user decision
└── outcome
```

This supports debugging, evaluation, demonstrations, and future model improvement.

A useful audit record can contain:

```text
assessmentId
paymentId
timestamp
features
signals
mitigators
riskScore
riskBand
explanation
userDecision
outcome
engineVersion
```

`engineVersion` is useful because risk rules may change between evaluations.

---

## 11. Application Architecture

For the hackathon prototype, the application can remain local-first.

```text
Next.js Application
│
├── Simulated Host Apps
│   ├── Messages App
│   ├── Payment App
│   └── Authorised to Lose Layer
│
├── App Router / UI
│
├── API Route Handlers
│
├── Domain Services
│   ├── Context Aggregator
│   ├── Feature Extractor
│   ├── Risk Engine
│   ├── Explanation Engine
│   └── Audit Service
│
├── Prisma ORM
│
└── SQLite
```

### Technology Choices

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js + TypeScript | Application and demo UI |
| Styling | Tailwind CSS | Interface implementation |
| Motion | Framer Motion | Subtle explanatory transitions |
| Backend | Next.js Route Handlers | API endpoints |
| Validation | Zod | Input/schema validation |
| Risk engine | Pure TypeScript | Deterministic scoring |
| ORM | Prisma | Database access |
| Database | SQLite | Local synthetic prototype data |
| Testing | Vitest | Unit/integration testing |
| Evaluation | Python + pandas + scikit-learn | Offline benchmark |
| Charts | Recharts | Secondary analytics |

A separate Express service is unnecessary for the hackathon unless the implementation later requires service separation.

---

## 12. Database Model

A minimal prototype can use the following logical entities:

```text
User
 ├── Transaction[]
 ├── Message[]
 └── UserBehaviour[]

Payee
 └── Transaction[]

Transaction
 ├── user
 ├── payee
 └── Assessment[]

Message
 └── user

LedgerEntry
 └── user

Assessment
 ├── transaction
 ├── features
 ├── signals
 ├── score
 ├── riskBand
 ├── explanation
 └── UserDecision
```

The database contains **synthetic data only**.

---

## 13. API Boundaries

Suggested endpoints:

### Review a payment

```http
POST /api/payments/:id/review
```

Responsibilities:

1. load payment context,
2. aggregate relevant context,
3. construct the contextual representation,
4. extract features,
5. evaluate risk,
6. generate explanation,
7. persist assessment,
8. return the assessment.

Example response:

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

### Record user decision

```http
POST /api/assessments/:id/decision
```

Example:

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

## 14. Optional NLP / LLM Layer

Natural-language messages may contain useful information such as:

```text
claimedSender
claimedAmount
requestedRecipient
urgency
refundIntent
paymentRequest
```

An LLM can optionally convert message text into structured information.

```text
Raw Message
     ↓
NLP / LLM extraction
     ↓
Structured message facts
     ↓
Feature Extractor
     ↓
Risk Engine
```

The LLM output should be schema-validated and treated as **input evidence**, not as the final fraud decision.

A deterministic implementation can be used as the fallback when an LLM is unavailable.

This keeps the core safety decision reproducible and demoable offline.

---

## 15. Synthetic Scenario Generation

The scenario taxonomy is grounded in documented UPI/digital-payment fraud-awareness patterns, while the actual transaction records and conversations used by the prototype are synthetic.

Scenario families should include:

### Scam-oriented scenarios

- mistaken-payment / refund claims,
- fake buyer/seller interactions,
- fake authority or support,
- urgency-driven payment requests,
- deceptive payment requests,
- QR/payment-instruction deception.

### Legitimate lookalikes

Each scam family should have legitimate counterparts.

For example:

```text
SCAM:
"I accidentally sent ₹5,000. Please return it to Rahul."

LEGITIMATE:
"Here is the ₹5,000 I transferred earlier. Please send it
to Rahul because he is collecting the group payment."
```

The evaluation should not only contain obvious scams.

---

## 16. Evaluation Architecture

The production risk engine should be reused by the evaluation pipeline.

```text
Synthetic Dataset
       │
       ▼
Scenario Generator
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

### Metrics

Measure:

- Accuracy
- Precision
- Recall
- F1
- False-positive rate
- False-negative rate
- Response latency

Also break results down by scenario family where useful.

### Dataset Design

Avoid evaluating only on cases generated from the exact same templates used to create the rules.

Use:

- different message wording,
- different names,
- different amounts,
- different timing,
- legitimate high-value transactions,
- legitimate new payees,
- adversarial scam phrasing,
- combinations of weak signals.

This provides a more meaningful test of generalisation.

---

## 17. Demo Scenarios

### Scenario A — High-Risk Social Engineering

```text
Incoming message:
"I accidentally sent ₹5,000 to you.
Please return it immediately to rahul@upi."

Payment:
₹5,000 → Rahul Sharma → rahul@upi
```

Context:

```text
No matching ₹5,000 incoming credit
+
Recipient differs from claimed sender
+
New payee
+
Amount matches message
+
Payment shortly follows message
```

Expected result:

```text
HIGH
```

The UI explains the evidence and allows:

```text
Go Back
Continue Anyway
```

---

### Scenario B — Legitimate Lookalike

```text
Message:
"Please send ₹5,000 to Rahul for the group booking."

Payment:
₹5,000 → Rahul Sharma
```

Context:

```text
Known contact
+
Established payee
+
Prior legitimate transactions
+
Consistent conversation
```

Expected behaviour:

```text
LOW / MEDIUM depending on context
```

The exact band is determined by the configured risk engine.

The purpose of this scenario is to demonstrate that the system does not equate:

```text
new/large payment = scam
```

and that mitigating evidence matters.

---

## 18. Security and Safety Principles

### No real financial integration

The prototype must not:

- connect to real bank accounts,
- initiate real UPI payments,
- collect UPI PINs,
- collect OTPs,
- store banking credentials.

### No autonomous blocking

The system provides a warning and evidence. The user remains the final decision-maker.

### Explainability by construction

The risk engine should retain the signals that contributed to every decision.

### Data minimisation

Only synthetic data required for the demonstration and evaluation should be stored.

---

## 19. Failure Modes and Limitations

The prototype should explicitly acknowledge:

### False positives

Legitimate payments can resemble scam patterns.

Example:

```text
new payee + large amount + urgent message
```

may be completely legitimate.

### False negatives

Sophisticated social engineering may avoid the known signal patterns.

### Synthetic-data limitations

Performance on synthetic scenarios does not establish real-world fraud-detection performance.

### Rule tuning limitations

Risk weights are prototype parameters and require real-world validation before production use.

### NLP limitations

Message extraction can be incorrect or ambiguous.

### Missing context

A production payment system may have access to signals unavailable to this prototype.

---

## 20. Observability

For each assessment, capture:

```text
assessmentId
engineVersion
processingTimeMs
riskBand
riskScore
triggeredSignalCount
mitigatorCount
userDecision
```

This makes it possible to inspect:

- slow assessments,
- frequently triggered signals,
- warning outcomes,
- false-positive patterns,
- changes between engine versions.

---

## 21. Future Production Architecture

The hackathon architecture intentionally avoids unnecessary infrastructure.

A production evolution could look like:

```text
Payment / Banking Channel
          │
          ▼
     Risk Gateway
          │
          ▼
   Context Services
    ┌─────┼─────┐
    ▼     ▼     ▼
 Ledger  Identity  Behaviour
    │     │         │
    └─────┼─────────┘
          ▼
 Contextual Payment Graph
          │
          ▼
 Feature / Signal Engine
          │
          ├──────────────┐
          ▼              ▼
 Deterministic Risk   ML/NLP Layer
      Engine              │
          └──────┬────────┘
                 ▼
          Explanation Layer
                 │
                 ▼
          User Intervention
                 │
                 ▼
            Audit Store
```

Potential production additions include:

- streaming event ingestion,
- stronger identity/counterparty verification,
- model-assisted feature extraction,
- feature stores,
- distributed audit logging,
- real-time monitoring,
- model/rule versioning,
- human-review workflows,
- privacy and security controls.

These are **future architecture considerations**, not dependencies of the hackathon prototype.

---

## 22. Architectural Principles

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

## 23. One-Line Architecture Summary

> **A contextual payment safety layer that aggregates transaction, message, behavioural, payee, and ledger evidence into an inspectable risk signal, explains the reasons before confirmation, records the user's decision, and evaluates the same deterministic engine against synthetic holdout scenarios.**


---

## 24. Hackathon Implementation Plan

Build the simulated host-app experience first, then connect the intelligence behind it.

### Phase 1 — Host-App Demo Shell

```text
Messages App
    ↓
Contextual Review Action
    ↓
Payment App
    ↓
Review Payment
```

The transition should feel like a safety layer rather than a separate data-entry tool.

### Phase 2 — Context Engine

Implement: `Message + Payment + History + Ledger + Payee + Behaviour` and produce a unified context object.

### Phase 3 — Risk Engine

Implement deterministic `Features → Signals → Score → Risk Band`.

### Phase 4 — Explanation

Render risk, top evidence, mitigating evidence, and an actionable verification step.

### Phase 5 — User Decision

Implement `GO BACK` and `CONTINUE ANYWAY`, and persist the outcome.

### Phase 6 — Evaluation

Run the same engine against Development, Holdout, and Adversarial datasets.

### Phase 7 — Polish

Only after the vertical slice works: improve animations, graph visualisation, analytics, optional NLP, and presentation mode.

## 25. Demo Boundary: What We Claim vs What We Demonstrate

### We demonstrate

- simulated messaging application,
- simulated payment application,
- automatic transfer of message context inside the prototype,
- contextual payment analysis,
- explainable risk,
- user intervention,
- auditability,
- synthetic-data evaluation.

### We do not claim

- real WhatsApp monitoring,
- real SMS interception,
- injection into Google Pay/PhonePe/Paytm,
- real bank integration,
- real UPI transaction execution,
- production-grade fraud-detection accuracy.

### Judge explanation

> **"For the hackathon, we simulate the host applications so we can demonstrate the safety-layer experience without requiring access to third-party apps or real payment rails. The core risk engine, contextual reasoning, explanation, intervention, and evaluation are implemented as the actual prototype."**
