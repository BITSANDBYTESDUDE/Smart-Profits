# Idea Capture Template
## GSMA MENA Ignite Open Gateway Hackathon — Phase 1

---

### 1. Project identity

| Field | Answer |
|-------|--------|
| **Project name** | Smart Profits: AI-Driven Financial Analytics & Telco-Secured Merchant Platform |
| **Short name** | Smart Profits |
| **One-line pitch** | A merchant AI advisor that turns messy Excel/CSV into profit decisions, protected by 4G/5G network intelligence so stolen SIMs and unusual locations cannot open or upload the store’s financial files. |
| **Theme (mandatory)** | **Theme 4: Secure FinTech, Payments & Anti-Fraud Innovation** |
| **Stage** | Phase 1 — Idea submission (working product already live for analytics; telco security + AI agent treated as core platform capabilities) |
| **Team** | Smart Profits Team — MENA |
| **Contact (fill)** | Name: ____________ &nbsp; Email: ____________ &nbsp; Country: ____________ |
| **Languages** | Arabic + English (RTL/LTR) |

---

### 2. Mandatory hackathon requirements (explicit mapping)

The solution **uses both compulsory building blocks**. They are not optional add-ons; they sit in the live decision path of the product.

#### Requirement A — Network Programming Interfaces (GSMA CAMARA APIs via Nokia Network-as-Code)

Smart Profits calls **Nokia Network-as-Code** (developer portal / sandbox → operator networks) to consume standardised **GSMA Open Gateway CAMARA APIs**:

| CAMARA API | When it is called | Decision it enables |
|------------|-------------------|---------------------|
| **SIM Swap** | Login, password reset, price-list change, payout / sensitive settings | If the merchant’s SIM was swapped recently, treat the session as high-risk and **block** OTP-only trust |
| **Number Verification** | Login and step-up identity (4G/5G silent check, no SMS) | Confirm the person is on the claimed mobile number **from the network**, not from a spoofed SMS |
| **Location Verification** | Upload of Excel/CSV/PDF financial files; export of P&L reports | Confirm the device is in the **usual store / branch area**; reject or freeze upload if location is inconsistent |
| **Device Status** | Same sensitive actions | Confirm the device is reachable / not in an abnormal reachability state before allowing the action |

> These APIs are accessed **only** through Nokia Network-as-Code, not by talking to operators one-by-one.

#### Requirement B — AI Agent layer that orchestrates APIs and takes decisions

Smart Profits is not “an LLM that reads Excel”. It includes a dedicated **AI Agent: Smart Guard & Financial Agent** that:

1. Analyses merchant sales, cost, OpEx and profit leaks from the open file.
2. **At the same time** queries CAMARA network signals.
3. **Coordinates** those signals into a single risk decision: allow, step-up, or **temporarily freeze sensitive financial actions**.
4. Explains the decision to the merchant in Arabic or English.

The agent is the orchestration brain. The CAMARA APIs are its network senses. The analytics engine is its financial brain. **No sensitive action completes unless the agent has run this loop.**

---

### 3. Problem (MENA / merchant reality)

Independent merchants across MENA run their business from **messy Excel, CSV, PDF and phone images**. They do not have a CFO. They also do not have a bank-grade SOC.

Three risks sit on the same login:

1. **Financial blindness** — sales files hide phantom profit (no rent, salaries, utilities). Wrong prices and dead stock drain cash.
2. **Account takeover** — a stolen phone / **SIM swap** lets an attacker pass SMS OTP, open the advisor, **download P&L, change prices, or exfiltrate customer sales files**.
3. **Untrusted origin** — a session from another country or an unusual cell area uploading “the monthly file” can be an insider or a hijacked account.

Banks already buy network APIs. **The merchant SaaS that holds the P&L usually does not.** That is the gap.

---

### 4. Solution

**Smart Profits** is a bilingual (AR/EN) merchant platform that:

- Cleans messy workbooks (Arabic *and* English headers).
- Diagnoses store health, profit leaks, inventory, and a 30-day action plan.
- Answers questions from the **currently open file** (e.g. “highest profit product”).
- Protects that same data with **telco-grade identity and location**, orchestrated by the **Smart Guard AI Agent**.

Positioning for judges: **not a generic Excel AI**. It is a **FinTech control plane** for SMEs, using **5G/4G CAMARA signals** the way a bank uses them — on the merchant’s own books.

---

### 5. How the AI Agent uses the network (decision policy)

```
Merchant action (login / file upload / report export / price change)
        │
        ▼
Smart Guard Agent
        │
        ├──► Nokia NaC → SIM Swap          (was the SIM changed?)
        ├──► Nokia NaC → Number Verification (is this the real number on 4G/5G?)
        ├──► Nokia NaC → Location Verification (inside usual store geofence?)
        └──► Nokia NaC → Device Status     (device reachable / normal?)
        │
        ▼
Risk score + policy
        │
        ├── ALLOW     → continue analytics / upload
        ├── STEP-UP   → extra confirmation (no SMS-only)
        └── FREEZE    → block upload/export; notify merchant; keep files locked
```

**Example automatic decision (anti-fraud):**  
If **SIM Swap = recent** OR **Location Verification = outside store** during a financial file upload, the agent **does not upload the workbook**. It freezes the sensitive action until identity is confirmed via Number Verification on the trusted line.

