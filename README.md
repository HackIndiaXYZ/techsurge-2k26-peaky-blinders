# PausePay

### A second opinion before you pay.

PausePay is a contextual payment safety layer designed for UPI-style authorised push payments and social-engineering scenarios.

> **Don't just check the payment. Check the context.**

A payment can be technically valid and fully authorised by the user while still being the result of manipulation, urgency, deception, or a fabricated story.

PausePay connects the **message, payment intent, transaction history, payee relationship, ledger context, behaviour, and timing** before the user commits the payment.

It then produces an explainable risk signal and gives the user the final decision.

> **Risk ≠ Fraud Verdict**

---

## 1. Problem

Authorised push-payment scams can look like normal transactions because the user is manipulated into initiating and authorising the payment.

```text
Attacker
   ↓
Social Engineering
   ↓
User Trusts the Story
   ↓
User Initiates Payment
   ↓
User Authorises Payment
   ↓
Money Leaves Account
```

A transaction-only view may see:

```text
₹5,000 → Rahul Sharma → Valid Payment
```

But the surrounding context may reveal:

```text
"I accidentally sent ₹5,000."
+
No matching ₹5,000 incoming payment
+
New recipient
+
Recipient mismatch
+
Urgency
+
Payment immediately after message
```

The key question is therefore:

> **"Does the story surrounding this payment make sense?"**

---

## 2. Solution

PausePay introduces a **contextual safety layer before payment confirmation**.

The prototype demonstrates this using simulated host applications rather than requiring users to copy-paste messages.

```text
SIMULATED MESSAGES APP
          ↓
"Review with PausePay"
          ↓
Context automatically attached
          ↓
SIMULATED PAYMENT APP
          ↓
"Review Payment"
          ↓
PAUSEPAY ANALYSIS
          ↓
Contextual Payment Graph
          ↓
Risk Signals
          ↓
Explainable Warning
          ↓
GO BACK / CONTINUE ANYWAY
```

The intended experience is:

> **See → Review → Understand → Decide**

---

## 3. Improved Product Concept: PausePay as a Safety Layer

The key improvement over a standalone fraud-detection dashboard is that PausePay behaves like a **safety layer around the payment decision**.

Instead of:

```text
Message
   ↓
Copy
   ↓
Paste
   ↓
Analyse
```

the prototype demonstrates:

```text
Message
   ↓
Review with PausePay
   ↓
Payment
   ↓
Review Payment
   ↓
Contextual Analysis
```

The context follows the simulated workflow automatically.

This makes the product experience closer to how a real contextual payment-safety system could operate.

---

## 4. Prototype Boundary

The hackathon prototype contains three simulated parts:

### Simulated Messages App

A fictional messaging interface where the user receives a suspicious message.

### Simulated Payment App

A fictional UPI-style payment interface where the user creates a payment.

### PausePay Safety Layer

The intelligence layer that connects the message context with the payment decision.

The prototype does **not** claim to directly monitor or inject UI into:

- WhatsApp
- SMS
- Google Pay
- PhonePe
- Paytm
- real banking applications

It does not connect to real payment rails or execute real payments.

Instead:

```text
Real-world concept
        ↓
Simulated host applications
        ↓
Actual PausePay intelligence
```

### Production vision

A production version could integrate through supported mechanisms provided by operating systems, messaging platforms, payment applications, or financial institutions.

The exact integration mechanism would depend on the capabilities and policies of those platforms.

---

## 5. Core Product Flow

### Step 1 — Message

The user receives:

```text
Rahul Sharma

"I accidentally sent ₹5,000 to you.
Please return it immediately to rahul@upi."
```

The user sees:

```text
[ Review with PausePay ]
```

### Step 2 — Context Transfer

The prototype automatically transfers structured message context.

```json
{
  "messageId": "msg_001",
  "sender": "Rahul Sharma",
  "text": "I accidentally sent ₹5,000...",
  "claimedAmount": 5000,
  "urgency": "high",
  "intent": "refund"
}
```

No copy-paste is required.

### Step 3 — Payment

The simulated payment app displays:

```text
Send Money

₹5,000

Rahul Sharma
rahul@upi

Note:
Refund

[ Review Payment ]
```

