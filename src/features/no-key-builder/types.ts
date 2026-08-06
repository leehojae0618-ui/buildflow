import type { AcceptanceTestCase, VerificationLoopObservation, VerificationVerdict } from "../verification-loop/types";
import type { ExternalBuilderPlatform } from "../external-builders/types";

export type ImportCompatibility = "CONFIRMED" | "PARTIAL" | "MANUAL_SETUP_REQUIRED" | "REQUIRES_REAL_PLATFORM_VALIDATION";

export type NoKeyResultSubmission = {
  platform: ExternalBuilderPlatform;
  blueprintChecksum: string;
  testCaseId: AcceptanceTestCase["id"];
  claimedStatus: "SUCCEEDED" | "FAILED" | "UNKNOWN";
  externalWorkflowReference?: string;
  externalExecutionReference?: string;
  observations: readonly VerificationLoopObservation[];
  submittedAt: string;
  userConfirmed: boolean;
  sanitizedLogExcerpt?: string;
};

export type NoKeyUserSubmittedEvidence = {
  sourceType: "USER_SUBMITTED";
  trustLevel: "USER_SUBMITTED";
  platform: ExternalBuilderPlatform;
  blueprintChecksum: string;
  testCaseId: AcceptanceTestCase["id"];
  observed: readonly VerificationLoopObservation[];
  occurredAt: string;
  reference: string;
  userConfirmed: true;
  actualExternalExecution: false;
  sanitizedLogExcerpt?: string;
};

export type NoKeyN8nArtifact = {
  kind: "N8N_WORKFLOW_EXPORT";
  workflowJson: string;
  fileName: string;
  importInstructions: readonly string[];
  connectionInstructions: readonly string[];
  importCompatibility: "REQUIRES_REAL_PLATFORM_VALIDATION";
};

export type NoKeyMakeArtifact = {
  kind: "MAKE_MANUAL_SETUP_GUIDE";
  scenarioGuide: readonly string[];
  moduleSequence: readonly string[];
  fieldMappingGuide: readonly string[];
  connectionInstructions: readonly string[];
  importCompatibility: "MANUAL_SETUP_REQUIRED";
};

export type NoKeyExecutionPackage = {
  packageVersion: "no-key-v1";
  platform: ExternalBuilderPlatform;
  blueprintChecksum: string;
  title: string;
  mode: "NO_KEY";
  setupSteps: readonly string[];
  requiredUserConnections: readonly string[];
  artifact: NoKeyN8nArtifact | NoKeyMakeArtifact;
  acceptanceTests: readonly AcceptanceTestCase[];
  resultSubmissionSchema: readonly string[];
  warnings: readonly string[];
  requiresExternalLogin: true;
  requiresUserCredentialSetup: true;
  actualExternalCreation: false;
  actualExternalExecution: false;
};

export type NoKeySubmissionOutcome = {
  evidence?: NoKeyUserSubmittedEvidence;
  verdict: VerificationVerdict;
  limitation?: "BLUEPRINT_CHECKSUM_MISMATCH" | "USER_CONFIRMATION_REQUIRED" | "EVIDENCE_MISSING";
};
