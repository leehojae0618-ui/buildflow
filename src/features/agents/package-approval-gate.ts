import { createHash } from "node:crypto";
import { stableSerializeAgentPackage } from "./package-export";
import type { PackageEvidenceReport } from "./package-evidence-report";

export const packageApprovalRequestFormatVersion =
  "buildflow.package-approval-request.v1" as const;
export const packageApprovalDecisionFormatVersion =
  "buildflow.package-approval-decision.v1" as const;
export const packageApprovalGateFormatVersion =
  "buildflow.package-approval-gate.v1" as const;

export const packageApprovalScopes = [
  "PACKAGE_ACCEPTANCE",
  "RUNTIME_EXECUTION",
  "MCP_INVOCATION",
  "PROVIDER_EXECUTION",
  "INSTALLATION",
  "DEPLOYMENT",
  "MARKETPLACE_PUBLISH",
] as const;
export type PackageApprovalScope = (typeof packageApprovalScopes)[number];

export const packageApprovalRequestV1Scopes = [
  "PACKAGE_ACCEPTANCE",
  "RUNTIME_EXECUTION",
  "DEPLOYMENT",
] as const satisfies readonly PackageApprovalScope[];

export const packageApprovalActorTypes = ["USER", "SERVICE", "SYSTEM"] as const;
export type PackageApprovalActorType = (typeof packageApprovalActorTypes)[number];

export type PackageApprovalActorReference = {
  actorId: string;
  actorType: PackageApprovalActorType;
  roleReference?: string;
  organizationReference?: string;
};

export type PackageApprovalRequestStatus =
  | "DRAFT"
  | "PENDING"
  | "CANCELLED"
  | "EXPIRED"
  | "SUPERSEDED";

export type PackageApprovalDecision =
  | "APPROVE"
  | "REJECT"
  | "REQUEST_CHANGES"
  | "ABSTAIN";

export type PackageApprovalDecisionStatus =
  | "RECORDED"
  | "INVALID"
  | "STALE"
  | "REVOKED"
  | "SUPERSEDED";

export type PackageApprovalReasonCode =
  | "ACCEPTED_RISK"
  | "VERIFIED_SCOPE"
  | "BUSINESS_APPROVAL"
  | "SECURITY_REVIEW_COMPLETE"
  | "CHANGES_REQUIRED"
  | "INSUFFICIENT_EVIDENCE"
  | "POLICY_VIOLATION"
  | "USER_REJECTED"
  | "OTHER";

export type PackageApprovalSourceReference = {
  packageId: string;
  packageVersion: string;
  evidenceReportId: string;
  evidenceReportIntegrityChecksum: string;
  packageArtifactChecksum: string;
  verificationReportChecksum: string;
  evidenceBundleChecksum: string;
  pipelineSummaryChecksum: string;
};

export type PackageApprovalExpirationPolicy =
  | { kind: "NONE" }
  | { kind: "REFERENCE_ONLY"; reference?: string }
  | { kind: "EXPLICIT_TIME"; expiresAt: string };

export type PackageApprovalRequestDeterministicCore = {
  formatVersion: typeof packageApprovalRequestFormatVersion;
  packageId: string;
  packageVersion: string;
  evidenceReportId: string;
  evidenceReportIntegrityChecksum: string;
  requestedScopes: PackageApprovalScope[];
  requestedBy: PackageApprovalActorReference;
  requiredApprover: PackageApprovalActorReference;
  sourceReferences: PackageApprovalSourceReference;
  requestStatus: PackageApprovalRequestStatus;
};

export type PackageApprovalRequest = {
  formatVersion: typeof packageApprovalRequestFormatVersion;
  approvalRequestId: string;
  packageId: string;
  packageVersion: string;
  evidenceReportId: string;
  evidenceReportIntegrityChecksum: string;
  requestedScopes: PackageApprovalScope[];
  requestedBy: PackageApprovalActorReference;
  requiredApprover: PackageApprovalActorReference;
  requestStatus: PackageApprovalRequestStatus;
  reason?: string;
  limitations: string[];
  sourceReferences: PackageApprovalSourceReference;
  expirationPolicy: PackageApprovalExpirationPolicy;
  deterministicCore: PackageApprovalRequestDeterministicCore;
  integrityChecksum: string;
  metadata: Record<string, string>;
};

export type PackageApprovalRequestBuildInput = {
  evidenceReport: PackageEvidenceReport;
  requestedScopes: string[];
  requestedBy: PackageApprovalActorReference;
  requiredApprover: PackageApprovalActorReference;
  requestStatus?: PackageApprovalRequestStatus;
  reason?: string;
  limitations?: string[];
  expirationPolicy?: PackageApprovalExpirationPolicy;
  metadata?: Record<string, string>;
};

export type PackageApprovalRequestBuildResult =
  | {
      status: "VALID";
      request: PackageApprovalRequest;
      failures: [];
      warnings: string[];
    }
  | {
      status: "INVALID";
      failures: PackageApprovalGateFailure[];
      warnings: string[];
    };

export type PackageApprovalDecisionDeterministicCore = {
  formatVersion: typeof packageApprovalDecisionFormatVersion;
  approvalRequestId: string;
  packageId: string;
  packageVersion: string;
  evidenceReportId: string;
  scope: PackageApprovalScope;
  actorReference: PackageApprovalActorReference;
  decision: PackageApprovalDecision;
  reasonCode: PackageApprovalReasonCode;
  decisionStatus: PackageApprovalDecisionStatus;
  sourceReferences: PackageApprovalSourceReference;
};

export type PackageApprovalRecord = {
  formatVersion: typeof packageApprovalDecisionFormatVersion;
  approvalDecisionId: string;
  approvalRequestId: string;
  packageId: string;
  packageVersion: string;
  evidenceReportId: string;
  scope: PackageApprovalScope;
  actorReference: PackageApprovalActorReference;
  decision: PackageApprovalDecision;
  reasonCode: PackageApprovalReasonCode;
  comment?: string;
  decisionStatus: PackageApprovalDecisionStatus;
  sourceReferences: PackageApprovalSourceReference;
  deterministicCore: PackageApprovalDecisionDeterministicCore;
  integrityChecksum: string;
  metadata: Record<string, string>;
};

