import { describe, expect, it, vi } from "vitest";

import {
  runRlsValidation,
  type LiveDbRlsActor,
  type LiveDbRlsReadOutcome,
} from "./rls-validation-runner";
import { hasStagingUnsafeValue } from "./staging-evidence";

const approvalId = "approval-under-test";

const actor = (
  actorClass: LiveDbRlsActor["actorClass"],
  outcome: LiveDbRlsReadOutcome,
): LiveDbRlsActor => ({ actorClass, read: vi.fn(async () => outcome) });

const allowed = (rowCount = 1): LiveDbRlsReadOutcome => ({ status: "READ", rowCount });
const filteredOut: LiveDbRlsReadOutcome = { status: "READ", rowCount: 0 };
const rejected: LiveDbRlsReadOutcome = {
  status: "REJECTED",
  safeErrorCode: "LIVE_DB_RLS_ACCESS_VIOLATION",
};

const passingActors = () => [
  actor("OWNER", allowed()),
  actor("OTHER_AUTHENTICATED", filteredOut),
  actor("ANONYMOUS", rejected),
];

describe("ST-B RLS validation runner (RLS-01..03)", () => {
  it("fails closed when the actor set is missing or incomplete", async () => {
    expect(await runRlsValidation({ approvalId, actors: undefined })).toEqual({
      status: "BLOCKED",
      safeErrorCode: "LIVE_DB_RLS_ACTOR_NOT_INJECTED",
      caseResults: [],
    });
    expect(
      await runRlsValidation({ approvalId, actors: [actor("OWNER", allowed())] }),
    ).toMatchObject({ safeErrorCode: "LIVE_DB_RLS_ACTOR_NOT_INJECTED" });
  });

  it("rejects a duplicated actor class instead of silently collapsing actors", async () => {
    const result = await runRlsValidation({
      approvalId,
      actors: [actor("OWNER", allowed()), actor("OWNER", allowed()), actor("ANONYMOUS", rejected)],
    });
    expect(result).toMatchObject({ safeErrorCode: "LIVE_DB_RLS_ACTOR_CLASS_INVALID" });
  });

  it("passes when owner reads and both other actors are denied", async () => {
    const actors = passingActors();
    const result = await runRlsValidation({ approvalId, actors });

    expect(result.status).toBe("PASSED");
    expect(result.caseResults).toEqual([
      { caseId: "rls-owner-read", executionStatus: "EXECUTED_PASS", verdict: "PASS" },
      { caseId: "rls-cross-user-denied", executionStatus: "EXECUTED_PASS", verdict: "PASS" },
      { caseId: "rls-anon-denied", executionStatus: "EXECUTED_PASS", verdict: "PASS" },
    ]);
    for (const item of actors) {
      expect(item.read).toHaveBeenCalledWith(approvalId);
    }
  });

  it("treats a zero-row read as denial, which is how RLS refuses a SELECT", async () => {
    const result = await runRlsValidation({
      approvalId,
      actors: [
        actor("OWNER", allowed()),
        actor("OTHER_AUTHENTICATED", filteredOut),
        actor("ANONYMOUS", filteredOut),
      ],
    });
    expect(result.status).toBe("PASSED");
  });

  it("reports an access violation when another authenticated user can read the record", async () => {
    const result = await runRlsValidation({
      approvalId,
      actors: [
        actor("OWNER", allowed()),
        actor("OTHER_AUTHENTICATED", allowed()),
        actor("ANONYMOUS", rejected),
      ],
    });
    expect(result.status).toBe("BLOCKED");
    expect(result.safeErrorCode).toBe("LIVE_DB_RLS_ACCESS_VIOLATION");
    expect(result.caseResults).toContainEqual({
      caseId: "rls-cross-user-denied",
      executionStatus: "EXECUTED_FAIL",
      verdict: "FAIL",
      safeErrorCode: "LIVE_DB_RLS_ACCESS_VIOLATION",
    });
  });

  it("reports an access violation when anonymous access succeeds", async () => {
    const result = await runRlsValidation({
      approvalId,
      actors: [
        actor("OWNER", allowed()),
        actor("OTHER_AUTHENTICATED", rejected),
        actor("ANONYMOUS", allowed()),
      ],
    });
    expect(result.status).toBe("BLOCKED");
    expect(result.caseResults).toContainEqual({
      caseId: "rls-anon-denied",
      executionStatus: "EXECUTED_FAIL",
      verdict: "FAIL",
      safeErrorCode: "LIVE_DB_RLS_ACCESS_VIOLATION",
    });
  });

  it("fails the owner case when the owner cannot read their own record", async () => {
    const result = await runRlsValidation({
      approvalId,
      actors: [
        actor("OWNER", filteredOut),
        actor("OTHER_AUTHENTICATED", rejected),
        actor("ANONYMOUS", rejected),
      ],
    });
    expect(result.status).toBe("BLOCKED");
    expect(result.caseResults[0]).toMatchObject({ caseId: "rls-owner-read", verdict: "FAIL" });
  });

  it("evaluates every actor even after one fails, and leaks nothing", async () => {
    const actors = [
      actor("OWNER", filteredOut),
      actor("OTHER_AUTHENTICATED", allowed()),
      actor("ANONYMOUS", rejected),
    ];
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = await runRlsValidation({ approvalId, actors });

    expect(result.caseResults).toHaveLength(3);
    for (const item of actors) {
      expect(item.read).toHaveBeenCalledOnce();
    }
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(hasStagingUnsafeValue(result)).toBe(false);
    fetchSpy.mockRestore();
  });
});
