import { createHash } from "node:crypto";
import {
  stableSerializeAgentPackage,
  type AgentPackageExportArtifact,
} from "./package-export";
import type {
  PackageEvidenceBundleBuildResult,
  PackageEvidenceBundleStatus,
} from "./package-evidence-bundle";
import type {
  PackageVerificationPipelineResult,
  PackageVerificationPipelineStatus,
} from "./package-verification-pipeline";
import type {
  PackageVerificationReport,
  PackageVerificationStatus,
} from "./package-verification";

export const packageEvidenceReportFormatVersion =
  "buildflow.package-evidence-report.v1" as const;

export const packageEvidenceReportStatuses = [
  "INVALID",
  "INCOMPLETE",
  "VALID_WITH_LIMITATIONS",
  "VALID",
] as const;
export type PackageEvidenceReportStatus =
  (typeof packageEvidenceReportStatuses)[number];

export const packageEvidenceCategories = [
  "STRUCTURAL",
  "EXPORT",
  "VERIFICATION",
  "BUNDLE",
  "PIPELINE",
  "RUNTIME",
  "MCP_INVOCATION",
  "PROVIDER_EXECUTION",
  "INSTALLATION",
  "DEPLOYMENT",
  "MARKETPLACE",
  "APPROVAL",
] as const;
export type PackageEvidenceCategory = (typeof packageEvidenceCategories)[number];

export const packageEvidenceReportFailureCodes = [
  "INTEGRITY_ERROR",
  "CONTRACT_ERROR",
  "REFERENCE_MISSING",
  "EVIDENCE_MISSING",
  "STATUS_CONFLICT",
  "READINESS_CONFLICT",
  "APPROVAL_CONFLICT",
  "SECRET_SAFETY_ERROR",
  "INTERNAL_REPORT_ERROR",
] as const;
export type PackageEvidenceReportFailureCode =
  (typeof packageEvidenceReportFailureCodes)[number];

export type PackageEvidenceReportReference = {
  checksum: string | null;
  reference: string | null;
  formatVersion: string | null;
};

export type PackageEvidenceReportCheckSummary = {
  total: number;
  passed: number;
  failed: number;
  warnings: number;
};

export type PackageEvidenceReportFailure = {
  code: PackageEvidenceReportFailureCode;
  message: string;
  target?: string;
  recoverable: boolean;
  userActionable: boolean;
};

export type PackageEvidenceReportFailureSummary = {
  total: number;
  byCode: Partial<Record<PackageEvidenceReportFailureCode, number>>;
};

export type PackageEvidenceReportEvidenceItem = {
  category: PackageEvidenceCategory;
  required: boolean;
  present: boolean;
  verified: boolean;
  reference: string | null;
  checksum: string | null;
  reasonCode: string;
  limitation: string | null;
};

export type PackageEvidenceReportEvidenceSummary = {
  present: PackageEvidenceReportEvidenceItem[];
  missingRequired: PackageEvidenceReportEvidenceItem[];
  missingOptional: PackageEvidenceReportEvidenceItem[];
  unsupported: PackageEvidenceReportEvidenceItem[];
};

export type PackageEvidenceReportApprovalStatus =
  | "UNKNOWN"
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export type PackageEvidenceReportApproval = {
  required: boolean;
  reference: string | null;
  statusSnapshot: PackageEvidenceReportApprovalStatus;
  informationalOnly: true;
  limitations: string[];
};

export type PackageEvidenceReportReadinessStatus =
  | "READY"
  | "CONDITIONALLY_READY"
  | "NOT_READY"
  | "NOT_VERIFIED"
  | "NOT_APPLICABLE";

export type PackageEvidenceReportReadiness = {
  structuralReadiness: PackageEvidenceReportReadinessStatus;
  runtimeReadiness: PackageEvidenceReportReadinessStatus;
  deploymentReadiness: PackageEvidenceReportReadinessStatus;
  marketplaceReadiness: PackageEvidenceReportReadinessStatus;
  approvalReadiness: PackageEvidenceReportReadinessStatus;
};

export type PackageEvidenceReportAvailability = {
  status: "NOT_VERIFIED" | "NOT_READY" | "CONDITIONALLY_READY" | "READY";
  reasonCodes: string[];
  limitations: string[];
};

