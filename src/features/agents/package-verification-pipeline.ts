import {
  exportAgentPackageArtifact,
  type AgentPackageExportArtifact,
  type AgentPackageExportInput,
} from "./package-export";
import {
  buildPackageEvidenceBundle,
  type PackageEvidenceBundleBuildInput,
  type PackageEvidenceBundleBuildResult,
} from "./package-evidence-bundle";
import {
  verifyAgentPackageArtifact,
  type PackageVerificationReport,
} from "./package-verification";

export const packageVerificationPipelineFormatVersion =
  "buildflow.package-verification-pipeline.v1" as const;

export const packageVerificationPipelineStatuses = [
  "FAILED",
  "INCOMPLETE",
  "COMPLETED_WITH_LIMITATIONS",
  "COMPLETED",
] as const;
export type PackageVerificationPipelineStatus =
  (typeof packageVerificationPipelineStatuses)[number];

export const packageVerificationPipelineStages = [
  "EXPORT",
  "VERIFICATION",
  "EVIDENCE_BUNDLE",
] as const;
export type PackageVerificationPipelineStageName =
  (typeof packageVerificationPipelineStages)[number];

export const packageVerificationPipelineFailureCodes = [
  "EXPORT_FAILED",
  "VERIFICATION_INVALID",
  "VERIFICATION_UNVERIFIED",
  "EVIDENCE_BUNDLE_INVALID",
  "EVIDENCE_BUNDLE_INCOMPLETE",
  "REFERENCE_MISSING",
  "CHECKSUM_CONFLICT",
  "PACKAGE_ID_CONFLICT",
  "PACKAGE_VERSION_CONFLICT",
  "SECRET_SAFETY_ERROR",
  "INTERNAL_PIPELINE_ERROR",
] as const;
export type PackageVerificationPipelineFailureCode =
  (typeof packageVerificationPipelineFailureCodes)[number];

export type PackageVerificationPipelineFailure = {
  code: PackageVerificationPipelineFailureCode;
  stage: PackageVerificationPipelineStageName;
  message: string;
  target?: string;
  recoverable: boolean;
  userActionable: boolean;
};

export type PackageVerificationPipelineStage = {
  stage: PackageVerificationPipelineStageName;
  status: "NOT_EXECUTED" | "FAILED" | "INCOMPLETE" | "COMPLETED_WITH_LIMITATIONS";
  executed: boolean;
  success: boolean;
  failures: PackageVerificationPipelineFailure[];
  warnings: string[];
  limitations: string[];
  checksum: string | null;
  resultReference: string | null;
};

export type PackageVerificationPipelineDeterministicSummary = {
  formatVersion: typeof packageVerificationPipelineFormatVersion;
  packageId: string | null;
  packageVersion: string | null;
  exportChecksum: string | null;
  verificationReportChecksum: string | null;
  evidenceBundleChecksum: string | null;
  stageStatuses: Array<{
    stage: PackageVerificationPipelineStageName;
    status: PackageVerificationPipelineStage["status"];
    executed: boolean;
    success: boolean;
  }>;
  failures: Array<{
    code: PackageVerificationPipelineFailureCode;
    stage: PackageVerificationPipelineStageName;
    target?: string;
  }>;
  limitations: string[];
  overallStatus: PackageVerificationPipelineStatus;
};

export type PackageVerificationPipelineResult = {
  formatVersion: typeof packageVerificationPipelineFormatVersion;
  status: PackageVerificationPipelineStatus;
  packageId: string | null;
  packageVersion: string | null;
  stages: PackageVerificationPipelineStage[];
  failures: PackageVerificationPipelineFailure[];
  warnings: string[];
  limitations: string[];
  checksums: {
    exportArtifact: string | null;
    verificationReport: string | null;
    evidenceBundle: string | null;
  };
  references: {
    packageArtifact: string | null;
    verificationReport: string | null;
    approval: string | null;
  };
  deterministicSummary: PackageVerificationPipelineDeterministicSummary;
};

