import { createHash } from "node:crypto";
import type {
  AgentPackageProfile,
  AgentPackageReadinessResult,
} from "./package-profile";

export const agentPackageArtifactFormatVersions = [
  "bps-agent-profile-artifact-1.0",
] as const;
export type AgentPackageArtifactFormatVersion =
  (typeof agentPackageArtifactFormatVersions)[number];

export type AgentPackageExportInput = {
  formatVersion: AgentPackageArtifactFormatVersion;
  profile: AgentPackageProfile;
  readiness: AgentPackageReadinessResult;
};

export type AgentPackageExportMetadata = {
  formatVersion: AgentPackageArtifactFormatVersion;
  contentType: "application/vnd.buildflow.agent-package-profile+json";
  packageId: string;
  packageVersion: string;
  checksumSha256: string;
  byteLength: number;
  deterministic: true;
};

export type AgentPackageExportArtifact = {
  metadata: AgentPackageExportMetadata;
  payload: string;
};

export type AgentPackageExportErrorCode =
  | "UNSUPPORTED_FORMAT_VERSION"
  | "PACKAGE_IDENTIFIER_MISSING"
  | "PACKAGE_VERSION_MISSING"
  | "PACKAGE_NOT_READY"
  | "SECRET_OR_CREDENTIAL_VALUE_DETECTED"
  | "SERIALIZATION_UNSUPPORTED";

export class AgentPackageExportError extends Error {
  constructor(
    public readonly code: AgentPackageExportErrorCode,
    message = code,
  ) {
    super(message);
    this.name = "AgentPackageExportError";
  }
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function stableValue(value: unknown): unknown {
  if (value === undefined) {
    throw new AgentPackageExportError("SERIALIZATION_UNSUPPORTED");
  }
  if (
    typeof value === "function" ||
    typeof value === "symbol" ||
    typeof value === "bigint"
  ) {
    throw new AgentPackageExportError("SERIALIZATION_UNSUPPORTED");
  }
  if (Array.isArray(value)) return value.map(stableValue);
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stableValue(value[key])]),
    );
  }
  return value;
}

export function stableSerializeAgentPackage(value: unknown) {
  return JSON.stringify(stableValue(value), null, 2) + "\n";
}

function containsForbiddenSecretLikeValue(value: unknown): boolean {
  if (typeof value === "string") {
    return (
      /sk-[A-Za-z0-9_-]{20,}/.test(value) ||
      /ghp_[A-Za-z0-9_]{20,}/.test(value) ||
      /github_pat_[A-Za-z0-9_]{20,}/.test(value) ||
      /xox[baprs]-[A-Za-z0-9-]{10,}/.test(value) ||
      /AKIA[0-9A-Z]{16}/.test(value)
    );
  }
  if (Array.isArray(value)) {
    return value.some(containsForbiddenSecretLikeValue);
  }
  if (value && typeof value === "object") {
    return Object.values(value).some(containsForbiddenSecretLikeValue);
  }
  return false;
}

function containsForbiddenCredentialField(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsForbiddenCredentialField);
  if (!value || typeof value !== "object") return false;

  return Object.entries(value).some(([key, child]) => {
    const normalizedKey = key.toLowerCase();
    if (
      normalizedKey === "secret" ||
      normalizedKey === "token" ||
      normalizedKey === "password" ||
      normalizedKey === "privatekey" ||
      normalizedKey === "private_key" ||
      normalizedKey === "apikey" ||
      normalizedKey === "api_key" ||
      normalizedKey === "accesstoken" ||
      normalizedKey === "access_token" ||
      normalizedKey === "refreshtoken" ||
      normalizedKey === "refresh_token" ||
      normalizedKey === "credentialvalue" ||
      normalizedKey === "credential_value" ||
      normalizedKey === "vaultsecret" ||
      normalizedKey === "vault_secret"
    ) {
      return true;
    }
    return containsForbiddenCredentialField(child);
  });
}

function assertExportable(input: AgentPackageExportInput) {
  stableValue(input.profile);
  stableValue(input.readiness);

  if (!agentPackageArtifactFormatVersions.includes(input.formatVersion)) {
    throw new AgentPackageExportError("UNSUPPORTED_FORMAT_VERSION");
  }
  if (!input.profile.packageId.trim()) {
    throw new AgentPackageExportError("PACKAGE_IDENTIFIER_MISSING");
  }
  if (!input.profile.packageVersion.trim()) {
    throw new AgentPackageExportError("PACKAGE_VERSION_MISSING");
  }
  if (input.readiness.status !== "READY" || !input.readiness.exportReady) {
    throw new AgentPackageExportError("PACKAGE_NOT_READY");
  }
  if (
    containsForbiddenSecretLikeValue(input.profile) ||
    containsForbiddenCredentialField(input.profile)
  ) {
    throw new AgentPackageExportError("SECRET_OR_CREDENTIAL_VALUE_DETECTED");
  }
}

export function exportAgentPackageArtifact(
  input: AgentPackageExportInput,
): AgentPackageExportArtifact {
  assertExportable(input);

  const packageArtifact = {
    formatVersion: input.formatVersion,
    profile: input.profile,
    readiness: input.readiness,
  };
  const payload = stableSerializeAgentPackage(packageArtifact);

  return {
    metadata: {
      formatVersion: input.formatVersion,
      contentType: "application/vnd.buildflow.agent-package-profile+json",
      packageId: input.profile.packageId,
      packageVersion: input.profile.packageVersion,
      checksumSha256: sha256(payload),
      byteLength: Buffer.byteLength(payload),
      deterministic: true,
    },
    payload,
  };
}
