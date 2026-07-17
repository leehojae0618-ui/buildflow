import { createHash } from "node:crypto";
import {
  stableSerializeAgentPackage,
  type AgentPackageExportArtifact,
} from "./package-export";
import type { PackageVerificationReport } from "./package-verification";

export const packageEvidenceBundleFormatVersion =
  "buildflow.package-evidence-bundle.v1" as const;

export const packageEvidenceBundleStatuses = [
  "INCOMPLETE",
  "VALID",
  "VALID_WITH_LIMITATIONS",
  "INVALID",
] as const;
export type PackageEvidenceBundleStatus =
  (typeof packageEvidenceBundleStatuses)[number];

export const packageEvidenceBundleFailureCodes = [
  "INTEGRITY_ERROR",
  "CONTRACT_ERROR",
  "REFERENCE_MISSING",
  "EVIDENCE_MISSING",
  "SECRET_SAFETY_ERROR",
  "STATUS_CONFLICT",
  "INTERNAL_BUILDER_ERROR",
] as const;
export type PackageEvidenceBundleFailureCode =
  (typeof packageEvidenceBundleFailureCodes)[number];

export type PackageEvidenceReferenceKind =
  | "PACKAGE_EXPORT"
  | "PACKAGE_VERIFICATION"
  | "VALIDATION_GATE"
  | "SECRET_FREE_EXPORT"
  | "PACKAGE_PROFILE_CONTRACT"
  | "MCP_DEPENDENCY_CONTRACT"
  | "APPROVAL_RECORD"
  | "RUNTIME_EVIDENCE"
  | "PROVIDER_EVIDENCE"
  | "MARKETPLACE_EVIDENCE";

export type PackageEvidenceReferenceStatus =
  | "PRESENT"
  | "MISSING"
  | "LIMITED";

export type PackageEvidenceReference = {
  id: string;
  kind: PackageEvidenceReferenceKind;
  required: boolean;
  reference: string;
  checksumSha256?: string;
  status: PackageEvidenceReferenceStatus;
  limitations: string[];
};

export type PackageEvidenceBundleFailure = {
  code: PackageEvidenceBundleFailureCode;
  message: string;
  target?: string;
  recoverable: boolean;
  userActionable: boolean;
};

export type PackageEvidenceBundleChecksSummary = {
  total: number;
  passed: number;
  failed: number;
  warnings: number;
};

export type PackageEvidenceBundleFailuresSummary = {
  total: number;
  byCode: Partial<Record<PackageEvidenceBundleFailureCode, number>>;
};

export type PackageEvidenceBundleDeterministicCore = {
  formatVersion: typeof packageEvidenceBundleFormatVersion;
  bundleId: string;
  packageId: string | null;
  packageVersion: string | null;
  packageArtifactChecksum: string | null;
  verificationReportChecksum: string | null;
  evidenceReferences: PackageEvidenceReference[];
  checksSummary: PackageEvidenceBundleChecksSummary;
  failuresSummary: PackageEvidenceBundleFailuresSummary;
  warnings: string[];
  limitations: string[];
  approvalRequired: boolean;
  approvalReference: string | null;
  status: PackageEvidenceBundleStatus;
};

export type PackageEvidenceBundle = {
  formatVersion: typeof packageEvidenceBundleFormatVersion;
  bundleId: string;
  packageId: string | null;
  packageVersion: string | null;
  packageArtifact: {
    checksum: string | null;
    formatVersion: string | null;
    reference: string | null;
  };
  verificationReport: {
    checksum: string | null;
    formatVersion: string | null;
    reference: string | null;
  };
  evidenceReferences: PackageEvidenceReference[];
  checksSummary: PackageEvidenceBundleChecksSummary;
  failuresSummary: PackageEvidenceBundleFailuresSummary;
  warnings: string[];
  limitations: string[];
  approval: {
    required: boolean;
    reference: string | null;
  };
  status: PackageEvidenceBundleStatus;
  deterministicCore: PackageEvidenceBundleDeterministicCore;
  bundleIntegrityChecksum: string;
  metadata: {
    generatedAt?: string;
  };
};