No real payment is executed.

### Step 4 — PausePay Review

The system gathers:

```text
Payment
+
Message
+
Transaction History
+
Payee History
+
Ledger
+
Behaviour
+
Timing
```

---

## 6. Contextual Payment Graph

The central technical idea is the **Contextual Payment Graph**.

A transaction is represented as a relationship between multiple events.

```text
                    MESSAGE
                       │
                       │
              "I sent ₹5,000"
                       │
                       ▼
              CLAIMED TRANSFER
                       │
                       │
               No matching credit
                       │
                       ▼
                PAYMENT INTENT
                       │
                       │
                ₹5,000 → Rahul
                       │
                       ▼
                     PAYEE
```

The graph can connect:

```text
Message
   ↕
Claimed Transfer
   ↕
Ledger
   ↕
Payment
   ↕
Payee
   ↕
Transaction History
```

This makes contextual relationships explicit.

---

## 7. Context Sources

PausePay can reason over:

### Message Context

- sender
- message text
- claimed amount
- requested recipient
- urgency
- refund intent
- payment request

### Payment Context

- amount
- recipient
- UPI-style identifier
- timestamp
- payment note

### Transaction History

- previous payments
- payment amounts
- payment frequency
- previous counterparties

### Payee Context

- first-time payee
- established payee
- known contact
- previous transactions

### Ledger Context

- matching incoming credit
- transaction amount
- sender
- timestamp

### Behavioural Context

- normal payment range
- typical payment frequency
- unusual amount
- unusual timing

---

## 8. Feature Extraction

Raw context becomes structured signals.

### Transaction / Behaviour

```text
FIRST_TIME_PAYEE
HIGH_AMOUNT_RELATIVE_TO_BASELINE
SHORT_LATENCY_AFTER_MESSAGE
UNUSUAL_TRANSACTION_TIMING
RAPID_REPEATED_ACTION
```

### Social Engineering

```text
MISTAKEN_TRANSFER_CLAIM
URGENCY_PRESSURE
REFUND_LANGUAGE
PAYMENT_REQUEST_IN_MESSAGE
PAYEE_SOURCED_FROM_MESSAGE
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
CLAIMED_SENDER_NOT_FOUND
```

---

## 9. Mitigating Evidence

PausePay must not assume:

```text
New Payee + Large Amount = Scam
```

It also looks for evidence supporting legitimate behaviour:

```text
ESTABLISHED_PAYEE
VERIFIED_INCOMING_PAYMENT
KNOWN_CONTACT
RECURRING_PAYMENT_PATTERN
VERIFIED_MERCHANT_CONTEXT
```

This is important for controlling false positives.

---

## 10. Risk Engine

The core risk engine is deterministic and inspectable.

```text
Context
   ↓
Features
   ↓
Signals
   ↓
Weighted Evidence
   ↓
Risk Score
   ↓
Risk Band
```

Risk bands:

### LOW

Continue with little or no friction.

### MEDIUM

Show contextual warning.

### HIGH

Interrupt the flow and require explicit user decision.

The risk score is a prototype risk signal, not a probability of fraud.

For example:

```text
Risk Score: 82
Risk Band: HIGH
```

does not mean:

```text
82% chance of fraud
```

---

## 11. Risk ≠ Fraud Verdict

PausePay deliberately avoids claiming certainty.

The system should say:

> **"This payment contains multiple risk indicators."**

Not:

> "This payment is definitely fraudulent."

The purpose is to help the user pause and verify the situation.

---

## 12. Explainable Warning

For the primary demo scenario:

```text
┌────────────────────────────────────┐
│          ⚠ HIGH RISK               │
│                                    │
│     This payment looks unusual.    │
│                                    │
│ Why we're warning you:             │
│                                    │
│ • No matching incoming ₹5,000      │
│   payment was found.               │
│                                    │
│ • The recipient differs from the   │
│   person described as the sender.  │
│                                    │
│ • Rahul is a new recipient for you.│
│                                    │
│ • The payment closely followed     │
│   the message.                     │
│                                    │
│ • The payment amount matches the   │
│   amount mentioned in the message.│
│                                    │
│ This is a risk signal, not a       │
│ fraud determination.               │
│                                    │
│ [ GO BACK ]   [ CONTINUE ANYWAY ]  │
└────────────────────────────────────┘
```

