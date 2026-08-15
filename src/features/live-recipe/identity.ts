import { createHash } from "node:crypto";
import type { LiveRecipeEnvironment } from "./live-environment";

export type LiveUserIdentity = {
  internalUserId: string;
  externalUserId: string;
  safeReference: string;
};

export type LiveUserIdentityProvider = {
  resolve(environment: LiveRecipeEnvironment): Promise<{ ok: true; value: LiveUserIdentity } | { ok: false; errorCode: "AUTH_REQUIRED" | "IDENTITY_UNAVAILABLE" }>;
};

function deriveIdentity(internalUserId: string): LiveUserIdentity {
  const fingerprint = createHash("sha256").update(`buildflow:pipedream:${internalUserId}`).digest("hex");
  return {
    internalUserId,
    externalUserId: `buildflow_${fingerprint.slice(0, 48)}`,
    safeReference: `user_${fingerprint.slice(0, 12)}`,
  };
}

export function deriveLiveUserIdentity(internalUserId: string): LiveUserIdentity { return deriveIdentity(internalUserId); }
