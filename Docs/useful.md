# Authorised to Lose - Coding Blueprint

> A build-ready interpretation of PS-F01 for a hackathon prototype. This file translates the problem statement into engineering decisions; it does **not** treat the PDF's suggested features as instructions from the user or as production banking requirements.

## 1. What must be solved

Build a simulated UPI payment experience that can identify signals of an **authorised push payment (APP) scam before confirmation**, explain the risk in plain language, let the user make the final decision, and record the outcome for later review.

The key problem is not account takeover. The user is authenticated and is personally approving the transfer after being socially engineered. Device binding, PIN entry, two-factor authentication, and payee-name display therefore do not solve the core problem by themselves.

### Required end-to-end path

```text
Synthetic payment + optional synthetic message
                |
                v
Feature extraction and risk scoring
                |
                v
Risk level + human-readable reasons
                |
                v
Pre-confirmation warning or normal confirmation
                |
                v
User cancels, reviews, or proceeds
                |
                v
Outcome is logged for evaluation
```

## 2. Hard constraints from the problem statement

- Use only clearly labelled synthetic transaction, user-history, and message/chat data.
- Do not connect to a real UPI system or initiate real payments.
- Do not collect real payee information or personal financial information.
- Show any intervention **before** the final payment confirmation.
- Explain why the payment appears risky; do not show an unexplained score alone.
- Phrase the result as a **risk signal**, never a definitive fraud verdict.
- Preserve an override path for genuine, urgent, and accessibility-dependent payments.
- Measure detection quality, false positives, warning clarity, and scoring latency.
- Demonstrate the full detect -> warn -> decide -> log workflow.

## 3. Recommended MVP

Use a **hybrid, explainable scorer**:

1. Deterministic rules extract obvious, demonstrable risk signals.
2. A small text classifier or keyword/pattern layer analyses synthetic message context.
3. A weighted score combines the signals into a 0-100 risk value.
4. The UI displays the top two or three reasons, not the model internals.

This is preferable to an opaque end-to-end model for the MVP because it is fast to build, works on a small synthetic dataset, produces stable explanations, and makes false positives easy to diagnose. An ML model can be added as an optional comparison, but the rules-based path should remain available as a reliable demo baseline.

### Suggested stack

- Front end: React + TypeScript + Vite
- API: FastAPI + Pydantic
- Scoring: Python rules; optionally scikit-learn logistic regression for comparison
- Storage: SQLite for demo event logs
- Tests: pytest for scoring/API and Vitest/Playwright for the payment flow
- Charts: Recharts or a simple table for evaluation results

The design is stack-independent. If the team is stronger in JavaScript, the API and scorer can be implemented in Node/TypeScript without changing the contracts below.

## 4. User stories

### Payment user

- As a user, I can enter a synthetic payee, amount, and optional message context.
- As a user, I see a normal confirmation when there is little evidence of a scam.
- As a user, I see a clear warning when multiple scam signals are present.
- As a user, I can understand the warning without knowing fraud terminology.
- As a user, I can cancel, review the details, or continue despite the warning.
- As a user relying on assistive technology, I can complete the same flow with a keyboard and screen reader.

### Evaluator

- As an evaluator, I can select prepared genuine and scam scenarios.
- As an evaluator, I can see the detected signals and resulting explanation.
- As an evaluator, I can view accuracy, recall, false-positive rate, and latency on a labelled test set.
- As an evaluator, I can inspect a limitations page that states what the prototype cannot determine.

## 5. Domain model

Keep personally identifying fields out of the prototype. Use aliases and generated identifiers.