The explanation is generated from structured evidence.

---

## 13. Evidence View

Provide an expandable technical evidence view:

```text
WHY DID PAUSEPAY FLAG THIS?

MESSAGE
"Accidentally sent ₹5,000"

LEDGER
"No matching incoming ₹5,000"

PAYEE
"First transaction with Rahul"

IDENTITY
"Claimed sender ≠ payment recipient"

TIMING
"Payment started 2 minutes after message"
```

Each evidence item should explain itself in plain language.

---

## 14. User Decision

The final decision remains with the user.

```text
                    HIGH RISK
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
          GO BACK          CONTINUE ANYWAY
             │                   │
             ▼                   ▼
       Payment stopped      Simulated payment
```

### GO BACK

```text
Payment cancelled.

You paused before sending.
```

Record:

```text
decision:
GO_BACK

outcome:
PAYMENT_NOT_SENT
```

### CONTINUE ANYWAY

```text
You chose to continue despite the warning.

No real payment was made.
```

Record:

```text
decision:
CONTINUE_ANYWAY

outcome:
PAYMENT_COMPLETED_SIMULATION
```

---

## 15. Audit Trace

Every assessment should be reconstructable.

```text
10:42:01
Message received

      ↓

10:43:10
Payment initiated

      ↓

10:43:12
PausePay review requested

      ↓

10:43:13
Context aggregated

      ↓

10:43:14
Signals evaluated

      ↓

10:43:14
HIGH risk generated

      ↓

10:43:15
Warning displayed

      ↓

10:43:21
User selected GO BACK
```

Display:

```text
Assessment ID
Payment ID
Risk Score
Risk Band
Signals
Mitigators
User Decision
Outcome
Engine Version
Processing Time
```

---

## 16. Primary Demo Scenario

### Mistaken Transfer Scam

Message:

```text
"I accidentally sent ₹5,000 to you.
Please return it immediately to rahul@upi."
```

Payment:

```text
₹5,000
Rahul Sharma
rahul@upi
```

Context:

```text
No matching ₹5,000 incoming credit
+
New payee
+
Recipient mismatch
+
Amount echo
+
Urgency
+
Short latency
```

Result:

```text
HIGH RISK
```

The user receives the warning and chooses:

```text
[ GO BACK ] [ CONTINUE ANYWAY ]
```

---

## 17. Legitimate Lookalike Scenario

PausePay must demonstrate that it does not simply flag every unusual payment.

Message:

```text
"Please send ₹5,000 to Rahul for the group booking."
```

Payment:

```text
₹5,000
Rahul Sharma
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
LOW / MEDIUM
```

depending on the configured risk engine.

The purpose is to show:

> **Large or new payments are not automatically scams.**

Mitigating evidence matters.

---

## 18. Scenario Library

The prototype should support multiple synthetic scenarios.

### Scam-oriented

1. Mistaken transfer / refund
2. Fake buyer / seller
3. Fake support request
4. Fake authority
5. Urgency-based payment
6. Deceptive payment request
7. QR/payment instruction deception

### Legitimate lookalikes

1. Legitimate group payment
2. Known merchant payment
3. New payee but legitimate payment
4. Large payment to an established contact

Each scenario should have coherent:

```text
Message
Payment
Ledger
Payee History
Transaction History
Behaviour
Timing
Expected Label
```

---

## 19. Synthetic Data

All demonstration data is synthetic.

The scenario taxonomy can be grounded in documented real-world digital-payment and social-engineering fraud patterns.

However:

```text
Real-world pattern
        ↓
Synthetic scenario
        ↓
Synthetic message
        ↓
Synthetic transaction
        ↓
Synthetic evaluation
```

The exact ₹5,000 scenario is a synthetic representation of a fraud pattern, not a claim that this exact transaction happened to a real person.

---

## 20. Evaluation

The application and evaluation pipeline should use the **same deterministic risk engine**.