export type PackageApprovalDecisionBuildInput = {
  request: PackageApprovalRequest;
  scope: string;
  actorReference: PackageApprovalActorReference;
  decision: PackageApprovalDecision;
  reasonCode: PackageApprovalReasonCode;
  comment?: string;
  decisionStatus?: PackageApprovalDecisionStatus;
  sourceReferences?: PackageApprovalSourceReference;
  metadata?: Record<string, string>;
};

export type PackageApprovalDecisionBuildResult =
  | {
      status: "RECORDED";
      record: PackageApprovalRecord;
      failures: [];
      warnings: string[];
    }
  | {
      status: "STALE";
      record: PackageApprovalRecord;
      failures: PackageApprovalGateFailure[];
      warnings: string[];
    }
  | {
      status: "INVALID";
      failures: PackageApprovalGateFailure[];
      warnings: string[];
    };

export type PackageApprovalGateStatus =
  | "BLOCKED"
  | "PENDING_APPROVAL"
  | "APPROVED_WITH_LIMITATIONS"
  | "APPROVED"
  | "REJECTED"
  | "STALE"
  | "INVALID";

export type PackageApprovalAuthorizationStatus =
  | "NOT_AUTHORIZED"
  | "PENDING"
  | "AUTHORIZED_WITH_LIMITATIONS"
  | "AUTHORIZED"
  | "REVOKED"
  | "STALE";

export type PackageApprovalGateFailureCode =
  | "REQUEST_MISSING"
  | "DECISION_MISSING"
  | "REPORT_INVALID"
  | "REPORT_INCOMPLETE"
  | "SOURCE_CONFLICT"
  | "CHECKSUM_CONFLICT"
  | "SCOPE_MISMATCH"
  | "APPROVER_MISMATCH"
  | "DECISION_REJECTED"
  | "DECISION_CONFLICT"
  | "APPROVAL_EXPIRED"
  | "APPROVAL_STALE"
  | "REQUEST_SUPERSEDED"
  | "DECISION_REVOKED"
  | "UNSUPPORTED_SCOPE"
  | "SECRET_SAFETY_ERROR"
  | "CONTRACT_ERROR"
  | "INTERNAL_APPROVAL_ERROR";

export type PackageApprovalGateFailure = {
  code: PackageApprovalGateFailureCode;
  message: string;
  target?: string;
  scope?: PackageApprovalScope;
  recoverable: boolean;
  userActionable: boolean;
};

export type PackageApprovalGateLimitation = {
  code:
    | "PACKAGE_CONDITIONALLY_READY"
    | "RUNTIME_NOT_EXECUTED"
    | "MCP_NOT_INVOKED"
    | "PROVIDER_NOT_EXECUTED"
    | "DEPLOYMENT_NOT_EXECUTED"
    | "MARKETPLACE_NOT_PUBLISHED";
  message: string;
};

export type PackageApprovalAuthorizationSummary = {
  authorizationStatus: PackageApprovalAuthorizationStatus;
  requestedScopes: PackageApprovalScope[];
  grantedScopes: PackageApprovalScope[];
  deniedScopes: PackageApprovalScope[];
  pendingScopes: PackageApprovalScope[];
  staleScopes: PackageApprovalScope[];
  revokedScopes: PackageApprovalScope[];
  reasonCodes: PackageApprovalReasonCode[];
  limitations: PackageApprovalGateLimitation[];
  sourceApprovalReferences: string[];
};

export type PackageApprovalGateDeterministicCore = {
  formatVersion: typeof packageApprovalGateFormatVersion;
  packageId: string | null;
  packageVersion: string | null;
  evidenceReportId: string | null;
  evidenceReportIntegrityChecksum: string | null;
  sourceReferences: PackageApprovalSourceReference | null;
  approvalRequestId: string | null;
  requestIntegrityChecksum: string | null;
  requestedScopes: PackageApprovalScope[];
  executionScopes: PackageApprovalScope[];
  activeDecisions: {
    id: string;
    checksum: string;
    scope: PackageApprovalScope;
    decision: PackageApprovalDecision;
    reasonCode: PackageApprovalReasonCode;
  }[];
  gateStatus: Exclude<PackageApprovalGateStatus, "APPROVED">;
  authorizationStatus: Exclude<PackageApprovalAuthorizationStatus, "AUTHORIZED">;
  grantedScopes: PackageApprovalScope[];
  deniedScopes: PackageApprovalScope[];
  pendingScopes: PackageApprovalScope[];
  staleScopes: PackageApprovalScope[];
  revokedScopes: PackageApprovalScope[];
  expirationEvaluation: {
    evaluated: boolean;
    status: "NOT_EVALUATED" | "VALID" | "EXPIRED" | "INVALID";
    evaluationTime: string | null;
    expiresAt: string | null;
  };
  failures: PackageApprovalGateFailure[];
  limitations: PackageApprovalGateLimitation[];
  packageReadiness: "CONDITIONALLY_READY";
};

export type PackageApprovalGateResult = {
  formatVersion: typeof packageApprovalGateFormatVersion;
  packageId: string | null;
  packageVersion: string | null;
  evidenceReportReference: {
    reportId: string | null;
    reportIntegrityChecksum: string | null;
    reportStatus: PackageEvidenceReport["reportStatus"] | null;
    packageReadiness: "CONDITIONALLY_READY";
  };
  requestReference: {
    approvalRequestId: string | null;
    integrityChecksum: string | null;
    requestStatus: PackageApprovalRequestStatus | null;
  };
  decisionReferences: {
    approvalDecisionId: string;
    integrityChecksum: string;
    scope: PackageApprovalScope;
    decision: PackageApprovalDecision;
    status: PackageApprovalDecisionStatus;
  }[];
  requestedScopes: PackageApprovalScope[];
  grantedScopes: PackageApprovalScope[];
  deniedScopes: PackageApprovalScope[];
  pendingScopes: PackageApprovalScope[];
  staleScopes: PackageApprovalScope[];
  revokedScopes: PackageApprovalScope[];
  gateStatus: PackageApprovalGateStatus;
  authorization: PackageApprovalAuthorizationSummary;
  failures: PackageApprovalGateFailure[];
  warnings: string[];
  limitations: PackageApprovalGateLimitation[];
  deterministicCore: PackageApprovalGateDeterministicCore;
  integrityChecksum: string;
  metadata: Record<string, string>;
};