export type PackageEvidenceReportHumanReadable = {
  title?: string;
  executiveSummary?: string;
  decisionSummary?: string;
  nextRequiredActions?: string[];
};

export type PackageEvidenceReportSourceReferences = {
  packageArtifact: PackageEvidenceReportReference;
  verificationReport: PackageEvidenceReportReference;
  evidenceBundle: PackageEvidenceReportReference;
  verificationPipeline: PackageEvidenceReportReference;
};

export type PackageEvidenceReportDeterministicCore = {
  formatVersion: typeof packageEvidenceReportFormatVersion;
  reportId: string;
  packageId: string | null;
  packageVersion: string | null;
  sourceReferences: PackageEvidenceReportSourceReferences;
  pipelineStatus: PackageVerificationPipelineStatus;
  reportStatus: PackageEvidenceReportStatus;
  packageReadiness: "CONDITIONALLY_READY";
  checksSummary: PackageEvidenceReportCheckSummary;
  failuresSummary: PackageEvidenceReportFailureSummary;
  warnings: string[];
  limitations: string[];
  evidenceSummary: PackageEvidenceReportEvidenceSummary;
  approval: PackageEvidenceReportApproval;
  readiness: PackageEvidenceReportReadiness;
  deployability: PackageEvidenceReportAvailability;
  marketplaceReadiness: PackageEvidenceReportAvailability;
};

export type PackageEvidenceReport = {
  formatVersion: typeof packageEvidenceReportFormatVersion;
  reportId: string;
  packageId: string | null;
  packageVersion: string | null;
  sourceReferences: PackageEvidenceReportSourceReferences;
  pipelineStatus: PackageVerificationPipelineStatus;
  reportStatus: PackageEvidenceReportStatus;
  packageReadiness: "CONDITIONALLY_READY";
  checksSummary: PackageEvidenceReportCheckSummary;
  failuresSummary: PackageEvidenceReportFailureSummary;
  failures: PackageEvidenceReportFailure[];
  warnings: string[];
  limitations: string[];
  evidenceSummary: PackageEvidenceReportEvidenceSummary;
  approval: PackageEvidenceReportApproval;
  readiness: PackageEvidenceReportReadiness;
  deployability: PackageEvidenceReportAvailability;
  marketplaceReadiness: PackageEvidenceReportAvailability;
  deterministicCore: PackageEvidenceReportDeterministicCore;
  reportIntegrityChecksum: string;
  humanReadable: PackageEvidenceReportHumanReadable;
  metadata: {
    generatedAt?: string;
  };
};

export type PackageEvidenceReportBuildInput = {
  packageArtifact: AgentPackageExportArtifact;
  verificationReport: PackageVerificationReport;
  evidenceBundleResult: PackageEvidenceBundleBuildResult;
  verificationPipeline: PackageVerificationPipelineResult;
  sourceReferences: {
    packageArtifact?: string;
    verificationReport?: string;
    evidenceBundle?: string;
    verificationPipeline?: string;
  };
  approvalReference?: string;
  approvalStatusSnapshot?: PackageEvidenceReportApprovalStatus;
  humanReadable?: PackageEvidenceReportHumanReadable;
  metadata?: PackageEvidenceReport["metadata"];
};

export type PackageEvidenceReportBuildResult = {
  report: PackageEvidenceReport;
  status: PackageEvidenceReportStatus;
  failures: PackageEvidenceReportFailure[];
};

const unverifiedLimitations = [
  "Runtime execution evidence is not present.",
  "Actual MCP Invocation evidence is not present.",
  "Provider execution evidence is not present.",
  "Installation evidence is not present.",
  "Deployment evidence is not present.",
  "Marketplace publish evidence is not present.",
] as const;