```text
                 Risk Engine
                     │
            ┌────────┴────────┐
            ▼                 ▼
       Live Application    Evaluation
                              │
                 ┌────────────┼────────────┐
                 ▼            ▼            ▼
             Development   Holdout     Adversarial
```

Metrics:

- Accuracy
- Precision
- Recall
- F1 Score
- False Positive Rate
- False Negative Rate
- Response Latency

Do not fabricate benchmark results.

If evaluation has not been run:

```text
Evaluation Pending
```

---

## 21. Evaluation Dataset Strategy

Avoid evaluating only on examples that look exactly like the development examples.

Include:

```text
Different message wording
Different names
Different amounts
Different timing
Legitimate high-value payments
Legitimate new payees
Adversarial scam phrasing
Weak-signal combinations
```

This provides a more meaningful test of generalisation.

---

## 22. Optional NLP / LLM Layer

An LLM may optionally help understand natural-language messages.

Example:

```text
"I accidentally sent ₹5,000 to you.
Please return it immediately to rahul@upi."
```

Extract:

```json
{
  "claimedAmount": 5000,
  "requestedRecipient": "rahul@upi",
  "urgency": "high",
  "intent": "refund",
  "paymentRequest": true
}
```

Architecture:

```text
Raw Message
     ↓
NLP / LLM
     ↓
Structured Facts
     ↓
Feature Extraction
     ↓
Deterministic Risk Engine
```

The LLM does **not** make the final fraud decision.

The application must still work without an external LLM API.

---

## 23. Technology Stack

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
| Charts | Recharts |
| Optional Motion | Framer Motion |
| Optional NLP | LLM structured extraction |

The architecture is local-first for reliable hackathon demonstration.

---

## 24. Application Architecture

```text
┌───────────────────────────────────────────────────────────┐
│                 SIMULATED HOST APPLICATIONS                │
│                                                           │
│      Messages App  →  Payment App  →  PausePay Layer     │
└───────────────────────────┬───────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────┐
│                     PAYMENT INTENT                        │
└───────────────────────────┬───────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────┐
│                   CONTEXT AGGREGATOR                      │
│                                                           │
│ Message • Payment • History • Payee • Ledger • Behaviour │
└───────────────────────────┬───────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────┐
│               CONTEXTUAL PAYMENT GRAPH                    │
└───────────────────────────┬───────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────┐
│                    FEATURE EXTRACTION                     │
└───────────────────────────┬───────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────┐
│                     RISK ENGINE                           │
│                                                           │
│             Signals → Evidence → Score → Band             │
└───────────────────────────┬───────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────┐
│                 EXPLANATION ENGINE                        │
└───────────────────────────┬───────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────┐
│                    USER DECISION                          │
│                                                           │
│             GO BACK  ←→  CONTINUE ANYWAY                  │
└───────────────────────────┬───────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────┐
│                     AUDIT TRACE                           │
└───────────────────────────────────────────────────────────┘
```

---

## 25. Project Structure

```text
pausepay/
│
├── apps/
│   └── web/
│       ├── app/
│       │   ├── page.tsx
│       │   ├── demo/
│       │   ├── messages/
│       │   ├── payment/
│       │   ├── review/
│       │   ├── scenarios/
│       │   ├── analytics/
│       │   └── api/
│       │
│       ├── components/
│       │   ├── messages/
│       │   ├── payment/
│       │   ├── risk/
│       │   ├── graph/
│       │   ├── audit/
│       │   ├── scenarios/
│       │   └── ui/
│       │
│       └── lib/
│
├── packages/
│   ├── risk-engine/
│   │   ├── src/
│   │   │   ├── context/
│   │   │   ├── features/
│   │   │   ├── signals/
│   │   │   ├── scoring/
│   │   │   ├── explanation/
│   │   │   └── types/
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
│   └── results/
│
├── scripts/
├── tests/
│
├── docs/
│   ├── architecture.md
│   ├── demo.md
│   ├── evaluation.md
│   └── scenarios.md
│
├── .env.example
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

---

## 26. Database Model

Logical entities:

```text
User
 ├── Transaction[]
 ├── Message[]
 └── UserBehaviour[]

