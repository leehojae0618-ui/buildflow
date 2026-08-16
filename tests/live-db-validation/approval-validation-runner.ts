import type {
  RuntimeApprovalRepository,
  RuntimeApprovalRepositoryResult,
} from "../../src/features/runtime-approval/repository";
import type {
  RuntimeApprovalBinding,
  RuntimeApprovalFailureCode,
  RuntimeApprovalRequest,
} from "../../src/features/runtime-approval/types";
import { validateRuntimeApprovalBinding } from "../../src/features/runtime-approval/validator";
import type { LiveDbCaseResult, LiveDbSafeErrorCode } from "./types";

export type ApprovalValidationInput = {
  /** Explicit injection only. There is no default repository. */
  repository: RuntimeApprovalRepository | undefined;
  binding: RuntimeApprovalBinding;
  /**
   * A binding that reaches the RPC and is then refused by the stored row.
   *
   * It must keep `projectId` and `userId` (a different owner is refused as
   * not-found before the binding is compared) and must itself be locally valid,
   * meaning its `bindingChecksum` is recomputed for the altered payload rather
   * than left stale. `assertFixtures` enforces both, because
   * `SupabaseRuntimeApprovalRepository.consume` runs
   * `validateRuntimeApprovalBinding` before it issues the RPC: a stale-checksum
   * fixture never reaches the database and so proves nothing about it.
   */
  mismatchedBinding: RuntimeApprovalBinding;
  /**
   * An approval whose TTL has already elapsed but whose status is still PENDING
   * or APPROVED, owned by `binding`'s project and user.
   *
   * It has to be injected because expiry cannot be forced through the port: the
   * TTL is server-set (15 minutes) and `reject_runtime_approval_request_mutation`
   * rejects any update that changes `expires_at`, so not even service-role SQL
   * can backdate a fresh request. Operators therefore create this fixture ahead
   * of the run. A missing fixture blocks instead of silently passing.
   */
  expiredApprovalId: string | undefined;
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
 * The only code that proves the *database* compared a binding and refused it.
 *
 * `RUNTIME_APPROVAL_INVALID` is deliberately excluded even though a mismatched
 * binding can produce it: the repository returns that code from its own local
 * precondition, before any RPC is issued. Accepting it would let APR-04 pass on
 * a probe that never reached the database.
 */
export const bindingMismatchFailureCodes: readonly RuntimeApprovalFailureCode[] = [
  "RUNTIME_APPROVAL_BINDING_MISMATCH",
];

/** The only code that proves the database refused an approval on its TTL. */
export const expiredFailureCodes: readonly RuntimeApprovalFailureCode[] = [
  "RUNTIME_APPROVAL_EXPIRED",
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
 * Rejects fixtures that could not exercise the case they claim to exercise.
 * Checked before any repository call, so a malformed probe blocks the run
 * instead of producing a green result the database never participated in.
 */
function assertFixtures(input: ApprovalValidationInput): LiveDbSafeErrorCode | undefined {
  if (!validateRuntimeApprovalBinding(input.binding)) {
    return "LIVE_DB_APPROVAL_BINDING_FIXTURE_INVALID";
  }
  const mismatched = input.mismatchedBinding;
  if (!validateRuntimeApprovalBinding(mismatched)) {
    return "LIVE_DB_APPROVAL_MISMATCH_FIXTURE_INVALID";
  }
  if (
    mismatched.projectId !== input.binding.projectId ||
    mismatched.userId !== input.binding.userId ||
    mismatched.bindingChecksum === input.binding.bindingChecksum
  ) {
    return "LIVE_DB_APPROVAL_MISMATCH_FIXTURE_INVALID";
  }
  if (!input.expiredApprovalId?.trim()) {
    return "LIVE_DB_APPROVAL_EXPIRED_FIXTURE_NOT_INJECTED";
  }
  return undefined;
}

/**
 * Executes APR-01 through APR-04 against an explicitly injected repository,
 * numbered as `LOCAL_VALIDATION_PLAN.md` numbers them.
 *
 * APR-01  create                        expects OK, status PENDING
 *         `approval-create`
 * APR-02  approve / reject / revoke /   expects the matching safe state result,
 *         expire, isolated fixtures     each on its own request
 *         `approval-approve`, `approval-reject`, `approval-revoke`,
 *         `approval-expiry`
 * APR-03  consume the exact approved    expects OK once, then a replay block
 *         binding                       `approval-consume`,
 *                                       `consume-replay-blocked`
 * APR-04  consume a mismatched binding  expects a database binding-mismatch
 *         `approval-binding-mismatch`
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

  const fixtureFailure = assertFixtures(input);
  if (fixtureFailure) {
    return { status: "BLOCKED", safeErrorCode: fixtureFailure, caseResults: [] };
  }

  const caseResults: LiveDbCaseResult[] = [];
  const blocked = (safeErrorCode: LiveDbSafeErrorCode): ApprovalValidationResult => ({
    status: "BLOCKED",
    safeErrorCode,
    caseResults,
  });
  const failCase = (caseId: string): ApprovalValidationResult => {
    caseResults.push(fail(caseId, "LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME"));
    return blocked("LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME");
  };

  /** Creates an isolated request so no case observes another case's state. */
  const createFixture = async () => {
    const created = await repository.create({ binding: input.binding });
    return isOk(created) && created.value.status === "PENDING" ? created.value.approvalId : null;
  };
  const decide = (approvalId: string, decision: "APPROVE" | "REJECT" | "REVOKE") =>
    repository.decide({
      approvalId,
      projectId: input.binding.projectId,
      userId: input.binding.userId,
      decision,
    });

  // APR-01 create
  const primaryApprovalId = await createFixture();
  if (!primaryApprovalId) return failCase("approval-create");
  caseResults.push(pass("approval-create"));

  // APR-02 approve
  const approved = await decide(primaryApprovalId, "APPROVE");
  if (!isOk(approved) || approved.value.status !== "APPROVED") return failCase("approval-approve");
  caseResults.push(pass("approval-approve"));

  // APR-02 reject, on its own request so the approved one stays consumable.
  const rejectTarget = await createFixture();
  if (!rejectTarget) return failCase("approval-reject");
  const rejected = await decide(rejectTarget, "REJECT");
  if (!isOk(rejected) || rejected.value.status !== "REJECTED") return failCase("approval-reject");
  caseResults.push(pass("approval-reject"));

  // APR-02 revoke. Revoked from APPROVED rather than PENDING: withdrawing an
  // already-usable approval is the transition that actually has to hold.
  const revokeTarget = await createFixture();
  if (!revokeTarget) return failCase("approval-revoke");
  const revokeApproved = await decide(revokeTarget, "APPROVE");
  if (!isOk(revokeApproved) || revokeApproved.value.status !== "APPROVED") {
    return failCase("approval-revoke");
  }
  const revoked = await decide(revokeTarget, "REVOKE");
  if (!isOk(revoked) || revoked.value.status !== "REVOKED") return failCase("approval-revoke");
  caseResults.push(pass("approval-revoke"));

  // APR-02 expire, against the pre-aged fixture. Only RUNTIME_APPROVAL_EXPIRED
  // counts: a fixture already transitioned to EXPIRED answers NOT_APPROVED
  // instead, and accepting that would hide a TTL that never fired.
  const expired = await decide(input.expiredApprovalId as string, "APPROVE");
  if (!blockedWith(expired, expiredFailureCodes)) return failCase("approval-expiry");
  caseResults.push(pass("approval-expiry"));

  // APR-03 consume
  const consumed = await repository.consume({
    approvalId: primaryApprovalId,
    binding: input.binding,
  });
  if (!isOk(consumed) || consumed.value.status !== "CONSUMED") return failCase("approval-consume");
  caseResults.push(pass("approval-consume"));

  // APR-03 replay
  const replayed = await repository.consume({
    approvalId: primaryApprovalId,
    binding: input.binding,
  });
  if (!blockedWith(replayed, replayBlockedFailureCodes)) {
    return failCase("consume-replay-blocked");
  }
  caseResults.push(pass("consume-replay-blocked"));

  // APR-04 binding mismatch.
  // Runs against a second, freshly approved request rather than the one just
  // consumed. The RPC compares the binding only after it has cleared CONSUMED,
  // REVOKED, expiry and non-APPROVED status, so a reused request would answer
  // with one of those codes and never reach the comparison at all.
  const mismatchTarget = await createFixture();
  if (!mismatchTarget) return failCase("approval-binding-mismatch");
  const mismatchApproved = await decide(mismatchTarget, "APPROVE");
  if (!isOk(mismatchApproved) || mismatchApproved.value.status !== "APPROVED") {
    return failCase("approval-binding-mismatch");
  }
  const mismatched = await repository.consume({
    approvalId: mismatchTarget,
    binding: input.mismatchedBinding,
  });
  if (!blockedWith(mismatched, bindingMismatchFailureCodes)) {
    return failCase("approval-binding-mismatch");
  }
  caseResults.push(pass("approval-binding-mismatch"));

  return { status: "PASSED", caseResults };
}
