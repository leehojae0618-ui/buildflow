# RECIPE-EXECUTION-CONTRACT-001 Contract

New interface introduced: `src/features/recipes/execution-contract.ts`.

```ts
export type RecipeTrigger = Recipe["trigger"]; // reused, not redefined

export type RecipeInputPort<TItem> = () => Promise<TItem[]>;

export type RecipeProcessorPort<TIn, TOut> = (input: TIn) => Promise<TOut>;

export type RecipeDestinationWriteRequest<TPayload> = {
  approved: true;
  recipeId: string;
  targetConfigurationReference: string;
  requestId: string;
  payload: TPayload;
};

export type RecipeDestinationPort<TPayload, TResult> = (
  request: RecipeDestinationWriteRequest<TPayload>,
) => Promise<LiveRecipeResult<TResult>>;
```

Design notes:

- Function-type ports, not object-method interfaces. This lets existing
  domain-specific adapters (`OpenAiNewsRssSource.fetchNews`,
  `GroqSummaryAdapter.summarize`) conform through a one-line wrapper without
  renaming their existing methods, keeping the already-verified live path
  (`live-recipe-service.ts`, `pipedream-real-adapter.ts`,
  `pipedream-port.ts`) completely untouched.
- Approval and Evidence are not new types. Approval is the existing
  `approved: true` + destination-lock + idempotency + kill-switch guard
  pattern already enforced inside `runApprovedSlackDigestWrite`; a
  `RecipeDestinationPort` implementation is expected to enforce it the same
  way `runApprovedSlackDigestWrite` does, not to duplicate it inline. Evidence
  is the existing `LiveRecipeEvidence` type from `../live-recipe/types`.

Reference implementation (adapters only, no changes to what they wrap):
`src/features/live-ai-news/real-adapters.ts` —
`toNewsRecipeInputPort`, `toGroqRecipeProcessorPort`,
`toSlackDigestRecipeDestinationPort`.

Consumers: none yet inside production code paths (`runNewsToGroqToSlackGate`
still calls the concrete pieces directly, unchanged). The adapters exist so
Step 3+ has a proven-real target shape to build new Recipes against, and are
covered by their own equivalence tests
(`real-adapters.test.ts`, "Recipe Execution Contract adapters (roadmap Step
2)").

Compatibility: additive only. No existing exported type or function
signature changed.
