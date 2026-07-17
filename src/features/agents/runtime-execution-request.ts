import { createHash } from "node:crypto";
import {
  packageApprovalScopes,
  type PackageApprovalGateResult,
  type PackageApprovalScope,
} from "./package-approval-gate";
import { stableSerializeAgentPackage } from "./package-export";

export const RUNTIME_EXECUTION_REQUEST_FORMAT_VERSION =
  "buildflow.runtime-execution-request.v1" as const;

export const runtimeExecutionModes = ["DRY_RUN", "STANDARD"] as const;
export type RuntimeExecutionMode = (typeof runtimeExecutionModes)[number];

export const runtimeActorTypes = ["SERVICE", "SYSTEM", "USER"] as const;
export type RuntimeActorType = (typeof runtimeActorTypes)[number];

export type ReferenceIdentifier = {
  referenceId: string;
  integrityChecksum?: string;
  referenceType?: string;
};

export type RuntimeActorReference = {
  actorType: RuntimeActorType;
  actorId: string;
  roleReference?: string;
  organizationReference?: string;
};

export type RuntimeArtifactReference = {
  artifactId: string;
  artifactType: string;
  integrityChecksum: string;
  mediaType?: string;
  storageReference?: string;
  schemaReference?: string;
};

export type RuntimeCapabilityReference = {
  capabilityId: string;
  policyReference?: string;
  integrityChecksum?: string;
};

export type RuntimeRequestExpirationPolicy =
  | {
      mode: "REFERENCE_ONLY";
      expirationReference: string;
    }
  | {
      mode: "EXPLICIT_TIME";
      expiresAt: string;
      evaluationTime: string;
    };

export type RuntimeExecutionRequestLimitationCode =
  | "NO_RUNTIME_POLICY_ENFORCEMENT"
  | "NO_PROVIDER_ATTESTATION"
  | "NO_MCP_ATTESTATION"
  | "NO_PERSISTENCE_ATTESTATION";

export type RuntimeExecutionRequestFailureCode =
  | "CONTRACT_ERROR"
  | "SECRET_SAFETY_ERROR"
  | "AUTHORIZATION_REQUIRED"
  | "AUTHORIZATION_SCOPE_MISSING"
  | "AUTHORIZATION_BINDING_INVALID"
  | "PACKAGE_BINDING_MISMATCH"
  | "EVIDENCE_BINDING_MISMATCH"
  | "RUNTIME_REQUEST_INVALID"
  | "RUNTIME_REQUEST_EXPIRED"
  | "EXPIRATION_POLICY_INVALID"
  | "ARTIFACT_INTEGRITY_ERROR"
  | "DUPLICATE_ARTIFACT_CONFLICT"
  | "DUPLICATE_CAPABILITY_CONFLICT"
  | "INTERNAL_RUNTIME_EXECUTION_REQUEST_ERROR";

export type RuntimeExecutionRequestFailure = {
  code: RuntimeExecutionRequestFailureCode;
  target?: string;
  detailCode?: string;
  safeReference?: string;
  recoverable: boolean;
  userActionable: boolean;
};

export type RuntimeExecutionRequestPackageBinding = {
  packageId: string;
  packageVersion: string;
  packageArtifactChecksum: string;
};

export type RuntimeExecutionRequestEvidenceBinding = {
  evidenceReportId: string;
  evidenceReportIntegrityChecksum: string;
};

export type RuntimeExecutionRequestApprovalBinding = {
  approvalRequestId: string;
  approvalGateIntegrityChecksum: string;
  approvalGateStatus: "APPROVED_WITH_LIMITATIONS";
  authorizationStatus: "AUTHORIZED_WITH_LIMITATIONS";
  grantedScopes: PackageApprovalScope[];
};

export type RuntimeExecutionRequestDeterministicCore = {
  formatVersion: typeof RUNTIME_EXECUTION_REQUEST_FORMAT_VERSION;
  packageBinding: RuntimeExecutionRequestPackageBinding;
  evidenceBinding: RuntimeExecutionRequestEvidenceBinding;
  approvalBinding: RuntimeExecutionRequestApprovalBinding;
  requestedExecutionMode: RuntimeExecutionMode;
  executionProfileReference: ReferenceIdentifier;
  runtimePolicyReference?: ReferenceIdentifier;
  requestedBy: RuntimeActorReference;
  inputArtifactReferences: RuntimeArtifactReference[];
  requestedCapabilityReferences: RuntimeCapabilityReference[];
  expirationPolicy: RuntimeRequestExpirationPolicy;
  limitations: RuntimeExecutionRequestLimitationCode[];
};

