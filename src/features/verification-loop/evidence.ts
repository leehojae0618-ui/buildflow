import { createHash } from "node:crypto";
import { stableSerializeAgentPackage } from "../agents/package-export";
import type { AcceptanceTestCase, NormalizedEvidence, SimulatedExecutionResult } from "./types";

function checksum(value: unknown): string {
  return createHash("sha256").update(stableSerializeAgentPackage(value), "utf8").digest("hex");
}

export function normalizeSimulatedEvidence(
  testCase: AcceptanceTestCase,
  result: SimulatedExecutionResult,
): NormalizedEvidence {
  if (result.executionMode !== "SIMULATED" || result.platform !== "FIXTURE") {
    throw new Error("SIMULATION_BOUNDARY_VIOLATION");
  }
  if (result.testCaseId !== testCase.id) throw new Error("TEST_CASE_ID_MISMATCH");
  const reference = `simulation.fixture.${result.executionId}`;
  const payload = {
    sourceType: "SIMULATED_FIXTURE" as const,
    executionMode: result.executionMode,
    testCaseId: result.testCaseId,
    expected: testCase.expectedObservations,
    observed: result.observations,
    occurredAt: result.occurredAt,
    reference,
    trustLevel: "SIMULATED" as const,
  };
  return {
    evidenceId: `evidence.${checksum(payload).slice(0, 24)}`,
    ...payload,
    integrityChecksum: checksum(payload),
  };
}

export function verifyNormalizedEvidenceChecksum(evidence: NormalizedEvidence): boolean {
  const payload = {
    sourceType: evidence.sourceType,
    executionMode: evidence.executionMode,
    testCaseId: evidence.testCaseId,
    expected: evidence.expected,
    observed: evidence.observed,
    occurredAt: evidence.occurredAt,
    reference: evidence.reference,
    trustLevel: evidence.trustLevel,
  };
  return checksum(payload) === evidence.integrityChecksum;
}