export type PackageVerificationPipelineInput = AgentPackageExportInput & {
  packageArtifactReference?: string;
  verificationReportReference?: string;
  approvalReference?: string;
  metadata?: {
    generatedAt?: string;
  };
};

type PackageVerificationPipelineDependencies = {
  exportPackageArtifact: typeof exportAgentPackageArtifact;
  verifyPackageArtifact: typeof verifyAgentPackageArtifact;
  buildEvidenceBundle: typeof buildPackageEvidenceBundle;
};

const defaultDependencies: PackageVerificationPipelineDependencies = {
  exportPackageArtifact: exportAgentPackageArtifact,
  verifyPackageArtifact: verifyAgentPackageArtifact,
  buildEvidenceBundle: buildPackageEvidenceBundle,
};

const runtimeLimitations = [
  "Runtime execution evidence is not present.",
  "Actual MCP Invocation evidence is not present.",
  "Provider execution evidence is not present.",
  "Installation or deployment evidence is not present.",
  "Marketplace publish evidence is not present.",
] as const;

function failure(
  code: PackageVerificationPipelineFailureCode,
  stage: PackageVerificationPipelineStageName,
  message: string,
  target?: string,
  userActionable = true,
): PackageVerificationPipelineFailure {
  return {
    code,
    stage,
    message,
    target,
    recoverable: code !== "INTERNAL_PIPELINE_ERROR",
    userActionable,
  };
}

function normalizeLimitations(limitations: string[]) {
  return [...new Set(limitations.map((item) => item.trim()).filter(Boolean))].sort();
}

function exportFailureCode(error: unknown): PackageVerificationPipelineFailureCode {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "SECRET_OR_CREDENTIAL_VALUE_DETECTED"
  ) {
    return "SECRET_SAFETY_ERROR";
  }
  return "EXPORT_FAILED";
}

function safeExportFailureMessage(code: PackageVerificationPipelineFailureCode) {
  if (code === "SECRET_SAFETY_ERROR") {
    return "Package export rejected unsafe secret or credential value input.";
  }
  return "Package export could not complete.";
}

function notExecutedStage(
  stage: PackageVerificationPipelineStageName,
): PackageVerificationPipelineStage {
  return {
    stage,
    status: "NOT_EXECUTED",
    executed: false,
    success: false,
    failures: [],
    warnings: [],
    limitations: [],
    checksum: null,
    resultReference: null,
  };
}

function buildStage(input: {
  stage: PackageVerificationPipelineStageName;
  status: PackageVerificationPipelineStage["status"];
  success: boolean;
  failures?: PackageVerificationPipelineFailure[];
  warnings?: string[];
  limitations?: string[];
  checksum?: string | null;
  resultReference?: string | null;
}): PackageVerificationPipelineStage {
  return {
    stage: input.stage,
    status: input.status,
    executed: true,
    success: input.success,
    failures: input.failures ?? [],
    warnings: input.warnings ?? [],
    limitations: input.limitations ?? [],
    checksum: input.checksum ?? null,
    resultReference: input.resultReference ?? null,
  };
}

function stageStatusFromFailures(
  failures: PackageVerificationPipelineFailure[],
  incompleteCodes: PackageVerificationPipelineFailureCode[],
): PackageVerificationPipelineStage["status"] {
  if (failures.length === 0) return "COMPLETED_WITH_LIMITATIONS";
  if (failures.every((item) => incompleteCodes.includes(item.code))) {
    return "INCOMPLETE";
  }
  return "FAILED";
}

