Great—this gives us a firm direction.

## Locked creative direction

- **Audience:** hackathon judges, companies, financial-product teams, and ordinary users
- **Primary action:** run the interactive demo
- **Business goal:** make the project credible enough that people could imagine adopting it
- **Emotional goal:** earn trust before asking for attention
- **Tone:** editorial + technical
- **Genre:** editorial product storytelling
- **Macrostructure:** Narrative Workflow
- **Visual theme:** warm paper, precise typography, technical diagrams, restrained forest/cobalt accents
- **Motion:** explanatory, quiet, never playful around financial risk

The design should feel like a well-designed financial research publication connected to a working product.

## Brand positioning

“Authorised to Lose” is memorable but intentionally unsettling. We should always pair it with a clarifying descriptor:

> **Authorised to Lose**  
> A contextual safety layer for authorised payments.

The name creates curiosity. The descriptor immediately restores clarity and credibility.

The primary marketing argument will be:

> A payment can be authorised and still be manipulated.

Everything on the landing page should prove that statement.

## Selected design system

### Typography

I recommend:

- **Display:** Instrument Serif
- **Body/UI:** Geist
- **Technical/data:** IBM Plex Mono

Usage:

- Instrument Serif for the wordmark, hero, major arguments, and closing statement
- Geist for navigation, explanations, buttons, forms, and product UI
- IBM Plex Mono for signal codes, scores, timestamps, engine versions, and audit metadata

Typography rules:

- Upright headings only
- No italic emphasis in headings
- Maximum seven words in the hero headline
- 16–18px default body text
- 14px minimum interface text
- 60–70 character reading measure
- Tabular figures for amounts, scores, metrics, and latency
- Sentence case throughout the interface

### Proposed hero headline

> **Pause before money leaves.**

Supporting copy:

> Authorised to Lose examines the message, recipient, ledger, timing, and payment history around a transfer—then explains what does not add up before you confirm.

### Color language

Light-first, calm, and highly legible:

| Role | Direction |
|---|---|
| Paper | Warm ivory |
| Raised surface | Slightly cooler off-white |
| Primary ink | Blue-black |
| Secondary text | Slate with a blue tint |
| Interactive accent | Deep cobalt |
| Editorial accent | Restrained forest green |
| Medium risk | Amber |
| High risk | Vermilion |
| Mitigating evidence | Teal |
| Rules/borders | Tinted blue-gray |
| Focus | High-contrast cobalt |

Important rules:

- Cobalt means interactive.
- Vermilion means risk or destructive action.
- Amber means pause and review.
- Teal means verified or mitigating evidence.
- Color never communicates a status by itself.
- Accent colors occupy a small percentage of each viewport.
- No pure black, pure white, or decorative gradients.

## Landing-page composition

### 1. Navigation

Use a restrained full-width navigation rather than a floating pill:

- Wordmark and descriptor on the left
- How it works
- Safety model
- Evaluation
- GitHub, if appropriate
- Primary action: **Run the demo**

On mobile, this becomes an accessible sheet with a visible menu button.

### 2. Hero

A 7/5 asymmetric split.

Left:

- Wordmark descriptor
- “Pause before money leaves.”
- Product explanation
- **Run a scam scenario**
- **See how it reasons**
- “Synthetic demonstration—no real payment is initiated.”

Right:

- A borderless product canvas
- Incoming message
- Claimed ₹5,000 transfer
- Ledger mismatch
- Different recipient
- Resulting warning

This will not be placed inside a fake phone or browser frame.

### 3. Core argument

Large editorial statement:

> The payment is authorised.  
> The surrounding story may not be.

Underneath, three pieces of evidence appear as one sequence rather than three feature cards.

### 4. Contextual payment workflow

This is the main page structure:

1. **Payment intent**  
   Amount, payee, time, and source are captured.

2. **Context assembled**  
   Messages, ledger activity, payment history, and payee history are connected.

3. **Contradictions identified**  
   The claimed transfer is missing, the payee differs, or pressure language is present.

4. **Risk explained**  
   Named signals and mitigating evidence create an inspectable result.

5. **User decides**  
   Cancel, review, or continue.

6. **Outcome recorded**  
   The complete evidence and decision chain remains auditable.

Each stage gets one compact product visual. Numbering is meaningful here because the process is genuinely sequential.

### 5. Contextual payment graph

A wide technical diagram:

```text
Message ───────────────┐
Claimed transfer ──────┼── Context relationships
Ledger ────────────────┤
Payee history ─────────┤
Payment intent ────────┘
                             ↓
                      Structured signals
```

Selecting a node exposes:

- What was observed
- Which relationship was detected
- Which signal it generated
- Whether the evidence increases or reduces risk

This section should make the project’s differentiator understandable within seconds.

### 6. Evidence before score

A worked assessment:

**Risk indicators**

- No matching incoming payment
- Requested recipient differs from claimed sender
- Recipient is new
- Payment amount matches the message
- Payment began shortly after the message

**Mitigating evidence**

- None found

**Result**

- High contextual risk
- Score shown secondarily
- Plain-language warning shown prominently

This demonstrates that the score is derived, not magical.

### 7. Intervention spectrum

Low, Medium, and High should form a continuous sequence:

```text
LOW                 MEDIUM                  HIGH
Normal confirmation → Focused review → Explicit interruption
```

