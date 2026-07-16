import { describe, expect, it } from "vitest";
import { createRequirementSnapshot } from "../requirements/snapshot";
import { createCredentialReferences } from "./references";
import { resolveRequiredConnectors } from "../connectors/resolver";
import { parseGoal } from "../requirements/goal-parser";
import { selectArchitecture } from "../architecture/selector";

describe("credential references", () => {
  it("keeps connector references metadata-only", () => {
    const requirement = parseGoal("단순 챗봇");
    const connectors = resolveRequiredConnectors(requirement, selectArchitecture(requirement));
    const refs = createCredentialReferences(connectors);
    expect(refs.every((ref) => ref.configured === false && ref.status === "MISSING")).toBe(true);
    expect(JSON.stringify(refs)).not.toContain("api_key");
  });
  it("does not place raw secret values in a requirement snapshot", () => {
    const snapshot = createRequirementSnapshot("단순 챗봇");
    const serialized = JSON.stringify(snapshot);
    expect(serialized).not.toContain("sk-test");
    expect(serialized).not.toContain("secret");
    expect(snapshot.credentialReferences[0]).toMatchObject({ configured: false, status: "MISSING" });
  });
});
