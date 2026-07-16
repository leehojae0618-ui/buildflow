# ALIGN-001 Report

## BuildPreference Domain

Added cost preference, automation preference, budget limit, preferred/excluded tools, and hosting preference. Existing `budget_range`, `automation_level`, and `current_tools` are normalized into the new model.

## Architecture Candidates

Added FREE_FIRST, BALANCED, and PERFORMANCE_FIRST candidates with distinct components, tradeoffs, cost, automation, action count, time, difficulty, risk, and confidence metrics. CUSTOM_BUDGET marks candidates above the limit as unavailable.

## Selection and downstream flow

Requirement snapshots retain candidates and the selected candidate ID while generating the existing Architecture, Connector, Credential, Build Plan, Installation, and Test inputs from the selected strategy. Candidate selection UI is local and comparison-focused; durable selection is a follow-up.

## MVP Impact

Users can compare system-building approaches by outcomes rather than provider names. This is a qualitative MVP improvement; no agreed quantitative measurement basis exists.

## Technical Debt

Durable candidate selection and server-side recalculation for refresh and multi-device continuity remain deferred.

## Verification

- Tests: PASS — 21 files, 114 tests
- lint: PASS
- typecheck: PASS
- build: PASS
- `git diff --check`: PASS
- Secret/.env.local tracking: no tracked `.env.local`; no raw Secret added

## Commit

Not created. Push not performed. Awaiting PM Review.