export type RuntimeExecutionRequest = {
  formatVersion: typeof RUNTIME_EXECUTION_REQUEST_FORMAT_VERSION;
  runtimeExecutionRequestId: string;
  packageBinding: RuntimeExecutionRequestPackageBinding;
  evidenceBinding: RuntimeExecutionRequestEvidenceBinding;
  approvalBinding: RuntimeExecutionRequestApprovalBinding;
  requestedExecutionMode: RuntimeExecutionMode;
  executionProfileReference: ReferenceIdentifier;
  runtimePolicyReference?: ReferenceIdentifier;
  requestedBy: RuntimeActorReference;
  inputArtifactReferences: RuntimeArtifactReference[];
  requestedCapabilityReferences: RuntimeCapabilityReference[];
  expirationPolicy: RuntimeRequestExpirationPolicy;
  limitations: RuntimeExecutionRequestLimitationCode[];
  deterministicCore: RuntimeExecutionRequestDeterministicCore;
  integrityChecksum: string;
};

export type BuildRuntimeExecutionRequestInput = {
  approvalGate: PackageApprovalGateResult;
  requestedExecutionMode: RuntimeExecutionMode;
  executionProfileReference: ReferenceIdentifier;
  runtimePolicyReference?: ReferenceIdentifier;
  requestedBy: RuntimeActorReference;
  inputArtifactReferences?: RuntimeArtifactReference[];
  requestedCapabilityReferences?: RuntimeCapabilityReference[];
  expirationPolicy: RuntimeRequestExpirationPolicy;
  limitations?: RuntimeExecutionRequestLimitationCode[];
};

export type BuildRuntimeExecutionRequestResult =
  | {
      status: "VALID";
      value: RuntimeExecutionRequest;
      failures: [];
    }
  | {
      status: "INVALID";
      failures: RuntimeExecutionRequestFailure[];
    };

const sha256Pattern = /^[a-f0-9]{64}$/;
const supportedScopes = new Set<string>(packageApprovalScopes);
const supportedActorTypes = new Set<string>(runtimeActorTypes);
const supportedExecutionModes = new Set<string>(runtimeExecutionModes);
const defaultLimitations: RuntimeExecutionRequestLimitationCode[] = [
  "NO_MCP_ATTESTATION",
  "NO_PERSISTENCE_ATTESTATION",
  "NO_PROVIDER_ATTESTATION",
  "NO_RUNTIME_POLICY_ENFORCEMENT",
];
const limitationOrder = new Map(defaultLimitations.map((item, index) => [item, index]));

const secretValuePatterns = [
  /sk-[A-Za-z0-9_-]{20,}/,
  /ghp_[A-Za-z0-9_]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /xox[baprs]-[A-Za-z0-9-]{10,}/,
  /AKIA[0-9A-Z]{16}/,
  /Bearer\s+[A-Za-z0-9._~+/=-]{10,}/i,
  /Authorization:\s*[^\s]+/i,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /(?:postgres|postgresql|mysql|mongodb):\/\/[^/\s:@]+:[^@\s]+@/i,
  /https?:\/\/[^\s?]+\?[^\s]*(?:token|signature|X-Amz-Signature|access_key)=/i,
] as const;

