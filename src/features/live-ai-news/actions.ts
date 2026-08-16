"use server";

import { randomUUID } from "node:crypto";
import { runApprovedSlackDigestWrite } from "../live-recipe/live-recipe-service";
import { readLiveRecipeEnvironment } from "../live-recipe/live-environment";
import type { LiveRecipeEvidence } from "../live-recipe/types";
import type { NewsDigestSummary, SelectedNewsItem } from "./manual-recipe";
import { GroqSummaryAdapter, OpenAiNewsRssSource, defaultGroqModel, formatSlackDigestMessage, runNewsFetchGate, runNewsToGroqToSlackGate } from "./real-adapters";

const aiNewsDigestRecipeId = "recipe.ai-news-slack-digest";

export type AiNewsDigestGateErrorCode = "LIVE_DISABLED" | "WRITE_DISABLED" | "CONFIGURATION_MISSING" | "EXTERNAL_ACTION_FAILED" | "ATTEMPT_NOT_FOUND";

/**
 * Server-owned store for in-flight stepped Manual Run attempts (roadmap
 * Step 9 provenance hardening). `runAiNewsFetchStep` / `runAiNewsSummaryStep`
 * write the real `selectedItems` / `summary` here and hand the browser only
 * an opaque `attemptId`; later steps read the value back out of this map
 * instead of trusting whatever the browser sends, so a forged client
 * request can no longer substitute its own news items or summary text into
 * the Slack write. In-memory only (lost on process restart) — acceptable
 * for a single-process dev/local deployment with no persistence layer yet;
 * revisit once Recipe runs move behind a real DB-backed attempt record.
 */
const attemptTtlMs = 10 * 60 * 1000;
type DigestAttempt = { selectedItems: SelectedNewsItem[]; summary?: NewsDigestSummary; createdAt: number };
const digestAttempts = new Map<string, DigestAttempt>();

function pruneExpiredAttempts(): void {
  const cutoff = Date.now() - attemptTtlMs;
  for (const [id, attempt] of digestAttempts) {
    if (attempt.createdAt < cutoff) digestAttempts.delete(id);
  }
}

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

export type AiNewsFetchStepResult =
  | { ok: true; attemptId: string; selectedItemCount: number; service: string; completedAt: string }
  | { ok: false; errorCode: AiNewsDigestGateErrorCode };

export type AiNewsSummaryStepResult =
  | { ok: true; attemptId: string; summaryLineCount: number; service: string; completedAt: string }
  | { ok: false; errorCode: AiNewsDigestGateErrorCode };

export type AiNewsSlackWriteStepResult =
  | { ok: true; safeSlackReference: string; evidence: LiveRecipeEvidence }
  | { ok: false; errorCode: AiNewsDigestGateErrorCode };

/**
 * Step-by-step variants of `requestApprovedAiNewsDigestRun` (roadmap
 * Step 9, provenance-hardened per the follow-up Sprint): each step
 * re-checks the same gate independently, so calling any one of these in
 * isolation is exactly as safe as the combined run w.r.t. the kill
 * switches. The client calls them in order (fetch -> summary -> write) and
 * updates UI between each awaited call to show real progress, but only
 * ever receives an opaque `attemptId` plus display counts — never the
 * actual news items or summary text — so it has nothing to forge back in.
 * `selectedItems` / `summary` live solely in `digestAttempts` server-side
 * between steps. The external call count (one RSS fetch, one Groq call,
 * one Slack write) matches the combined run exactly.
 */
export async function runAiNewsFetchStep(): Promise<AiNewsFetchStepResult> {
  const preview = await prepareAiNewsDigestRun();
  if (!preview.ok) return preview;
  try {
    pruneExpiredAttempts();
    const gate = await runNewsFetchGate({ source: new OpenAiNewsRssSource() });
    const attemptId = randomUUID();
    digestAttempts.set(attemptId, { selectedItems: gate.selectedItems, createdAt: Date.now() });
    return { ok: true, attemptId, selectedItemCount: gate.selectedItems.length, service: "OpenAI News RSS", completedAt: new Date().toISOString() };
  } catch {
    return { ok: false, errorCode: "EXTERNAL_ACTION_FAILED" };
  }
}

export async function runAiNewsSummaryStep(attemptId: string): Promise<AiNewsSummaryStepResult> {
  const preview = await prepareAiNewsDigestRun();
  if (!preview.ok) return preview;
  const attempt = digestAttempts.get(attemptId);
  if (!attempt) return { ok: false, errorCode: "ATTEMPT_NOT_FOUND" };
  try {
    const summarizer = new GroqSummaryAdapter({ apiKey: process.env.GROQ_API_KEY });
    const summary = await summarizer.summarize({ items: attempt.selectedItems });
    attempt.summary = summary;
    return { ok: true, attemptId, summaryLineCount: summary.bullets.length, service: `Groq (${defaultGroqModel})`, completedAt: new Date().toISOString() };
  } catch {
    return { ok: false, errorCode: "EXTERNAL_ACTION_FAILED" };
  }
}

export async function runAiNewsSlackWriteStep(attemptId: string): Promise<AiNewsSlackWriteStepResult> {
  const preview = await prepareAiNewsDigestRun();
  if (!preview.ok) return preview;
  const attempt = digestAttempts.get(attemptId);
  if (!attempt || !attempt.summary) return { ok: false, errorCode: "ATTEMPT_NOT_FOUND" };
  try {
    const message = formatSlackDigestMessage(attempt.summary, attempt.selectedItems);
    const result = await runApprovedSlackDigestWrite({
      approved: true,
      recipeId: preview.recipeId,
      targetConfigurationReference: preview.targetConfigurationReference,
      requestId: `slack-digest-ui-run-${randomUUID()}`,
      message,
    });
    digestAttempts.delete(attemptId);
    if (!result.ok) return { ok: false, errorCode: "EXTERNAL_ACTION_FAILED" };
    return { ok: true, safeSlackReference: result.value.safeExternalReference, evidence: result.evidence };
  } catch {
    digestAttempts.delete(attemptId);
    return { ok: false, errorCode: "EXTERNAL_ACTION_FAILED" };
  }
}