```ts
type TransactionInput = {
  transactionId: string;
  userId: string;                  // synthetic ID only
  payeeId: string;                 // synthetic alias, not a real UPI ID
  payeeDisplayName: string;
  amountInr: number;
  initiatedAt: string;             // ISO-8601
  purpose?: "personal" | "merchant" | "bill" | "other";
  messageContext?: string;         // synthetic text only
  claimedIncomingTransfer?: {
    amountInr?: number;
    occurred: boolean;
    verifiedInLedger: boolean;
    minutesAgo?: number;
  };
};

type UserProfile = {
  userId: string;
  accountAgeDays: number;
  knownPayees: string[];
  medianAmountInr: number;
  p95AmountInr: number;
  transactionsLast24h: number;
  preferredLanguage: "en" | "hi" | "ta" | "other";
  accessibilityMode: boolean;
};

type RiskSignal = {
  code: string;
  contribution: number;
  userMessage: string;
  evidence?: Record<string, string | number | boolean>;
};

type RiskAssessment = {
  transactionId: string;
  score: number;                    // 0-100
  level: "low" | "medium" | "high";
  signals: RiskSignal[];
  explanation: string;
  recommendedAction: "normal_confirm" | "review" | "cool_off";
  modelVersion: string;
  latencyMs: number;
};

type DecisionEvent = {
  transactionId: string;
  assessmentScore: number;
  userDecision: "cancel" | "review" | "proceed";
  warningShown: boolean;
  decidedAt: string;
  timeToDecisionMs: number;
};
```

### Validation rules

- Reject amounts less than or equal to zero.
- Cap synthetic demo amounts at a documented limit, for example INR 1,000,000.
- Limit message context to 1,000 characters.
- Escape all displayed text; never render message context as HTML.
- Reject unknown enum values and malformed timestamps.
- Do not persist raw message text unless the demo explicitly needs it; a scenario ID and extracted signals are usually enough.

## 6. Risk signals for the first version

The following weights are starting hypotheses for the synthetic prototype, not real banking thresholds. Keep them in a configuration file so they can be tuned from validation results.

| Signal | Example condition | Initial weight | Plain-language reason |
|---|---|---:|---|
| `NEW_PAYEE` | Payee is absent from prior synthetic history | 15 | You have not paid this person before. |
| `UNUSUAL_AMOUNT` | Amount is above the user's synthetic p95 or 3x median | 12 | This amount is unusual for your recent payments. |
| `URGENCY_LANGUAGE` | Text contains pressure such as "now", "immediately", or a threat | 14 | The message is pressuring you to act quickly. |
| `REFUND_SCRIPT` | Text claims money was sent by mistake and asks for a return | 28 | This resembles a common fake-refund request. |
| `IMPERSONATION` | Sender claims to be a bank, police officer, merchant, support agent, etc. | 18 | Someone is claiming authority to make you pay. |
| `DIFFERENT_RETURN_PAYEE` | Claimed sender differs from requested return payee | 25 | You are being asked to return money to a different account. |
| `UNVERIFIED_INCOMING` | A claimed incoming transfer is missing from the synthetic ledger | 30 | The claimed incoming payment cannot be verified. |
| `RECENT_INCOMING_CLAIM` | Return request occurs soon after the alleged incoming transfer | 10 | This payment follows a recent refund claim. |
| `PAYMENT_TO_RECEIVE` | Message says the user must pay or enter a PIN to receive money | 30 | You do not need to send money to receive a payment. |
| `SAFE_KNOWN_PAYEE` | Established payee with repeated normal history | -12 | You have paid this person before. |
| `NORMAL_PATTERN` | Amount and timing fit the synthetic user's usual behaviour | -8 | This payment matches your usual pattern. |

### Guard against single-signal overreaction

- A new payee alone should normally remain low or medium risk.
- A large amount alone should not be labelled a scam.
- High risk should generally require either one very strong contradiction, such as an unverified incoming payment, or multiple independent signals.
- Negative/comfort signals may lower the score but must not erase a strong contradiction completely.

### Initial scoring formula

```python
raw_score = sum(signal.contribution for signal in active_signals)
score = max(0, min(100, raw_score))

if score < 30:
    level = "low"
elif score < 60:
    level = "medium"
else:
    level = "high"
```

Tune both weights and cut-offs only on the training/validation scenarios. Freeze them before measuring the final test set.

## 7. Text analysis

Start with normalized, multilingual-aware pattern groups rather than an LLM dependency.

### Processing steps

1. Unicode-normalize and lowercase the synthetic message.
2. Remove repeated whitespace but preserve currency amounts and UPI-related terms.
3. Match phrase groups for refund claims, urgency, authority impersonation, secrecy, payment-to-receive, and credential requests.
4. Detect the co-occurrence of a refund claim and a request to use a different payee.
5. Return named signals and matched concepts, not raw regex fragments.