function consistencyFailures(input: {
  artifact: AgentPackageExportArtifact;
  report: PackageVerificationReport;
  bundleResult: PackageEvidenceBundleBuildResult;
}): PackageVerificationPipelineFailure[] {
  const failures: PackageVerificationPipelineFailure[] = [];
  if (input.artifact.metadata.packageId !== input.report.packageId) {
    failures.push(
      failure(
        "PACKAGE_ID_CONFLICT",
        "VERIFICATION",
        "Package identifier differs between export artifact and verification report.",
        "packageId",
      ),
    );
  }
  if (input.artifact.metadata.packageVersion !== input.report.packageVersion) {
    failures.push(
      failure(
        "PACKAGE_VERSION_CONFLICT",
        "VERIFICATION",
        "Package version differs between export artifact and verification report.",
        "packageVersion",
      ),
    );
  }
  if (input.artifact.metadata.checksumSha256 !== input.report.artifactChecksum) {
    failures.push(
      failure(
        "CHECKSUM_CONFLICT",
        "VERIFICATION",
        "Export artifact checksum differs from verification report artifact checksum.",
        "artifactChecksum",
      ),
    );
  }
  if (
    input.report.reportIntegrityChecksum !==
    input.bundleResult.bundle.verificationReport.checksum
  ) {
    failures.push(
      failure(
        "CHECKSUM_CONFLICT",
        "EVIDENCE_BUNDLE",
        "Verification report checksum differs from evidence bundle reference.",
        "verificationReportChecksum",
      ),
    );
  }
  if (
    input.artifact.metadata.checksumSha256 !==
    input.bundleResult.bundle.packageArtifact.checksum
  ) {
    failures.push(
      failure(
        "CHECKSUM_CONFLICT",
        "EVIDENCE_BUNDLE",
        "Export artifact checksum differs from evidence bundle package reference.",
        "packageArtifactChecksum",
      ),
    );
  }
  return failures;
}

function verificationFailures(
  report: PackageVerificationReport,
): PackageVerificationPipelineFailure[] {
  if (report.overallStatus === "INVALID") {
    return [
      failure(
        "VERIFICATION_INVALID",
        "VERIFICATION",
        "Package verification report is invalid.",
        "verificationReport.overallStatus",
      ),
    ];
  }
  if (report.overallStatus === "UNVERIFIED") {
    return [
      failure(
        "VERIFICATION_UNVERIFIED",
        "VERIFICATION",
        "Package verification report is unverified.",
        "verificationReport.overallStatus",
      ),
    ];
  }
  return [];
}

function bundleFailures(
  bundleResult: PackageEvidenceBundleBuildResult,
): PackageVerificationPipelineFailure[] {
  if (bundleResult.status === "INVALID") {
    return [
      failure(
        "EVIDENCE_BUNDLE_INVALID",
        "EVIDENCE_BUNDLE",
        "Evidence bundle is invalid.",
        "evidenceBundle.status",
      ),
    ];
  }
  if (bundleResult.status === "INCOMPLETE") {
    return [
      failure(
        "EVIDENCE_BUNDLE_INCOMPLETE",
        "EVIDENCE_BUNDLE",
        "Evidence bundle is incomplete.",
        "evidenceBundle.status",
      ),
    ];
  }
  return [];
}

function missingReferenceFailures(
  input: PackageVerificationPipelineInput,
): PackageVerificationPipelineFailure[] {
  const failures: PackageVerificationPipelineFailure[] = [];
  if (!input.packageArtifactReference?.trim()) {
    failures.push(
      failure(
        "REFERENCE_MISSING",
        "EVIDENCE_BUNDLE",
        "Package artifact reference is required for the pipeline.",
        "packageArtifactReference",
      ),
    );
  }
  if (!input.verificationReportReference?.trim()) {
    failures.push(
      failure(
        "REFERENCE_MISSING",
        "EVIDENCE_BUNDLE",
        "Verification report reference is required for the pipeline.",
        "verificationReportReference",
      ),
    );
  }
  return failures;
}

