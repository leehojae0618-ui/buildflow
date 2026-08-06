import { normalizeSimulatedEvidence } from "../../verification-loop/evidence";
import { evaluateAcceptance } from "../../verification-loop/verdict";
import type { AcceptanceTestCase, NormalizedEvidence, SimulatedExecutionResult, VerificationLoopObservation, VerificationVerdict } from "../../verification-loop/types";
import type { CanonicalExternalExecutionResult } from "../types";
import type { ExternalBuilderClientResult } from "./types";

export function toCanonicalMockExecutionResult(
  result: ExternalBuilderClientResult,
  observations: readonly VerificationLoopObservation[],
): CanonicalExternalExecutionResult {
  if (result.actualExternalAction || result.status === "DRY_RUN" || !result.externalWorkflowId || !result.externalExecutionId) {
    throw new Error("MOCK_EXECUTION_REQUIRED");
  }
  return {
    platform: result.platform,
    executionMode: "SIMULATED",
    externalWorkflowId: result.externalWorkflowId,
    externalExecutionId: result.externalExecutionId,
    status: result.status === "SUCCEEDED" ? "SUCCEEDED" : result.status === "WAITING" ? "WAITING" : "FAILED",
    startedAt: result.startedAt,
    finishedAt: result.finishedAt,
    observations,
    errors: result.normalizedError ? [result.normalizedError.code] : [],
    rawReference: result.responseReference ?? "mock.platform.response.unavailable",
    actualExternalExecution: false,
  };
}

export function verifyMockClientResult(
  testCase: AcceptanceTestCase,
  result: ExternalBuilderClientResult,
  observations: readonly VerificationLoopObservation[],
): { execution: CanonicalExternalExecutionResult; evidence: NormalizedEvidence; verdict: VerificationVerdict } {
  const execution = toCanonicalMockExecutionResult(result, observations);
  const simulation: SimulatedExecutionResult = {
    executionId: execution.externalExecutionId,
    executionMode: "SIMULATED",
    platform: "FIXTURE",
    testCaseId: testCase.id,
    observations: execution.observations,
    occurredAt: execution.finishedAt,
    source: "LV5_FIRST_VERTICAL_SLICE_FIXTURE",
  };
  const evidence = normalizeSimulatedEvidence(testCase, simulation);
  return { execution, evidence, verdict: evaluateAcceptance(testCase, evidence) };
}