Example pattern concepts:

```yaml
refund_claim:
  - sent by mistake
  - accidental transfer
  - refund the amount
  - return my money
urgency:
  - do it now
  - immediately
  - account will be blocked
payment_to_receive:
  - pay to receive
  - enter pin to receive
  - send a small amount first
```

Do not claim comprehensive language coverage. For the demo, clearly list the supported languages and provide hand-authored variations for each supported scam family.

### Optional ML comparison

Train a TF-IDF + logistic-regression classifier on the synthetic messages and compare it with the deterministic text rules. Do not feed the final class probability directly to the user. Convert it into a bounded contribution and retain the explicit rule-based reasons.

```python
text_contribution = round(min(25, classifier_probability * 25))
```

Avoid an LLM in the critical scoring path unless it runs deterministically enough for the demo and has a robust fallback. It adds latency, variability, prompt-injection concerns, and harder-to-audit explanations.

## 8. Warning and friction design

### Low risk: normal confirmation

- Show payee, amount, and a normal confirm button.
- Do not display reassuring language such as "safe" or "verified"; absence of detected signals is not proof of safety.

### Medium risk: focused review

- Heading: **Pause and check this payment**
- Show up to two concrete reasons.
- Primary safe action: **Review payment details**
- Secondary action: **Continue anyway**
- Provide a short reminder: check the actual transaction history rather than a screenshot or message.

### High risk: short cooling-off step

- Heading: **This payment has signs of a scam**
- Show the two or three strongest reasons.
- Primary safe action: **Cancel payment**
- Offer **Review details** and a less prominent **Continue anyway** path.
- Add a short countdown only if it does not trap keyboard or screen-reader users.
- Never use a dead end; legitimate users must retain an override path.

### Example warning for the suggested demo

> Pause before paying. The claimed incoming payment is not in this demo account's history, and you are being asked to send money to a different, new payee. This resembles a common fake-refund scam. Check your actual transaction history instead of relying on a screenshot or message.

Buttons:

1. Cancel payment
2. Review transaction history
3. Continue anyway

### Accessibility requirements

- Warning is announced with `role="alert"` and focus moves to its heading.
- All actions are keyboard reachable with a visible focus indicator.
- Do not rely on red, amber, or green alone; include labels and icons with text alternatives.
- Use simple sentences and avoid jargon such as APP fraud, anomaly score, or z-score.
- Support text zoom to 200% without clipped actions.
- Respect reduced-motion preferences.
- Do not make the cooling-off countdown the only route forward.

## 9. API surface

### `POST /api/v1/risk/assess`

Request:

```json
{
  "transaction": {
    "transactionId": "txn_demo_001",
    "userId": "user_refund_demo",
    "payeeId": "payee_new_002",
    "payeeDisplayName": "Demo Recipient",
    "amountInr": 4500,
    "initiatedAt": "2026-09-18T10:30:00+05:30",
    "messageContext": "I sent you money by mistake. Return it now to this different UPI ID.",
    "claimedIncomingTransfer": {
      "amountInr": 4500,
      "occurred": true,
      "verifiedInLedger": false,
      "minutesAgo": 5
    }
  },
  "profileId": "profile_demo_001"
}
```

Response:

```json
{
  "transactionId": "txn_demo_001",
  "score": 100,
  "level": "high",
  "signals": [
    {
      "code": "UNVERIFIED_INCOMING",
      "contribution": 30,
      "userMessage": "The claimed incoming payment cannot be verified."
    },
    {
      "code": "REFUND_SCRIPT",
      "contribution": 28,
      "userMessage": "This resembles a common fake-refund request."
    },
    {
      "code": "DIFFERENT_RETURN_PAYEE",
      "contribution": 25,
      "userMessage": "You are being asked to return money to a different account."
    }
  ],
  "explanation": "Pause before paying. The incoming payment cannot be verified and this resembles a fake-refund request.",
  "recommendedAction": "cool_off",
  "modelVersion": "rules-v1.0.0",
  "latencyMs": 12
}
```