const forbiddenKeys = new Set([
  "access_token",
  "accessToken",
  "api_key",
  "apiKey",
  "authClaims",
  "authorizationHeader",
  "bearer",
  "client_secret",
  "clientSecret",
  "connectionString",
  "cookie",
  "cookies",
  "credential",
  "credentialValue",
  "databaseUrl",
  "environmentVariables",
  "mcpRequest",
  "mcpResponse",
  "password",
  "privateInput",
  "private_key",
  "privateKey",
  "prompt",
  "providerRequest",
  "providerResponse",
  "rawLogs",
  "refresh_token",
  "refreshToken",
  "requestHeaders",
  "secret",
  "session",
  "session_token",
  "sessionToken",
  "signedUrl",
  "stack",
  "token",
  "vaultSecret",
]);

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function hash(value: unknown) {
  return sha256(stableSerializeAgentPackage(value));
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function failure(
  code: RuntimeExecutionRequestFailureCode,
  target?: string,
  detailCode?: string,
  safeReference?: string,
  recoverable = true,
  userActionable = true,
): RuntimeExecutionRequestFailure {
  return {
    code,
    ...(target ? { target } : {}),
    ...(detailCode ? { detailCode } : {}),
    ...(safeReference ? { safeReference } : {}),
    recoverable,
    userActionable,
  };
}

function isBlank(value: unknown) {
  return typeof value !== "string" || value.trim().length === 0;
}

function normalizeOptional(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function assertChecksum(
  value: string | undefined,
  target: string,
): RuntimeExecutionRequestFailure[] {
  if (isBlank(value)) {
    return [failure("RUNTIME_REQUEST_INVALID", target, "CHECKSUM_MISSING")];
  }
  if (!sha256Pattern.test(value!.trim())) {
    return [failure("ARTIFACT_INTEGRITY_ERROR", target, "CHECKSUM_INVALID")];
  }
  return [];
}

function containsSecretLikeValue(value: unknown): boolean {
  if (typeof value === "string") {
    return secretValuePatterns.some((pattern) => pattern.test(value));
  }
  if (Array.isArray(value)) return value.some(containsSecretLikeValue);
  if (isObjectRecord(value)) {
    return Object.entries(value).some(
      ([key, child]) => forbiddenKeys.has(key) || containsSecretLikeValue(child),
    );
  }
  return false;
}

function normalizeReference(
  reference: ReferenceIdentifier,
  target: string,
): {
  reference?: ReferenceIdentifier;
  failures: RuntimeExecutionRequestFailure[];
} {
  const failures: RuntimeExecutionRequestFailure[] = [];
  if (!reference || isBlank(reference.referenceId)) {
    failures.push(failure("RUNTIME_REQUEST_INVALID", `${target}.referenceId`));
    return { failures };
  }
  const normalized: ReferenceIdentifier = {
    referenceId: reference.referenceId.trim(),
    ...(normalizeOptional(reference.integrityChecksum)
      ? { integrityChecksum: normalizeOptional(reference.integrityChecksum) }
      : {}),
    ...(normalizeOptional(reference.referenceType)
      ? { referenceType: normalizeOptional(reference.referenceType) }
      : {}),
  };
  if (normalized.integrityChecksum && !sha256Pattern.test(normalized.integrityChecksum)) {
    failures.push(failure("ARTIFACT_INTEGRITY_ERROR", `${target}.integrityChecksum`));
  }
  return { reference: normalized, failures };
}

function normalizeActor(
  actor: RuntimeActorReference,
): {
  actor?: RuntimeActorReference;
  failures: RuntimeExecutionRequestFailure[];
} {
  const failures: RuntimeExecutionRequestFailure[] = [];
  if (!actor || !supportedActorTypes.has(actor.actorType)) {
    failures.push(failure("RUNTIME_REQUEST_INVALID", "requestedBy.actorType"));
  }
  if (!actor || isBlank(actor.actorId)) {
    failures.push(failure("RUNTIME_REQUEST_INVALID", "requestedBy.actorId"));
  }
  if (failures.length > 0) return { failures };
  return {
    actor: {
      actorType: actor.actorType,
      actorId: actor.actorId.trim(),
      ...(normalizeOptional(actor.roleReference)
        ? { roleReference: normalizeOptional(actor.roleReference) }
        : {}),
      ...(normalizeOptional(actor.organizationReference)
        ? { organizationReference: normalizeOptional(actor.organizationReference) }
        : {}),
    },
    failures,
  };
}

function normalizeScopes(
  scopes: string[],
): {
  scopes: PackageApprovalScope[];
  failures: RuntimeExecutionRequestFailure[];
} {
  const failures: RuntimeExecutionRequestFailure[] = [];
  const normalized = new Set<PackageApprovalScope>();
  for (const scope of scopes) {
    if (!supportedScopes.has(scope)) {
      failures.push(
        failure("AUTHORIZATION_BINDING_INVALID", "approvalBinding.grantedScopes", "UNKNOWN_SCOPE"),
      );
      continue;
    }
    normalized.add(scope as PackageApprovalScope);
  }
  if (!normalized.has("RUNTIME_EXECUTION")) {
    failures.push(
      failure(
        "AUTHORIZATION_SCOPE_MISSING",
        "approvalBinding.grantedScopes",
        "RUNTIME_EXECUTION_REQUIRED",
      ),
    );
  }
  return { scopes: [...normalized].sort(), failures };
}

function normalizeArtifacts(
  artifacts: RuntimeArtifactReference[],
): {
  artifacts: RuntimeArtifactReference[];
  failures: RuntimeExecutionRequestFailure[];
} {
  const failures: RuntimeExecutionRequestFailure[] = [];
  const byId = new Map<string, RuntimeArtifactReference>();
  for (const artifact of artifacts) {
    const artifactId = artifact.artifactId?.trim();
    const integrityChecksum = artifact.integrityChecksum?.trim();
    if (!artifactId) {
      failures.push(failure("RUNTIME_REQUEST_INVALID", "inputArtifactReferences.artifactId"));
      continue;
    }
    if (!artifact.artifactType?.trim()) {
      failures.push(
        failure("RUNTIME_REQUEST_INVALID", `inputArtifactReferences.${artifactId}.artifactType`),
      );
      continue;
    }
    failures.push(
      ...assertChecksum(
        integrityChecksum,
        `inputArtifactReferences.${artifactId}.integrityChecksum`,
      ),
    );
    if (!integrityChecksum || !sha256Pattern.test(integrityChecksum)) continue;
    const normalized: RuntimeArtifactReference = {
      artifactId,
      artifactType: artifact.artifactType.trim(),
      integrityChecksum,
      ...(normalizeOptional(artifact.mediaType)
        ? { mediaType: normalizeOptional(artifact.mediaType) }
        : {}),
      ...(normalizeOptional(artifact.storageReference)
        ? { storageReference: normalizeOptional(artifact.storageReference) }
        : {}),
      ...(normalizeOptional(artifact.schemaReference)
        ? { schemaReference: normalizeOptional(artifact.schemaReference) }
        : {}),
    };
    const existing = byId.get(artifactId);
    if (
      existing &&
      (existing.integrityChecksum !== integrityChecksum ||
        stableSerializeAgentPackage(existing) !== stableSerializeAgentPackage(normalized))
    ) {
      failures.push(
        failure("DUPLICATE_ARTIFACT_CONFLICT", `inputArtifactReferences.${artifactId}`),
      );
      continue;
    }
    if (!existing) byId.set(artifactId, normalized);
  }
  return {
    artifacts: [...byId.values()].sort((a, b) =>
      `${a.artifactId}:${a.integrityChecksum}`.localeCompare(
        `${b.artifactId}:${b.integrityChecksum}`,
      ),
    ),
    failures,
  };
}

function normalizeCapabilities(
  capabilities: RuntimeCapabilityReference[],
): {
  capabilities: RuntimeCapabilityReference[];
  failures: RuntimeExecutionRequestFailure[];
} {
  const failures: RuntimeExecutionRequestFailure[] = [];
  const byId = new Map<string, RuntimeCapabilityReference>();
  for (const capability of capabilities) {
    const capabilityId = capability.capabilityId?.trim();
    if (!capabilityId) {
      failures.push(
        failure("RUNTIME_REQUEST_INVALID", "requestedCapabilityReferences.capabilityId"),
      );
      continue;
    }
    const normalized: RuntimeCapabilityReference = {
      capabilityId,
      ...(normalizeOptional(capability.policyReference)
        ? { policyReference: normalizeOptional(capability.policyReference) }
        : {}),
      ...(normalizeOptional(capability.integrityChecksum)
        ? { integrityChecksum: normalizeOptional(capability.integrityChecksum) }
        : {}),
    };
    if (normalized.integrityChecksum && !sha256Pattern.test(normalized.integrityChecksum)) {
      failures.push(
        failure(
          "ARTIFACT_INTEGRITY_ERROR",
          `requestedCapabilityReferences.${capabilityId}.integrityChecksum`,
        ),
      );
      continue;
    }
    const existing = byId.get(capabilityId);
    if (existing) {
      if (stableSerializeAgentPackage(existing) !== stableSerializeAgentPackage(normalized)) {
        failures.push(
          failure("DUPLICATE_CAPABILITY_CONFLICT", `requestedCapabilityReferences.${capabilityId}`),
        );
      }
      continue;
    }
    byId.set(capabilityId, normalized);
  }
  return {
    capabilities: [...byId.values()].sort((a, b) =>
      `${a.capabilityId}:${a.policyReference ?? ""}:${a.integrityChecksum ?? ""}`.localeCompare(
        `${b.capabilityId}:${b.policyReference ?? ""}:${b.integrityChecksum ?? ""}`,
      ),
    ),
    failures,
  };
}

function normalizeLimitations(
  limitations?: RuntimeExecutionRequestLimitationCode[],
): RuntimeExecutionRequestLimitationCode[] {
  const allowed = new Set(defaultLimitations);
  return [...new Set([...(limitations ?? []), ...defaultLimitations])]
    .filter((item): item is RuntimeExecutionRequestLimitationCode => allowed.has(item))
    .sort((a, b) => (limitationOrder.get(a) ?? 999) - (limitationOrder.get(b) ?? 999));
}

function normalizeIso(value: string | undefined) {
  if (isBlank(value)) return undefined;
  const normalized = value!.trim();
  const match = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/,
  );
  if (!match) return undefined;
  const [, year, month, day] = match;
  const calendarDate = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day)),
  );
  if (
    calendarDate.getUTCFullYear() !== Number(year) ||
    calendarDate.getUTCMonth() !== Number(month) - 1 ||
    calendarDate.getUTCDate() !== Number(day)
  ) {
    return undefined;
  }
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function normalizeExpirationPolicy(
  policy: RuntimeRequestExpirationPolicy,
): {
  expirationPolicy?: RuntimeRequestExpirationPolicy;
  failures: RuntimeExecutionRequestFailure[];
} {
  const failures: RuntimeExecutionRequestFailure[] = [];
  if (!policy || !["REFERENCE_ONLY", "EXPLICIT_TIME"].includes(policy.mode)) {
    return {
      failures: [failure("EXPIRATION_POLICY_INVALID", "expirationPolicy.mode")],
    };
  }
  if (policy.mode === "REFERENCE_ONLY") {
    if (isBlank(policy.expirationReference)) {
      failures.push(failure("EXPIRATION_POLICY_INVALID", "expirationPolicy.expirationReference"));
      return { failures };
    }
    return {
      expirationPolicy: {
        mode: "REFERENCE_ONLY",
        expirationReference: policy.expirationReference.trim(),
      },
      failures,
    };
  }
  const expiresAt = normalizeIso(policy.expiresAt);
  const evaluationTime = normalizeIso(policy.evaluationTime);
  if (!expiresAt) failures.push(failure("EXPIRATION_POLICY_INVALID", "expirationPolicy.expiresAt"));
  if (!evaluationTime) {
    failures.push(failure("EXPIRATION_POLICY_INVALID", "expirationPolicy.evaluationTime"));
  }
  if (!expiresAt || !evaluationTime) return { failures };
  if (new Date(evaluationTime).getTime() >= new Date(expiresAt).getTime()) {
    failures.push(failure("RUNTIME_REQUEST_EXPIRED", "expirationPolicy"));
  }
  return {
    expirationPolicy: {
      mode: "EXPLICIT_TIME",
      expiresAt,
      evaluationTime,
    },
    failures,
  };
}

