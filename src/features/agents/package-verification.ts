import { createHash } from "node:crypto";
import {
  agentPackageArtifactFormatVersions,
  stableSerializeAgentPackage,
  type AgentPackageExportArtifact,
  type AgentPackageArtifactFormatVersion,
} from "./package-export";
import type {
  AgentPackageProfile,
  AgentPackageReadinessResult,
} from "./package-profile";

export const packageVerificationReportFormatVersion =
  "buildflow.package-verification-report.v1" as const;
export const packageVerifierId = "buildflow.package-verifier" as const;
export const packageVerifierVersion = "1.0.0" as const;

export const packageVerificationStatuses = [
  "UNVERIFIED",
  "INVALID",
  "VERIFIED_WITH_LIMITATIONS",
  "VERIFIED",
] as const;
export type PackageVerificationStatus =
  (typeof packageVerificationStatuses)[number];

export const packageVerificationFailureCodes = [
  "FORMAT_ERROR",
  "INTEGRITY_ERROR",
  "CONTRACT_ERROR",
  "READINESS_ERROR",
  "SECRET_SAFETY_ERROR",
  "EVIDENCE_MISSING",
  "VERSION_UNSUPPORTED",
  "INTERNAL_VERIFIER_ERROR",
] as const;
export type PackageVerificationFailureCode =
  (typeof packageVerificationFailureCodes)[number];

export const packageVerificationCheckStatuses = [
  "PASS",
  "FAIL",
  "WARNING",
  "SKIPPED",
] as const;
export type PackageVerificationCheckStatus =
  (typeof packageVerificationCheckStatuses)[number];

export type PackageVerificationCheckCategory =
  | "FORMAT"
  | "INTEGRITY"
  | "CONTRACT"
  | "READINESS"
  | "SECRET_SAFETY"
  | "CONSISTENCY"
  | "EVIDENCE"
  | "APPROVAL";

export type PackageVerificationApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export type PackageVerificationFailure = {
  code: PackageVerificationFailureCode;
  checkId: string;
  message: string;
  path?: string;
  recoverable: boolean;
  userActionable: boolean;
};

export type PackageVerificationCheckResult = {
  id: string;
  category: PackageVerificationCheckCategory;
  status: PackageVerificationCheckStatus;
  required: boolean;
  message: string;
  evidenceReferences: string[];
  failureCode?: PackageVerificationFailureCode;
  limitations: string[];
};

export type PackageVerificationSecretSafety = {
  status: "PASS" | "FAIL";
  rawSecretDetected: boolean;
  credentialValueDetected: boolean;
  credentialReferencesAllowed: boolean;
};

export type PackageVerificationQualityScoreInputs = {
  requiredChecks: number;
  passedRequiredChecks: number;
  failedRequiredChecks: number;
  warningCount: number;
  limitationCount: number;
  missingEvidenceCount: number;
  contractConsistent: boolean;
  secretSafe: boolean;
};

export type PackageVerificationDeterministicCore = {
  reportFormatVersion: typeof packageVerificationReportFormatVersion;
  verifierVersion: typeof packageVerifierVersion;
  packageId: string | null;
  packageVersion: string | null;
  artifactFormatVersion: string | null;
  artifactChecksum: string | null;
  artifactByteLength: number | null;
  overallStatus: PackageVerificationStatus;
  executedChecks: string[];
  passedChecks: string[];
  failedChecks: string[];
  warnings: string[];
  limitations: string[];
  evidenceReferences: string[];
  secretSafety: PackageVerificationSecretSafety;
  approvalRequired: boolean;
  approvalStatus: "PENDING";
  failureClassifications: PackageVerificationFailureCode[];
  qualityScoreInputs: PackageVerificationQualityScoreInputs;
};

export type PackageVerificationReport = {
  reportFormatVersion: typeof packageVerificationReportFormatVersion;
  packageId: string | null;
  packageVersion: string | null;
  artifactFormatVersion: string | null;
  artifactChecksum: string | null;
  verifierId: typeof packageVerifierId;
  verifierVersion: typeof packageVerifierVersion;
  overallStatus: PackageVerificationStatus;
  deterministicCore: PackageVerificationDeterministicCore;
  checks: PackageVerificationCheckResult[];
  failures: PackageVerificationFailure[];
  warnings: string[];
  limitations: string[];
  evidenceReferences: string[];
  secretSafety: PackageVerificationSecretSafety;
  approvalRequired: boolean;
  approvalStatus: "PENDING";
  reportIntegrityChecksum: string;
  metadata: {
    generatedAt?: string;
  };
};

