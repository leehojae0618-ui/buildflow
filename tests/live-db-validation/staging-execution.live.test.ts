import { describe, expect, it } from "vitest";

import { runStagingValidationEntrypoint } from "./staging-entrypoint";
import { hasStagingUnsafeValue } from "./staging-evidence";

/**
 * The ST-B execution entrypoint, wired to the existing Vitest runner per
 * `HARNESS_SCOPE.md`'s "package scripts invoke the existing runner only" rule.
 *
 * It is inert by default. Running it requires two separate switches, neither of
 * which is set anywhere in this repository:
 *
 *   LIVE_DB_EXECUTION_CONFIRMED=true  the standing contract switch
 *   LIVE_DB_ST_B_EXECUTE=true         this gate's own switch
 *
 * Two are used rather than one because `LIVE_DB_EXECUTION_CONFIRMED` is also
 * what the guard checks for a mere connection; ST-B applies a migration and
 * writes rows, so it gets a switch that means only that. With either unset this
 * file skips, which is why `npm test` can run it in CI without touching a
 * database.
 */
const executionRequested =
  process.env.LIVE_DB_EXECUTION_CONFIRMED === "true" &&
  process.env.LIVE_DB_ST_B_EXECUTE === "true";

describe.skipIf(!executionRequested)("ST-B staging execution", () => {
  it("runs the full staging validation and returns safe evidence", async () => {
    const result = await runStagingValidationEntrypoint();

    // The evidence is the deliverable; the assertion only confirms it is safe
    // and that the run reached a verdict rather than throwing.
    expect(result.evidence).toBeDefined();
    expect(hasStagingUnsafeValue(result)).toBe(false);
    expect(result.evidence?.secretExposureDetected).toBe(false);
    expect(["PASSED", "BLOCKED"]).toContain(result.status);

    // Printed for the ST-E evidence audit. Every field is already safe by
    // construction, and the line above proves it before anything is written.
    console.info(JSON.stringify(result.evidence, null, 2));

    expect(result.status).toBe("PASSED");
  }, 25 * 60 * 1000);
});

describe.skipIf(executionRequested)("ST-B staging execution guard", () => {
  it("stays inert unless both execution switches are set", () => {
    expect(executionRequested).toBe(false);
  });
});
