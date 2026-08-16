# RECIPE-EXECUTION-CONTRACT-001 Report

## Status

```text
STATUS: IMPLEMENTED / VALIDATED
COMMIT: PENDING APPROVAL
PUSH: NOT PERFORMED
LIVE EXECUTION: NONE (pure type-level contract + mocked adapter tests)
```

## Scope Completed

- Added `src/features/recipes/execution-contract.ts` defining
  `RecipeInputPort`, `RecipeProcessorPort`, `RecipeDestinationWriteRequest`,
  `RecipeDestinationPort`, and re-exporting `RecipeTrigger` from the existing
  `Recipe["trigger"]` type. See `CONTRACT.md` for the full shape and design
  notes.
- Added three adapter functions to `src/features/live-ai-news/real-adapters.ts`
  (`toNewsRecipeInputPort`, `toGroqRecipeProcessorPort`,
  `toSlackDigestRecipeDestinationPort`) that wrap the existing, unmodified
  `OpenAiNewsRssSource`, `GroqSummaryAdapter`, and
  `runApprovedSlackDigestWrite` so they conform to the new ports.
- Added 4 equivalence tests in `real-adapters.test.ts` proving each adapter
  produces the same result as calling the wrapped piece directly, including
  a negative test that the Slack digest destination adapter rejects any
  `recipeId` other than `recipe.ai-news-slack-digest` before reaching the
  guarded service.

## Validation

```text
npm run typecheck
PASS

npm run lint
PASS

npx vitest run
PASS — 93 test files passed, 3 skipped; 953 tests passed, 5 skipped
(949 -> 953: +4 new equivalence tests, 0 regressions)
```

No file inside the already-verified live path
(`live-recipe-service.ts`, `pipedream-real-adapter.ts`, `pipedream-port.ts`,
`live-environment.ts`) was modified. `runNewsToGroqToSlackGate` and its
mocked and live tests are unchanged and still pass.

## Out Of Scope Preserved

- No new Destination (Gmail/Notion — Step 19).
- No new Provider (Step 20).
- No Scheduler (Step 17).
- No live execution performed in this Sprint.
- No rename of any existing live-path method or type.

## MVP Impact

Qualitative: this does not change what a user can see or do today (the
AI-news Recipe behaves identically). It removes a structural blocker for
Step 3 (natural-language → Recipe): future Recipes now have a proven-real,
tested target shape (Input/Processor/Destination ports) to be generated
against, instead of requiring a bespoke one-off gate function per Recipe
like `runNewsToGroqToSlackGate`. Not quantified — no user-facing surface
changed to measure.

## Next Gate

Roadmap Step 3: natural-language → Recipe conversion. Any live execution,
new Destination, or Scheduler work remains a separate approval regardless of
this Sprint's outcome.
