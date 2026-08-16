import type {
  RuntimeApprovalRepository,
  RuntimeApprovalRepositoryResult,
} from "../../src/features/runtime-approval/repository";
import type {
  RuntimeApprovalBinding,
  RuntimeApprovalFailureCode,
  RuntimeApprovalRequest,
} from "../../src/features/runtime-approval/types";
import type { LiveDbCaseResult, LiveDbSafeErrorCode } from "./types";

export type ApprovalValidationInput = {
  /** Explicit injection only. There is no default repository. */
  repository: RuntimeApprovalRepository | undefined;
  binding: RuntimeApprovalBinding;
  /**
   * A binding that differs from `binding` in its checksum payload while keeping
   * the same `projectId` and `userId`. Sharing the owner keeps APR-04 a genuine
   * binding-mismatch probe: a different owner would be refused as not-found or
   * not-authorized before the binding is ever compared.
   */
  mismatchedBinding: RuntimeApprovalBinding;
};

export type ApprovalValidationResult = {
  status: "PASSED" | "BLOCKED";
  safeErrorCode?: LiveDbSafeErrorCode;
  caseResults: readonly LiveDbCaseResult[];
};

/**
 * Failure codes that prove the database actively refused a replayed consume.
 *
 * `RUNTIME_APPROVAL_NOT_APPROVED` is accepted alongside the explicit
 * `RUNTIME_APPROVAL_CONSUMED`: an already-consumed request is no longer in the
 * APPROVED state, so a status-based refusal is a legitimate way for the RPC to
 * express the same block, and it is also the repository's mapped fallback when
 * the RPC does not surface a code in its message.
 *
 * `RUNTIME_APPROVAL_PERSISTENCE_FAILED` is deliberately excluded: it is the
 * repository's answer for an unreachable or erroring database, so accepting it
 * would let an infrastructure fault masquerade as a successful block.
 */
export const replayBlockedFailureCodes: readonly RuntimeApprovalFailureCode[] = [
  "RUNTIME_APPROVAL_CONSUMED",
  "RUNTIME_APPROVAL_NOT_APPROVED",
];

/**
 * Failure codes that prove the database refused a binding that did not match.
 */
export const bindingMismatchFailureCodes: readonly RuntimeApprovalFailureCode[] = [
  "RUNTIME_APPROVAL_BINDING_MISMATCH",
  "RUNTIME_APPROVAL_INVALID",
];

function isOk<T>(
  result: RuntimeApprovalRepositoryResult<T>,
): result is { status: "OK"; value: T; failures: [] } {
  return result.status === "OK";
}

function blockedWith(
  result: RuntimeApprovalRepositoryResult<RuntimeApprovalRequest>,
  accepted: readonly RuntimeApprovalFailureCode[],
): boolean {
  if (result.status === "OK") return false;
  return result.failures.some((failure) => accepted.includes(failure.code));
}

const pass = (caseId: string): LiveDbCaseResult => ({
  caseId,
  executionStatus: "EXECUTED_PASS",
  verdict: "PASS",
});

const fail = (caseId: string, safeErrorCode: LiveDbSafeErrorCode): LiveDbCaseResult => ({
  caseId,
  executionStatus: "EXECUTED_FAIL",
  verdict: "FAIL",
  safeErrorCode,
});

/**
 * Executes APR-01 through APR-04 against an explicitly injected repository.
 *
 * APR-01  create then approve            expects OK, status APPROVED
 * APR-02  consume the approved request   expects OK, status CONSUMED
 * APR-03  consume the same request again expects a replay block
 * APR-04  consume with a wrong binding   expects a binding-mismatch block
 *
 * Every step goes through the repository port, so this function issues no
 * Supabase call itself and can be driven entirely by a fake in R2.
 */
export async function runApprovalValidation(
  input: ApprovalValidationInput,
): Promise<ApprovalValidationResult> {
  const { repository } = input;
  if (!repository) {
    return {
      status: "BLOCKED",
      safeErrorCode: "LIVE_DB_APPROVAL_REPOSITORY_NOT_INJECTED",
      caseResults: [],
    };
  }

  const caseResults: LiveDbCaseResult[] = [];
  const blocked = (safeErrorCode: LiveDbSafeErrorCode): ApprovalValidationResult => ({
    status: "BLOCKED",
    safeErrorCode,
    caseResults,
  });

  // APR-01 create
  const created = await repository.create({ binding: input.binding });
  if (!isOk(created)) {
    caseResults.push(fail("approval-create", "LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME"));
    return blocked("LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME");
  }
  caseResults.push(pass("approval-create"));
  const approvalId = created.value.approvalId;

  // APR-01 approve
  const approved = await repository.decide({
    approvalId,
    projectId: input.binding.projectId,
    userId: input.binding.userId,
    decision: "APPROVE",
  });
  if (!isOk(approved) || approved.value.status !== "APPROVED") {
    caseResults.push(fail("approval-approve", "LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME"));
    return blocked("LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME");
  }
  caseResults.push(pass("approval-approve"));

  // APR-02 consume
  const consumed = await repository.consume({ approvalId, binding: input.binding });
  if (!isOk(consumed) || consumed.value.status !== "CONSUMED") {
    caseResults.push(fail("approval-consume", "LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME"));
    return blocked("LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME");
  }
  caseResults.push(pass("approval-consume"));

  // APR-03 replay
  const replayed = await repository.consume({ approvalId, binding: input.binding });
  if (!blockedWith(replayed, replayBlockedFailureCodes)) {
    caseResults.push(fail("consume-replay-blocked", "LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME"));
    return blocked("LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME");
  }
  caseResults.push(pass("consume-replay-blocked"));

  // APR-04 binding mismatch.
  // Runs against a second, freshly approved request rather than the one just
  // consumed. Reusing the consumed request would let a repository that checks
  // status before binding answer CONSUMED, which would report a mismatch block
  // that never actually happened.
  const mismatchTarget = await repository.create({ binding: input.binding });
  if (!isOk(mismatchTarget)) {
    caseResults.push(fail("approval-binding-mismatch", "LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME"));
    return blocked("LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME");
  }
  const mismatchApproved = await repository.decide({
    approvalId: mismatchTarget.value.approvalId,
    projectId: input.binding.projectId,
    userId: input.binding.userId,
    decision: "APPROVE",
  });
  if (!isOk(mismatchApproved) || mismatchApproved.value.status !== "APPROVED") {
    caseResults.push(fail("approval-binding-mismatch", "LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME"));
    return blocked("LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME");
  }
  const mismatched = await repository.consume({
    approvalId: mismatchTarget.value.approvalId,
    binding: input.mismatchedBinding,
  });
  if (!blockedWith(mismatched, bindingMismatchFailureCodes)) {
    caseResults.push(fail("approval-binding-mismatch", "LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME"));
    return blocked("LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME");
  }
  caseResults.push(pass("approval-binding-mismatch"));

  return { status: "PASSED", caseResults };
}
