import type {
  RuntimeApprovalRepository,
  RuntimeApprovalRepositoryResult,
} from "../../src/features/runtime-approval/repository";
import type {
  RuntimeApprovalBinding,
  RuntimeApprovalFailureCode,
  RuntimeApprovalRequest,
} from "../../src/features/runtime-approval/types";
import {
  checksumRuntimeApprovalBinding,
  validateRuntimeApprovalBinding,
} from "../../src/features/runtime-approval/validator";
import type { LiveDbRecordCounter } from "./runtime-record-counters";
import { LIVE_DB_TEST_PREFIX, type LiveDbCaseResult, type LiveDbSafeErrorCode } from "./types";

export type ApprovalValidationDeps = {
  /** Explicit injection only. There is no default repository. */
  repository: RuntimeApprovalRepository | undefined;
  /**
   * Reads the event and evidence counts the validation matrix expects beside
   * each case. The repository port exposes no event access, so without this the
   * "one CREATED / one CONSUMED / evidence 0" column cannot be checked at all.
   */
  counter: LiveDbRecordCounter | undefined;
  /**
   * Template for every request this runner creates. It is never inserted
   * verbatim — see `fixtureBinding` — and its identifiers must carry the
   * validation prefix so ST-D cleanup can find every row this run leaves.
   */
  binding: RuntimeApprovalBinding;
  /**
   * A binding that reaches the RPC and is then refused by the stored row.
   *
   * It must keep `projectId` and `userId` (a different owner is refused as
   * not-found before the binding is compared) and must itself be locally valid,
   * meaning its `bindingChecksum` is recomputed for the altered payload rather
   * than left stale. `SupabaseRuntimeApprovalRepository.consume` runs
   * `validateRuntimeApprovalBinding` before it issues the RPC, so a
   * stale-checksum fixture never reaches the database and proves nothing.
   */
  mismatchedBinding: RuntimeApprovalBinding;
};

