# STABILIZE-003 Report

## Selection persistence

The existing `projects.goal_constraints.requirement_snapshot` JSONB stores `selectedCandidateId`, `selectedStrategy`, `selectedAt`, `selectedArchitectureSnapshot`, `buildPreferenceSnapshotVersion`, and `architectureCandidatesSnapshotVersion`.

## Server Action

`selectProjectArchitectureCandidate` authenticates the user, verifies project ownership, regenerates the current candidate list, compares the stored and regenerated Architecture snapshot, checks excluded Tools, and requires explicit confirmation for over-budget candidates.

## Downstream confirmation

After server validation, only the selected Architecture is used to regenerate Build Intelligence, Connector/Credential references, Build Plan, Installation, and Test Suite. No Client-only selection is trusted for persistence.

## Compatibility

Projects without candidate snapshots return a reselection-required error instead of silently selecting a different Architecture. Existing pre-ALIGN projects remain readable through the existing optional Snapshot fallback.

## MVP Impact

Architecture choice now survives Project Detail re-entry and authenticated server persistence, reducing the risk that later setup uses a different design than the user selected. This is qualitative because no agreed quantitative measurement basis exists.

## Verification

Tests: PASS — 22 files, 116 tests. lint: PASS. typecheck: PASS. build: PASS. `git diff --check`: PASS. `.env.local` is not tracked and no raw Secret was added.

## Commit

Not created. Push not performed. Awaiting PM Review.