Each state shows its actual interface, actions, and explanation policy.

### 8. Scenario laboratory

Three genuine demo paths:

- Fake refund
- Legitimate new merchant
- Urgent genuine payment

Judges should be able to run all three quickly. The second and third scenarios prove that the product does not simply flag every new, large, or urgent transaction.

### 9. Auditability

Show the assessment timeline:

```text
Payment
Context snapshot
Extracted features
Triggered signals
Mitigators
Risk score
Explanation
User decision
Outcome
Engine version
```

This is where technical stakeholders begin trusting the system.

### 10. Evaluation

Use real data only:

- Recall
- Precision
- False-positive rate
- False-negative rate
- Confusion matrix
- Latency
- Results by scam family
- Results for legitimate lookalikes

Until the evaluation pipeline generates results, the website will show labelled “measurement pending” states—not invented figures.

### 11. Safety and limitations

A serious, visible section:

- Synthetic data only
- No bank or UPI integration
- No PIN, OTP, or credential collection
- No autonomous payment blocking
- No definitive fraud verdict
- Known limitations of synthetic data and deterministic rules

### 12. Closing statement

> **A warning should explain itself.**

Primary action:

**Try a payment scenario**

Secondary link:

**Read the methodology**

## Product application structure

### Scenario laboratory

Desktop layout:

```text
Scenario index | Conversation and payment | Expected assessment
```

Mobile becomes:

```text
Choose scenario
      ↓
Review context
      ↓
Start payment
      ↓
See assessment
```

### Payment review

Information order:

1. Amount
2. Payee
3. Payment purpose
4. Context warning
5. Strongest evidence
6. Recommended action
7. Override path

High-risk actions:

- **Cancel payment**
- **Review transaction history**
- **Continue anyway**

“Continue anyway” remains accessible but is deliberately less prominent.

### Assessment detail

A chronological audit view with expandable technical evidence. Plain-language explanations appear first; raw feature and signal information is progressively disclosed.

### Analytics

Designed for judges and technical stakeholders:

- Dataset version
- Engine version
- Summary metrics
- Confusion matrix
- Scenario-family breakdown
- False-positive explorer
- Latency distribution
- Individual assessment inspection

### Methodology

A readable editorial document covering:

- What APP fraud is
- Why authentication alone is insufficient
- Contextual payment graph
- Feature and signal extraction
- Risk calculation
- Explanation generation
- Synthetic dataset methodology
- Security constraints
- Limitations
- Production evolution

## Component inventory

We will design these as shared primitives:

- Navigation
- Button and text link
- Status badge
- Input and amount input
- Payment summary
- Payee summary
- Message block
- Ledger entry
- Graph node and edge
- Signal row
- Mitigator row
- Risk indicator
- Warning panel
- Decision actions
- Scenario selector
- Audit timeline
- Metric display
- Chart container
- Dialog
- Mobile sheet
- Tooltip
- Empty, loading, error, and unavailable states

Every interactive component gets:

- Default
- Hover
- Focus-visible
- Active
- Disabled
- Loading
- Error
- Success

## Motion plan

Only three visible motion systems:

1. **Hero evidence sequence**  
   Message → ledger → recipient → warning.

2. **Graph relationship activation**  
   Lines and nodes clarify how evidence connects.

3. **Assessment transition**  
   Payment review becomes a contextual warning without a jarring jump.

Everything else receives simple interaction feedback:

- Button press: `scale(0.97)`, 120–160ms
- Popovers: origin-aware, under 220ms
- Dialogs: opacity plus `0.96 → 1`, under 300ms
- No bounce
- No decorative parallax
- No continuous floating elements
- No animation on charts merely for spectacle
- Reduced-motion mode uses opacity only

## Implementation stack

Aligned with the architecture:

- Next.js App Router
- TypeScript
- Tailwind plus CSS variables
- `next/font` for typography
- Base UI for accessible dialogs, menus, and sheets
- Lucide for one consistent icon system
- Motion only where CSS cannot handle graph or exit transitions
- Recharts for evaluator charts
- Sonner only for asynchronous outcomes not already visible
- Prisma and SQLite for synthetic assessment records

## Build sequence

### Phase 1 — Foundation

- Establish the Next.js project
- Create the route structure
- Create design tokens
- Configure fonts
- Build page shell and responsive navigation
- Build primitive components

### Phase 2 — Landing page

- Hero
- Context contradiction
- Narrative workflow
- Payment graph demonstration
- Intervention spectrum
- Scenario CTA
- Audit and evaluation sections
- Safety section and footer

### Phase 3 — Core demo

- Scenario selection
- Payment review
- Risk warning
- User decision
- Assessment detail
- Audit trail

### Phase 4 — Evaluator experience

- Analytics dashboard
- Methodology
- Limitations
- Engine and dataset versioning

### Phase 5 — Motion and polish

- Hero evidence animation
- Graph activation
- Assessment transitions
- Press and focus feedback
- Reduced-motion paths

### Phase 6 — Verification

- 320, 375, 414, 768, and desktop widths
- Keyboard-only completion
- Screen-reader assessment flow
- 200% zoom
- Reduced motion
- Color contrast
- Long and translated copy
- Loading/error/empty states
- Real-phone testing
- Final anti-generic-design review

The next concrete step should be to turn this into a locked design specification—exact tokens, sitemap, component contracts, and section copy—before implementing the frontend.