function bindingFailures(
  gate: PackageApprovalGateResult,
): {
  packageBinding: RuntimeExecutionRequestPackageBinding;
  evidenceBinding: RuntimeExecutionRequestEvidenceBinding;
  approvalBinding?: RuntimeExecutionRequestApprovalBinding;
  failures: RuntimeExecutionRequestFailure[];
} {
  const failures: RuntimeExecutionRequestFailure[] = [];
  const source = gate.deterministicCore.sourceReferences;
  const packageBinding = {
    packageId: gate.packageId?.trim() ?? "",
    packageVersion: gate.packageVersion?.trim() ?? "",
    packageArtifactChecksum: source?.packageArtifactChecksum?.trim() ?? "",
  };
  const evidenceBinding = {
    evidenceReportId: gate.evidenceReportReference.reportId?.trim() ?? "",
    evidenceReportIntegrityChecksum:
      gate.evidenceReportReference.reportIntegrityChecksum?.trim() ?? "",
  };
  if (!packageBinding.packageId) failures.push(failure("RUNTIME_REQUEST_INVALID", "packageBinding.packageId"));
  if (!packageBinding.packageVersion) {
    failures.push(failure("RUNTIME_REQUEST_INVALID", "packageBinding.packageVersion"));
  }
  failures.push(
    ...assertChecksum(packageBinding.packageArtifactChecksum, "packageBinding.packageArtifactChecksum"),
  );
  if (!evidenceBinding.evidenceReportId) {
    failures.push(failure("RUNTIME_REQUEST_INVALID", "evidenceBinding.evidenceReportId"));
  }
  failures.push(
    ...assertChecksum(
      evidenceBinding.evidenceReportIntegrityChecksum,
      "evidenceBinding.evidenceReportIntegrityChecksum",
    ),
  );
  if (source) {
    if (
      source.packageId !== packageBinding.packageId ||
      source.packageVersion !== packageBinding.packageVersion ||
      source.packageArtifactChecksum !== packageBinding.packageArtifactChecksum
    ) {
      failures.push(failure("PACKAGE_BINDING_MISMATCH", "packageBinding"));
    }
    if (
      source.evidenceReportId !== evidenceBinding.evidenceReportId ||
      source.evidenceReportIntegrityChecksum !== evidenceBinding.evidenceReportIntegrityChecksum
    ) {
      failures.push(failure("EVIDENCE_BINDING_MISMATCH", "evidenceBinding"));
    }
  } else {
    failures.push(failure("AUTHORIZATION_BINDING_INVALID", "approvalBinding.sourceReferences"));
  }
  if (gate.gateStatus !== "APPROVED_WITH_LIMITATIONS") {
    failures.push(failure("AUTHORIZATION_BINDING_INVALID", "approvalBinding.approvalGateStatus"));
  }
  if (gate.authorization.authorizationStatus !== "AUTHORIZED_WITH_LIMITATIONS") {
    failures.push(failure("AUTHORIZATION_BINDING_INVALID", "approvalBinding.authorizationStatus"));
  }
  const { scopes, failures: scopeFailures } = normalizeScopes(gate.authorization.grantedScopes);
  failures.push(...scopeFailures);
  if (gate.staleScopes.length > 0 || gate.revokedScopes.length > 0) {
    failures.push(failure("AUTHORIZATION_BINDING_INVALID", "approvalBinding.currentAuthorization"));
  }
  if (isBlank(gate.requestReference.approvalRequestId)) {
    failures.push(failure("AUTHORIZATION_REQUIRED", "approvalBinding.approvalRequestId"));
  }
  failures.push(
    ...assertChecksum(gate.integrityChecksum, "approvalBinding.approvalGateIntegrityChecksum"),
  );
  const approvalBinding =
    failures.some((item) =>
      [
        "AUTHORIZATION_REQUIRED",
        "AUTHORIZATION_SCOPE_MISSING",
        "AUTHORIZATION_BINDING_INVALID",
      ].includes(item.code),
    )
      ? undefined
      : {
          approvalRequestId: gate.requestReference.approvalRequestId!,
          approvalGateIntegrityChecksum: gate.integrityChecksum,
          approvalGateStatus: "APPROVED_WITH_LIMITATIONS" as const,
          authorizationStatus: "AUTHORIZED_WITH_LIMITATIONS" as const,
          grantedScopes: scopes,
        };
  return { packageBinding, evidenceBinding, approvalBinding, failures };
}