const sourceReferenceKeys = [
  "packageArtifact",
  "verificationReport",
  "evidenceBundle",
  "verificationPipeline",
] as const;

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function isPresentReference(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function failure(
  code: PackageEvidenceReportFailureCode,
  message: string,
  target?: string,
  userActionable = true,
): PackageEvidenceReportFailure {
  return {
    code,
    message,
    target,
    recoverable: code !== "INTERNAL_REPORT_ERROR",
    userActionable,
  };
}

function summarizeFailures(failures: PackageEvidenceReportFailure[]) {
  const byCode: PackageEvidenceReportFailureSummary["byCode"] = {};
  for (const item of failures) {
    byCode[item.code] = (byCode[item.code] ?? 0) + 1;
  }
  return {
    total: failures.length,
    byCode,
  };
}

function containsSecretLikeValue(value: unknown): boolean {
  if (typeof value === "string") {
    return (
      /sk-[A-Za-z0-9_-]{20,}/.test(value) ||
      /ghp_[A-Za-z0-9_]{20,}/.test(value) ||
      /github_pat_[A-Za-z0-9_]{20,}/.test(value) ||
      /xox[baprs]-[A-Za-z0-9-]{10,}/.test(value) ||
      /AKIA[0-9A-Z]{16}/.test(value)
    );
  }
  if (Array.isArray(value)) return value.some(containsSecretLikeValue);
  if (value && typeof value === "object") {
    return Object.values(value).some(containsSecretLikeValue);
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
      normalizedKey === "clientsecret" ||
      normalizedKey === "client_secret" ||
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

function pipelineSummaryChecksum(
  pipeline: PackageVerificationPipelineResult,
) {
  return sha256(stableSerializeAgentPackage(pipeline.deterministicSummary));
}

function sourceReferences(
  input: PackageEvidenceReportBuildInput,
): PackageEvidenceReportSourceReferences {
  return {
    packageArtifact: {
      checksum: input.packageArtifact.metadata.checksumSha256,
      reference: input.sourceReferences.packageArtifact ?? null,
      formatVersion: input.packageArtifact.metadata.formatVersion,
    },
    verificationReport: {
      checksum: input.verificationReport.reportIntegrityChecksum,
      reference: input.sourceReferences.verificationReport ?? null,
      formatVersion: input.verificationReport.reportFormatVersion,
    },
    evidenceBundle: {
      checksum: input.evidenceBundleResult.bundle.bundleIntegrityChecksum,
      reference: input.sourceReferences.evidenceBundle ?? null,
      formatVersion: input.evidenceBundleResult.bundle.formatVersion,
    },
    verificationPipeline: {
      checksum: pipelineSummaryChecksum(input.verificationPipeline),
      reference: input.sourceReferences.verificationPipeline ?? null,
      formatVersion: input.verificationPipeline.formatVersion,
    },
  };
}

function buildReportId(input: {
  packageId: string | null;
  packageVersion: string | null;
  sources: PackageEvidenceReportSourceReferences;
}) {
  return sha256(
    stableSerializeAgentPackage({
      packageId: input.packageId,
      packageVersion: input.packageVersion,
      packageArtifactChecksum: input.sources.packageArtifact.checksum,
      verificationReportChecksum: input.sources.verificationReport.checksum,
      evidenceBundleChecksum: input.sources.evidenceBundle.checksum,
      pipelineSummaryChecksum: input.sources.verificationPipeline.checksum,
    }),
  );
}

function sourceReferenceFailures(
  sources: PackageEvidenceReportSourceReferences,
) {
  return sourceReferenceKeys
    .filter((key) => !isPresentReference(sources[key].reference))
    .map((key) =>
      failure(
        "REFERENCE_MISSING",
        `${key} source reference is missing.`,
        `sourceReferences.${key}.reference`,
      ),
    );
}

function sourceConsistencyFailures(input: {
  artifact: AgentPackageExportArtifact;
  report: PackageVerificationReport;
  bundle: PackageEvidenceBundleBuildResult;
  pipeline: PackageVerificationPipelineResult;
}) {
  const failures: PackageEvidenceReportFailure[] = [];
  const packageId = input.artifact.metadata.packageId;
  const packageVersion = input.artifact.metadata.packageVersion;
  if (
    input.report.packageId !== packageId ||
    input.bundle.bundle.packageId !== packageId ||
    input.pipeline.packageId !== packageId
  ) {
    failures.push(
      failure(
        "CONTRACT_ERROR",
        "Package identifier differs across evidence sources.",
        "packageId",
      ),
    );
  }
  if (
    input.report.packageVersion !== packageVersion ||
    input.bundle.bundle.packageVersion !== packageVersion ||
    input.pipeline.packageVersion !== packageVersion
  ) {
    failures.push(
      failure(
        "CONTRACT_ERROR",
        "Package version differs across evidence sources.",
        "packageVersion",
      ),
    );
  }
  if (input.report.artifactChecksum !== input.artifact.metadata.checksumSha256) {
    failures.push(
      failure(
        "INTEGRITY_ERROR",
        "Package artifact checksum differs from verification report.",
        "verificationReport.artifactChecksum",
      ),
    );
  }
  if (
    input.bundle.bundle.packageArtifact.checksum !==
    input.artifact.metadata.checksumSha256
  ) {
    failures.push(
      failure(
        "INTEGRITY_ERROR",
        "Evidence bundle package artifact checksum differs from export artifact.",
        "evidenceBundle.packageArtifact.checksum",
      ),
    );
  }
  if (
    input.bundle.bundle.verificationReport.checksum !==
    input.report.reportIntegrityChecksum
  ) {
    failures.push(
      failure(
        "INTEGRITY_ERROR",
        "Evidence bundle verification checksum differs from verification report.",
        "evidenceBundle.verificationReport.checksum",
      ),
    );
  }
  if (
    input.pipeline.checksums.exportArtifact !==
    input.artifact.metadata.checksumSha256
  ) {
    failures.push(
      failure(
        "INTEGRITY_ERROR",
        "Pipeline export checksum differs from export artifact.",
        "pipeline.checksums.exportArtifact",
      ),
    );
  }
  if (
    input.pipeline.checksums.verificationReport !==
    input.report.reportIntegrityChecksum
  ) {
    failures.push(
      failure(
        "INTEGRITY_ERROR",
        "Pipeline verification checksum differs from verification report.",
        "pipeline.checksums.verificationReport",
      ),
    );
  }
  if (
    input.pipeline.checksums.evidenceBundle !==
    input.bundle.bundle.bundleIntegrityChecksum
  ) {
    failures.push(
      failure(
        "INTEGRITY_ERROR",
        "Pipeline evidence bundle checksum differs from evidence bundle.",
        "pipeline.checksums.evidenceBundle",
      ),
    );
  }
  return failures;
}

function upstreamStatusFailures(input: {
  report: PackageVerificationReport;
  bundle: PackageEvidenceBundleBuildResult;
  pipeline: PackageVerificationPipelineResult;
}) {
  const failures: PackageEvidenceReportFailure[] = [];
  if (input.pipeline.status === "FAILED") {
    failures.push(
      failure(
        "STATUS_CONFLICT",
        "Verification pipeline failed.",
        "verificationPipeline.status",
      ),
    );
  }
  if (input.pipeline.status === "INCOMPLETE") {
    failures.push(
      failure(
        "EVIDENCE_MISSING",
        "Verification pipeline is incomplete.",
        "verificationPipeline.status",
      ),
    );
  }
  if (input.report.overallStatus === "INVALID") {
    failures.push(
      failure(
        "STATUS_CONFLICT",
        "Package verification report is invalid.",
        "verificationReport.overallStatus",
      ),
    );
  }
  if (input.report.overallStatus === "UNVERIFIED") {
    failures.push(
      failure(
        "EVIDENCE_MISSING",
        "Package verification report is unverified.",
        "verificationReport.overallStatus",
      ),
    );
  }
  if (input.bundle.status === "INVALID") {
    failures.push(
      failure("STATUS_CONFLICT", "Evidence bundle is invalid.", "bundle.status"),
    );
  }
  if (input.bundle.status === "INCOMPLETE") {
    failures.push(
      failure("EVIDENCE_MISSING", "Evidence bundle is incomplete.", "bundle.status"),
    );
  }
  return failures;
}

function readiness(
  approval: PackageEvidenceReportApproval,
): PackageEvidenceReportReadiness {
  return {
    structuralReadiness: "CONDITIONALLY_READY",
    runtimeReadiness: "NOT_VERIFIED",
    deploymentReadiness: "NOT_VERIFIED",
    marketplaceReadiness: "NOT_VERIFIED",
    approvalReadiness:
      approval.statusSnapshot === "APPROVED" && approval.reference
        ? "CONDITIONALLY_READY"
        : approval.required
          ? "NOT_READY"
          : "NOT_APPLICABLE",
  };
}

function availability(kind: "DEPLOYMENT" | "MARKETPLACE"): PackageEvidenceReportAvailability {
  const label = kind === "DEPLOYMENT" ? "Deployment" : "Marketplace publish";
  return {
    status: "NOT_VERIFIED",
    reasonCodes: [`${kind}_EVIDENCE_NOT_PRESENT`],
    limitations: [`${label} evidence is not present.`],
  };
}

function evidenceSummary(
  sources: PackageEvidenceReportSourceReferences,
  approval: PackageEvidenceReportApproval,
): PackageEvidenceReportEvidenceSummary {
  const items: PackageEvidenceReportEvidenceItem[] = [
    item("STRUCTURAL", true, true, true, "structural-contract", null, null),
    item(
      "EXPORT",
      true,
      Boolean(sources.packageArtifact.reference),
      Boolean(sources.packageArtifact.reference && sources.packageArtifact.checksum),
      sources.packageArtifact.reference,
      sources.packageArtifact.checksum,
      sources.packageArtifact.reference
        ? null
        : "Package artifact reference is missing.",
    ),
    item(
      "VERIFICATION",
      true,
      Boolean(sources.verificationReport.reference),
      Boolean(sources.verificationReport.reference && sources.verificationReport.checksum),
      sources.verificationReport.reference,
      sources.verificationReport.checksum,
      sources.verificationReport.reference
        ? null
        : "Verification report reference is missing.",
    ),
    item(
      "BUNDLE",
      true,
      Boolean(sources.evidenceBundle.reference),
      Boolean(sources.evidenceBundle.reference && sources.evidenceBundle.checksum),
      sources.evidenceBundle.reference,
      sources.evidenceBundle.checksum,
      sources.evidenceBundle.reference
        ? null
        : "Evidence bundle reference is missing.",
    ),
    item(
      "PIPELINE",
      true,
      Boolean(sources.verificationPipeline.reference),
      Boolean(sources.verificationPipeline.reference && sources.verificationPipeline.checksum),
      sources.verificationPipeline.reference,
      sources.verificationPipeline.checksum,
      sources.verificationPipeline.reference
        ? null
        : "Verification pipeline reference is missing.",
    ),
    item(
      "RUNTIME",
      false,
      false,
      false,
      null,
      null,
      "Runtime execution evidence is not present.",
    ),
    item(
      "MCP_INVOCATION",
      false,
      false,
      false,
      null,
      null,
      "Actual MCP Invocation evidence is not present.",
    ),
    item(
      "PROVIDER_EXECUTION",
      false,
      false,
      false,
      null,
      null,
      "Provider execution evidence is not present.",
    ),
    item(
      "INSTALLATION",
      false,
      false,
      false,
      null,
      null,
      "Installation evidence is not present.",
    ),
    item(
      "DEPLOYMENT",
      false,
      false,
      false,
      null,
      null,
      "Deployment evidence is not present.",
    ),
    item(
      "MARKETPLACE",
      false,
      false,
      false,
      null,
      null,
      "Marketplace publish evidence is not present.",
    ),
    item(
      "APPROVAL",
      approval.required,
      Boolean(approval.reference),
      Boolean(approval.reference && approval.statusSnapshot === "APPROVED"),
      approval.reference,
      null,
      approval.reference ? null : "Approval reference is not present.",
    ),
  ];
  const sorted = [...items].sort(
    (first, second) =>
      packageEvidenceCategories.indexOf(first.category) -
      packageEvidenceCategories.indexOf(second.category),
  );

  return {
    present: sorted.filter((entry) => entry.present),
    missingRequired: sorted.filter((entry) => entry.required && !entry.present),
    missingOptional: sorted.filter(
      (entry) => !entry.required && !entry.present && entry.category !== "MARKETPLACE",
    ),
    unsupported: sorted.filter((entry) => entry.category === "MARKETPLACE"),
  };
}

function item(
  category: PackageEvidenceCategory,
  required: boolean,
  present: boolean,
  verified: boolean,
  reference: string | null,
  checksum: string | null,
  limitation: string | null,
): PackageEvidenceReportEvidenceItem {
  return {
    category,
    required,
    present,
    verified,
    reference,
    checksum,
    reasonCode: present
      ? `${category}_PRESENT`
      : required
        ? `${category}_REQUIRED_EVIDENCE_MISSING`
        : `${category}_EVIDENCE_NOT_PRESENT`,
    limitation,
  };
}

function approval(
  input: PackageEvidenceReportBuildInput,
  report: PackageVerificationReport,
): PackageEvidenceReportApproval {
  const reference = input.approvalReference ?? null;
  const statusSnapshot = input.approvalStatusSnapshot ?? "UNKNOWN";
  return {
    required: report.approvalRequired,
    reference,
    statusSnapshot,
    informationalOnly: true,
    limitations: reference ? [] : ["Approval reference is not present."],
  };
}

function approvalFailures(approval: PackageEvidenceReportApproval) {
  if (approval.statusSnapshot === "APPROVED" && !approval.reference) {
    return [
      failure(
        "APPROVAL_CONFLICT",
        "Approval status snapshot is approved but no approval reference is present.",
        "approval",
      ),
    ];
  }
  return [];
}

function secretFailures(input: PackageEvidenceReportBuildInput) {
  const checkedInput = {
    sourceReferences: input.sourceReferences,
    approvalReference: input.approvalReference,
    approvalStatusSnapshot: input.approvalStatusSnapshot,
    humanReadable: input.humanReadable,
    metadata: input.metadata,
  };
  if (
    containsSecretLikeValue(checkedInput) ||
    containsForbiddenCredentialField(checkedInput)
  ) {
    return [
      failure(
        "SECRET_SAFETY_ERROR",
        "Evidence report input includes a forbidden secret or credential value field.",
        "report",
      ),
    ];
  }
  return [];
}

function decideStatus(
  failures: PackageEvidenceReportFailure[],
  pipelineStatus: PackageVerificationPipelineStatus,
  verificationStatus: PackageVerificationStatus,
  bundleStatus: PackageEvidenceBundleStatus,
): PackageEvidenceReportStatus {
  if (
    failures.some((entry) =>
      [
        "INTEGRITY_ERROR",
        "CONTRACT_ERROR",
        "STATUS_CONFLICT",
        "READINESS_CONFLICT",
        "APPROVAL_CONFLICT",
        "SECRET_SAFETY_ERROR",
        "INTERNAL_REPORT_ERROR",
      ].includes(entry.code),
    )
  ) {
    return "INVALID";
  }
  if (
    pipelineStatus === "FAILED" ||
    verificationStatus === "INVALID" ||
    bundleStatus === "INVALID"
  ) {
    return "INVALID";
  }
  if (
    pipelineStatus === "INCOMPLETE" ||
    verificationStatus === "UNVERIFIED" ||
    bundleStatus === "INCOMPLETE" ||
    failures.some((entry) =>
      ["REFERENCE_MISSING", "EVIDENCE_MISSING"].includes(entry.code),
    )
  ) {
    return "INCOMPLETE";
  }
  return "VALID_WITH_LIMITATIONS";
}

function summaryFromEvidence(
  verificationReport: PackageVerificationReport,
  bundleResult: PackageEvidenceBundleBuildResult,
  pipeline: PackageVerificationPipelineResult,
): PackageEvidenceReportCheckSummary {
  return {
    total:
      verificationReport.checks.length +
      bundleResult.bundle.checksSummary.total +
      pipeline.stages.length,
    passed:
      verificationReport.checks.filter((check) => check.status === "PASS").length +
      bundleResult.bundle.checksSummary.passed +
      pipeline.stages.filter((stage) => stage.success).length,
    failed:
      verificationReport.checks.filter((check) => check.status === "FAIL").length +
      bundleResult.bundle.checksSummary.failed +
      pipeline.stages.filter((stage) => stage.executed && !stage.success).length,
    warnings:
      verificationReport.checks.filter((check) => check.status === "WARNING")
        .length +
      bundleResult.bundle.checksSummary.warnings +
      pipeline.warnings.length,
  };
}

function reportSourceFailures(summary: PackageEvidenceReportEvidenceSummary) {
  const sourceCategories: PackageEvidenceCategory[] = [
    "EXPORT",
    "VERIFICATION",
    "BUNDLE",
    "PIPELINE",
  ];
  return summary.missingRequired
    .filter((entry) => sourceCategories.includes(entry.category))
    .map((entry) =>
      failure(
        "REFERENCE_MISSING",
        `${entry.category} required evidence is missing.`,
        `evidenceSummary.${entry.category}`,
      ),
    );
}

function reportId(input: {
  packageId: string | null;
  packageVersion: string | null;
  sources: PackageEvidenceReportSourceReferences;
}) {
  return buildReportId(input);
}

function humanReadable(input?: PackageEvidenceReportHumanReadable) {
  if (containsSecretLikeValue(input) || containsForbiddenCredentialField(input)) {
    return {};
  }
  const output: PackageEvidenceReportHumanReadable = {};
  const title = input?.title?.trim();
  const executiveSummary = input?.executiveSummary?.trim();
  const decisionSummary = input?.decisionSummary?.trim();
  const nextRequiredActions = input?.nextRequiredActions
    ?.map((action) => action.trim())
    .filter(Boolean);
  if (title) output.title = title;
  if (executiveSummary) output.executiveSummary = executiveSummary;
  if (decisionSummary) output.decisionSummary = decisionSummary;
  if (nextRequiredActions?.length) output.nextRequiredActions = nextRequiredActions;
  return output;
}

export function buildPackageEvidenceReport(
  input: PackageEvidenceReportBuildInput,
): PackageEvidenceReportBuildResult {
  try {
    const sources = sourceReferences(input);
    const packageId = input.packageArtifact.metadata.packageId;
    const packageVersion = input.packageArtifact.metadata.packageVersion;
    const approvalSummary = approval(input, input.verificationReport);
    const readinessSummary = readiness(approvalSummary);
    const deployability = availability("DEPLOYMENT");
    const marketplaceReadiness = availability("MARKETPLACE");
    const evidence = evidenceSummary(sources, approvalSummary);
    const failures = [
      ...sourceReferenceFailures(sources),
      ...sourceConsistencyFailures({
        artifact: input.packageArtifact,
        report: input.verificationReport,
        bundle: input.evidenceBundleResult,
        pipeline: input.verificationPipeline,
      }),
      ...upstreamStatusFailures({
        report: input.verificationReport,
        bundle: input.evidenceBundleResult,
        pipeline: input.verificationPipeline,
      }),
      ...reportSourceFailures(evidence),
      ...approvalFailures(approvalSummary),
      ...secretFailures(input),
    ];
    const warnings = normalizeStrings([
      ...input.verificationReport.warnings,
      ...input.evidenceBundleResult.bundle.warnings,
      ...input.verificationPipeline.warnings,
    ]);
    const limitations = normalizeStrings([
      ...unverifiedLimitations,
      ...input.verificationReport.limitations,
      ...input.evidenceBundleResult.bundle.limitations,
      ...input.verificationPipeline.limitations,
      ...approvalSummary.limitations,
      ...deployability.limitations,
      ...marketplaceReadiness.limitations,
      ...evidence.missingOptional.flatMap((entry) =>
        entry.limitation ? [entry.limitation] : [],
      ),
      ...evidence.unsupported.flatMap((entry) =>
        entry.limitation ? [entry.limitation] : [],
      ),
    ]);
    const status = decideStatus(
      failures,
      input.verificationPipeline.status,
      input.verificationReport.overallStatus,
      input.evidenceBundleResult.status,
    );
    const id = reportId({ packageId, packageVersion, sources });
    const safeHumanReadable = humanReadable(input.humanReadable);
    const checksSummary = summaryFromEvidence(
      input.verificationReport,
      input.evidenceBundleResult,
      input.verificationPipeline,
    );
    const failuresSummary = summarizeFailures(failures);
    const deterministicCore: PackageEvidenceReportDeterministicCore = {
      formatVersion: packageEvidenceReportFormatVersion,
      reportId: id,
      packageId,
      packageVersion,
      sourceReferences: sources,
      pipelineStatus: input.verificationPipeline.status,
      reportStatus: status,
      packageReadiness: "CONDITIONALLY_READY",
      checksSummary,
      failuresSummary,
      warnings,
      limitations,
      evidenceSummary: evidence,
      approval: approvalSummary,
      readiness: readinessSummary,
      deployability,
      marketplaceReadiness,
    };
    const report: PackageEvidenceReport = {
      formatVersion: packageEvidenceReportFormatVersion,
      reportId: id,
      packageId,
      packageVersion,
      sourceReferences: sources,
      pipelineStatus: input.verificationPipeline.status,
      reportStatus: status,
      packageReadiness: "CONDITIONALLY_READY",
      checksSummary,
      failuresSummary,
      failures,
      warnings,
      limitations,
      evidenceSummary: evidence,
      approval: approvalSummary,
      readiness: readinessSummary,
      deployability,
      marketplaceReadiness,
      deterministicCore,
      reportIntegrityChecksum: sha256(stableSerializeAgentPackage(deterministicCore)),
      humanReadable: safeHumanReadable,
      metadata: input.metadata ?? {},
    };

    return { report, status, failures };
  } catch {
    const fallbackSources: PackageEvidenceReportSourceReferences = {
      packageArtifact: { checksum: null, reference: null, formatVersion: null },
      verificationReport: { checksum: null, reference: null, formatVersion: null },
      evidenceBundle: { checksum: null, reference: null, formatVersion: null },
      verificationPipeline: { checksum: null, reference: null, formatVersion: null },
    };
    const failures = [
      failure(
        "INTERNAL_REPORT_ERROR",
        "Evidence report builder could not complete.",
        "report",
        false,
      ),
    ];
    const approvalSummary: PackageEvidenceReportApproval = {
      required: true,
      reference: null,
      statusSnapshot: "UNKNOWN",
      informationalOnly: true,
      limitations: ["Approval reference is not present."],
    };
    const readinessSummary = readiness(approvalSummary);
    const deployability = availability("DEPLOYMENT");
    const marketplaceReadiness = availability("MARKETPLACE");
    const evidence: PackageEvidenceReportEvidenceSummary = {
      present: [],
      missingRequired: [],
      missingOptional: [],
      unsupported: [],
    };
    const id = reportId({
      packageId: null,
      packageVersion: null,
      sources: fallbackSources,
    });
    const failuresSummary = summarizeFailures(failures);
    const deterministicCore: PackageEvidenceReportDeterministicCore = {
      formatVersion: packageEvidenceReportFormatVersion,
      reportId: id,
      packageId: null,
      packageVersion: null,
      sourceReferences: fallbackSources,
      pipelineStatus: "FAILED",
      reportStatus: "INVALID",
      packageReadiness: "CONDITIONALLY_READY",
      checksSummary: { total: 0, passed: 0, failed: 0, warnings: 0 },
      failuresSummary,
      warnings: [],
      limitations: [...unverifiedLimitations],
      evidenceSummary: evidence,
      approval: approvalSummary,
      readiness: readinessSummary,
      deployability,
      marketplaceReadiness,
    };
    const report: PackageEvidenceReport = {
      formatVersion: packageEvidenceReportFormatVersion,
      reportId: id,
      packageId: null,
      packageVersion: null,
      sourceReferences: fallbackSources,
      pipelineStatus: "FAILED",
      reportStatus: "INVALID",
      packageReadiness: "CONDITIONALLY_READY",
      checksSummary: deterministicCore.checksSummary,
      failuresSummary,
      failures,
      warnings: [],
      limitations: deterministicCore.limitations,
      evidenceSummary: evidence,
      approval: approvalSummary,
      readiness: readinessSummary,
      deployability,
      marketplaceReadiness,
      deterministicCore,
      reportIntegrityChecksum: sha256(stableSerializeAgentPackage(deterministicCore)),
      humanReadable: {},
      metadata: {},
    };
    return { report, status: "INVALID", failures };
  }
}
