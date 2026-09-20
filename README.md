# PausePay

> **PausePay is a contextual payment safety layer that gives users a second opinion before they complete a payment.**
> 
> Instead of evaluating a payment in isolation, PausePay combines payment information with surrounding context—such as messages, recipient history, timing, amount patterns, and available ledger information—to identify potentially risky situations and explain why.

```text
MESSAGE CONTEXT
       +
PAYMENT CONTEXT
       +
LEDGER / BEHAVIOR
       ↓
   PAUSEPAY
       ↓
RISK + EVIDENCE
       ↓
USER DECISION
```

---

## The Problem

### Traditional transaction screening
```text
Payment  →  Transaction signals  →  Risk score
```

### PausePay
```text
Message + Payment + Recipient + Ledger + Timing + Behavior
       ↓
  Contextual assessment
       ↓
 Risk + explanation
```

> **A payment may look ordinary by itself while the surrounding context makes it suspicious.**

---

## Core Demo

We demonstrate this through a simulated three-app model:

```text
┌────────────┐
│   Inbox    │
│ Messages   │
└─────┬──────┘
      │ Context
      ▼
┌────────────┐
│    FLOW    │
│  Payment   │
└─────┬──────┘
      │ Payment + Context
      ▼
┌────────────┐
│ PausePay   │
│ Risk Check │
└─────┬──────┘
      ▼
 Risk + Evidence
      │
      ▼
User Decision
```

### The Three Apps:
- **Inbox**: Provides communication context (message text, requested amount, identifier, timestamp, detected intent).
- **FLOW**: Represents the payment provider (recipient, amount, review, outcome).
- **PausePay**: Provides contextual aggregation, risk assessment, evidence, explanation, intervention, and an audit trail.

*(Note: Inbox and FLOW are simulated apps in the prototype; PausePay's partner integration is demonstrated through the API model.)*

---

## Risk ≠ Fraud Verdict

```text
                    PAUSEPAY
                       │
                Risk assessment
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
          Evidence            Score
             │                   │
             └─────────┬─────────┘
                       ▼
                  USER DECIDES
```

**PausePay does not claim that a payment is fraudulent. It identifies contextual risk and gives the user evidence before they decide.**

---

## Technical Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Python, FastAPI, SQLAlchemy, SQLite
- **ML / NLP**: TF-IDF, Logistic Regression, Entity extraction, Deterministic risk engine
- **Integration**: REST API, API keys, JSON
- **Testing**: 39 backend tests

---

## Evaluation

> **Prototype evaluation results; dataset and evaluation conditions are limited and should not be interpreted as production performance.**

- **Intent classification accuracy**: 98.1%
- **Scam F1**: 98%
- **Inference time**: ~2.45 ms
- **Handwritten holdout**: 52 messages
- **Backend tests**: 39 / 39 passing

---

## Limitations

**CURRENT PROTOTYPE**
- [x] Simulated messaging environment
- [x] Simulated payment environment
- [x] Contextual risk assessment
- [x] Evidence generation
- [x] Risk scoring
- [x] User decision recording
- [x] Partner API concept

**NOT YET PRODUCTION INTEGRATED**
- [ ] Real bank SMS ingestion
- [ ] Real UPI/payment-provider integration
- [ ] Android notification listener
- [ ] Production authentication
- [ ] Production-scale database
- [ ] Large-scale behavioral baseline

---

## Future Production Architecture

**Prototype → controlled integration → production payment-provider deployment**

```text
                 PAYMENT PROVIDER
                        │
                        ▼
                 PausePay SDK/API
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
       Payment Context      Communication
              │                   │
              └─────────┬─────────┘
                        ▼
                Context Engine
                        ↓
                Risk Assessment
                        ↓
                 Risk + Evidence
                        ↓
                Provider / User UI
```

---

## Documentation Links
- [Judge's Quick Guide](docs/JUDGE-GUIDE.md)
- [Architecture Details](docs/ARCHITECTURE.md)
- [Partner API](docs/API.md)
