import { describe, expect, it } from "vitest";
import { buildPackage, previewPackage, validatePackage } from "./builder";
import { createRequirementSnapshot } from "../requirements/snapshot";
import { generateArchitectureCandidates } from "../architecture/candidates";
import { generateBuildPlan } from "../planner/generator";
import { resolveRequiredConnectors } from "../connectors/resolver";
import { createCredentialReferences } from "../credentials/references";

function input() {
  const requirementSnapshot = createRequirementSnapshot("Create a customer support assistant", { automation_level: "AUTO", budget_range: "unknown", current_tools: [] });
  const candidates = generateArchitectureCandidates(requirementSnapshot.requirement, {});
  const architecture = candidates.candidates[0].architecture;
  const connectors = resolveRequiredConnectors(requirementSnapshot.requirement, architecture);
  const intelligence = { buildScore: 70, automation: 70, consent: 0, manual: 0, expert: 0, unsupported: 0, estimatedBuildMinutes: 10, estimatedSetupMinutes: 10, estimatedMonthlyCostCents: 0, difficulty: "easy" as const, riskScore: 10, confidence: 80, requiredAccounts: [], userActions: [], summary: "test" };
  return { projectId: "project-1", title: "Support Assistant", goal: requirementSnapshot.requirement.goalOriginal, author: { name: "Test User" }, snapshot: { ...requirementSnapshot, architecture, architectureCandidates: candidates, connectors, credentialReferences: createCredentialReferences(connectors), buildPlan: generateBuildPlan({ requirement: requirementSnapshot.requirement, architecture, intelligence }) } as never };
}

describe("BPS package builder", () => {
  it("generates manifest and exports snapshots without secret values", () => { const built = buildPackage(input()); expect(built.manifest.id).toContain("com.buildflow.project"); expect(built.manifest.version).toBe("1.0.0"); expect(built.files["package.yaml"]).toContain("compatibility:"); expect(built.files["architecture/architecture-snapshot.json"]).toContain("architecture-v1"); expect(JSON.stringify(built.files)).not.toContain("test-secret-value"); expect(built.files["credentials/definitions.json"]).not.toContain("value"); expect(built.archive.byteLength).toBeGreaterThan(0); });
  it("previews size and reports missing artifacts", () => { const result = previewPackage(input()); expect(result.estimatedSize).toBeGreaterThan(0); expect(result.validation.valid).toBe(true); const invalid = validatePackage(result.manifest, result.artifacts.filter((item) => item.path !== "README.md"), input().snapshot); expect(invalid.valid).toBe(false); expect(invalid.missing).toContain("README.md"); });
});