export type PackageApprovalGateEvaluationInput = {
  evidenceReport: PackageEvidenceReport;
  request?: PackageApprovalRequest | null;
  decisions: PackageApprovalRecord[];
  requestedExecutionScopes: string[];
  evaluationTime?: string;
  supersedingRequestReference?: string;
  revokedDecisionReferences?: string[];
  metadata?: Record<string, string>;
};

const secretPatterns = [
  /sk-[A-Za-z0-9_-]{20,}/,
  /ghp_[A-Za-z0-9_]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /xox[baprs]-[A-Za-z0-9-]{10,}/,
  /AKIA[0-9A-Z]{16}/,
] as const;

const approvalReasonCodes = new Set<PackageApprovalReasonCode>([
  "ACCEPTED_RISK",
  "VERIFIED_SCOPE",
  "BUSINESS_APPROVAL",
  "SECURITY_REVIEW_COMPLETE",
]);
const rejectionReasonCodes = new Set<PackageApprovalReasonCode>([
  "INSUFFICIENT_EVIDENCE",
  "POLICY_VIOLATION",
  "USER_REJECTED",
]);

const limitationDefaults: PackageApprovalGateLimitation[] = [
  {
    code: "PACKAGE_CONDITIONALLY_READY",
    message: "Package Readiness remains CONDITIONALLY_READY.",
  },
  {
    code: "RUNTIME_NOT_EXECUTED",
    message: "Runtime execution has not been performed by Approval Gate.",
  },
  {
    code: "MCP_NOT_INVOKED",
    message: "Actual MCP Tool Invocation has not been performed by Approval Gate.",
  },
  {
    code: "PROVIDER_NOT_EXECUTED",
    message: "Provider execution has not been performed by Approval Gate.",
  },
  {
    code: "DEPLOYMENT_NOT_EXECUTED",
    message: "Deployment has not been performed by Approval Gate.",
  },
  {
    code: "MARKETPLACE_NOT_PUBLISHED",
    message: "Marketplace publish has not been performed by Approval Gate.",
  },
];

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function hash(value: unknown) {
  return sha256(stableSerializeAgentPackage(value));
}

function isSecretLike(value: unknown): boolean {
  if (typeof value === "string") {
    return secretPatterns.some((pattern) => pattern.test(value));
  }
  if (Array.isArray(value)) return value.some(isSecretLike);
  if (value && typeof value === "object") return Object.values(value).some(isSecretLike);
  return false;
}

function failure(
  code: PackageApprovalGateFailureCode,
  message: string,
  target?: string,
  scope?: PackageApprovalScope,
  recoverable = true,
  userActionable = true,
): PackageApprovalGateFailure {
  return {
    code,
    message,
    ...(target ? { target } : {}),
    ...(scope ? { scope } : {}),
    recoverable,
    userActionable,
  };
}

function safeMetadata(input?: Record<string, string>) {
  if (!input) return {};
  const output: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    const normalizedKey = key.trim();
    const normalizedValue = value.trim();
    if (normalizedKey && normalizedValue) output[normalizedKey] = normalizedValue;
  }
  return output;
}

function normalizeActor(
  actor: PackageApprovalActorReference,
): PackageApprovalActorReference {
  return {
    actorId: actor.actorId.trim(),
    actorType: actor.actorType,
    ...(actor.roleReference?.trim()
      ? { roleReference: actor.roleReference.trim() }
      : {}),
    ...(actor.organizationReference?.trim()
      ? { organizationReference: actor.organizationReference.trim() }
      : {}),
  };
}

function actorEquals(
  first: PackageApprovalActorReference,
  second: PackageApprovalActorReference,
) {
  return stableSerializeAgentPackage(normalizeActor(first)) === stableSerializeAgentPackage(normalizeActor(second));
}

function actorFailures(
  actor: PackageApprovalActorReference,
  target: string,
): PackageApprovalGateFailure[] {
  const failures: PackageApprovalGateFailure[] = [];
  const normalized = normalizeActor(actor);
  if (!normalized.actorId) {
    failures.push(failure("CONTRACT_ERROR", "Actor reference is missing.", target));
  }
  if (!packageApprovalActorTypes.includes(normalized.actorType)) {
    failures.push(failure("CONTRACT_ERROR", "Actor type is unsupported.", target));
  }
  if (isSecretLike(normalized)) {
    failures.push(
      failure("SECRET_SAFETY_ERROR", "Actor reference contains a forbidden value.", target),
    );
  }
  return failures;
}

function normalizeScopes(scopes: string[]) {
  const scopeMap = new Map<string, PackageApprovalScope>();
  const failures: PackageApprovalGateFailure[] = [];
  for (const rawScope of scopes) {
    const normalized = rawScope.trim();
    if (!packageApprovalScopes.includes(normalized as PackageApprovalScope)) {
      failures.push(
        failure("UNSUPPORTED_SCOPE", "Approval scope is not supported.", "scope"),
      );
      continue;
    }
    const scope = normalized as PackageApprovalScope;
    if (!(packageApprovalRequestV1Scopes as readonly PackageApprovalScope[]).includes(scope)) {
      failures.push(
        failure("UNSUPPORTED_SCOPE", "Approval scope is reserved for a future version.", "scope", scope),
      );
      continue;
    }
    scopeMap.set(scope, scope);
  }
  const scopesInOrder = packageApprovalScopes.filter((scope) =>
    scopeMap.has(scope),
  ) as PackageApprovalScope[];
  if (!scopesInOrder.length) {
    failures.push(failure("SCOPE_MISMATCH", "At least one approval scope is required.", "scope"));
  }
  return { scopes: scopesInOrder, failures };
}

