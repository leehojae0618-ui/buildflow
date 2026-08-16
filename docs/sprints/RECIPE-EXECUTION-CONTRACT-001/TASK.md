# RECIPE-EXECUTION-CONTRACT-001 Task

## Authority

```text
RISK TIER: R2 (product/runtime logic change, no live external write, no DB, no OAuth)
SCOPE + IMPLEMENTATION AUTHORITY: APPROVED 2026-08-16
COMMIT: covered by the same Scope approval per Section 11 (R2)
PUSH: NOT APPROVED — separate gate
```

## Goal

Roadmap Step 2 ("Recipe Execution Contract 정리"): stop the guarded Slack
digest / News / Groq code from being implicitly AI-News-only, by naming and
typing the common contract every Recipe's runtime execution follows —
Trigger / Input / Processor / Destination / Approval / Evidence — so a
future Recipe (Step 3+) can be built against a stable shape instead of a
bespoke one-off like `runNewsToGroqToSlackGate`.

## Requirements

- Define the six-part contract as a dedicated module, reusing existing types
  where they are already generic (`Recipe["trigger"]`, `LiveRecipeEvidence`)
  rather than redefining them.
- Prove the contract is real (not documentary-only) by adapting the existing
  AI-news Recipe's Input (`OpenAiNewsRssSource`), Processor
  (`GroqSummaryAdapter`), and Destination (`runApprovedSlackDigestWrite`) to
  conform to it.
- Zero behavior change: no existing method is renamed, no existing guarded
  function (`runApprovedSlackDigestWrite`, `live-recipe-service.ts`,
  `pipedream-real-adapter.ts`, `pipedream-port.ts`) is modified. Adapters are
  additive, thin wrapper functions only.
- Add equivalence tests proving each wrapper produces the same result as
  calling the wrapped piece directly.
- No new Destination, no new Provider, no Scheduler, no live execution, no
  DB, no OAuth. Those remain separate, later roadmap steps.

## Out of Scope

- Generalizing beyond the three ports actually needed today (no speculative
  orchestrator for pipeline shapes BuildFlow does not have a second example
  of yet — that is Step 3's job, once natural-language → Recipe exists).
- Renaming `NewsSourcePort.fetchNews` / `AiSummaryPort.summarize` or any
  other already-verified live-path method name.
- Widening `LiveRecipeEvidence`'s `actionType`/`engine`/`service` unions
  (no new concrete value exists yet to justify it).
