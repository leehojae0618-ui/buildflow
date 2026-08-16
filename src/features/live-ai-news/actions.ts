"use server";

import { randomUUID } from "node:crypto";
import { readLiveRecipeEnvironment } from "../live-recipe/live-environment";
import { GroqSummaryAdapter, OpenAiNewsRssSource, runNewsToGroqToSlackGate } from "./real-adapters";

const aiNewsDigestRecipeId = "recipe.ai-news-slack-digest";

export type AiNewsDigestGateErrorCode = "LIVE_DISABLED" | "WRITE_DISABLED" | "CONFIGURATION_MISSING" | "EXTERNAL_ACTION_FAILED";

export type AiNewsDigestPreview =
  | { ok: true; recipeId: typeof aiNewsDigestRecipeId; targetConfigurationReference: string }
  | { ok: false; errorCode: AiNewsDigestGateErrorCode };

export type AiNewsDigestRunResult =
  | { ok: true; selectedItemCount: number; summaryLineCount: number; safeSlackReference: string }
  | { ok: false; errorCode: AiNewsDigestGateErrorCode };

/**
 * Reads the same live-recipe kill switches C3 already enforces, without
 * making any External call. Lets the UI show destination + action and
 * block the run button before anything happens.
 */
export async function prepareAiNewsDigestRun(): Promise<AiNewsDigestPreview> {
  const environment = readLiveRecipeEnvironment();
  if (!environment.liveConnectEnabled) return { ok: false, errorCode: "LIVE_DISABLED" };
  if (!environment.liveSlackWriteEnabled) return { ok: false, errorCode: "WRITE_DISABLED" };
  if (!environment.approvedSlackChannelId || !process.env.GROQ_API_KEY) return { ok: false, errorCode: "CONFIGURATION_MISSING" };
  return { ok: true, recipeId: aiNewsDigestRecipeId, targetConfigurationReference: environment.approvedSlackChannelId };
}

/**
 * Server Action boundary for the composite AI-news Recipe (roadmap Step 8).
 * Re-checks the same kill switches *before* calling News/Groq, so a
 * disabled switch blocks the whole C1->C2->C3 chain, not just the final
 * Slack write (`runApprovedSlackDigestWrite` only gates C3 internally).
 * Destination is always server-resolved, never client-supplied.
 */
export async function requestApprovedAiNewsDigestRun(): Promise<AiNewsDigestRunResult> {
  const preview = await prepareAiNewsDigestRun();
  if (!preview.ok) return preview;

  try {
    const result = await runNewsToGroqToSlackGate({
      source: new OpenAiNewsRssSource(),
      summarizer: new GroqSummaryAdapter({ apiKey: process.env.GROQ_API_KEY }),
      slackWrite: {
        approved: true,
        recipeId: preview.recipeId,
        targetConfigurationReference: preview.targetConfigurationReference,
        requestId: `slack-digest-ui-run-${randomUUID()}`,
      },
    });
    return {
      ok: true,
      selectedItemCount: result.evidence.selectedItemCount,
      summaryLineCount: result.summary.bullets.length,
      safeSlackReference: result.evidence.safeSlackReference ?? "",
    };
  } catch {
    return { ok: false, errorCode: "EXTERNAL_ACTION_FAILED" };
  }
}
