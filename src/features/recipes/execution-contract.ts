import type { LiveRecipeResult } from "../live-recipe/types";
import type { Recipe } from "./types";

// Recipe Execution Contract (roadmap Step 2)
//
// The common shape every BuildFlow Recipe's runtime execution follows,
// independent of which specific news source, AI provider, or destination
// service a given Recipe uses:
//
// - Trigger:     when the Recipe runs. Already defined by `Recipe["trigger"]`
//                (MANUAL | SCHEDULE | EVENT); reused here, not redefined.
// - Input:       fetches the raw items a Recipe acts on.
// - Processor:   transforms fetched input into an output payload (today,
//                one AI-provider step; not limited to that).
// - Destination: performs the guarded external write / side effect.
// - Approval:    a Destination write is only ever attempted with an
//                explicit `approved: true` request; the destination-lock,
//                idempotency, and kill-switch guards live in each concrete
//                Destination implementation (see `runApprovedSlackDigestWrite`
//                for the reference implementation) and are not duplicated
//                here.
// - Evidence:    the structured result every Destination write returns.
//                Already defined by `LiveRecipeEvidence`; reused here, not
//                redefined.
//
// This module defines Input/Processor/Destination as function-type ports so
// existing domain-specific adapters (e.g. `OpenAiNewsRssSource.fetchNews`,
// `GroqSummaryAdapter.summarize`) can conform to them through a thin
// wrapper function without renaming their existing methods.

export type RecipeTrigger = Recipe["trigger"];

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