function decidePipelineStatus(
  failures: PackageVerificationPipelineFailure[],
  verificationStatus: PackageVerificationReport["overallStatus"] | null,
  bundleStatus: PackageEvidenceBundleBuildResult["status"] | null,
): PackageVerificationPipelineStatus {
  if (
    failures.some((item) =>
      [
        "EXPORT_FAILED",
        "VERIFICATION_INVALID",
        "EVIDENCE_BUNDLE_INVALID",
        "CHECKSUM_CONFLICT",
        "PACKAGE_ID_CONFLICT",
        "PACKAGE_VERSION_CONFLICT",
        "SECRET_SAFETY_ERROR",
        "INTERNAL_PIPELINE_ERROR",
      ].includes(item.code),
    )
  ) {
    return "FAILED";
  }
  if (
    verificationStatus === "UNVERIFIED" ||
    bundleStatus === "INCOMPLETE" ||
    failures.some((item) =>
      ["VERIFICATION_UNVERIFIED", "EVIDENCE_BUNDLE_INCOMPLETE", "REFERENCE_MISSING"].includes(
        item.code,
      ),
    )
  ) {
    return "INCOMPLETE";
  }
  return "COMPLETED_WITH_LIMITATIONS";
}

function deterministicSummary(input: {
  packageId: string | null;
  packageVersion: string | null;
  exportChecksum: string | null;
  verificationReportChecksum: string | null;
  evidenceBundleChecksum: string | null;
  stages: PackageVerificationPipelineStage[];
  failures: PackageVerificationPipelineFailure[];
  limitations: string[];
  status: PackageVerificationPipelineStatus;
}): PackageVerificationPipelineDeterministicSummary {
  return {
    formatVersion: packageVerificationPipelineFormatVersion,
    packageId: input.packageId,
    packageVersion: input.packageVersion,
    exportChecksum: input.exportChecksum,
    verificationReportChecksum: input.verificationReportChecksum,
    evidenceBundleChecksum: input.evidenceBundleChecksum,
    stageStatuses: input.stages.map((stage) => ({
      stage: stage.stage,
      status: stage.status,
      executed: stage.executed,
      success: stage.success,
    })),
    failures: input.failures
      .map((item) => ({
        code: item.code,
        stage: item.stage,
        target: item.target,
      }))
      .sort((first, second) =>
        `${first.stage}:${first.code}:${first.target ?? ""}`.localeCompare(
          `${second.stage}:${second.code}:${second.target ?? ""}`,
        ),
      ),
    limitations: normalizeLimitations(input.limitations),
    overallStatus: input.status,
  };
}

function result(input: {
  status: PackageVerificationPipelineStatus;
  packageId: string | null;
  packageVersion: string | null;
  stages: PackageVerificationPipelineStage[];
  failures: PackageVerificationPipelineFailure[];
  warnings: string[];
  limitations: string[];
  checksums: PackageVerificationPipelineResult["checksums"];
  references: PackageVerificationPipelineResult["references"];
}): PackageVerificationPipelineResult {
  const normalizedLimitations = normalizeLimitations(input.limitations);
  return {
    formatVersion: packageVerificationPipelineFormatVersion,
    status: input.status,
    packageId: input.packageId,
    packageVersion: input.packageVersion,
    stages: input.stages,
    failures: input.failures,
    warnings: [...new Set(input.warnings)].sort(),
    limitations: normalizedLimitations,
    checksums: input.checksums,
    references: input.references,
    deterministicSummary: deterministicSummary({
      packageId: input.packageId,
      packageVersion: input.packageVersion,
      exportChecksum: input.checksums.exportArtifact,
      verificationReportChecksum: input.checksums.verificationReport,
      evidenceBundleChecksum: input.checksums.evidenceBundle,
      stages: input.stages,
      failures: input.failures,
      limitations: normalizedLimitations,
      status: input.status,
    }),
  };
}