function sourceReferenceFromReport(
  report: PackageEvidenceReport,
): PackageApprovalSourceReference {
  return {
    packageId: report.packageId ?? "",
    packageVersion: report.packageVersion ?? "",
    evidenceReportId: report.reportId,
    evidenceReportIntegrityChecksum: report.reportIntegrityChecksum,
    packageArtifactChecksum: report.sourceReferences.packageArtifact.checksum ?? "",
    verificationReportChecksum:
      report.sourceReferences.verificationReport.checksum ?? "",
    evidenceBundleChecksum: report.sourceReferences.evidenceBundle.checksum ?? "",
    pipelineSummaryChecksum:
      report.sourceReferences.verificationPipeline.checksum ?? "",
  };
}

function sourceFailures(
  source: PackageApprovalSourceReference,
): PackageApprovalGateFailure[] {
  const entries = Object.entries(source) as [keyof PackageApprovalSourceReference, string][];
  return entries
    .filter(([, value]) => !value.trim())
    .map(([key]) =>
      failure("CONTRACT_ERROR", "Approval source reference is incomplete.", `sourceReferences.${key}`),
    );
}

function sourcesEqual(
  first: PackageApprovalSourceReference,
  second: PackageApprovalSourceReference,
) {
  return stableSerializeAgentPackage(first) === stableSerializeAgentPackage(second);
}

function reasonConflicts(
  decision: PackageApprovalDecision,
  reasonCode: PackageApprovalReasonCode,
) {
  if (decision === "APPROVE") return !approvalReasonCodes.has(reasonCode);
  if (decision === "REJECT") return !rejectionReasonCodes.has(reasonCode);
  if (decision === "REQUEST_CHANGES") return reasonCode !== "CHANGES_REQUIRED";
  return false;
}

function requestReference(
  request: PackageApprovalRequest | null | undefined,
): PackageApprovalGateResult["requestReference"] {
  return {
    approvalRequestId: request?.approvalRequestId ?? null,
    integrityChecksum: request?.integrityChecksum ?? null,
    requestStatus: request?.requestStatus ?? null,
  };
}

function decisionReferences(decisions: PackageApprovalRecord[]) {
  return decisions
    .map((decision) => ({
      approvalDecisionId: decision.approvalDecisionId,
      integrityChecksum: decision.integrityChecksum,
      scope: decision.scope,
      decision: decision.decision,
      status: decision.decisionStatus,
    }))
    .sort((first, second) =>
      `${first.scope}:${first.approvalDecisionId}`.localeCompare(
        `${second.scope}:${second.approvalDecisionId}`,
      ),
    );
}

function statusFromFailures(
  failures: PackageApprovalGateFailure[],
  hasRejection: boolean,
  hasStale: boolean,
  pendingScopes: PackageApprovalScope[],
) {
  if (
    failures.some((item) =>
      [
        "CONTRACT_ERROR",
        "UNSUPPORTED_SCOPE",
        "SECRET_SAFETY_ERROR",
        "DECISION_CONFLICT",
        "APPROVER_MISMATCH",
        "INTERNAL_APPROVAL_ERROR",
      ].includes(item.code),
    )
  ) {
    return "INVALID" as const;
  }
  if (
    hasStale ||
    failures.some((item) => item.code === "APPROVAL_STALE" || item.code === "REQUEST_SUPERSEDED")
  ) {
    return "STALE" as const;
  }
  if (
    failures.some((item) =>
      [
        "REQUEST_MISSING",
        "REPORT_INVALID",
        "REPORT_INCOMPLETE",
        "SCOPE_MISMATCH",
        "APPROVAL_EXPIRED",
        "REQUEST_SUPERSEDED",
      ].includes(item.code),
    )
  ) {
    return "BLOCKED" as const;
  }
  if (hasRejection) return "REJECTED" as const;
  if (pendingScopes.length) return "PENDING_APPROVAL" as const;
  return "APPROVED_WITH_LIMITATIONS" as const;
}

function authorizationStatus(
  gateStatus: Exclude<PackageApprovalGateStatus, "APPROVED">,
): Exclude<PackageApprovalAuthorizationStatus, "AUTHORIZED"> {
  if (gateStatus === "APPROVED_WITH_LIMITATIONS") {
    return "AUTHORIZED_WITH_LIMITATIONS";
  }
  if (gateStatus === "PENDING_APPROVAL") return "PENDING";
  if (gateStatus === "STALE") return "STALE";
  return "NOT_AUTHORIZED";
}

