# Meeting-to-Execution Copilot — Product Context & PRD

> **Transforming messy meeting transcripts into auditable, high-conviction execution items with transparent ambiguity flags and zero invented commitments.**

---

## 1. Executive Summary & Product Context

Teams spend hundreds of hours each week collaborating, brainstorming, and making tactical and strategic decisions in synchronous meetings. However, the true gap in operational velocity occurs **after** the call ends:
- Action items, decisions, and unresolved questions are routinely scattered across unstructured meeting notes, transient Slack/Teams messages, and disparate project boards.
- Conventional AI meeting summarizers generate polite, paragraph-style summaries that give the illusion of progress while failing to answer core operational questions: *Who owns this? When is it due? Was this actually decided or just suggested? What still requires clarification?*
- Hallucinated accountability: Standard LLM summarizers frequently turn casual suggestions (*"Maybe we should look into Redis caching next week"*) into definitive assigned tasks with phantom deadlines, confusing team members and creating friction.

**Meeting-to-Execution Copilot** solves this fundamental breakdown. It acts as an execution-grade bridge between spoken conversation and operational follow-through, ensuring every outcome is **explicit**, **auditable**, and backed by **verifiable transcript citations**.

---

## 2. Problem Statement

### The Core Problem
Teams lack an automated, reliable method to convert spoken meeting transcripts into execution-ready artifacts (tasks, owners, deadlines, decisions, and blocking questions) without losing accountability or glossing over critical ambiguities.

### Key Pain Points
1. **The "Passive Consensus" Trap:** General discussion is mistaken for agreed decisions, leading to false assumptions until discovery weeks later.
2. **Missing or Ambiguous Ownership:** Tasks are mentioned without designated assignees (*"Someone should update the customer API docs"*), resulting in bystander apathy where nobody does the work.
3. **Vague Temporal Commitments:** Phrases like *"next week"*, *"soon"*, or *"before the release"* are never pegged to real milestone dates.
4. **Lack of Auditability:** When tasks appear on project boards, team members cannot easily trace the conversation context, leading to repetitive debates.
5. **Over-Automation Risks:** Aggressive AI systems that hallucinate commitments erode trust among senior engineering and product leads.

---

## 3. Target Users & Personas

| Persona | Role | Primary Needs | Critical Success Factor |
| :--- | :--- | :--- | :--- |
| **Primary: Aarav Sharma** | Senior Product Manager | Coordinating cross-functional alignment across Engineering, Design, QA, and Marketing. Needs bulletproof decision logs and clear owners. | Zero invented commitments; rapid 2-minute review before exporting to Jira/Notion. |
| **Secondary: Rohan Mehta** | Technical Project Manager / Scrum Master | Translating sprint planning, architectural reviews, and retrospectives into sprint backlogs and action items. | Explicit citation links back to speaker quotes for technical clarity. |
| **Secondary: Ananya Patel** | Early-stage Startup Founder & Product Lead | Running fast-paced standups and executive syncs where speed is vital and nothing can slip through the cracks. | Instant ambiguity detection for unassigned mission-critical tasks. |

---

## 4. Core Hypothesis

> **If meeting transcripts are ingested through an evidence-based extraction pipeline that links every extracted outcome to its exact transcript passage and explicitly highlights ambiguity (missing owners, fuzzy deadlines, unconfirmed proposals), then cross-functional teams will achieve significantly higher follow-through rates with near-zero false commitments.**

---

## 5. Scope & Functional Requirements (MVP)

### 5.1 Transcript Ingestion & Pre-processing
- **Paste & File Upload:** Support direct text pasting, `.txt`, `.vtt`, `.srt`, `.json`, and markdown transcript formats.
- **Speaker & Timestamp Detection:** Recognize speaker headers (e.g., `Alex (09:12):`, `Marcus [14:30] -`) and sequential speech blocks.
- **Sample Transcripts Library:** Built-in real-world meeting archetypes (Sprint Planning, Cross-functional Product Sync, Post-Mortem / Incident Review, Architecture Decision Record Sync) for instant evaluation.

### 5.2 Structured Extraction Pipeline
- **Action Items Extraction:** Explicit tasks requiring work, with candidate assignees, priority indicators, and timeline expectations.
- **Decision Extraction:** Distinct separation between:
  - *Confirmed Decisions:* Firm agreements backed by affirmative team consensus.
  - *Proposals Under Discussion:* Ideas floated without final sign-off.
- **Open Questions & Blockers:** Unresolved technical, business, or operational questions needing follow-up.
- **Source Passage Evidence Linking:** Every single extracted item must store the exact quote and character/line offsets from the transcript.

### 5.3 Ambiguity & Uncertainty Engine
- **Unassigned Owner Flag:** Flags tasks where no specific individual committed to the work.
- **Ambiguous Date Flag:** Flags vague timelines (e.g., *"soon"*, *"next quarter"*, *"eventually"*) and offers contextual date pickers.
- **Low Confidence Detection:** Highlights statements using hedging language (*"maybe"*, *"we could possibly"*, *"I think"*) to prevent premature commitment.