function invalidResult(
  failures: RuntimeExecutionRequestFailure[],
): BuildRuntimeExecutionRequestResult {
  const unique = new Map<string, RuntimeExecutionRequestFailure>();
  for (const item of failures) {
    unique.set(
      `${item.code}:${item.target ?? ""}:${item.detailCode ?? ""}:${item.safeReference ?? ""}`,
      item,
    );
  }
  return { status: "INVALID", failures: [...unique.values()] };
}

export function buildRuntimeExecutionRequest(
  input: BuildRuntimeExecutionRequestInput,
): BuildRuntimeExecutionRequestResult {
  try {
    const failures: RuntimeExecutionRequestFailure[] = [];
    if (containsSecretLikeValue(input)) {
      return invalidResult([
        failure("SECRET_SAFETY_ERROR", "runtimeExecutionRequest", "SECRET_LIKE_VALUE"),
      ]);
    }
    if (!supportedExecutionModes.has(input.requestedExecutionMode)) {
      failures.push(failure("RUNTIME_REQUEST_INVALID", "requestedExecutionMode"));
    }
    const bindings = bindingFailures(input.approvalGate);
    failures.push(...bindings.failures);
    const { reference: executionProfileReference, failures: executionProfileFailures } =
      normalizeReference(input.executionProfileReference, "executionProfileReference");
    failures.push(...executionProfileFailures);
    const runtimePolicyResult = input.runtimePolicyReference
      ? normalizeReference(input.runtimePolicyReference, "runtimePolicyReference")
      : { reference: undefined, failures: [] };
    failures.push(...runtimePolicyResult.failures);
    const { actor: requestedBy, failures: actorFailures } = normalizeActor(input.requestedBy);
    failures.push(...actorFailures);
    const { artifacts, failures: artifactFailures } = normalizeArtifacts(
      input.inputArtifactReferences ?? [],
    );
    failures.push(...artifactFailures);
    const { capabilities, failures: capabilityFailures } = normalizeCapabilities(
      input.requestedCapabilityReferences ?? [],
    );
    failures.push(...capabilityFailures);
    const { expirationPolicy, failures: expirationFailures } = normalizeExpirationPolicy(
      input.expirationPolicy,
    );
    failures.push(...expirationFailures);
    const limitations = normalizeLimitations(input.limitations);
    if (
      failures.length > 0 ||
      !bindings.approvalBinding ||
      !executionProfileReference ||
      !requestedBy ||
      !expirationPolicy
    ) {
      return invalidResult(failures.length > 0 ? failures : [failure("CONTRACT_ERROR")]);
    }
    const deterministicCore: RuntimeExecutionRequestDeterministicCore = {
      formatVersion: RUNTIME_EXECUTION_REQUEST_FORMAT_VERSION,
      packageBinding: bindings.packageBinding,
      evidenceBinding: bindings.evidenceBinding,
      approvalBinding: bindings.approvalBinding,
      requestedExecutionMode: input.requestedExecutionMode,
      executionProfileReference,
      ...(runtimePolicyResult.reference
        ? { runtimePolicyReference: runtimePolicyResult.reference }
        : {}),
      requestedBy,
      inputArtifactReferences: artifacts,
      requestedCapabilityReferences: capabilities,
      expirationPolicy,
      limitations,
    };
    const runtimeExecutionRequestId = hash({
      formatVersion: deterministicCore.formatVersion,
      packageBinding: deterministicCore.packageBinding,
      evidenceBinding: deterministicCore.evidenceBinding,
      approvalBinding: deterministicCore.approvalBinding,
      requestedExecutionMode: deterministicCore.requestedExecutionMode,
      executionProfileReference: deterministicCore.executionProfileReference,
      runtimePolicyReference: deterministicCore.runtimePolicyReference ?? null,
      requestedBy: deterministicCore.requestedBy,
      inputArtifactReferences: deterministicCore.inputArtifactReferences,
      requestedCapabilityReferences: deterministicCore.requestedCapabilityReferences,
      expirationPolicy: deterministicCore.expirationPolicy,
    });
    const integrityChecksum = hash(deterministicCore);
    return {
      status: "VALID",
      value: {
        formatVersion: RUNTIME_EXECUTION_REQUEST_FORMAT_VERSION,
        runtimeExecutionRequestId,
        packageBinding: bindings.packageBinding,
        evidenceBinding: bindings.evidenceBinding,
        approvalBinding: bindings.approvalBinding,
        requestedExecutionMode: input.requestedExecutionMode,
        executionProfileReference,
        ...(runtimePolicyResult.reference
          ? { runtimePolicyReference: runtimePolicyResult.reference }
          : {}),
        requestedBy,
        inputArtifactReferences: artifacts,
        requestedCapabilityReferences: capabilities,
        expirationPolicy,
        limitations,
        deterministicCore,
        integrityChecksum,
      },
      failures: [],
    };
  } catch {
    return invalidResult([
      failure(
        "INTERNAL_RUNTIME_EXECUTION_REQUEST_ERROR",
        "runtimeExecutionRequest",
        "INTERNAL_ERROR",
        undefined,
        false,
        false,
      ),
    ]);
  }
}