export function buildPackageApprovalRequest(
  input: PackageApprovalRequestBuildInput,
): PackageApprovalRequestBuildResult {
  const failures: PackageApprovalGateFailure[] = [];
  const sourceReferences = sourceReferenceFromReport(input.evidenceReport);
  const requestedBy = normalizeActor(input.requestedBy);
  const requiredApprover = normalizeActor(input.requiredApprover);
  const { scopes, failures: scopeFailures } = normalizeScopes(input.requestedScopes);
  failures.push(...scopeFailures);
  failures.push(...actorFailures(requestedBy, "requestedBy"));
  failures.push(...actorFailures(requiredApprover, "requiredApprover"));
  failures.push(...sourceFailures(sourceReferences));
  if (
    isSecretLike(input.reason) ||
    isSecretLike(input.limitations) ||
    isSecretLike(input.metadata) ||
    isSecretLike(input.expirationPolicy)
  ) {
    failures.push(
      failure("SECRET_SAFETY_ERROR", "Approval request contains a forbidden value.", "request"),
    );
  }

  const requestStatus = input.requestStatus ?? "PENDING";
  if (!["DRAFT", "PENDING", "CANCELLED", "EXPIRED", "SUPERSEDED"].includes(requestStatus)) {
    failures.push(failure("CONTRACT_ERROR", "Approval request status is unsupported.", "requestStatus"));
  }

  const deterministicCore: PackageApprovalRequestDeterministicCore = {
    formatVersion: packageApprovalRequestFormatVersion,
    packageId: sourceReferences.packageId,
    packageVersion: sourceReferences.packageVersion,
    evidenceReportId: sourceReferences.evidenceReportId,
    evidenceReportIntegrityChecksum:
      sourceReferences.evidenceReportIntegrityChecksum,
    requestedScopes: scopes,
    requestedBy,
    requiredApprover,
    sourceReferences,
    requestStatus,
  };
  const approvalRequestId = hash({
    packageId: deterministicCore.packageId,
    packageVersion: deterministicCore.packageVersion,
    evidenceReportId: deterministicCore.evidenceReportId,
    evidenceReportIntegrityChecksum:
      deterministicCore.evidenceReportIntegrityChecksum,
    requestedScopes: deterministicCore.requestedScopes,
    requestedBy: deterministicCore.requestedBy,
    requiredApprover: deterministicCore.requiredApprover,
    sourceReferences: deterministicCore.sourceReferences,
  });
  const request: PackageApprovalRequest = {
    formatVersion: packageApprovalRequestFormatVersion,
    approvalRequestId,
    packageId: sourceReferences.packageId,
    packageVersion: sourceReferences.packageVersion,
    evidenceReportId: sourceReferences.evidenceReportId,
    evidenceReportIntegrityChecksum:
      sourceReferences.evidenceReportIntegrityChecksum,
    requestedScopes: scopes,
    requestedBy,
    requiredApprover,
    requestStatus,
    ...(input.reason?.trim() ? { reason: input.reason.trim() } : {}),
    limitations: [...new Set((input.limitations ?? []).map((item) => item.trim()).filter(Boolean))].sort(),
    sourceReferences,
    expirationPolicy: input.expirationPolicy ?? { kind: "REFERENCE_ONLY" },
    deterministicCore,
    integrityChecksum: hash(deterministicCore),
    metadata: safeMetadata(input.metadata),
  };

  if (failures.length) return { status: "INVALID", failures, warnings: [] };
  return { status: "VALID", request, failures: [], warnings: [] };
}

export function buildPackageApprovalDecision(
  input: PackageApprovalDecisionBuildInput,
): PackageApprovalDecisionBuildResult {
  const failures: PackageApprovalGateFailure[] = [];
  const actorReference = normalizeActor(input.actorReference);
  const sourceReferences = input.sourceReferences ?? input.request.sourceReferences;
  const scope = input.scope.trim() as PackageApprovalScope;
  if (!packageApprovalScopes.includes(scope)) {
    failures.push(failure("UNSUPPORTED_SCOPE", "Decision scope is not supported.", "scope"));
  }
  if (!input.request.requestedScopes.includes(scope)) {
    failures.push(failure("SCOPE_MISMATCH", "Decision scope is not included in the request.", "scope", scope));
  }
  failures.push(...actorFailures(actorReference, "actorReference"));
  if (!actorEquals(actorReference, input.request.requiredApprover)) {
    failures.push(failure("APPROVER_MISMATCH", "Decision actor does not match required approver.", "actorReference", scope));
  }
  if (input.decision === "APPROVE" && actorReference.actorType !== "USER") {
    failures.push(failure("APPROVER_MISMATCH", "Only USER actors can approve in v1.", "actorReference", scope));
  }
  if (!sourcesEqual(sourceReferences, input.request.sourceReferences)) {
    failures.push(failure("APPROVAL_STALE", "Decision source references differ from request source references.", "sourceReferences", scope));
  }
  if (["CANCELLED", "EXPIRED", "SUPERSEDED"].includes(input.request.requestStatus)) {
    failures.push(failure("REQUEST_SUPERSEDED", "Request status does not allow a recorded approval decision.", "requestStatus", scope));
  }
  if (reasonConflicts(input.decision, input.reasonCode)) {
    failures.push(failure("CONTRACT_ERROR", "Decision and reason code conflict.", "reasonCode", scope));
  }
  if (isSecretLike(input.comment) || isSecretLike(input.metadata) || isSecretLike(actorReference)) {
    failures.push(failure("SECRET_SAFETY_ERROR", "Approval decision contains a forbidden value.", "decision", scope));
  }
  const decisionStatus: PackageApprovalDecisionStatus =
    failures.some((item) => item.code === "APPROVAL_STALE" || item.code === "REQUEST_SUPERSEDED")
      ? "STALE"
      : failures.length
        ? "INVALID"
        : (input.decisionStatus ?? "RECORDED");

  const deterministicCore: PackageApprovalDecisionDeterministicCore = {
    formatVersion: packageApprovalDecisionFormatVersion,
    approvalRequestId: input.request.approvalRequestId,
    packageId: input.request.packageId,
    packageVersion: input.request.packageVersion,
    evidenceReportId: input.request.evidenceReportId,
    scope,
    actorReference,
    decision: input.decision,
    reasonCode: input.reasonCode,
    decisionStatus,
    sourceReferences,
  };
  const approvalDecisionId = hash({
    approvalRequestId: input.request.approvalRequestId,
    actorReference,
    scope,
    decision: input.decision,
    reasonCode: input.reasonCode,
    evidenceReportIntegrityChecksum:
      sourceReferences.evidenceReportIntegrityChecksum,
    sourceReferences,
  });
  const record: PackageApprovalRecord = {
    formatVersion: packageApprovalDecisionFormatVersion,
    approvalDecisionId,
    approvalRequestId: input.request.approvalRequestId,
    packageId: input.request.packageId,
    packageVersion: input.request.packageVersion,
    evidenceReportId: input.request.evidenceReportId,
    scope,
    actorReference,
    decision: input.decision,
    reasonCode: input.reasonCode,
    ...(input.comment?.trim() ? { comment: input.comment.trim() } : {}),
    decisionStatus,
    sourceReferences,
    deterministicCore,
    integrityChecksum: hash(deterministicCore),
    metadata: safeMetadata(input.metadata),
  };
  if (decisionStatus === "INVALID") {
    return { status: "INVALID", failures, warnings: [] };
  }
  if (decisionStatus === "STALE") {
    return { status: "STALE", record, failures, warnings: [] };
  }
  return { status: "RECORDED", record, failures: [], warnings: [] };
}