This is **agentic**: the model does not only “recommend”; it **calls tools (CAMARA APIs)** and **executes a policy**.

---

### 6. Technical architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Merchant UI (Next.js / TypeScript)  AR + EN · Dark/Light   │
│  Login · Upload · Dashboard · Advisor chat · Reports        │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  Application API (Next.js) + PostgreSQL                     │
│  Users · Stores · Files · Action log · Risk events          │
└─────────────┬───────────────────────────────┬───────────────┘
              │                               │
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────────┐
│  Financial AI           │     │  Smart Guard AI Agent       │
│  Parse Excel/CSV/PDF    │     │  Orchestrates CAMARA calls  │
│  P&L, leaks, forecast   │     │  Allow / Step-up / Freeze   │
│  File-grounded Q&A      │     │  Explains risk in AR/EN     │
└─────────────────────────┘     └──────────────┬──────────────┘
                                               │
                                ┌──────────────▼──────────────┐
                                │  Nokia Network-as-Code      │
                                │  GSMA CAMARA APIs           │
                                │  SIM Swap · Number Verif.   │
                                │  Location Verif. · Device   │
                                │  4G / 5G operator networks  │
                                └─────────────────────────────┘
```

| Layer | Stack |
|-------|--------|
| Front-end | Next.js, TypeScript, RTL Arabic + English |
| Back-end | Next.js API, **PostgreSQL** |
| Financial AI | File parser, diagnosis engine, advisor grounded on the open file |
| **AI Agent** | Smart Guard — tool-calling loop over CAMARA + finance context |
| **Network** | **Nokia Network-as-Code** hosting **GSMA CAMARA** APIs |
| Security outcomes | Anti-SIM-swap, silent number check, location-bound file upload |

---

### 7. User journeys (what we will demo)

**Journey A — Trusted merchant, usual shop**  
Login → Agent: SIM Swap clean, Number Verification OK, location = store → **Allow** → upload Excel → diagnosis + “highest profit product” from that file.

**Journey B — SIM swap / stolen OTP (anti-fraud)**  
Attacker with a freshly swapped SIM tries login or export → Agent calls **SIM Swap** → **Freeze** → no P&L download, no price change.

**Journey C — File upload from a strange location**  
Session tries to push `monthly_sales.xlsx` outside the branch geofence → **Location Verification fails** → Agent **blocks the upload** of sensitive financial data until Number Verification succeeds on the merchant’s line.

---

### 8. Differentiation

| Typical Excel AI | Smart Profits |
|------------------|---------------|
| Reads a spreadsheet | Reads + diagnoses + bilingual Q&A on the **open file** |
| Trusts SMS OTP | **Does not trust SMS alone** — SIM Swap + Number Verification via the **network** |
| No notion of “where” | **Location Verification** binds uploads to the store |
| Chatbot only | **AI Agent that calls CAMARA tools and enforces freeze** |
| Generic SaaS | Built for **MENA merchants** (Arabic RTL, messy Arabic/English ledgers) |

---

### 9. Impact (why GSMA / Nokia should care)

- **Operators** get a **B2B FinTech** that actually consumes Open Gateway APIs (not a slide-only integration).
- **Merchants** get CFO-grade insight **and** bank-like protection of the files that *are* their business.
- **Region:** high WhatsApp/Excel commerce, high SIM-swap fraud, low formal accounting — exact Theme 4 conditions.
- **5G/4G:** Number Verification and location work because the merchant’s phone is on the operator network, not because we sent another SMS.

---

### 10. What already exists vs what Phase 1 is selling

**Already built in the product (do not rebuild for the idea phase):** bilingual UI, dark/light theme, messy-file analysis (AR/EN columns), file-grounded advisor chat, OpEx-aware net profit, reports.

**Presented as core architecture for this hackathon (mandatory):** Nokia Network-as-Code CAMARA integration + Smart Guard AI Agent orchestration and freeze policy.

Phase 1 asks for **idea + architecture + pitch**, not a full production operator contract. The story is implementation-ready: same Next.js app, agent gateway, NaC sandbox credentials.

---

### 11. Demo plan (if shortlisted)

1. Happy path: analyse a messy furniture Excel, ask “highest profit product”.
2. Switch to **NaC sandbox**: inject a **SIM Swap = true** signal → UI shows freeze, upload button disabled.
3. Inject **location mismatch** → financial upload blocked with an Arabic/English explanation from the agent.
4. Architecture slide: Agent → NaC → CAMARA.

---

### 12. Risks and mitigation

| Risk | Mitigation |
|------|------------|
| Sandbox vs live operator | Develop against Nokia NaC simulator; map 1:1 to CAMARA names |
| Privacy / consent | Consent screen before Location Verification; store only allow/deny + timestamp, not raw coordinates beyond policy |
| False freeze | Step-up with Number Verification instead of permanent lockout |
| Excel variety | Existing bilingual column mapper already in product |

---

### 13. Ask / next phase

Approve the idea under **Theme 4**. Next: connect Smart Guard to **Nokia Network-as-Code sandbox**, record a 3-minute demo of freeze-on-SIM-swap and location-bound upload, then prototype with a MENA operator path toward MWC Doha 2026.

---

**Declaration:** This idea **uses GSMA CAMARA network APIs through Nokia Network-as-Code** and **uses an AI Agent to orchestrate those APIs and take security decisions**. Both hackathon mandatory requirements are satisfied by design.