Payee
 └── Transaction[]

Transaction
 ├── User
 ├── Payee
 └── Assessment[]

Message
 └── User

LedgerEntry
 └── User

Assessment
 ├── Transaction
 ├── Features
 ├── Signals
 ├── Mitigators
 ├── Score
 ├── RiskBand
 ├── Explanation
 └── UserDecision
```

Assessment should retain:

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
processingTimeMs
```

---

## 27. API

### Review Payment

```http
POST /api/payments/:id/review
```

Responsibilities:

1. Load payment context
2. Aggregate contextual data
3. Build contextual payment representation
4. Extract features
5. Evaluate risk
6. Generate explanation
7. Persist assessment
8. Return assessment

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

### Record Decision

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

## 28. Security & Privacy

The prototype must never request:

- UPI PIN
- OTP
- bank password
- card credentials
- banking login
- real account access

The prototype must not:

- execute real payments,
- connect to bank accounts,
- monitor real third-party applications,
- store real financial credentials.

All demonstration information should be synthetic.

---

## 29. Failure Modes

### False Positives

A legitimate transaction may look suspicious.

```text
New Payee
+
Large Amount
+
Urgent Message
```

does not automatically mean fraud.

### False Negatives

A sophisticated scam may avoid known patterns.

### Synthetic Data Limitation

Synthetic evaluation does not prove real-world fraud-detection performance.

### Rule Tuning

Risk weights are prototype parameters and require real-world validation.

### NLP Errors

Message extraction may be incomplete or incorrect.

### Missing Context

A production payment platform may have signals unavailable to the prototype.

---

## 30. UX Principles

The interface should communicate:

1. **Context over isolated transaction data**
2. **Evidence over opaque AI confidence**
3. **Warning over autonomous blocking**
4. **User decision over system decision**
5. **Simple language over technical jargon**

The user should understand the warning in seconds.

---

## 31. Visual Design

PausePay should feel like:

```text
Fintech
+
Financial Security
+
Technical Intelligence
+
Trust
```

Use:

- dark charcoal / near-black background,
- white typography,
- muted grey surfaces,
- amber/orange for warnings,
- red only for HIGH risk,
- green for legitimate/low-risk states,
- subtle borders,
- clean cards,
- strong spacing.

Typography:

```text
Inter
Geist
IBM Plex Sans
```

Prefer:

- payment interfaces,
- message bubbles,
- evidence cards,
- contextual graphs,
- timelines,
- risk states,
- architecture diagrams.

Avoid:

- generic AI brain illustrations,
- stock finance photos,
- excessive gradients,
- excessive glassmorphism,
- decorative cybersecurity shields,
- meaningless animations.

---

## 32. Demo Mode

Create:

```text
[ START DEMO ]
```

The main demonstration:

```text
01 MESSAGE
       ↓
02 REVIEW WITH PAUSEPAY
       ↓
03 PAYMENT
       ↓
04 REVIEW PAYMENT
       ↓
05 CONTEXT
       ↓
06 RISK
       ↓
07 EVIDENCE
       ↓
08 USER DECISION
       ↓
09 AUDIT
```

Add a progress indicator:

```text
Message → Payment → Context → Risk → Decision
```

The entire story should be demonstrable in approximately 2–3 minutes.

---

## 33. Judge Demo

The ideal judge experience:

```text
"I receive a suspicious message."

        ↓

"I click Review with PausePay."

        ↓

"I don't copy anything."

        ↓

"The payment context follows automatically."

        ↓

"I start the payment."

        ↓

"PausePay pauses the decision."

        ↓

"It shows me the contextual relationship."

        ↓

"It explains exactly why the payment is risky."

        ↓

"I choose Go Back."

        ↓

"The decision is recorded."

        ↓

"I run a legitimate lookalike."

        ↓

"PausePay considers the mitigating evidence."
```

---

## 34. What We Demonstrate vs What We Claim

### We demonstrate

- Simulated Messages application
- Simulated Payment application
- Context transfer without copy-paste
- Contextual payment analysis
- Contextual Payment Graph
- Deterministic risk engine
- Explainable warning
- User-controlled intervention
- Audit trace
- Synthetic evaluation

