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
  workflow: N8nImportWorkflow;
  importReadiness: N8nImportReadiness;
  fileName: string;
  importInstructions: readonly string[];
  connectionInstructions: readonly string[];
  importCompatibility: "REQUIRES_REAL_PLATFORM_VALIDATION";
};

export type N8nImportNode = {
  id: string;
  name: string;
  parameters: Record<string, unknown>;
  type: "n8n-nodes-base.manualTrigger" | "n8n-nodes-base.set" | "n8n-nodes-base.if";
  typeVersion: number;
  position: readonly [number, number];
};

export type N8nImportConnection = {
  node: string;
  type: "main";
  index: 0;
};

export type N8nImportWorkflow = {
  name: string;
  nodes: readonly N8nImportNode[];
  connections: Readonly<Record<string, { main: readonly (readonly N8nImportConnection[])[] }>>;
  settings: { executionOrder: "v1" };
  active: false;
};

export type N8nImportReadiness = {
  status: "PASS" | "FAILED";
  realPlatformValidation: "REQUIRES_REAL_PLATFORM_VALIDATION";
  issues: readonly string[];
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
