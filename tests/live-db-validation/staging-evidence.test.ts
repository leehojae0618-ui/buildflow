import { describe, expect, it } from "vitest";

import { createLiveDbStagingEvidenceSummary, hasStagingUnsafeValue } from "./staging-evidence";
import type { LiveDbCaseResult } from "./types";

const caseResults: readonly LiveDbCaseResult[] = [
  { caseId: "approval-create", executionStatus: "EXECUTED_PASS", verdict: "PASS" },
  { caseId: "rls-anon-denied", executionStatus: "EXECUTED_PASS", verdict: "PASS" },
  { caseId: "product-runtime-fake-provider", executionStatus: "SKIPPED_REQUIRES_STAGING", verdict: "SKIPPED" },
];

const safeCases = [
  {
    caseId: "rls-anon-denied",
    actorClass: "ANONYMOUS",
    expectedResult: "anonymous access is denied",
    actualSafeResult: "denied",
    verdict: "PASS" as const,
    rowCount: 0,
  },
];

const build = (overrides: Partial<Parameters<typeof createLiveDbStagingEvidenceSummary>[0]> = {}) =>
  createLiveDbStagingEvidenceSummary({
    validationRunId: "live-db-validation-001-staging",
    maskedProjectRef: "stag…gabc",
    migrationApplied: true,
    appliedMigrationCount: 20,
    caseResults,
    cases: safeCases,
    timestamp: "2026-08-17T00:00:00.000Z",
    verdict: "PASS",
    ...overrides,
  });

/** The safe summary, asserted to be safe so a regression fails here loudly. */
const summary = () => {
  const result = build();
  if (result.status !== "SAFE") throw new Error("expected a SAFE evidence result");
  return result.summary;
};

describe("hasStagingUnsafeValue", () => {
  it("detects database URLs, which embed the password", () => {
    expect(
      hasStagingUnsafeValue({ note: "postgresql://postgres:pw@db.abc.supabase.co:5432/postgres" }),
    ).toBe(true);
    expect(hasStagingUnsafeValue({ note: "postgres://postgres:pw@db.abc.supabase.co:5432/postgres" })).toBe(true);
  });

  it("detects JWTs, publishable and service keys, and bearer tokens", () => {
    expect(
      hasStagingUnsafeValue({ key: "eyJhbGciOiJIUzI1NiIs.eyJyb2xlIjoiYW5vbiJ9.signature" }),
    ).toBe(true);
    expect(hasStagingUnsafeValue({ key: "sb_secret_abcdefgh1234" })).toBe(true);
    expect(hasStagingUnsafeValue({ key: "sb_publishable_abcdefgh1234" })).toBe(true);
    expect(hasStagingUnsafeValue({ role: "service_role" })).toBe(true);
    expect(hasStagingUnsafeValue({ key: "sk-abcdefgh1234" })).toBe(true);
    expect(hasStagingUnsafeValue({ header: "Bearer abcdefgh.1234" })).toBe(true);
  });

  it("detects a full project URL", () => {
    expect(hasStagingUnsafeValue({ url: "https://stagingabc.supabase.co" })).toBe(true);
  });

  it("detects a full project ref only when it is named as forbidden", () => {
    const value = { ref: "stagingabc" };
    expect(hasStagingUnsafeValue(value)).toBe(false);
    expect(hasStagingUnsafeValue(value, { forbiddenProjectRefs: ["stagingabc"] })).toBe(true);
    expect(hasStagingUnsafeValue(value, { forbiddenProjectRefs: ["StagingABC"] })).toBe(true);
  });

  it("does not reject legitimate masked refs or binding checksums", () => {
    expect(
      hasStagingUnsafeValue(
        { maskedProjectRef: "stag…gabc", bindingChecksum: "9f2c4b7ae1d0c3f58b6a" },
        { forbiddenProjectRefs: ["productionxyz"] },
      ),
    ).toBe(false);
  });

  it("ignores an empty forbidden ref rather than matching everything", () => {
    expect(hasStagingUnsafeValue({ note: "safe" }, { forbiddenProjectRefs: ["", "  "] })).toBe(false);
  });
});

describe("createLiveDbStagingEvidenceSummary", () => {
  it("builds a summary from safe fields and partitions case ids", () => {
    expect(summary()).toMatchObject({
      validationRunId: "live-db-validation-001-staging",
      targetEnvironment: "staging",
      maskedProjectRef: "stag…gabc",
      actorType: "HARNESS",
      externalProviderCallCount: 0,
      executionMode: "STAGING",
      migrationApplied: true,
      appliedMigrationCount: 20,
      timestamp: "2026-08-17T00:00:00.000Z",
      executedCaseIds: ["approval-create", "rls-anon-denied"],
      failedCaseIds: [],
      skippedCaseIds: ["product-runtime-fake-provider"],
      secretExposureDetected: false,
      verdict: "PASS",
    });
  });

  it("carries only the allowed evidence fields per case", () => {
    const [entry] = summary().cases;
    expect(Object.keys(entry).sort()).toEqual(
      ["actorClass", "actualSafeResult", "caseId", "expectedResult", "rowCount", "verdict"].sort(),
    );
  });

  it("contains no unsafe value, including the staging project ref", () => {
    expect(
      hasStagingUnsafeValue(summary(), { forbiddenProjectRefs: ["stagingabc", "productionxyz"] }),
    ).toBe(false);
  });

  it("freezes the summary and its cases so evidence cannot be mutated after the fact", () => {
    const evidence = summary();
    expect(Object.isFrozen(evidence)).toBe(true);
    expect(Object.isFrozen(evidence.cases[0])).toBe(true);
  });

  it("reports SAFE only after scanning the summary it is about to return", () => {
    expect(build().status).toBe("SAFE");
  });

  it("fails closed when a caller puts a database URL into a case result", () => {
    const result = build({
      cases: [
        {
          ...safeCases[0],
          actualSafeResult: "failed: postgresql://postgres:pw@db.stagingabc.supabase.co:5432/postgres",
        },
      ],
    });
    expect(result.status).toBe("UNSAFE");
    expect(result.status === "UNSAFE" && result.safeErrorCode).toBe("LIVE_DB_SECRET_EXPOSURE_DETECTED");
  });

  it("fails closed on a raw JWT or a service_role mention in evidence", () => {
    expect(
      build({
        cases: [{ ...safeCases[0], actualSafeResult: "eyJhbGciOiJIUzI1NiIs.eyJyb2xlIjoiYW5vbiJ9.sig" }],
      }).status,
    ).toBe("UNSAFE");
    expect(
      build({ cases: [{ ...safeCases[0], actualSafeResult: "denied for service_role" }] }).status,
    ).toBe("UNSAFE");
  });

  it("fails closed when the full project ref leaks through a supposedly masked field", () => {
    const result = build({
      maskedProjectRef: "stagingabc",
      forbiddenProjectRefs: ["stagingabc"],
    });
    expect(result.status).toBe("UNSAFE");
  });

  it("redacts rather than republishes the unsafe value it just detected", () => {
    const result = build({
      cases: [{ ...safeCases[0], actualSafeResult: "sb_secret_abcdefgh1234" }],
    });
    expect(result.status).toBe("UNSAFE");
    expect(result.summary).toMatchObject({
      validationRunId: "unavailable",
      maskedProjectRef: "unavailable",
      migrationApplied: false,
      appliedMigrationCount: 0,
      cases: [],
      executedCaseIds: [],
      failedCaseIds: [],
      skippedCaseIds: [],
      secretExposureDetected: true,
      verdict: "FAIL",
    });
    expect(hasStagingUnsafeValue(result.summary)).toBe(false);
  });
});