### 5.4 Human-in-the-Loop Review & Approval Interface
- **Split-View Audit Workspace:** Side-by-side view with interactive transcript on the left and structured execution cards on the right.
- **Click-to-Highlight Audit Trail:** Clicking an evidence badge in an execution card scrolls to and illuminates the exact line in the transcript.
- **Inline Editing & Quick Resolve:** Direct inline editing of task title, owner dropdown, date picker, category tag, and approval toggle.
- **Batch Approval:** One-click approval for high-confidence items.

### 5.5 Execution Export Engine
- **Interactive Markdown Checklist:** Ready to paste into GitHub Issues, PR descriptions, or Notion.
- **Formatted CSV Export:** Ready for Jira, Linear, Asana, or Excel import with fields: `ID`, `Type`, `Title`, `Owner`, `Deadline`, `Status`, `Confidence`, `Evidence Passage`.
- **JSON Payload:** Machine-readable payload for webhooks or API consumption.
- **Summary Briefing:** Executive summary highlighting Key Decisions, Critical Path Actions, and Open Questions.

---

## 6. Product Differentiation: "Anti-Hallucination Guardrails"

Conventional AI tools prioritize completeness over accuracy, routinely inventing details to fill gaps. Meeting-to-Execution Copilot adheres to three strict architectural guardrails:

1. **No Invented Ownership:** If a participant says *"We need to optimize the database query,"* the system assigns `Owner: Unassigned (Needs PM Assignment)`, NEVER guessing an owner.
2. **No Phantom Deadlines:** Unless a speaker specifies an explicit timeline or relative date anchored to the meeting date, the deadline is marked `Unspecified`.
3. **Auditability First:** An action item without an attributable transcript excerpt is rejected by the extraction validator.

---

## 7. Product Management Decisions to Demonstrate

| Decision Vector | PM Stance in Copilot MVP | Rationale & Trade-off |
| :--- | :--- | :--- |
| **What qualifies as an action item vs discussion?** | Requires a concrete verb + deliverable + conversational commitment. | Prevents flooding the task tracker with conversational noise and brainstorming ideas. |
| **How to represent uncertainty?** | Multi-level ambiguity badges (`Ambiguous Owner`, `Vague Date`, `Low Confidence`) with visual color coding. | Prompts user attention precisely where human decision-making is necessary. |
| **When to prompt for clarification?** | Non-blocking inline flags in the review workbench. | Avoids disruptive modal popups while ensuring unassigned critical items are highlighted before export. |
| **What evidence is required before export?** | Every item must retain a transcript quote link. | Preserves trust and makes retrospective auditing frictionless. |
| **Level of manual review acceptable?** | Targeted 90-second review where user only resolves flagged uncertainties. | Maximizes efficiency while retaining human sign-off on commitments. |

---

## 8. Success Metrics & Key Performance Indicators

- **Extraction Precision:** $\ge 92\%$ of extracted action items represent legitimate work commitments.
- **False Commitment Rate:** $0\%$ invented owners or confirmed deadlines on ambiguous utterances.
- **Review Speedup:** Reduction in PM post-meeting administrative time from an average of 18 minutes down to $< 3$ minutes.
- **Ambiguity Detection Recall:** $\ge 95\%$ of unassigned or fuzzy tasks correctly flagged.
- **Audit Adoption:** $\ge 70\%$ of reviewers utilize the evidence click-to-transcript link during verification.

---

## 9. Non-Goals & Out of Scope (MVP)

- ❌ Autonomous task assignment without human confirmation.
- ❌ Direct auto-dispatching of Slack messages or calendar invites without manual review.
- ❌ Real-time audio recording or speech-to-text hardware integration (focuses on clean transcript ingestion).
- ❌ Complex bidirectional Jira/Linear synchronization plugins (provided via CSV & Markdown export).
- ❌ Employee productivity surveillance or individual performance scoring.

---

## 10. PM Readiness Checklist

- [x] **1. Target User & Problem Statement Defined:** Aarav Sharma (Senior PM) & Rohan Mehta (TPM) facing scattered outcomes and hallucinated AI commitments.
- [x] **2. Problem Validation:** Verified against common PM post-meeting pain points across distributed teams.
- [x] **3. Product Hypothesis & Core Guardrails:** Evidence-first extraction + ambiguity flagging = reliable execution.
- [x] **4. MVP Scope & Explicit Non-Goals:** Text ingestion, structured extraction, ambiguity engine, split-view review, multi-format export.
- [x] **5. Success Metrics:** Precision, false-commitment rate, ambiguity recall, time to export.
- [x] **6. User Flows & Low-Fidelity UI Architecture:** Transcript input $\to$ Extraction & Uncertainty Analysis $\to$ Split-Screen Audit $\to$ Export.
- [x] **7. AI Evaluation Cases & Edge Cases:** Casual proposals, rhetorical questions, unassigned chores, conditional agreements.
- [x] **8. Build & Test Smallest Useful Version:** Deliver responsive SPA with offline rule-engine fallback + Gemini API integration.
- [x] **9. Review Results & Iteration Plan:** Documented in Architecture and Implementation Plan.
- [x] **10. Case Study & Portfolio Readiness:** Comprehensive documentation, clean git history, GitHub Pages live deployment ready.