type DecisionResolution = {
  active: PackageApprovalRecord[];
  grantedScopes: PackageApprovalScope[];
  deniedScopes: PackageApprovalScope[];
  pendingScopes: PackageApprovalScope[];
  staleScopes: PackageApprovalScope[];
  revokedScopes: PackageApprovalScope[];
  failures: PackageApprovalGateFailure[];
};

function resolveDecisions(
  request: PackageApprovalRequest,
  decisions: PackageApprovalRecord[],
  requestedScopes: PackageApprovalScope[],
  revokedDecisionReferences: string[],
): DecisionResolution {
  const deduped = new Map<string, PackageApprovalRecord>();
  for (const decision of decisions) deduped.set(decision.approvalDecisionId, decision);
  const relatedDecisionIds = new Set(
    [...deduped.values()]
      .filter((decision) => decision.approvalRequestId === request.approvalRequestId)
      .map((decision) => decision.approvalDecisionId),
  );
  const normalizedRevokedReferences = [...new Set(revokedDecisionReferences.map((item) => item.trim()).filter(Boolean))].sort();

  const failures: PackageApprovalGateFailure[] = [];
  if (isSecretLike(revokedDecisionReferences)) {
    failures.push(
      failure("SECRET_SAFETY_ERROR", "Revoked decision references contain a forbidden value.", "revokedDecisionReferences"),
    );
  }
  for (const revokedReference of normalizedRevokedReferences) {
    if (!relatedDecisionIds.has(revokedReference)) {
      failures.push(
        failure("CONTRACT_ERROR", "Revoked decision reference does not match a decision for this request.", "revokedDecisionReferences"),
      );
    }
  }
  const activeByScope = new Map<PackageApprovalScope, PackageApprovalRecord[]>();
  const staleScopes = new Set<PackageApprovalScope>();
  const revokedScopes = new Set<PackageApprovalScope>();
  for (const decision of deduped.values()) {
    if (decision.approvalRequestId !== request.approvalRequestId) continue;
    if (!request.requestedScopes.includes(decision.scope)) {
      failures.push(failure("SCOPE_MISMATCH", "Decision scope is not included in the request.", "decision", decision.scope));
      continue;
    }
    if (normalizedRevokedReferences.includes(decision.approvalDecisionId)) {
      revokedScopes.add(decision.scope);
      failures.push(failure("DECISION_REVOKED", "Decision reference was revoked.", "decision", decision.scope));
      continue;
    }
    if (decision.decisionStatus === "REVOKED") {
      revokedScopes.add(decision.scope);
      failures.push(failure("DECISION_REVOKED", "Decision is revoked.", "decision", decision.scope));
      continue;
    }
    if (decision.decisionStatus === "STALE" || !sourcesEqual(decision.sourceReferences, request.sourceReferences)) {
      staleScopes.add(decision.scope);
      failures.push(failure("APPROVAL_STALE", "Decision source does not match request source.", "decision", decision.scope));
      continue;
    }
    if (decision.decisionStatus === "SUPERSEDED") continue;
    if (decision.decisionStatus === "INVALID") {
      failures.push(failure("CONTRACT_ERROR", "Decision is invalid.", "decision", decision.scope));
      continue;
    }
    const current = activeByScope.get(decision.scope) ?? [];
    if (!current.some((item) => item.integrityChecksum === decision.integrityChecksum)) {
      activeByScope.set(decision.scope, [...current, decision]);
    }
  }
  const grantedScopes: PackageApprovalScope[] = [];
  const deniedScopes: PackageApprovalScope[] = [];
  const active: PackageApprovalRecord[] = [];
  for (const scope of requestedScopes) {
    const scoped = activeByScope.get(scope) ?? [];
    if (scoped.length > 1) {
      failures.push(failure("DECISION_CONFLICT", "Multiple active decisions exist for one scope.", "decision", scope));
      active.push(...scoped);
      continue;
    }
    const decision = scoped[0];
    if (!decision) continue;
    active.push(decision);
    if (decision.decision === "APPROVE") grantedScopes.push(scope);
    if (decision.decision === "REJECT" || decision.decision === "REQUEST_CHANGES" || decision.decision === "ABSTAIN") {
      deniedScopes.push(scope);
    }
  }
  const pendingScopes = requestedScopes.filter(
    (scope) =>
      !grantedScopes.includes(scope) &&
      !deniedScopes.includes(scope) &&
      !staleScopes.has(scope),
  );
  return {
    active: active.sort((first, second) =>
      `${first.scope}:${first.approvalDecisionId}`.localeCompare(
        `${second.scope}:${second.approvalDecisionId}`,
      ),
    ),
    grantedScopes: sortScopes(grantedScopes),
    deniedScopes: sortScopes(deniedScopes),
    pendingScopes: sortScopes(pendingScopes),
    staleScopes: sortScopes([...staleScopes]),
    revokedScopes: sortScopes([...revokedScopes]),
    failures,
  };
}

function sortScopes(scopes: PackageApprovalScope[]) {
  const unique = new Set(scopes);
  return packageApprovalScopes.filter((scope) => unique.has(scope)) as PackageApprovalScope[];
}