### `POST /api/v1/decisions`

Record the user's synthetic outcome. The API should be idempotent by transaction ID plus decision sequence number.

### `GET /api/v1/scenarios`

Return prepared demo scenarios and labels. Do not return the label to the payment screen; expose it only to evaluator mode.

### `GET /api/v1/metrics`

Return evaluation results generated from a fixed labelled test set, including the scorer version and dataset version.

## 10. Service boundaries

```text
UI
 |- Payment form
 |- Warning modal/page
 |- Decision screen
 `- Evaluator dashboard

API
 |- Scenario service
 |- Feature extractor
 |- Rules/text scorer
 |- Explanation generator
 |- Decision logger
 `- Metrics runner

Data
 |- synthetic_profiles.json
 |- synthetic_transactions.jsonl
 |- synthetic_messages.jsonl
 |- scenario_labels.jsonl
 `- demo_events.sqlite
```

Keep explanation generation separate from scoring. The scorer should return stable signal codes; a presentation layer should map them to tested, localized user messages.

## 11. Suggested repository layout

```text
authorised-to-lose/
  README.md
  apps/
    web/
      src/
        components/
        pages/
        api/
        accessibility/
    api/
      app/
        main.py
        schemas.py
        routes/
        scoring/
          features.py
          rules.py
          thresholds.py
          explanations.py
        services/
        storage/
  data/
    generator/
    train/
    validation/
    test/
    scenarios/
  evaluation/
    run_metrics.py
    reports/
  tests/
    api/
    scoring/
    ui/
  docs/
    architecture.md
    limitations.md
    data-dictionary.md