export type ApprovalLifecycleResult = {
  status: "PASSED" | "BLOCKED";
  safeErrorCode?: LiveDbSafeErrorCode;
  caseResults: readonly LiveDbCaseResult[];
  /**
   * The pre-aged fixture this phase created, carried to the expiry phase. Its
   * TTL is server-set and `expires_at` is immutable, so the only way to observe
   * an expiry is to create the row early and come back to it later.
   */
  expiry?: { approvalId: string; expiresAtMs: number };
  /** A row later phases can probe without disturbing an unfinished case. */
  triggerProbeApprovalId?: string;
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

/**
 * Labels that make each fixture's binding distinct. `binding_checksum` carries
 * a UNIQUE constraint, so reusing one binding across the lifecycle cases would
 * make every create after the first fail on the real database — while an
 * in-memory double that skips the constraint reports the whole run green.
 */
export const fixtureLabels = {
  expiry: "apr02-expire",
  consume: "apr03-consume",
  reject: "apr02-reject",
  revoke: "apr02-revoke",
  mismatch: "apr04-mismatch",
} as const;

/**
 * Derives a distinct but still valid binding for one fixture.
 *
 * The request id is what varies: it is part of the checksummed core, so the
 * derived binding gets its own `bindingChecksum`, and a validation fixture
 * standing for its own execution request is what the field means anyway.
 */
export function fixtureBinding(
  template: RuntimeApprovalBinding,
  label: string,
): RuntimeApprovalBinding {
  // Listed field by field rather than spread-minus-checksum, so a new field on
  // RuntimeApprovalBinding surfaces as a type error here instead of silently
  // joining the checksummed core.
  const core = {
    projectId: template.projectId,
    userId: template.userId,
    scope: template.scope,
    runtimeExecutionRequestId: `${template.runtimeExecutionRequestId}-${label}`,
    runtimeExecutionRequestChecksum: template.runtimeExecutionRequestChecksum,
    runtimePlanId: template.runtimePlanId,
    runtimePlanChecksum: template.runtimePlanChecksum,
    provider: template.provider,
    model: template.model,
    safeInputChecksum: template.safeInputChecksum,
  };
  return { ...core, bindingChecksum: checksumRuntimeApprovalBinding(core) };
}

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
 * Rejects fixtures that could not exercise the case they claim to exercise, and
 * identifiers ST-D cleanup could not find. Checked before any repository call,
 * so a malformed probe blocks the run instead of producing a green result the
 * database never participated in.
 */
export function assertApprovalFixtures(
  deps: Pick<ApprovalValidationDeps, "binding" | "mismatchedBinding">,
): LiveDbSafeErrorCode | undefined {
  const { binding, mismatchedBinding } = deps;
  if (!validateRuntimeApprovalBinding(binding)) {
    return "LIVE_DB_APPROVAL_BINDING_FIXTURE_INVALID";
  }
  // Cleanup is defined by prefix, so a row created without one is a row ST-D
  // cannot account for.
  if (
    !binding.runtimeExecutionRequestId.startsWith(LIVE_DB_TEST_PREFIX) ||
    !binding.runtimePlanId.startsWith(LIVE_DB_TEST_PREFIX)
  ) {
    return "LIVE_DB_FIXTURE_PREFIX_REQUIRED";
  }
  if (!validateRuntimeApprovalBinding(mismatchedBinding)) {
    return "LIVE_DB_APPROVAL_MISMATCH_FIXTURE_INVALID";
  }
  // Compared against the binding APR-04's target row will actually hold, not
  // against the template, since the template is never stored.
  const mismatchTargetBinding = fixtureBinding(binding, fixtureLabels.mismatch);
  if (
    mismatchedBinding.projectId !== binding.projectId ||
    mismatchedBinding.userId !== binding.userId ||
    mismatchedBinding.bindingChecksum === mismatchTargetBinding.bindingChecksum
  ) {
    return "LIVE_DB_APPROVAL_MISMATCH_FIXTURE_INVALID";
  }
  return undefined;
}

/**
 * Phase one of APR, numbered as `LOCAL_VALIDATION_PLAN.md` numbers the cases.
 *
 * APR-01  create                        expects OK, status PENDING, one CREATED
 * APR-02  approve / reject / revoke,    each on its own request, each with the
 *         plus the expiry fixture       matching event recorded
 * APR-03  consume the exact approved    expects OK once, then a replay block
 *         binding
 * APR-04  consume a mismatched binding  expects a database binding-mismatch
 *
 * The expiry fixture is created first and deliberately left alone: its TTL runs
 * down while the rest of ST-B executes, and `runApprovalExpiry` returns to it.
 * Every step goes through the repository port, so this issues no Supabase call
 * of its own.
 */
export async function runApprovalLifecycle(
  deps: ApprovalValidationDeps,
): Promise<ApprovalLifecycleResult> {
  const { repository, counter } = deps;
  if (!repository) {
    return {
      status: "BLOCKED",
      safeErrorCode: "LIVE_DB_APPROVAL_REPOSITORY_NOT_INJECTED",
      caseResults: [],
    };
  }
  if (!counter) {
    return { status: "BLOCKED", safeErrorCode: "LIVE_DB_COUNTER_NOT_INJECTED", caseResults: [] };
  }
  const fixtureFailure = assertApprovalFixtures(deps);
  if (fixtureFailure) {
    return { status: "BLOCKED", safeErrorCode: fixtureFailure, caseResults: [] };
  }

  const caseResults: LiveDbCaseResult[] = [];
  const blocked = (
    safeErrorCode: LiveDbSafeErrorCode,
    extra: Partial<ApprovalLifecycleResult> = {},
  ): ApprovalLifecycleResult => ({ status: "BLOCKED", safeErrorCode, caseResults, ...extra });
  const failCase = (
    caseId: string,
    safeErrorCode: LiveDbSafeErrorCode = "LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME",
    extra: Partial<ApprovalLifecycleResult> = {},
  ): ApprovalLifecycleResult => {
    caseResults.push(fail(caseId, safeErrorCode));
    return blocked(safeErrorCode, extra);
  };

  const createFixture = async (label: string) => {
    const fixture = fixtureBinding(deps.binding, label);
    const created = await repository.create({ binding: fixture });
    return isOk(created) && created.value.status === "PENDING" ? created.value : null;
  };
  const decide = (approvalId: string, decision: "APPROVE" | "REJECT" | "REVOKE") =>
    repository.decide({
      approvalId,
      projectId: deps.binding.projectId,
      userId: deps.binding.userId,
      decision,
    });
  /** Matrix column: each transition must leave exactly one matching event. */
  const eventsAre = async (approvalId: string, expected: number) => {
    const counted = await counter.countApprovalEvents(approvalId);
    return counted.status === "COUNTED" && counted.count === expected;
  };

  // The expiry fixture goes first so its TTL runs down during everything below.
  const expiryFixture = await createFixture(fixtureLabels.expiry);
  if (!expiryFixture) return failCase("approval-expiry");
  const expiresAtMs = Date.parse(expiryFixture.expiresAt);
  if (!Number.isFinite(expiresAtMs)) return failCase("approval-expiry");
  const expiry = { approvalId: expiryFixture.approvalId, expiresAtMs };
  const withExpiry = { expiry, triggerProbeApprovalId: expiryFixture.approvalId };

  // APR-01 create
  const primary = await createFixture(fixtureLabels.consume);
  if (!primary) return failCase("approval-create", "LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME", withExpiry);
  if (!(await eventsAre(primary.approvalId, 1))) {
    return failCase("approval-create", "LIVE_DB_APPROVAL_EVENT_COUNT_MISMATCH", withExpiry);
  }
  caseResults.push(pass("approval-create"));

  // APR-02 approve
  const approved = await decide(primary.approvalId, "APPROVE");
  if (!isOk(approved) || approved.value.status !== "APPROVED") {
    return failCase("approval-approve", "LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME", withExpiry);
  }
  if (!(await eventsAre(primary.approvalId, 2))) {
    return failCase("approval-approve", "LIVE_DB_APPROVAL_EVENT_COUNT_MISMATCH", withExpiry);
  }
  caseResults.push(pass("approval-approve"));

  // APR-02 reject, on its own request so the approved one stays consumable.
  const rejectTarget = await createFixture(fixtureLabels.reject);
  if (!rejectTarget) return failCase("approval-reject", "LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME", withExpiry);
  const rejected = await decide(rejectTarget.approvalId, "REJECT");
  if (!isOk(rejected) || rejected.value.status !== "REJECTED") {
    return failCase("approval-reject", "LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME", withExpiry);
  }
  if (!(await eventsAre(rejectTarget.approvalId, 2))) {
    return failCase("approval-reject", "LIVE_DB_APPROVAL_EVENT_COUNT_MISMATCH", withExpiry);
  }
  caseResults.push(pass("approval-reject"));

  // APR-02 revoke. Revoked from APPROVED rather than PENDING: withdrawing an
  // already-usable approval is the transition that actually has to hold.
  const revokeTarget = await createFixture(fixtureLabels.revoke);
  if (!revokeTarget) return failCase("approval-revoke", "LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME", withExpiry);
  const revokeApproved = await decide(revokeTarget.approvalId, "APPROVE");
  if (!isOk(revokeApproved) || revokeApproved.value.status !== "APPROVED") {
    return failCase("approval-revoke", "LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME", withExpiry);
  }
  const revoked = await decide(revokeTarget.approvalId, "REVOKE");
  if (!isOk(revoked) || revoked.value.status !== "REVOKED") {
    return failCase("approval-revoke", "LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME", withExpiry);
  }
  if (!(await eventsAre(revokeTarget.approvalId, 3))) {
    return failCase("approval-revoke", "LIVE_DB_APPROVAL_EVENT_COUNT_MISMATCH", withExpiry);
  }
  caseResults.push(pass("approval-revoke"));

  // APR-03 consume, with the binding this request was actually created from.
  const consumed = await repository.consume({
    approvalId: primary.approvalId,
    binding: fixtureBinding(deps.binding, fixtureLabels.consume),
  });
  if (!isOk(consumed) || consumed.value.status !== "CONSUMED") {
    return failCase("approval-consume", "LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME", withExpiry);
  }
  if (!(await eventsAre(primary.approvalId, 3))) {
    return failCase("approval-consume", "LIVE_DB_APPROVAL_EVENT_COUNT_MISMATCH", withExpiry);
  }
  caseResults.push(pass("approval-consume"));

  // APR-03 replay
  const replayed = await repository.consume({
    approvalId: primary.approvalId,
    binding: fixtureBinding(deps.binding, fixtureLabels.consume),
  });
  if (!blockedWith(replayed, replayBlockedFailureCodes)) {
    return failCase("consume-replay-blocked", "LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME", withExpiry);
  }
  // A refused replay must also leave no second CONSUMED behind.
  if (!(await eventsAre(primary.approvalId, 3))) {
    return failCase("consume-replay-blocked", "LIVE_DB_APPROVAL_EVENT_COUNT_MISMATCH", withExpiry);
  }
  caseResults.push(pass("consume-replay-blocked"));

  // APR-04 binding mismatch.
  // Runs against a second, freshly approved request rather than the one just
  // consumed. The RPC compares the binding only after it has cleared CONSUMED,
  // REVOKED, expiry and non-APPROVED status, so a reused request would answer
  // with one of those codes and never reach the comparison at all.
  const mismatchTarget = await createFixture(fixtureLabels.mismatch);
  if (!mismatchTarget) {
    return failCase("approval-binding-mismatch", "LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME", withExpiry);
  }
  const mismatchApproved = await decide(mismatchTarget.approvalId, "APPROVE");
  if (!isOk(mismatchApproved) || mismatchApproved.value.status !== "APPROVED") {
    return failCase("approval-binding-mismatch", "LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME", withExpiry);
  }
  const mismatched = await repository.consume({
    approvalId: mismatchTarget.approvalId,
    binding: deps.mismatchedBinding,
  });
  if (!blockedWith(mismatched, bindingMismatchFailureCodes)) {
    return failCase("approval-binding-mismatch", "LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME", withExpiry);
  }
  // Matrix column: the refused consume leaves the request unconsumed, so only
  // its CREATED and APPROVED events exist.
  if (!(await eventsAre(mismatchTarget.approvalId, 2))) {
    return failCase("approval-binding-mismatch", "LIVE_DB_APPROVAL_EVENT_COUNT_MISMATCH", withExpiry);
  }
  caseResults.push(pass("approval-binding-mismatch"));

  return { status: "PASSED", caseResults, ...withExpiry };
}

export type ApprovalExpiryDeps = {
  repository: RuntimeApprovalRepository | undefined;
  binding: RuntimeApprovalBinding;
  expiry: { approvalId: string; expiresAtMs: number } | undefined;
  clock: () => number;
  wait: (milliseconds: number) => Promise<void>;
  /** Refuses to sit on a TTL that is further away than ST-B should ever wait. */
  maxWaitMs?: number;
};

/** A second past the instant, so a same-millisecond read cannot race the TTL. */
const EXPIRY_MARGIN_MS = 1_000;
const DEFAULT_MAX_WAIT_MS = 20 * 60 * 1_000;

export type ApprovalExpiryResult = {
  status: "PASSED" | "BLOCKED";
  safeErrorCode?: LiveDbSafeErrorCode;
  caseResults: readonly LiveDbCaseResult[];
};

/**
 * Phase two of APR-02: the expiry case, run once the fixture's TTL has passed.
 *
 * Only `RUNTIME_APPROVAL_EXPIRED` counts. A fixture already transitioned to
 * EXPIRED answers `NOT_APPROVED` instead — the RPC checks terminal status before
 * it checks the clock — so accepting that would hide a TTL that never fired.
 */
export async function runApprovalExpiry(
  deps: ApprovalExpiryDeps,
): Promise<ApprovalExpiryResult> {
  const { repository, expiry } = deps;
  if (!repository) {
    return {
      status: "BLOCKED",
      safeErrorCode: "LIVE_DB_APPROVAL_REPOSITORY_NOT_INJECTED",
      caseResults: [],
    };
  }
  if (!expiry) {
    return {
      status: "BLOCKED",
      safeErrorCode: "LIVE_DB_APPROVAL_EXPIRED_FIXTURE_NOT_INJECTED",
      caseResults: [],
    };
  }

  const maxWaitMs = deps.maxWaitMs ?? DEFAULT_MAX_WAIT_MS;
  const remaining = expiry.expiresAtMs + EXPIRY_MARGIN_MS - deps.clock();
  if (remaining > maxWaitMs) {
    return { status: "BLOCKED", safeErrorCode: "LIVE_DB_EXPIRY_WAIT_EXCEEDED", caseResults: [] };
  }
  if (remaining > 0) await deps.wait(remaining);
  if (deps.clock() <= expiry.expiresAtMs) {
    // The wait did not actually advance the clock past the TTL, so a refusal
    // now would not be attributable to expiry.
    return { status: "BLOCKED", safeErrorCode: "LIVE_DB_EXPIRY_WAIT_EXCEEDED", caseResults: [] };
  }

  const expired = await repository.decide({
    approvalId: expiry.approvalId,
    projectId: deps.binding.projectId,
    userId: deps.binding.userId,
    decision: "APPROVE",
  });
  if (!blockedWith(expired, expiredFailureCodes)) {
    return {
      status: "BLOCKED",
      safeErrorCode: "LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME",
      caseResults: [fail("approval-expiry", "LIVE_DB_APPROVAL_UNEXPECTED_OUTCOME")],
    };
  }
  return { status: "PASSED", caseResults: [pass("approval-expiry")] };
}