function expirationEvaluation(
  request: PackageApprovalRequest,
  evaluationTime?: string,
): {
  failures: PackageApprovalGateFailure[];
  evaluation: PackageApprovalGateDeterministicCore["expirationEvaluation"];
} {
  if (request.requestStatus === "EXPIRED") {
    return {
      failures: [failure("APPROVAL_EXPIRED", "Approval request is expired.", "requestStatus")],
      evaluation: {
        evaluated: true,
        status: "EXPIRED",
        evaluationTime: null,
        expiresAt: null,
      },
    };
  }
  if (request.expirationPolicy.kind !== "EXPLICIT_TIME") {
    return {
      failures: [],
      evaluation: {
        evaluated: false,
        status: "NOT_EVALUATED",
        evaluationTime: null,
        expiresAt: null,
      },
    };
  }
  if (!evaluationTime) {
    return {
      failures: [
        failure("CONTRACT_ERROR", "Explicit expiration requires evaluation time.", "evaluationTime"),
      ],
      evaluation: {
        evaluated: false,
        status: "INVALID",
        evaluationTime: null,
        expiresAt: request.expirationPolicy.expiresAt,
      },
    };
  }
  const evaluation = Date.parse(evaluationTime);
  const expiration = Date.parse(request.expirationPolicy.expiresAt);
  if (Number.isNaN(evaluation) || Number.isNaN(expiration)) {
    return {
      failures: [failure("CONTRACT_ERROR", "Approval expiration time is malformed.", "expirationPolicy")],
      evaluation: {
        evaluated: true,
        status: "INVALID",
        evaluationTime,
        expiresAt: request.expirationPolicy.expiresAt,
      },
    };
  }
  const normalizedEvaluationTime = new Date(evaluation).toISOString();
  const normalizedExpiresAt = new Date(expiration).toISOString();
  if (evaluation >= expiration) {
    return {
      failures: [failure("APPROVAL_EXPIRED", "Approval request is expired.", "expirationPolicy")],
      evaluation: {
        evaluated: true,
        status: "EXPIRED",
        evaluationTime: normalizedEvaluationTime,
        expiresAt: normalizedExpiresAt,
      },
    };
  }
  return {
    failures: [],
    evaluation: {
      evaluated: true,
      status: "VALID",
      evaluationTime: normalizedEvaluationTime,
      expiresAt: normalizedExpiresAt,
    },
  };
}

function reportFailures(report: PackageEvidenceReport) {
  if (report.reportStatus === "INVALID") {
    return [failure("REPORT_INVALID", "Evidence Report is invalid.", "evidenceReport")];
  }
  if (report.reportStatus === "INCOMPLETE") {
    return [failure("REPORT_INCOMPLETE", "Evidence Report is incomplete.", "evidenceReport")];
  }
  if (report.reportStatus === "VALID") {
    return [failure("CONTRACT_ERROR", "Evidence Report VALID status is unsupported in v1 Approval Gate.", "evidenceReport")];
  }
  return [];
}