### We do not claim

- Real WhatsApp monitoring
- Real SMS interception
- Google Pay integration
- PhonePe integration
- Paytm integration
- Real bank integration
- Real UPI payment execution
- Guaranteed fraud prevention
- Production-level fraud-detection accuracy

Correct positioning:

> **"PausePay is a contextual payment safety-layer prototype demonstrated using simulated host applications."**

---

## 35. Future Production Architecture

```text
Payment / Banking Channel
          ↓
       Risk Gateway
          ↓
    Context Services
     ┌────┼────┐
     ↓    ↓    ↓
   Ledger Identity Behaviour
     └────┼────┘
          ↓
 Contextual Payment Graph
          ↓
 Feature / Signal Engine
          ↓
 ┌────────┴────────┐
 ↓                 ↓
Deterministic    ML/NLP
Risk Engine      Assistance
 └────────┬────────┘
          ↓
 Explanation Layer
          ↓
 User Intervention
          ↓
 Audit Infrastructure
```

Possible future additions:

- real-time event streams,
- stronger counterparty verification,
- behavioural modelling,
- graph-based anomaly detection,
- ML-assisted NLP,
- feature stores,
- rule/model versioning,
- human review workflows,
- privacy-preserving analytics,
- real-time monitoring.

These are future considerations, not dependencies of the hackathon prototype.

---

## 36. Hackathon Implementation Plan

### Phase 1 — Simulated Host Apps

Implement:

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

Implement:

```text
Message
+
Payment
+
History
+
Ledger
+
Payee
+
Behaviour
```

and produce a unified context object.

### Phase 3 — Risk Engine

Implement:

```text
Features
→ Signals
→ Score
→ Risk Band
```

### Phase 4 — Explanation

Render:

```text
Risk
+
Top Evidence
+
Mitigating Evidence
+
Recommended Verification
```

### Phase 5 — User Decision

Implement:

```text
GO BACK
CONTINUE ANYWAY
```

and persist the outcome.

### Phase 6 — Evaluation

Run the same engine against:

```text
Development
Holdout
Adversarial
```

### Phase 7 — Polish

Only after the vertical slice works:

- improve animations,
- improve graph visualisation,
- add analytics,
- add optional NLP,
- improve presentation mode.

---

## 37. Architecture Principles

1. **Context over isolated transaction features**
2. **Risk signal over fraud verdict**
3. **Evidence over opaque confidence**
4. **Deterministic decision layer over direct LLM decisions**
5. **User intervention over autonomous blocking**
6. **Synthetic data for the prototype**
7. **Auditability by default**
8. **Mitigating evidence for false-positive control**
9. **Holdout/adversarial evaluation**
10. **Local-first demonstration**
11. **Simulated host applications for honest integration demonstration**

---

## 38. Final Product Statement

> **PausePay is a contextual payment safety layer that connects messages, payment intent, transaction history, payee relationships, ledger evidence, behaviour, and timing to identify explainable risk before a user commits a payment.**

The user gets one important moment:

```text
        BEFORE YOU PAY
              ↓
          PAUSEPAY
              ↓
      Understand the context
              ↓
          Make YOUR decision
```

---

## 39. One-Line Pitch

> **"PausePay gives users a second opinion before they pay by checking whether the story surrounding a payment actually makes sense."**

---

## 40. Final Demo Story

```text
                    MESSAGE
                       ↓
          "I accidentally sent ₹5,000"
                       ↓
              REVIEW WITH PAUSEPAY
                       ↓
                    PAYMENT
                       ↓
                REVIEW PAYMENT
                       ↓
              CONTEXT AGGREGATION
                       ↓
            CONTEXTUAL PAYMENT GRAPH
                       ↓
                 RISK SIGNALS
                       ↓
                  ⚠ HIGH RISK
                       ↓
                WHY WE'RE WARNING
                       ↓
              ┌────────┴────────┐
              ↓                 ↓
           GO BACK        CONTINUE ANYWAY
              ↓
        PAYMENT STOPPED
              ↓
          AUDIT TRACE
```

**PausePay**

> **Don't just check the payment. Check the context.**
