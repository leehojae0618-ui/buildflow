import { normalizeSimulatedEvidence } from "../../verification-loop/evidence";
import { evaluateAcceptance } from "../../verification-loop/verdict";
import type { AcceptanceTestCase, NormalizedEvidence, SimulatedExecutionResult, VerificationVerdict } from "../../verification-loop/types";
import type { CanonicalExternalExecutionResult } from "../types";

export type N8nFixtureResult = {
  workflowId: string;
  executionId: string;
  status: "SUCCESS" | "ERROR" | "WAITING";
  observations: readonly SimulatedExecutionResult["observations"][number][];
  safeErrorCode?: string;
  startedAt: string;
  finishedAt: string;
};

export function adaptN8nFixtureResult(fixture: N8nFixtureResult): CanonicalExternalExecutionResult {
  return {
    platform: "N8N",
    executionMode: "SIMULATED",
    externalWorkflowId: `fixture.n8n.workflow.${fixture.workflowId}`,
    externalExecutionId: `fixture.n8n.execution.${fixture.executionId}`,
    status: fixture.status === "SUCCESS" ? "SUCCEEDED" : fixture.status === "ERROR" ? "FAILED" : "WAITING",
    startedAt: fixture.startedAt,
    finishedAt: fixture.finishedAt,
    observations: fixture.observations,
    errors: fixture.safeErrorCode ? [fixture.safeErrorCode] : [],
    rawReference: `fixture.n8n.execution-log.${fixture.executionId}`,
    actualExternalExecution: false,
  };
}

export function normalizeN8nFixtureEvidence(testCase: AcceptanceTestCase, fixture: N8nFixtureResult): NormalizedEvidence {
  const execution = adaptN8nFixtureResult(fixture);
  const simulation: SimulatedExecutionResult = {
    executionId: execution.externalExecutionId,
    executionMode: "SIMULATED",
    platform: "FIXTURE",
    testCaseId: testCase.id,
    observations: execution.observations,
    occurredAt: execution.finishedAt,
    source: "LV5_FIRST_VERTICAL_SLICE_FIXTURE",
  };
  return normalizeSimulatedEvidence(testCase, simulation);
}

export function verifyN8nFixture(testCase: AcceptanceTestCase, fixture: N8nFixtureResult): { execution: CanonicalExternalExecutionResult; evidence: NormalizedEvidence; verdict: VerificationVerdict } {
  const execution = adaptN8nFixtureResult(fixture);
  const evidence = normalizeN8nFixtureEvidence(testCase, fixture);
  return { execution, evidence, verdict: evaluateAcceptance(testCase, evidence) };
}
