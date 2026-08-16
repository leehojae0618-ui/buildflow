import { describe, expect, it } from "vitest";

import {
  classifyRlsError,
  isFunctionRaisedError,
  isMissingObjectError,
} from "./db-safe-error";
import { hasStagingUnsafeValue } from "./staging-evidence";

describe("classifyRlsError", () => {
  it("maps an RLS policy refusal to the policy-violation code", () => {
    expect(
      classifyRlsError({
        code: "42501",
        message: 'new row violates row-level security policy for table "runtime_approval_requests"',
      }),
    ).toBe("LIVE_DB_RLS_POLICY_VIOLATION");
    expect(
      classifyRlsError({ code: "42501", message: "New row violates ROW LEVEL SECURITY policy" }),
    ).toBe("LIVE_DB_RLS_POLICY_VIOLATION");
  });

  it("maps a missing grant to the permission-denied code", () => {
    expect(
      classifyRlsError({ code: "42501", message: "permission denied for function consume_runtime_approval_request" }),
    ).toBe("LIVE_DB_RLS_PERMISSION_DENIED");
    expect(classifyRlsError({ code: "PGRST301", message: "JWT expired" })).toBe(
      "LIVE_DB_RLS_PERMISSION_DENIED",
    );
  });

  it("refuses to treat anything else as denial", () => {
    // These are the shapes that must never be read as "the policy held".
    for (const error of [
      { code: "57014", message: "canceling statement due to statement timeout" },
      { code: "08006", message: "connection failure" },
      { code: "XX000", message: "internal error" },
      { code: "", message: "fetch failed" },
      { message: "no code at all" },
      new Error("network down"),
      undefined,
      null,
      "a bare string",
      42,
    ]) {
      expect(classifyRlsError(error)).toBe("LIVE_DB_RLS_INFRASTRUCTURE_ERROR");
    }
  });

  it("does not treat a message alone as authorization evidence", () => {
    // A message can be attacker- or driver-controlled; only the code admits it.
    expect(
      classifyRlsError({ code: "08006", message: "row-level security policy" }),
    ).toBe("LIVE_DB_RLS_INFRASTRUCTURE_ERROR");
  });

  it("returns nothing derived from the raw message", () => {
    const result = classifyRlsError({
      code: "42501",
      message:
        'permission denied; connection postgresql://postgres:hunter2@db.stagingabc.supabase.co:5432/postgres',
    });
    expect(result).toBe("LIVE_DB_RLS_PERMISSION_DENIED");
    expect(hasStagingUnsafeValue(result)).toBe(false);
  });
});

describe("isMissingObjectError", () => {
  it("recognises a missing table or function", () => {
    expect(isMissingObjectError({ code: "42P01" })).toBe(true);
    expect(isMissingObjectError({ code: "42883" })).toBe(true);
    expect(isMissingObjectError({ code: "PGRST202" })).toBe(true);
    expect(isMissingObjectError({ code: "PGRST205" })).toBe(true);
  });

  it("does not confuse a refusal with an absence", () => {
    expect(isMissingObjectError({ code: "42501" })).toBe(false);
    expect(isMissingObjectError({ code: "P0001" })).toBe(false);
    expect(isMissingObjectError(undefined)).toBe(false);
  });
});

describe("isFunctionRaisedError", () => {
  it("recognises a plpgsql RAISE, which proves the function ran", () => {
    expect(isFunctionRaisedError({ code: "P0001", message: "RUNTIME_APPROVAL_NOT_FOUND" })).toBe(true);
  });

  it("does not accept a missing function as a raise", () => {
    expect(isFunctionRaisedError({ code: "42883" })).toBe(false);
    expect(isFunctionRaisedError(null)).toBe(false);
  });
});
