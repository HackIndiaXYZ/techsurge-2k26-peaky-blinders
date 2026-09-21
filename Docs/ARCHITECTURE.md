# PausePay Technical Architecture

This document outlines the technical architecture of PausePay, focusing on the context pipeline, risk evaluation, and evidence generation.

---

## 1. System Architecture

```text
                    ┌──────────────┐
                    │   MESSAGE    │
                    │   CONTEXT    │
                    └──────┬───────┘
                           │
                           ▼
                    Context Aggregator
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
           Message       Ledger      Behavior
           Signals       Context     Signals
              │            │            │
              └────────────┼────────────┘
                           ▼
                    Contextual Risk
                       Engine
                           │
                    ┌──────┴──────┐
                    ▼             ▼
                Risk Score      Evidence
                    │             │
                    └──────┬──────┘
                           ▼
                  Explanation Engine
                           │
                           ▼
                    User Intervention
                           │
                    ┌──────┴──────┐
                    ▼             ▼
                 Go Back      Continue
```

---

## 2. Contextual Risk Engine

PausePay evaluates risk by aggregating context from multiple streams:

- **Message Signals**: NLP analysis (TF-IDF, Logistic Regression) of communication intent, urgency, and specific entities.
- **Ledger Context**: Verification of incoming funds versus requested amounts.
- **Behavior Signals**: Historical payee interaction, frequency, and amount patterns.

These streams are aggregated to identify anomalies that a payment network alone cannot see.

---

## 3. Risk Scoring

The Risk Engine uses a deterministic, transparent formula. **The score is an interpretable risk scale, not a probability of fraud.**

```text
raw_score =
    Σ risk_signal_weights
    +
    Σ mitigator_weights

final_score =
    max(0, min(100, raw_score))
```

### Risk Bands
```text
0 – 34    LOW
35 – 64   MEDIUM
65 – 100  HIGH
```

### Example
If a user receives an urgent message for ₹5,000 from an unknown sender, and immediately initiates a payment for exactly ₹5,000 to a new VPA:
- `FIRST_TIME_PAYEE` (+30)
- `AMOUNT_ECHO` (+20)
- `URGENCY_DETECTED` (+15)
- `SHORT_LATENCY_AFTER_MESSAGE` (+21)
- **Total Score: 86 (HIGH)**

---

## 4. Evidence & Explainability

PausePay separates internal risk signals from user-facing explanations. The user sees concrete evidence rather than ML model terminology.

### Internal Signals
```text
COUNTERPARTY_MISMATCH
FIRST_TIME_PAYEE
AMOUNT_ECHO
SHORT_LATENCY_AFTER_MESSAGE
```

### User-facing Explanation
```text
No matching incoming credit found
First payment to this recipient
₹5,000 matches the requested amount
Payment followed the request by 43 seconds
```

---

## 5. Audit & Activity

PausePay maintains a rigorous audit trail of every stage in the lifecycle.

### Audit Sequence
```text
MESSAGE_RECEIVED
       ↓
MESSAGE_ANALYZED
       ↓
PAYMENT_INITIATED
       ↓
CONTEXT_AGGREGATED
       ↓
RISK_SIGNALS_EVALUATED
       ↓
RISK_ASSESSMENT_CREATED
       ↓
WARNING_DISPLAYED
       ↓
USER_DECISION (e.g. CONTINUED_AFTER_WARNING)
```

The system explicitly records that a warning was presented and that the user explicitly chose to continue, separating the risk evaluation from the user's ultimate decision.