type ParsedArtifactPayload = {
  formatVersion?: unknown;
  profile?: unknown;
  readiness?: unknown;
};

const expectedContentType =
  "application/vnd.buildflow.agent-package-profile+json";

const standardLimitations = [
  "Runtime execution has not been verified.",
  "Actual MCP Tool Invocation has not been verified.",
  "Provider execution has not been verified.",
  "Installation and deployment have not been verified.",
  "Marketplace publish readiness has not been verified.",
] as const;

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isProfile(value: unknown): value is AgentPackageProfile {
  if (!isObject(value)) return false;
  const profile = value as Partial<AgentPackageProfile>;
  const agent = profile.agent as Partial<AgentPackageProfile["agent"]> | undefined;
  const dependencies = profile.dependencies as
    | Partial<AgentPackageProfile["dependencies"]>
    | undefined;
  const exportSafety = profile.exportSafety as
    | Partial<AgentPackageProfile["exportSafety"]>
    | undefined;
  return (
    typeof profile.packageId === "string" &&
    typeof profile.packageVersion === "string" &&
    typeof profile.buildflowVersion === "string" &&
    profile.format === "BPS_AI_AGENT_PROFILE" &&
    isObject(agent) &&
    typeof agent.id === "string" &&
    typeof agent.blueprintId === "string" &&
    typeof agent.blueprintVersion === "string" &&
    typeof agent.name === "string" &&
    typeof agent.deliveryMode === "string" &&
    Array.isArray(agent.interfaceModes) &&
    Array.isArray(agent.capabilities) &&
    isObject(dependencies) &&
    Array.isArray(dependencies.providers) &&
    Array.isArray(dependencies.mcp) &&
    Array.isArray(profile.credentials) &&
    Array.isArray(profile.permissions) &&
    Array.isArray(profile.verificationRules) &&
    profile.verificationRules.every(
      (rule) => isObject(rule) && typeof rule.id === "string",
    ) &&
    isObject(profile.fallbackPolicy) &&
    isObject(exportSafety) &&
    exportSafety.secretFree === true &&
    typeof exportSafety.rawProviderResponsesIncluded === "boolean" &&
    typeof exportSafety.liveCredentialValuesIncluded === "boolean" &&
    typeof exportSafety.archiveWritten === "boolean" &&
    typeof exportSafety.marketplacePublished === "boolean"
  );
}