export function runPackageVerificationPipeline(
  input: PackageVerificationPipelineInput,
  dependencies: PackageVerificationPipelineDependencies = defaultDependencies,
): PackageVerificationPipelineResult {
  const referenceFailures = missingReferenceFailures(input);
  let artifact: AgentPackageExportArtifact;

  try {
    artifact = dependencies.exportPackageArtifact(input);
  } catch (error) {
    const code = exportFailureCode(error);
    const exportFailure = failure(
      code,
      "EXPORT",
      safeExportFailureMessage(code),
      "packageExport",
    );
    const stages = [
      buildStage({
        stage: "EXPORT",
        status: "FAILED",
        success: false,
        failures: [exportFailure],
      }),
      notExecutedStage("VERIFICATION"),
      notExecutedStage("EVIDENCE_BUNDLE"),
    ];
    return result({
      status: "FAILED",
      packageId: input.profile.packageId || null,
      packageVersion: input.profile.packageVersion || null,
      stages,
      failures: [exportFailure],
      warnings: [],
      limitations: [],
      checksums: {
        exportArtifact: null,
        verificationReport: null,
        evidenceBundle: null,
      },
      references: {
        packageArtifact: input.packageArtifactReference ?? null,
        verificationReport: input.verificationReportReference ?? null,
        approval: input.approvalReference ?? null,
      },
    });
  }

  const exportStage = buildStage({
    stage: "EXPORT",
    status: "COMPLETED_WITH_LIMITATIONS",
    success: true,
    checksum: artifact.metadata.checksumSha256,
    resultReference: input.packageArtifactReference ?? null,
  });

  let verificationReport: PackageVerificationReport;
  try {
    verificationReport = dependencies.verifyPackageArtifact(artifact);
  } catch {
    const verifyFailure = failure(
      "INTERNAL_PIPELINE_ERROR",
      "VERIFICATION",
      "Package verification could not complete.",
      "verification",
      false,
    );
    const stages = [
      exportStage,
      buildStage({
        stage: "VERIFICATION",
        status: "FAILED",
        success: false,
        failures: [verifyFailure],
      }),
      notExecutedStage("EVIDENCE_BUNDLE"),
    ];
    return result({
      status: "FAILED",
      packageId: artifact.metadata.packageId,
      packageVersion: artifact.metadata.packageVersion,
      stages,
      failures: [verifyFailure],
      warnings: [],
      limitations: [],
      checksums: {
        exportArtifact: artifact.metadata.checksumSha256,
        verificationReport: null,
        evidenceBundle: null,
      },
      references: {
        packageArtifact: input.packageArtifactReference ?? null,
        verificationReport: input.verificationReportReference ?? null,
        approval: input.approvalReference ?? null,
      },
    });
  }

  const verificationStageFailures = verificationFailures(verificationReport);
  const verificationStageStatus = stageStatusFromFailures(verificationStageFailures, [
    "VERIFICATION_UNVERIFIED",
  ]);
  const verificationStage = buildStage({
    stage: "VERIFICATION",
    status: verificationStageStatus,
    success: verificationStageFailures.length === 0,
    failures: verificationStageFailures,
    warnings: verificationReport.warnings,
    limitations: verificationReport.limitations,
    checksum: verificationReport.reportIntegrityChecksum,
    resultReference: input.verificationReportReference ?? null,
  });

  if (
    verificationStageFailures.some((item) =>
      ["VERIFICATION_INVALID", "INTERNAL_PIPELINE_ERROR"].includes(item.code),
    )
  ) {
    const failures = [...referenceFailures, ...verificationStageFailures];
    const stages = [exportStage, verificationStage, notExecutedStage("EVIDENCE_BUNDLE")];
    return result({
      status: decidePipelineStatus(
        failures,
        verificationReport.overallStatus,
        null,
      ),
      packageId: artifact.metadata.packageId,
      packageVersion: artifact.metadata.packageVersion,
      stages,
      failures,
      warnings: verificationReport.warnings,
      limitations: verificationReport.limitations,
      checksums: {
        exportArtifact: artifact.metadata.checksumSha256,
        verificationReport: verificationReport.reportIntegrityChecksum,
        evidenceBundle: null,
      },
      references: {
        packageArtifact: input.packageArtifactReference ?? null,
        verificationReport: input.verificationReportReference ?? null,
        approval: input.approvalReference ?? null,
      },
    });
  }

  let bundleResult: PackageEvidenceBundleBuildResult;
  try {
    const bundleInput: PackageEvidenceBundleBuildInput = {
      packageArtifact: artifact,
      verificationReport,
      packageArtifactReference: input.packageArtifactReference,
      verificationReportReference: input.verificationReportReference,
      approvalReference: input.approvalReference,
      metadata: input.metadata,
    };
    bundleResult = dependencies.buildEvidenceBundle(bundleInput);
  } catch {
    const bundleFailure = failure(
      "INTERNAL_PIPELINE_ERROR",
      "EVIDENCE_BUNDLE",
      "Evidence bundle builder could not complete.",
      "evidenceBundle",
      false,
    );
    const stages = [
      exportStage,
      verificationStage,
      buildStage({
        stage: "EVIDENCE_BUNDLE",
        status: "FAILED",
        success: false,
        failures: [bundleFailure],
      }),
    ];
    return result({
      status: "FAILED",
      packageId: artifact.metadata.packageId,
      packageVersion: artifact.metadata.packageVersion,
      stages,
      failures: [bundleFailure],
      warnings: verificationReport.warnings,
      limitations: verificationReport.limitations,
      checksums: {
        exportArtifact: artifact.metadata.checksumSha256,
        verificationReport: verificationReport.reportIntegrityChecksum,
        evidenceBundle: null,
      },
      references: {
        packageArtifact: input.packageArtifactReference ?? null,
        verificationReport: input.verificationReportReference ?? null,
        approval: input.approvalReference ?? null,
      },
    });
  }

  const consistency = consistencyFailures({
    artifact,
    report: verificationReport,
    bundleResult,
  });
  const evidenceBundleFailures = [
    ...referenceFailures,
    ...bundleFailures(bundleResult),
    ...bundleResult.failures
      .filter((item) => item.code === "SECRET_SAFETY_ERROR")
      .map((item) =>
        failure(
          "SECRET_SAFETY_ERROR",
          "EVIDENCE_BUNDLE",
          item.message,
          item.target,
        ),
      ),
    ...consistency,
  ];
  const evidenceBundleStage = buildStage({
    stage: "EVIDENCE_BUNDLE",
    status: stageStatusFromFailures(evidenceBundleFailures, [
      "EVIDENCE_BUNDLE_INCOMPLETE",
      "REFERENCE_MISSING",
    ]),
    success: evidenceBundleFailures.length === 0,
    failures: evidenceBundleFailures,
    warnings: bundleResult.bundle.warnings,
    limitations: bundleResult.bundle.limitations,
    checksum: bundleResult.bundle.bundleIntegrityChecksum,
    resultReference: bundleResult.bundle.bundleId,
  });
  const failures = [
    ...referenceFailures,
    ...verificationStageFailures,
    ...evidenceBundleFailures.filter((item) => item.code !== "REFERENCE_MISSING"),
  ];
  const limitations = [
    ...runtimeLimitations,
    ...verificationReport.limitations,
    ...bundleResult.bundle.limitations,
  ];
  const status = decidePipelineStatus(
    failures,
    verificationReport.overallStatus,
    bundleResult.status,
  );
  const stages = [exportStage, verificationStage, evidenceBundleStage];

  return result({
    status,
    packageId: artifact.metadata.packageId,
    packageVersion: artifact.metadata.packageVersion,
    stages,
    failures,
    warnings: [...verificationReport.warnings, ...bundleResult.bundle.warnings],
    limitations,
    checksums: {
      exportArtifact: artifact.metadata.checksumSha256,
      verificationReport: verificationReport.reportIntegrityChecksum,
      evidenceBundle: bundleResult.bundle.bundleIntegrityChecksum,
    },
    references: {
      packageArtifact: input.packageArtifactReference ?? null,
      verificationReport: input.verificationReportReference ?? null,
      approval: input.approvalReference ?? null,
    },
  });
}