export type PackageEvidenceBundleBuildInput = {
  packageArtifact: AgentPackageExportArtifact;
  verificationReport: PackageVerificationReport;
  packageArtifactReference?: string;
  verificationReportReference?: string;
  approvalReference?: string;
  metadata?: PackageEvidenceBundle["metadata"];
};

export type PackageEvidenceBundleBuildResult = {
  bundle: PackageEvidenceBundle;
  status: PackageEvidenceBundleStatus;
  failures: PackageEvidenceBundleFailure[];
};

const optionalEvidenceLimitations: string[] = [
  "Runtime execution evidence is not present.",
  "Actual MCP Invocation evidence is not present.",
  "Provider execution evidence is not present.",
  "Installation or deployment evidence is not present.",
  "Marketplace publish evidence is not present.",
] as const;

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function buildBundleId(input: {
  packageId: string | null;
  packageVersion: string | null;
  packageArtifactChecksum: string | null;
  verificationReportChecksum: string | null;
}) {
  return sha256(stableSerializeAgentPackage(input));
}

function isPresentReference(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
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

function normalizeEvidenceReferences(
  references: string[],
): PackageEvidenceReference[] {
  const normalized: PackageEvidenceReference[] = references
    .map((reference) => reference.trim())
    .filter(Boolean)
    .map((reference) => ({
      id: reference,
      kind: inferEvidenceKind(reference),
      required: true,
      reference,
      status: "PRESENT" as const,
      limitations: [],
    }));
  const unique = new Map<string, PackageEvidenceReference>();
  for (const reference of normalized) {
    unique.set(
      `${reference.kind}:${reference.id}:${reference.reference}:${reference.checksumSha256 ?? ""}`,
      reference,
    );
  }
  return [...unique.values()].sort((first, second) =>
    `${first.kind}:${first.id}:${first.reference}`.localeCompare(
      `${second.kind}:${second.id}:${second.reference}`,
    ),
  );
}

function inferEvidenceKind(reference: string): PackageEvidenceReferenceKind {
  if (reference.includes("export.secret-free")) return "SECRET_FREE_EXPORT";
  if (reference.includes("agent.validation")) return "VALIDATION_GATE";
  if (reference.includes("mcp")) return "MCP_DEPENDENCY_CONTRACT";
  if (reference.includes("profile") || reference.includes("contract")) {
    return "PACKAGE_PROFILE_CONTRACT";
  }
  return "PACKAGE_VERIFICATION";
}

function summarizeFailures(failures: PackageEvidenceBundleFailure[]) {
  const byCode: PackageEvidenceBundleFailuresSummary["byCode"] = {};
  for (const failure of failures) {
    byCode[failure.code] = (byCode[failure.code] ?? 0) + 1;
  }
  return {
    total: failures.length,
    byCode,
  };
}

function failure(
  code: PackageEvidenceBundleFailureCode,
  message: string,
  target: string,
  userActionable = true,
): PackageEvidenceBundleFailure {
  return {
    code,
    message,
    target,
    recoverable: code !== "INTERNAL_BUILDER_ERROR",
    userActionable,
  };
}

function decideStatus(
  reportStatus: PackageVerificationReport["overallStatus"],
  failures: PackageEvidenceBundleFailure[],
  limitations: string[],
): PackageEvidenceBundleStatus {
  if (
    failures.some((item) =>
      [
        "INTEGRITY_ERROR",
        "CONTRACT_ERROR",
        "SECRET_SAFETY_ERROR",
        "STATUS_CONFLICT",
        "INTERNAL_BUILDER_ERROR",
      ].includes(item.code),
    )
  ) {
    return "INVALID";
  }
  if (reportStatus === "INVALID") return "INVALID";
  if (
    reportStatus === "UNVERIFIED" ||
    failures.some((item) =>
      ["REFERENCE_MISSING", "EVIDENCE_MISSING"].includes(item.code),
    )
  ) {
    return "INCOMPLETE";
  }
  return limitations.length > 0 ? "VALID_WITH_LIMITATIONS" : "VALID_WITH_LIMITATIONS";
}

export function buildPackageEvidenceBundle(
  input: PackageEvidenceBundleBuildInput,
): PackageEvidenceBundleBuildResult {
  const failures: PackageEvidenceBundleFailure[] = [];
  const warnings: string[] = [];
  const limitations = [...optionalEvidenceLimitations];

  try {
    const artifact = input.packageArtifact;
    const report = input.verificationReport;
    const packageArtifactChecksum = artifact.metadata.checksumSha256;
    const verificationReportChecksum = report.reportIntegrityChecksum;
    const normalizedEvidenceReferences = normalizeEvidenceReferences(
      report.evidenceReferences,
    );

    if (!isPresentReference(input.packageArtifactReference)) {
      failures.push(
        failure(
          "REFERENCE_MISSING",
          "Package artifact reference is missing.",
          "packageArtifact.reference",
        ),
      );
    }
    if (!isPresentReference(input.verificationReportReference)) {
      failures.push(
        failure(
          "REFERENCE_MISSING",
          "Verification report reference is missing.",
          "verificationReport.reference",
        ),
      );
    }
    if (!isPresentReference(packageArtifactChecksum)) {
      failures.push(
        failure(
          "INTEGRITY_ERROR",
          "Package artifact checksum is missing.",
          "packageArtifact.checksum",
        ),
      );
    }
    if (!isPresentReference(verificationReportChecksum)) {
      failures.push(
        failure(
          "INTEGRITY_ERROR",
          "Verification report checksum is missing.",
          "verificationReport.checksum",
        ),
      );
    }
    if (artifact.metadata.packageId !== report.packageId) {
      failures.push(
        failure("CONTRACT_ERROR", "Package identifier mismatch.", "packageId"),
      );
    }
    if (artifact.metadata.packageVersion !== report.packageVersion) {
      failures.push(
        failure("CONTRACT_ERROR", "Package version mismatch.", "packageVersion"),
      );
    }
    if (report.artifactChecksum !== artifact.metadata.checksumSha256) {
      failures.push(
        failure(
          "INTEGRITY_ERROR",
          "Verification report does not reference the package artifact checksum.",
          "verificationReport.artifactChecksum",
        ),
      );
    }
    if (report.overallStatus === "INVALID") {
      failures.push(
        failure(
          "STATUS_CONFLICT",
          "Verification report is invalid and cannot produce a valid bundle.",
          "verificationReport.overallStatus",
        ),
      );
    }
    if (report.overallStatus === "UNVERIFIED") {
      failures.push(
        failure(
          "EVIDENCE_MISSING",
          "Verification report is unverified.",
          "verificationReport.overallStatus",
        ),
      );
    }
    if (report.evidenceReferences.length === 0) {
      failures.push(
        failure(
          "EVIDENCE_MISSING",
          "Verification report does not include required evidence references.",
          "verificationReport.evidenceReferences",
        ),
      );
    }
    if (normalizedEvidenceReferences.length !== report.evidenceReferences.length) {
      warnings.push("Evidence references were normalized or deduplicated.");
    }
    if (report.evidenceReferences.some((reference) => !isPresentReference(reference))) {
      failures.push(
        failure(
          "REFERENCE_MISSING",
          "One or more evidence references are malformed.",
          "evidenceReferences",
        ),
      );
    }
    if (
      containsSecretLikeValue(input) ||
      containsForbiddenCredentialField({
        approvalReference: input.approvalReference,
        metadata: input.metadata,
        evidenceReferences: report.evidenceReferences,
      })
    ) {
      failures.push(
        failure(
          "SECRET_SAFETY_ERROR",
          "Evidence bundle input includes a forbidden secret or credential value field.",
          "bundle",
        ),
      );
    }

    if (!input.approvalReference) {
      limitations.push("Approval reference is not present.");
    }

    const checksSummary = {
      total: report.checks.length,
      passed: report.checks.filter((check) => check.status === "PASS").length,
      failed: report.checks.filter((check) => check.status === "FAIL").length,
      warnings: report.checks.filter((check) => check.status === "WARNING")
        .length,
    };
    const failuresSummary = summarizeFailures(failures);
    const status = decideStatus(report.overallStatus, failures, limitations);
    const bundleId = buildBundleId({
      packageId: artifact.metadata.packageId,
      packageVersion: artifact.metadata.packageVersion,
      packageArtifactChecksum,
      verificationReportChecksum,
    });
    const deterministicCore: PackageEvidenceBundleDeterministicCore = {
      formatVersion: packageEvidenceBundleFormatVersion,
      bundleId,
      packageId: artifact.metadata.packageId,
      packageVersion: artifact.metadata.packageVersion,
      packageArtifactChecksum,
      verificationReportChecksum,
      evidenceReferences: normalizedEvidenceReferences,
      checksSummary,
      failuresSummary,
      warnings,
      limitations,
      approvalRequired: report.approvalRequired,
      approvalReference: input.approvalReference ?? null,
      status,
    };
    const bundle: PackageEvidenceBundle = {
      formatVersion: packageEvidenceBundleFormatVersion,
      bundleId,
      packageId: artifact.metadata.packageId,
      packageVersion: artifact.metadata.packageVersion,
      packageArtifact: {
        checksum: packageArtifactChecksum,
        formatVersion: artifact.metadata.formatVersion,
        reference: input.packageArtifactReference ?? null,
      },
      verificationReport: {
        checksum: verificationReportChecksum,
        formatVersion: report.reportFormatVersion,
        reference: input.verificationReportReference ?? null,
      },
      evidenceReferences: normalizedEvidenceReferences,
      checksSummary,
      failuresSummary,
      warnings,
      limitations,
      approval: {
        required: report.approvalRequired,
        reference: input.approvalReference ?? null,
      },
      status,
      deterministicCore,
      bundleIntegrityChecksum: sha256(stableSerializeAgentPackage(deterministicCore)),
      metadata: input.metadata ?? {},
    };

    return { bundle, status, failures };
  } catch {
    const artifact = input.packageArtifact;
    const report = input.verificationReport;
    failures.push(
      failure(
        "INTERNAL_BUILDER_ERROR",
        "Evidence bundle builder could not complete.",
        "builder",
        false,
      ),
    );
    const checksSummary = { total: 0, passed: 0, failed: 0, warnings: 0 };
    const failuresSummary = summarizeFailures(failures);
    const bundleId = buildBundleId({
      packageId: artifact?.metadata?.packageId ?? null,
      packageVersion: artifact?.metadata?.packageVersion ?? null,
      packageArtifactChecksum: artifact?.metadata?.checksumSha256 ?? null,
      verificationReportChecksum: report?.reportIntegrityChecksum ?? null,
    });
    const deterministicCore: PackageEvidenceBundleDeterministicCore = {
      formatVersion: packageEvidenceBundleFormatVersion,
      bundleId,
      packageId: artifact?.metadata?.packageId ?? null,
      packageVersion: artifact?.metadata?.packageVersion ?? null,
      packageArtifactChecksum: artifact?.metadata?.checksumSha256 ?? null,
      verificationReportChecksum: report?.reportIntegrityChecksum ?? null,
      evidenceReferences: [],
      checksSummary,
      failuresSummary,
      warnings,
      limitations,
      approvalRequired: report?.approvalRequired ?? true,
      approvalReference: input.approvalReference ?? null,
      status: "INVALID",
    };
    return {
      status: "INVALID",
      failures,
      bundle: {
        formatVersion: packageEvidenceBundleFormatVersion,
        bundleId,
        packageId: deterministicCore.packageId,
        packageVersion: deterministicCore.packageVersion,
        packageArtifact: {
          checksum: deterministicCore.packageArtifactChecksum,
          formatVersion: artifact?.metadata?.formatVersion ?? null,
          reference: input.packageArtifactReference ?? null,
        },
        verificationReport: {
          checksum: deterministicCore.verificationReportChecksum,
          formatVersion: report?.reportFormatVersion ?? null,
          reference: input.verificationReportReference ?? null,
        },
        evidenceReferences: [],
        checksSummary,
        failuresSummary,
        warnings,
        limitations,
        approval: {
          required: deterministicCore.approvalRequired,
          reference: input.approvalReference ?? null,
        },
        status: "INVALID",
        deterministicCore,
        bundleIntegrityChecksum: sha256(stableSerializeAgentPackage(deterministicCore)),
        metadata: input.metadata ?? {},
      },
    };
  }
}