function isReadiness(value: unknown): value is AgentPackageReadinessResult {
  if (!isObject(value)) return false;
  const readiness = value as Partial<AgentPackageReadinessResult>;
  return (
    (readiness.status === "READY" || readiness.status === "BLOCKED") &&
    typeof readiness.exportReady === "boolean" &&
    Array.isArray(readiness.issues) &&
    Array.isArray(readiness.safeDetails)
  );
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

function addCheck(
  checks: PackageVerificationCheckResult[],
  failures: PackageVerificationFailure[],
  check: PackageVerificationCheckResult,
  failure?: Omit<PackageVerificationFailure, "checkId" | "code"> & {
    code: PackageVerificationFailureCode;
  },
) {
  checks.push(check);
  if (check.status === "FAIL" && failure) {
    failures.push({
      code: failure.code,
      checkId: check.id,
      message: failure.message,
      path: failure.path,
      recoverable: failure.recoverable,
      userActionable: failure.userActionable,
    });
  }
}

function evidence(id: string) {
  return [`evidence:${id}`];
}

function buildReport(input: {
  artifact: AgentPackageExportArtifact;
  parsed?: ParsedArtifactPayload;
  checks: PackageVerificationCheckResult[];
  failures: PackageVerificationFailure[];
  metadata?: PackageVerificationReport["metadata"];
}): PackageVerificationReport {
  const profile = isProfile(input.parsed?.profile) ? input.parsed.profile : undefined;
  const warnings = input.checks
    .filter((check) => check.status === "WARNING")
    .map((check) => check.message);
  const limitations = [
    ...standardLimitations,
    ...input.checks.flatMap((check) => check.limitations),
  ];
  const uniqueLimitations = [...new Set(limitations)];
  const evidenceReferences = [
    ...new Set(input.checks.flatMap((check) => check.evidenceReferences)),
  ];
  const requiredChecks = input.checks.filter((check) => check.required);
  const failedRequiredChecks = requiredChecks.filter(
    (check) => check.status === "FAIL",
  );
  const secretFailure = input.failures.some(
    (failure) => failure.code === "SECRET_SAFETY_ERROR",
  );
  const overallStatus: PackageVerificationStatus =
    input.failures.length > 0 ? "INVALID" : "VERIFIED_WITH_LIMITATIONS";
  const secretSafety: PackageVerificationSecretSafety = {
    status: secretFailure ? "FAIL" : "PASS",
    rawSecretDetected: secretFailure,
    credentialValueDetected: secretFailure,
    credentialReferencesAllowed: !secretFailure,
  };
  const deterministicCore: PackageVerificationDeterministicCore = {
    reportFormatVersion: packageVerificationReportFormatVersion,
    verifierVersion: packageVerifierVersion,
    packageId: profile?.packageId ?? input.artifact.metadata.packageId ?? null,
    packageVersion:
      profile?.packageVersion ?? input.artifact.metadata.packageVersion ?? null,
    artifactFormatVersion: input.artifact.metadata.formatVersion ?? null,
    artifactChecksum: input.artifact.metadata.checksumSha256 ?? null,
    artifactByteLength: input.artifact.metadata.byteLength ?? null,
    overallStatus,
    executedChecks: input.checks.map((check) => check.id),
    passedChecks: input.checks
      .filter((check) => check.status === "PASS")
      .map((check) => check.id),
    failedChecks: input.checks
      .filter((check) => check.status === "FAIL")
      .map((check) => check.id),
    warnings,
    limitations: uniqueLimitations,
    evidenceReferences,
    secretSafety,
    approvalRequired: true,
    approvalStatus: "PENDING",
    failureClassifications: [
      ...new Set(input.failures.map((failure) => failure.code)),
    ],
    qualityScoreInputs: {
      requiredChecks: requiredChecks.length,
      passedRequiredChecks: requiredChecks.filter(
        (check) => check.status === "PASS",
      ).length,
      failedRequiredChecks: failedRequiredChecks.length,
      warningCount: warnings.length,
      limitationCount: uniqueLimitations.length,
      missingEvidenceCount: input.failures.filter(
        (failure) => failure.code === "EVIDENCE_MISSING",
      ).length,
      contractConsistent: !input.failures.some((failure) =>
        ["CONTRACT_ERROR", "READINESS_ERROR"].includes(failure.code),
      ),
      secretSafe: !secretFailure,
    },
  };

  return {
    reportFormatVersion: packageVerificationReportFormatVersion,
    packageId: deterministicCore.packageId,
    packageVersion: deterministicCore.packageVersion,
    artifactFormatVersion: deterministicCore.artifactFormatVersion,
    artifactChecksum: deterministicCore.artifactChecksum,
    verifierId: packageVerifierId,
    verifierVersion: packageVerifierVersion,
    overallStatus,
    deterministicCore,
    checks: input.checks,
    failures: input.failures,
    warnings,
    limitations: uniqueLimitations,
    evidenceReferences,
    secretSafety,
    approvalRequired: true,
    approvalStatus: "PENDING",
    reportIntegrityChecksum: sha256(stableSerializeAgentPackage(deterministicCore)),
    metadata: input.metadata ?? {},
  };
}

function pass(
  id: string,
  category: PackageVerificationCheckCategory,
  message: string,
): PackageVerificationCheckResult {
  return {
    id,
    category,
    status: "PASS",
    required: true,
    message,
    evidenceReferences: evidence(id),
    limitations: [],
  };
}

function fail(
  id: string,
  category: PackageVerificationCheckCategory,
  failureCode: PackageVerificationFailureCode,
  message: string,
): PackageVerificationCheckResult {
  return {
    id,
    category,
    status: "FAIL",
    required: true,
    message,
    evidenceReferences: [],
    failureCode,
    limitations: [],
  };
}

function warning(
  id: string,
  category: PackageVerificationCheckCategory,
  message: string,
  limitations: string[],
): PackageVerificationCheckResult {
  return {
    id,
    category,
    status: "WARNING",
    required: false,
    message,
    evidenceReferences: evidence(id),
    limitations,
  };
}

export function verifyAgentPackageArtifact(
  artifact: AgentPackageExportArtifact,
  options: { generatedAt?: string } = {},
): PackageVerificationReport {
  const checks: PackageVerificationCheckResult[] = [];
  const failures: PackageVerificationFailure[] = [];
  let parsed: ParsedArtifactPayload | undefined;

  try {
    if (!artifact || typeof artifact !== "object" || !artifact.metadata) {
      addCheck(
        checks,
        failures,
        fail(
          "artifact.input",
          "FORMAT",
          "FORMAT_ERROR",
          "Package artifact envelope is missing required metadata.",
        ),
        {
          code: "FORMAT_ERROR",
          message: "Package artifact envelope is missing required metadata.",
          path: "artifact.metadata",
          recoverable: true,
          userActionable: true,
        },
      );
      return buildReport({ artifact, checks, failures, metadata: options });
    }

    const formatSupported = agentPackageArtifactFormatVersions.includes(
      artifact.metadata.formatVersion as AgentPackageArtifactFormatVersion,
    );
    addCheck(
      checks,
      failures,
      formatSupported
        ? pass(
            "artifact.format-version",
            "FORMAT",
            "Artifact format version is supported.",
          )
        : fail(
            "artifact.format-version",
            "FORMAT",
            "VERSION_UNSUPPORTED",
            "Artifact format version is not supported.",
          ),
      formatSupported
        ? undefined
        : {
            code: "VERSION_UNSUPPORTED",
            message: "Artifact format version is not supported.",
            path: "metadata.formatVersion",
            recoverable: true,
            userActionable: true,
          },
    );

    const contentTypeValid = artifact.metadata.contentType === expectedContentType;
    addCheck(
      checks,
      failures,
      contentTypeValid
        ? pass("artifact.content-type", "FORMAT", "Artifact content type is valid.")
        : fail(
            "artifact.content-type",
            "FORMAT",
            "FORMAT_ERROR",
            "Artifact content type is invalid.",
          ),
      contentTypeValid
        ? undefined
        : {
            code: "FORMAT_ERROR",
            message: "Artifact content type is invalid.",
            path: "metadata.contentType",
            recoverable: true,
            userActionable: true,
          },
    );

    const checksum = sha256(artifact.payload);
    const checksumValid = checksum === artifact.metadata.checksumSha256;
    addCheck(
      checks,
      failures,
      checksumValid
        ? pass("artifact.checksum", "INTEGRITY", "Artifact checksum is valid.")
        : fail(
            "artifact.checksum",
            "INTEGRITY",
            "INTEGRITY_ERROR",
            "Artifact checksum does not match payload.",
          ),
      checksumValid
        ? undefined
        : {
            code: "INTEGRITY_ERROR",
            message: "Artifact checksum does not match payload.",
            path: "metadata.checksumSha256",
            recoverable: true,
            userActionable: true,
          },
    );

    const byteLength = Buffer.byteLength(artifact.payload);
    const byteLengthValid = byteLength === artifact.metadata.byteLength;
    addCheck(
      checks,
      failures,
      byteLengthValid
        ? pass("artifact.byte-length", "INTEGRITY", "Artifact byte length is valid.")
        : fail(
            "artifact.byte-length",
            "INTEGRITY",
            "INTEGRITY_ERROR",
            "Artifact byte length does not match payload.",
          ),
      byteLengthValid
        ? undefined
        : {
            code: "INTEGRITY_ERROR",
            message: "Artifact byte length does not match payload.",
            path: "metadata.byteLength",
            recoverable: true,
            userActionable: true,
          },
    );

    try {
      parsed = JSON.parse(artifact.payload) as ParsedArtifactPayload;
      addCheck(
        checks,
        failures,
        pass("artifact.parse", "FORMAT", "Artifact payload is valid JSON."),
      );
    } catch {
      addCheck(
        checks,
        failures,
        fail(
          "artifact.parse",
          "FORMAT",
          "FORMAT_ERROR",
          "Artifact payload is not valid JSON.",
        ),
        {
          code: "FORMAT_ERROR",
          message: "Artifact payload is not valid JSON.",
          path: "payload",
          recoverable: true,
          userActionable: true,
        },
      );
      return buildReport({ artifact, parsed, checks, failures, metadata: options });
    }

    const profile = isProfile(parsed.profile) ? parsed.profile : undefined;
    const readiness = isReadiness(parsed.readiness) ? parsed.readiness : undefined;
    addCheck(
      checks,
      failures,
      profile && readiness
        ? pass(
            "package.contract",
            "CONTRACT",
            "Package profile and readiness contract are valid.",
          )
        : fail(
            "package.contract",
            "CONTRACT",
            "CONTRACT_ERROR",
            "Package profile or readiness contract is invalid.",
          ),
      profile && readiness
        ? undefined
        : {
            code: "CONTRACT_ERROR",
            message: "Package profile or readiness contract is invalid.",
            path: "payload.profile",
            recoverable: true,
            userActionable: true,
          },
    );

    if (profile && readiness) {
      const readinessReady = readiness.status === "READY" && readiness.exportReady;
      addCheck(
        checks,
        failures,
        readinessReady
          ? pass(
              "package.readiness",
              "READINESS",
              "Package readiness metadata is export-ready.",
            )
          : fail(
              "package.readiness",
              "READINESS",
              "READINESS_ERROR",
              "Package readiness metadata is not export-ready.",
            ),
        readinessReady
          ? undefined
          : {
              code: "READINESS_ERROR",
              message: "Package readiness metadata is not export-ready.",
              path: "payload.readiness",
              recoverable: true,
              userActionable: true,
            },
      );

      const secretUnsafe =
        containsSecretLikeValue(profile) ||
        containsForbiddenCredentialField(profile);
      addCheck(
        checks,
        failures,
        secretUnsafe
          ? fail(
              "package.secret-safety",
              "SECRET_SAFETY",
              "SECRET_SAFETY_ERROR",
              "Package profile contains a forbidden secret or credential value field.",
            )
          : pass(
              "package.secret-safety",
              "SECRET_SAFETY",
              "Package profile contains credential references only.",
            ),
        secretUnsafe
          ? {
              code: "SECRET_SAFETY_ERROR",
              message:
                "Package profile contains a forbidden secret or credential value field.",
              path: "payload.profile",
              recoverable: true,
              userActionable: true,
            }
          : undefined,
      );

      const profileMatchesMetadata =
        profile.packageId === artifact.metadata.packageId &&
        profile.packageVersion === artifact.metadata.packageVersion &&
        parsed.formatVersion === artifact.metadata.formatVersion;
      const exportSafetyValid =
        profile.exportSafety.secretFree &&
        !profile.exportSafety.rawProviderResponsesIncluded &&
        !profile.exportSafety.liveCredentialValuesIncluded &&
        !profile.exportSafety.archiveWritten &&
        !profile.exportSafety.marketplacePublished;
      addCheck(
        checks,
        failures,
        profileMatchesMetadata && exportSafetyValid
          ? pass(
              "package.cross-contract-consistency",
              "CONSISTENCY",
              "Package metadata, payload, and export safety are consistent.",
            )
          : fail(
              "package.cross-contract-consistency",
              "CONSISTENCY",
              "READINESS_ERROR",
              "Package metadata, payload, or export safety is inconsistent.",
            ),
        profileMatchesMetadata && exportSafetyValid
          ? undefined
          : {
              code: "READINESS_ERROR",
              message:
                "Package metadata, payload, or export safety is inconsistent.",
              path: "payload.profile",
              recoverable: true,
              userActionable: true,
            },
      );

      const rules = new Set(profile.verificationRules.map((rule) => rule.id));
      const requiredEvidence = ["agent.validation-gate", "export.secret-free"];
      if (profile.dependencies.mcp.length > 0) {
        requiredEvidence.push("mcp.dependency-contract");
      }
      const missingEvidence = requiredEvidence.filter((id) => !rules.has(id));
      addCheck(
        checks,
        failures,
        missingEvidence.length === 0
          ? pass(
              "package.evidence",
              "EVIDENCE",
              "Required package evidence references are present.",
            )
          : fail(
              "package.evidence",
              "EVIDENCE",
              "EVIDENCE_MISSING",
              "Required package evidence references are missing.",
            ),
        missingEvidence.length === 0
          ? undefined
          : {
              code: "EVIDENCE_MISSING",
              message: "Required package evidence references are missing.",
              path: "payload.profile.verificationRules",
              recoverable: true,
              userActionable: true,
            },
      );
    }

    checks.push(
      warning(
        "package.limitations",
        "EVIDENCE",
        "Live runtime, MCP, provider, installation, deployment, and Marketplace evidence are not included.",
        [...standardLimitations],
      ),
    );
    checks.push({
      id: "package.approval",
      category: "APPROVAL",
      status: "WARNING",
      required: false,
      message: "Package approval is required outside this verifier.",
      evidenceReferences: evidence("package.approval"),
      limitations: ["Approval status is PENDING and is not equivalent to verification."],
    });

    return buildReport({ artifact, parsed, checks, failures, metadata: options });
  } catch {
    addCheck(
      checks,
      failures,
      fail(
        "verifier.internal",
        "FORMAT",
        "INTERNAL_VERIFIER_ERROR",
        "The package verifier could not complete verification.",
      ),
      {
        code: "INTERNAL_VERIFIER_ERROR",
        message: "The package verifier could not complete verification.",
        path: "verifier",
        recoverable: false,
        userActionable: false,
      },
    );
    return buildReport({ artifact, parsed, checks, failures, metadata: options });
  }
}
