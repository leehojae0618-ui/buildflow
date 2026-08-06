import { normalizeSimulatedEvidence } from "../../verification-loop/evidence";
import { evaluateAcceptance } from "../../verification-loop/verdict";
import type { AcceptanceTestCase, NormalizedEvidence, SimulatedExecutionResult, VerificationVerdict } from "../../verification-loop/types";
import type { CanonicalExternalExecutionResult } from "../types";

export type MakeFixtureResult = {
  scenarioId: string;
  executionId: string;
  status: "SUCCESS" | "FAILED" | "WAITING";
  observations: readonly SimulatedExecutionResult["observations"][number][];
  safeErrorCode?: string;
  startedAt: string;
  finishedAt: string;
};

export function adaptMakeFixtureResult(fixture: MakeFixtureResult): CanonicalExternalExecutionResult {
  return {
    platform: "MAKE",
    executionMode: "SIMULATED",
    externalWorkflowId: `fixture.make.scenario.${fixture.scenarioId}`,
    externalExecutionId: `fixture.make.execution.${fixture.executionId}`,
    status: fixture.status === "SUCCESS" ? "SUCCEEDED" : fixture.status === "FAILED" ? "FAILED" : "WAITING",
    startedAt: fixture.startedAt,
    finishedAt: fixture.finishedAt,
    observations: fixture.observations,
    errors: fixture.safeErrorCode ? [fixture.safeErrorCode] : [],
    rawReference: `fixture.make.log.${fixture.executionId}`,
    actualExternalExecution: false,
  };
}

export function normalizeMakeFixtureEvidence(testCase: AcceptanceTestCase, fixture: MakeFixtureResult): NormalizedEvidence {
  const execution = adaptMakeFixtureResult(fixture);
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

export function verifyMakeFixture(testCase: AcceptanceTestCase, fixture: MakeFixtureResult): { execution: CanonicalExternalExecutionResult; evidence: NormalizedEvidence; verdict: VerificationVerdict } {
  const execution = adaptMakeFixtureResult(fixture);
  const evidence = normalizeMakeFixtureEvidence(testCase, fixture);
  return { execution, evidence, verdict: evaluateAcceptance(testCase, evidence) };
}
