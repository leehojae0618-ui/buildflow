export type CanonicalBlueprintStepType =
  | "TRIGGER"
  | "CLASSIFY"
  | "SUMMARIZE"
  | "APPROVAL_GATE"
  | "DELIVERY";

export type CanonicalBlueprintStep = {
  id: string;
  type: CanonicalBlueprintStepType;
  label: string;
  dependsOn: readonly string[];
  requiresApproval: boolean;
  outputReference: string;
};

export type CanonicalBlueprint = {
  id: string;
  version: "lv5-internal-v1";
  goal: string;
  trigger: "INCOMING_INQUIRY";
  steps: readonly CanonicalBlueprintStep[];
  approvalPolicy: "APPROVAL_REQUIRED_BEFORE_DELIVERY";
  forbiddenBehaviors: readonly VerificationLoopObservation[];
  expectedOutputs: readonly string[];
};

export type VerificationLoopObservation =
  | "INQUIRY_CLASSIFIED"
  | "INQUIRY_SUMMARIZED"
  | "APPROVAL_GATE_ENFORCED"
  | "APPROVAL_STATUS_APPROVED"
  | "SLACK_DELIVERY_BLOCKED_UNTIL_APPROVED"
  | "SLACK_DELIVERY_ATTEMPTED_AFTER_APPROVAL"
  | "SLACK_DELIVERY_ATTEMPTED_BEFORE_APPROVAL";

export type AcceptanceTestCase = {
  id: "VALID_INQUIRY_APPROVED" | "DELIVERY_BEFORE_APPROVAL";
  title: string;
  preconditions: readonly string[];
  input: string;
  expectedObservations: readonly VerificationLoopObservation[];
  forbiddenObservations: readonly VerificationLoopObservation[];
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
};

export type SimulatedExecutionResult = {
  executionId: string;
  executionMode: "SIMULATED";
  platform: "FIXTURE";
  testCaseId: AcceptanceTestCase["id"];
  observations: readonly VerificationLoopObservation[];
  occurredAt: string;
  source: "LV5_FIRST_VERTICAL_SLICE_FIXTURE";
};

export type EvidenceSourceType =
  | "USER_SUBMITTED"
  | "PLATFORM_OBSERVED"
  | "EXTERNAL_SYSTEM_REPORTED"
  | "DERIVED"
  | "SIMULATED_FIXTURE";

export type NormalizedEvidence = {
  evidenceId: string;
  sourceType: EvidenceSourceType;
  executionMode: "SIMULATED";
  testCaseId: AcceptanceTestCase["id"];
  expected: readonly VerificationLoopObservation[];
  observed: readonly VerificationLoopObservation[];
  occurredAt: string;
  reference: string;
  integrityChecksum: string;
  trustLevel: "SIMULATED";
};

export type VerificationVerdictStatus = "VERIFIED" | "FAILED" | "NOT_VERIFIED";

export type VerificationVerdict = {
  verdictId: string;
  status: VerificationVerdictStatus;
  presentation: "SIMULATED VERIFIED" | "SIMULATED FAILED" | "NOT VERIFIED";
  testCaseId: AcceptanceTestCase["id"];
  evidenceReference?: string;
  failureCode?: "EVIDENCE_MISSING" | "TEST_CASE_MISMATCH" | "FORBIDDEN_OBSERVATION_DETECTED" | "EXPECTED_OBSERVATION_MISSING";
  details: readonly string[];
  actualExternalExecution: false;
};

export type RemediationInstruction = {
  id: string;
  failureCode: "FORBIDDEN_OBSERVATION_DETECTED";
  summary: string;
  targetStepId: string;
  changeType: "INSERT_APPROVAL_GATE";
  before: string;
  after: string;
  reason: string;
  requiresApproval: true;
};

export type ReverificationLink = {
  originalExecutionId: string;
  remediationId: string;
  reverificationExecutionId: string;
  originalVerdict: VerificationVerdictStatus;
  reverificationVerdict: VerificationVerdictStatus;
  testCaseId: AcceptanceTestCase["id"];
};
