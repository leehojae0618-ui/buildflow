import type { AcceptanceTestCase, ReverificationLink, SimulatedExecutionResult, VerificationVerdict } from "./types";

export function createReverificationLink(
  testCase: AcceptanceTestCase,
  original: SimulatedExecutionResult,
  originalVerdict: VerificationVerdict,
  remediationId: string,
  reverification: SimulatedExecutionResult,
  reverificationVerdict: VerificationVerdict,
): ReverificationLink {
  if (original.testCaseId !== testCase.id || reverification.testCaseId !== testCase.id) {
    throw new Error("REVERIFICATION_TEST_CASE_MISMATCH");
  }
  if (originalVerdict.testCaseId !== testCase.id || reverificationVerdict.testCaseId !== testCase.id) {
    throw new Error("REVERIFICATION_VERDICT_MISMATCH");
  }
  if (originalVerdict.status !== "FAILED" || reverificationVerdict.status !== "VERIFIED") {
    throw new Error("REVERIFICATION_TERMINAL_STATE_INVALID");
  }
  return {
    originalExecutionId: original.executionId,
    remediationId,
    reverificationExecutionId: reverification.executionId,
    originalVerdict: originalVerdict.status,
    reverificationVerdict: reverificationVerdict.status,
    testCaseId: testCase.id,
  };
}