export function evaluatePackageApprovalGate(
  input: PackageApprovalGateEvaluationInput,
): PackageApprovalGateResult {
  try {
    const report = input.evidenceReport;
    const sourceReferences = sourceReferenceFromReport(report);
    const { scopes: executionScopes, failures: executionScopeFailures } =
      normalizeScopes(input.requestedExecutionScopes);
    const failures: PackageApprovalGateFailure[] = [
      ...executionScopeFailures,
      ...reportFailures(report),
    ];
    if (isSecretLike(input.metadata)) {
      failures.push(failure("SECRET_SAFETY_ERROR", "Approval gate metadata contains a forbidden value.", "metadata"));
    }
    if (
      isSecretLike(input.supersedingRequestReference) ||
      isSecretLike(input.revokedDecisionReferences) ||
      isSecretLike(input.evaluationTime)
    ) {
      failures.push(
        failure("SECRET_SAFETY_ERROR", "Approval gate reference input contains a forbidden value.", "approvalGate"),
      );
    }
    const request = input.request ?? null;
    if (!request) {
      failures.push(failure("REQUEST_MISSING", "Approval request is missing.", "request"));
    }

    let requestedScopes: PackageApprovalScope[] = executionScopes;
    let resolution: DecisionResolution = {
      active: [],
      grantedScopes: [],
      deniedScopes: [],
      pendingScopes: executionScopes,
      staleScopes: [],
      revokedScopes: [],
      failures: [],
    };
    if (request) {
      requestedScopes = executionScopes.length ? executionScopes : request.requestedScopes;
      if (!sourcesEqual(sourceReferences, request.sourceReferences)) {
        failures.push(failure("APPROVAL_STALE", "Approval request source does not match Evidence Report.", "sourceReferences"));
      }
      if (request.packageId !== report.packageId || request.packageVersion !== report.packageVersion) {
        failures.push(failure("SOURCE_CONFLICT", "Approval request package identity differs from Evidence Report.", "request"));
      }
      for (const scope of requestedScopes) {
        if (!request.requestedScopes.includes(scope)) {
          failures.push(failure("SCOPE_MISMATCH", "Requested execution scope is not included in the approval request.", "scope", scope));
        }
      }
      if (request.requestStatus === "SUPERSEDED" || input.supersedingRequestReference) {
        if (
          input.supersedingRequestReference &&
          input.supersedingRequestReference !== request.approvalRequestId
        ) {
          failures.push(
            failure(
              "CONTRACT_ERROR",
              "Superseding request reference does not match the current request.",
              "supersedingRequestReference",
            ),
          );
        } else {
          failures.push(failure("REQUEST_SUPERSEDED", "Approval request has been superseded.", "request"));
        }
      }
      if (request.requestStatus === "CANCELLED") {
        failures.push(failure("REQUEST_SUPERSEDED", "Approval request has been cancelled.", "request"));
      }
      const expiration = expirationEvaluation(request, input.evaluationTime);
      failures.push(...expiration.failures);
      resolution = resolveDecisions(
        request,
        input.decisions,
        requestedScopes,
        input.revokedDecisionReferences ?? [],
      );
      failures.push(...resolution.failures);
      for (const scope of resolution.pendingScopes) {
        failures.push(failure("DECISION_MISSING", "Approval decision is missing for scope.", "decision", scope));
      }
    }

    const hasRejection = resolution.deniedScopes.length > 0;
    const hasStale = resolution.staleScopes.length > 0;
    const expiration = request
      ? expirationEvaluation(request, input.evaluationTime).evaluation
      : {
          evaluated: false,
          status: "NOT_EVALUATED" as const,
          evaluationTime: null,
          expiresAt: null,
        };
    const gateStatus = statusFromFailures(
      failures,
      hasRejection,
      hasStale,
      resolution.pendingScopes,
    );
    const authStatus = authorizationStatus(gateStatus);
    const limitations = [...limitationDefaults];
    const reasonCodes = sortReasonCodes(resolution.active.map((decision) => decision.reasonCode));
    const sourceApprovalReferences = resolution.active.map((decision) => decision.approvalDecisionId).sort();
    const authorization: PackageApprovalAuthorizationSummary = {
      authorizationStatus: authStatus,
      requestedScopes,
      grantedScopes: resolution.grantedScopes,
      deniedScopes: resolution.deniedScopes,
      pendingScopes: resolution.pendingScopes,
      staleScopes: resolution.staleScopes,
      revokedScopes: resolution.revokedScopes,
      reasonCodes,
      limitations,
      sourceApprovalReferences,
    };
    const deterministicCore: PackageApprovalGateDeterministicCore = {
      formatVersion: packageApprovalGateFormatVersion,
      packageId: report.packageId,
      packageVersion: report.packageVersion,
      evidenceReportId: report.reportId,
      evidenceReportIntegrityChecksum: report.reportIntegrityChecksum,
      sourceReferences,
      approvalRequestId: request?.approvalRequestId ?? null,
      requestIntegrityChecksum: request?.integrityChecksum ?? null,
      requestedScopes: request?.requestedScopes ?? [],
      executionScopes,
      activeDecisions: resolution.active.map((decision) => ({
        id: decision.approvalDecisionId,
        checksum: decision.integrityChecksum,
        scope: decision.scope,
        decision: decision.decision,
        reasonCode: decision.reasonCode,
      })),
      gateStatus,
      authorizationStatus: authStatus,
      grantedScopes: resolution.grantedScopes,
      deniedScopes: resolution.deniedScopes,
      pendingScopes: resolution.pendingScopes,
      staleScopes: resolution.staleScopes,
      revokedScopes: resolution.revokedScopes,
      expirationEvaluation: expiration,
      failures: normalizeFailures(failures),
      limitations,
      packageReadiness: "CONDITIONALLY_READY",
    };
    return {
      formatVersion: packageApprovalGateFormatVersion,
      packageId: report.packageId,
      packageVersion: report.packageVersion,
      evidenceReportReference: {
        reportId: report.reportId,
        reportIntegrityChecksum: report.reportIntegrityChecksum,
        reportStatus: report.reportStatus,
        packageReadiness: "CONDITIONALLY_READY",
      },
      requestReference: requestReference(request),
      decisionReferences: decisionReferences(input.decisions),
      requestedScopes,
      grantedScopes: resolution.grantedScopes,
      deniedScopes: resolution.deniedScopes,
      pendingScopes: resolution.pendingScopes,
      staleScopes: resolution.staleScopes,
      revokedScopes: resolution.revokedScopes,
      gateStatus,
      authorization,
      failures: normalizeFailures(failures),
      warnings: [],
      limitations,
      deterministicCore,
      integrityChecksum: hash(deterministicCore),
      metadata: safeMetadata(input.metadata),
    };
  } catch {
    const failures = [
      failure(
        "INTERNAL_APPROVAL_ERROR",
        "Approval Gate evaluator could not complete.",
        "approvalGate",
        undefined,
        false,
        false,
      ),
    ];
    const limitations = [...limitationDefaults];
    const deterministicCore: PackageApprovalGateDeterministicCore = {
      formatVersion: packageApprovalGateFormatVersion,
      packageId: null,
      packageVersion: null,
      evidenceReportId: null,
      evidenceReportIntegrityChecksum: null,
      sourceReferences: null,
      approvalRequestId: null,
      requestIntegrityChecksum: null,
      requestedScopes: [],
      executionScopes: [],
      activeDecisions: [],
      gateStatus: "INVALID",
      authorizationStatus: "NOT_AUTHORIZED",
      grantedScopes: [],
      deniedScopes: [],
      pendingScopes: [],
      staleScopes: [],
      revokedScopes: [],
      expirationEvaluation: {
        evaluated: false,
        status: "INVALID",
        evaluationTime: null,
        expiresAt: null,
      },
      failures,
      limitations,
      packageReadiness: "CONDITIONALLY_READY",
    };
    return {
      formatVersion: packageApprovalGateFormatVersion,
      packageId: null,
      packageVersion: null,
      evidenceReportReference: {
        reportId: null,
        reportIntegrityChecksum: null,
        reportStatus: null,
        packageReadiness: "CONDITIONALLY_READY",
      },
      requestReference: requestReference(null),
      decisionReferences: [],
      requestedScopes: [],
      grantedScopes: [],
      deniedScopes: [],
      pendingScopes: [],
      staleScopes: [],
      revokedScopes: [],
      gateStatus: "INVALID",
      authorization: {
        authorizationStatus: "NOT_AUTHORIZED",
        requestedScopes: [],
        grantedScopes: [],
        deniedScopes: [],
        pendingScopes: [],
        staleScopes: [],
        revokedScopes: [],
        reasonCodes: [],
        limitations,
        sourceApprovalReferences: [],
      },
      failures,
      warnings: [],
      limitations,
      deterministicCore,
      integrityChecksum: hash(deterministicCore),
      metadata: {},
    };
  }
}

function sortReasonCodes(codes: PackageApprovalReasonCode[]) {
  return [...new Set(codes)].sort();
}

function normalizeFailures(failures: PackageApprovalGateFailure[]) {
  const unique = new Map<string, PackageApprovalGateFailure>();
  for (const item of failures) {
    unique.set(
      `${item.code}:${item.target ?? ""}:${item.scope ?? ""}:${item.message}`,
      item,
    );
  }
  return [...unique.values()].sort((first, second) =>
    `${first.code}:${first.target ?? ""}:${first.scope ?? ""}`.localeCompare(
      `${second.code}:${second.target ?? ""}:${second.scope ?? ""}`,
    ),
  );
}
