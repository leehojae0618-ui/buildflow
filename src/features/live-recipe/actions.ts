"use server";

import { prepareSlackConnectLink, prepareSlackTestAction, runApprovedSlackTestWrite } from "./live-recipe-service";
import { slackWriteRequestSchema } from "./types";

/** Server Action boundary. Browser input never supplies an external Pipedream user ID. */
export async function requestSlackConnectLink(recipeId: string) {
  return prepareSlackConnectLink(recipeId);
}

export async function requestSlackTestActionPreparation(recipeId: string) {
  return prepareSlackTestAction(recipeId);
}

export async function requestApprovedSlackTestWrite(input: unknown) {
  const parsed = slackWriteRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, errorCode: "WRITE_NOT_APPROVED" as const };
  return runApprovedSlackTestWrite(parsed.data);
}
