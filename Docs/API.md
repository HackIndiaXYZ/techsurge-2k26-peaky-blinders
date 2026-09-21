# PausePay Partner API

The PausePay API allows payment providers to evaluate transactions against contextual communication and behavioral data before they are finalized.

## Integration Flow

```text
Payment Provider
       ↓
POST /v1/risk/evaluate
       ↓
PausePay
       ↓
Risk + Evidence
       ↓
Payment Provider UI
```

---

## Endpoint: Evaluate Risk

**`POST /v1/risk/evaluate`**

Evaluates a proposed payment against recent contextual signals to generate a risk score and user-facing evidence.

### Authentication
Include your partner API key in the request headers:
```http
Authorization: Bearer sk_test_...
```

### Example Request

```json
{
  "amount": 5000,
  "currency": "INR",
  "payee": {
    "name": "Rahul Sharma",
    "vpa": "rahul@upi"
  },
  "context": {
    "message": "I accidentally sent ₹5000. Please send it back.",
    "message_timestamp": "2026-09-19T09:40:12Z"
  }
}
```

### Example Response

```json
{
  "risk_score": 86,
  "risk_band": "HIGH",
  "action": "WARN",
  "evidence": [
    "No matching incoming credit found",
    "First payment to recipient",
    "Payment closely followed message",
    "Amount matches requested amount"
  ]
}
```

### Field Definitions

- **`risk_score`**: Integer from 0 to 100 representing the contextual risk. Not a probability of fraud.
- **`risk_band`**: Enum of `LOW`, `MEDIUM`, or `HIGH`. Use this to decide whether to intervene.
- **`action`**: Suggested provider action (e.g., `WARN`, `ALLOW`).
- **`evidence`**: Human-readable strings explaining the risk factors. These are safe to present directly to the user in a warning UI.