```

## 12. Synthetic dataset plan

### Scam families

Create labelled variants for at least:

1. Fake refund / money-sent-by-mistake scam
2. Bank or support impersonation
3. Police/government authority impersonation
4. Payment required to receive a prize, refund, job, or benefit
5. Fake merchant QR or changed payee request
6. Emergency/family impersonation

### Genuine families

Include difficult negative examples so the scorer is not rewarded for simply flagging every new or urgent payment:

1. First payment to a legitimate new merchant
2. Genuine emergency payment to a hospital or family member
3. Large rent, tuition, or bill payment
4. Genuine refund to the same verified sender
5. Repeated payment to a known payee with an unusual amount
6. Accessibility-assisted payment with minimal interaction data

### Dataset size for a hackathon

- 600-1,000 total scenarios is sufficient for a clear synthetic evaluation.
- Keep scam and genuine examples approximately balanced for development.
- Report metrics on both the balanced set and a more realistic low-fraud-rate simulation.
- Store a `scenario_family` field so results can be broken down by scam type.

### Split strategy

Do not randomly split near-duplicate message templates across train and test; this would inflate accuracy. Split by template family or paraphrase seed so the test set contains genuinely unseen wording. Keep the final test set frozen.

Example record:

```json
{
  "scenarioId": "refund_014",
  "scenarioFamily": "fake_refund",
  "label": "scam",
  "transaction": {
    "payeeNovel": true,
    "amountInr": 4500,
    "amountToMedianRatio": 2.2,
    "claimedIncomingVerified": false,
    "returnPayeeMatchesSender": false
  },
  "message": "Please return the amount now to my other UPI ID.",
  "expectedSignals": [
    "NEW_PAYEE",
    "REFUND_SCRIPT",
    "UNVERIFIED_INCOMING",
    "DIFFERENT_RETURN_PAYEE",
    "URGENCY_LANGUAGE"
  ]
}
```

## 13. Evaluation plan

Do not report accuracy alone. On a balanced synthetic set, a useful initial target is:

| Metric | MVP target | Why it matters |
|---|---:|---|
| Scam recall | >= 0.85 | Measures how many labelled scams are caught |
| Precision | >= 0.80 | Limits noisy warnings |
| Genuine false-positive rate | <= 0.10 | Protects usability and trust |
| Urgent-genuine false-positive rate | <= 0.15 | Tests the stated safety boundary |
| Explanation coverage | 100% of medium/high results | Every intervention needs a reason |
| Scoring latency p95 | < 200 ms locally | Warning must appear before confirmation without noticeable lag |
| API error rate in scripted demo | 0% | Demonstration reliability |

Also report the confusion matrix and results by scenario family. Record the exact scorer and dataset versions beside every report.

### Warning-comprehension check

Run a small, non-claiming usability test with 5-8 participants if possible. After each warning, ask:

1. What is the app concerned about?
2. What would you do next?
3. Did the screen say the payment was definitely fraudulent?

Target: at least 80% correctly identify the main risk and the recommended safe action. Treat this as formative prototype evidence, not population-level research.

## 14. Test checklist

### Unit tests

- New payee alone does not reach high risk.
- A verified genuine refund to the same sender is not treated like an unverified refund to a different payee.
- Strong contradictions cannot be completely cancelled by `SAFE_KNOWN_PAYEE`.
- Score is always clamped to 0-100.
- Threshold boundaries at 29/30 and 59/60 return the intended levels.
- Empty message context is accepted and produces no text signal.
- Mixed-case and Unicode-equivalent text produce consistent signals.
- Explanation contains only reasons actually returned by the scorer.

### API tests

- Malformed and overlong inputs return structured validation errors.
- Unknown profile/scenario IDs return 404.
- Replayed decision events do not create duplicate records.
- Every response includes `modelVersion` and `latencyMs`.
- Raw exceptions and stack traces are not exposed to the UI.

### UI tests

- Low-risk flow reaches normal confirmation.
- Medium-risk flow supports review and override.
- High-risk flow supports cancel, review, and override.
- Back navigation does not accidentally confirm a payment.
- Double-clicking confirm cannot create two decision events.
- Focus enters the warning and returns predictably after dismissal.
- Screen-reader labels describe the amount, payee, risk reasons, and actions.
- Colour-blind and 200% zoom checks pass.

### Safety tests

- No real-looking UPI IDs, phone numbers, or account numbers ship in fixtures.
- Logs do not store raw synthetic messages unless explicitly configured.
- UI never says "fraud confirmed", "100% scam", or "safe payment".
- A genuine urgent scenario always has an accessible continuation path.

## 15. Build order

### Phase 1 - deterministic vertical slice

1. Define schemas and five hand-authored scenarios.
2. Implement feature extraction and weighted rules.
3. Implement `POST /risk/assess`.
4. Build payment -> warning -> decision screens.
5. Log the decision and elapsed time.

Exit condition: the suggested fake-refund scenario works end to end.

### Phase 2 - evaluation

1. Generate the labelled synthetic dataset.
2. Freeze validation/test splits.
3. Add the metrics runner and confusion matrix.
4. Tune weights on validation only.
5. Add evaluator mode and limitations page.

Exit condition: metrics are reproducible from one command and linked to versioned inputs.

### Phase 3 - polish

1. Add multilingual copy for one or two supported languages.
2. Complete keyboard/screen-reader testing.
3. Add optional text-classifier comparison.
4. Rehearse the timed demo and failure fallback.

Exit condition: the demo is understandable without a technical explanation from the presenter.

## 16. Demo script

Prepare three short scenarios rather than only one:

### Scenario A - high-risk fake refund

- Message claims money was sent by mistake.
- Synthetic ledger has no matching incoming transfer.
- Requested return goes to an unfamiliar, different payee.
- Expected result: high risk, concrete warning, user cancels.

### Scenario B - genuine new merchant

- New payee and slightly unusual amount, but no social-engineering message or contradiction.
- Expected result: low/medium risk, no alarming fraud claim, payment can continue.

### Scenario C - urgent genuine payment

- High amount to a known hospital/family payee with an urgent note.
- Expected result: urgency alone does not trigger a high-risk verdict; accessible override remains available.

Show the metrics dashboard after the user-facing flow. This demonstrates both scam detection and restraint on false positives.

## 17. Acceptance criteria

The prototype is ready when all of the following are true:

- [ ] At least one scam and two genuine scenarios run end to end.
- [ ] Risk assessment happens before the final synthetic confirmation.
- [ ] Every medium/high assessment includes specific plain-language reasons.
- [ ] The user can cancel, review, or proceed.
- [ ] The selected action is logged without real personal/payment data.
- [ ] Metrics are computed from a frozen labelled synthetic test set.
- [ ] False-positive results are shown, not hidden.
- [ ] The UI avoids definitive fraud/safety claims.
- [ ] Keyboard, screen-reader, reduced-motion, and zoom checks pass.
- [ ] The limitations page honestly describes synthetic-data and coverage limitations.
- [ ] The architecture summary fits on one page or diagram.
- [ ] The live demo has an offline/local fallback.

## 18. Known limitations to state honestly

- Synthetic data will not represent the full variety and prevalence of real fraud.
- Hand-authored scam phrases may overestimate text-detection performance.
- No real device, account, graph, beneficiary, or network intelligence is available.
- A legitimate payment can contain suspicious-looking language; a scam can contain none.
- User-history features are only simulated.
- The system cannot declare a recipient fraudulent.
- Thresholds are prototype settings, not regulatory or production recommendations.
- The interaction log measures demo behaviour, not prevented financial loss.

## 19. Evidence translated into design decisions

### RBI friction coverage via Business Standard, May 2026

The cited report says RBI is exploring friction specifically for APP fraud, where customers initiate payments despite existing safeguards. It also mentions possibilities such as a one-hour delay above INR 10,000, trusted-individual confirmation for vulnerable users, customer-controlled controls, and a debit "kill switch." For this prototype, implement friction as a configurable UX policy rather than claiming RBI has mandated a specific delay.

Design consequence: keep `recommendedAction` separate from the risk score so policies such as review, a short local cooling-off step, or trusted-contact simulation can change without retraining the detector.

Source: [Business Standard - RBI weighs adding frictions](https://www.business-standard.com/finance/news/rbi-digital-payments-fraud-upi-security-frictions-126052900821_1.html)

### FY2024-25 fraud mix via Business Standard

The cited report states that 13,516 digital-payment fraud cases represented 56.5% of reported banking fraud cases and involved INR 520 crore. It also cautions that RBI's reported data covers frauds of INR 1 lakh and above and that a case may have occurred in an earlier year.

Design consequence: use the statistics as problem context only. Do not derive class balance, score weights, or model thresholds from these aggregate banking figures.

Source: [Business Standard - FY25 bank fraud figures](https://www.business-standard.com/finance/news/bank-fraud-amount-triples-in-fy25-despite-drop-in-number-of-cases-rbi-125052900696_1.html)

### Fraud patterns and layered controls via PwC, April 2025

The report explicitly describes the fake-refund pattern: a claimed accidental transfer, a screenshot or impersonation used to build trust, pressure to act, and a request to pay a different UPI ID. It also argues for real-time pattern analysis, education, customer controls, and shared intelligence.

Design consequence: the first demo should combine ledger verification, payee comparison, message cues, and an educational warning. The text alone should not decide the result.

Evidence caution: the report contains broad recommendations and several secondary claims that should be checked against their primary citations before use in a formal report. Some percentages appear inconsistent with the stated transaction totals. Treat them as product inspiration, not validated labels or requirements.

Source: [PwC - Combating payments fraud](https://www.pwc.in/ghost-templates/combating-payments-fraud-in-Indias-digital-payments-landscape.html)

### Growth context via Bloomberg, May 2024

The accessible portion reports that digital-payment fraud value rose more than fivefold to INR 14.57 billion in the year ended March 2024, while UPI transaction value had risen 137% over two years to INR 200 trillion.

Design consequence: the problem has scale, but growth statistics do not specify which behavioural features identify APP scams. They justify the problem; they do not train the detector.

Source: [Bloomberg - Online payment frauds jump over 400%](https://www.bloomberg.com/news/articles/2024-05-30/online-payment-frauds-jump-over-400-in-india-rbi-data-shows)

## 20. Final implementation principle

The strongest hackathon solution is not the one that produces the highest risk score. It is the one that can show, reproducibly:

1. which independent signals were detected;
2. why those signals matter in language a user understands;
3. how the intervention changes with risk;
4. how genuine urgent payments remain usable; and
5. how detection and false positives were measured on unseen synthetic scenarios.

