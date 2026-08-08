import { describe, expect, it } from "vitest";
import { noKeyN8nPackage } from "./fixtures";
import { validateN8nImportReadiness } from "./n8n-import-readiness";

describe("n8n Import Readiness", () => {
  it("passes the deterministic credential-free No-Key workflow schema", () => {
    if (noKeyN8nPackage.artifact.kind !== "N8N_WORKFLOW_EXPORT") throw new Error("unexpected artifact");
    const { workflow, importReadiness } = noKeyN8nPackage.artifact;
    expect(importReadiness).toMatchObject({ status: "PASS", realPlatformValidation: "REQUIRES_REAL_PLATFORM_VALIDATION", issues: [] });
    expect(workflow).toMatchObject({ name: expect.any(String), settings: { executionOrder: "v1" }, active: false });
    expect(workflow.nodes).toHaveLength(4);
    expect(new Set(workflow.nodes.map((node) => node.name)).size).toBe(workflow.nodes.length);
    for (const node of workflow.nodes) {
      expect(node).toMatchObject({ id: expect.any(String), name: expect.any(String), parameters: expect.any(Object), type: expect.any(String), typeVersion: expect.any(Number), position: expect.any(Array) });
      expect(node.position).toHaveLength(2);
    }
    expect(workflow.connections["Approval Gate"].main).toHaveLength(2);
    expect(JSON.stringify(workflow)).not.toMatch(/credentials|sk-|Bearer\s|password=/i);
  });

  it("rejects missing node fields, duplicates, and unsafe node types", () => {
    if (noKeyN8nPackage.artifact.kind !== "N8N_WORKFLOW_EXPORT") throw new Error("unexpected artifact");
    const workflow = noKeyN8nPackage.artifact.workflow;
    const malformed = {
      ...workflow,
      nodes: [{ ...workflow.nodes[0], id: "", name: "Duplicate" }, { ...workflow.nodes[1], name: "Duplicate", type: "n8n-nodes-base.unknown" as never, position: [] as never }],
    };
    expect(validateN8nImportReadiness(malformed as typeof workflow)).toMatchObject({
      status: "FAILED",
      issues: expect.arrayContaining(["NODE_ID_MISSING", "NODE_NAME_DUPLICATE", "NODE_TYPE_UNKNOWN", "NODE_POSITION_INVALID"]),
    });
  });

  it("rejects dangling or malformed main connections and secret-shaped parameters", () => {
    if (noKeyN8nPackage.artifact.kind !== "N8N_WORKFLOW_EXPORT") throw new Error("unexpected artifact");
    const workflow = noKeyN8nPackage.artifact.workflow;
    const malformed = {
      ...workflow,
      nodes: [{ ...workflow.nodes[0], parameters: { authorization: "not-allowed" } }, ...workflow.nodes.slice(1)],
      connections: { "Missing Source": { main: [[{ node: "Missing Target", type: "other", index: 1 }]] } },
    };
    expect(validateN8nImportReadiness(malformed as typeof workflow)).toMatchObject({
      status: "FAILED",
      issues: expect.arrayContaining(["NODE_PARAMETERS_CONTAIN_SENSITIVE_VALUE", "CONNECTION_SOURCE_MISSING", "CONNECTION_TYPE_INVALID", "CONNECTION_INDEX_INVALID", "CONNECTION_TARGET_MISSING"]),
    });
  });
});
