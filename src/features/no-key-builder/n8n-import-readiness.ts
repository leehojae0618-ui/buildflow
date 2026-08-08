import type { N8nImportReadiness, N8nImportWorkflow } from "./types";

const allowedNodeTypes = new Set([
  "n8n-nodes-base.manualTrigger",
  "n8n-nodes-base.set",
  "n8n-nodes-base.if",
]);

const sensitiveKey = /api.?key|authorization|bearer|cookie|oauth|password|private.?key|refresh.?token|secret|token/i;
const sensitiveValue = /(?:sk-[A-Za-z0-9_-]{20,}|bearer\s+[A-Za-z0-9._~+/=-]{10,}|authorization\s*:|cookie\s*=|password\s*=|oauth|refresh_token|private key)/i;

function containsSensitiveValue(value: unknown, key = ""): boolean {
  if (sensitiveKey.test(key) && value !== undefined && value !== null && value !== "") return true;
  if (typeof value === "string") return sensitiveValue.test(value);
  if (Array.isArray(value)) return value.some((item) => containsSensitiveValue(item));
  if (value && typeof value === "object") {
    return Object.entries(value).some(([childKey, childValue]) => containsSensitiveValue(childValue, childKey));
  }
  return false;
}

export function validateN8nImportReadiness(workflow: N8nImportWorkflow): N8nImportReadiness {
  const issues: string[] = [];
  if (!workflow.name.trim()) issues.push("WORKFLOW_NAME_MISSING");
  if (!Array.isArray(workflow.nodes) || workflow.nodes.length === 0) issues.push("WORKFLOW_NODES_MISSING");
  if (workflow.active !== false) issues.push("WORKFLOW_MUST_BE_INACTIVE");

  const nodeNames = new Set<string>();
  const nodesByName = new Map(workflow.nodes.map((node) => [node.name, node]));
  for (const node of workflow.nodes) {
    if (!node.id) issues.push("NODE_ID_MISSING");
    if (!node.name) issues.push("NODE_NAME_MISSING");
    if (nodeNames.has(node.name)) issues.push("NODE_NAME_DUPLICATE");
    nodeNames.add(node.name);
    if (!node.parameters || typeof node.parameters !== "object" || Array.isArray(node.parameters)) issues.push("NODE_PARAMETERS_INVALID");
    if (!allowedNodeTypes.has(node.type)) issues.push("NODE_TYPE_UNKNOWN");
    if (!Number.isFinite(node.typeVersion) || node.typeVersion <= 0) issues.push("NODE_TYPE_VERSION_INVALID");
    if (!Array.isArray(node.position) || node.position.length !== 2 || !node.position.every(Number.isFinite)) issues.push("NODE_POSITION_INVALID");
    if (containsSensitiveValue(node.parameters)) issues.push("NODE_PARAMETERS_CONTAIN_SENSITIVE_VALUE");
    if ("credentials" in node && containsSensitiveValue((node as unknown as Record<string, unknown>).credentials, "credentials")) issues.push("NODE_CREDENTIALS_CONTAIN_VALUE");
  }

  for (const [sourceName, connection] of Object.entries(workflow.connections)) {
    if (!nodesByName.has(sourceName)) issues.push("CONNECTION_SOURCE_MISSING");
    if (!connection || !Array.isArray(connection.main)) {
      issues.push("CONNECTION_MAIN_INVALID");
      continue;
    }
    for (const branch of connection.main) {
      if (!Array.isArray(branch)) {
        issues.push("CONNECTION_BRANCH_INVALID");
        continue;
      }
      for (const target of branch) {
        if (!target || target.type !== "main") issues.push("CONNECTION_TYPE_INVALID");
        if (target?.index !== 0) issues.push("CONNECTION_INDEX_INVALID");
        if (!nodesByName.has(target?.node)) issues.push("CONNECTION_TARGET_MISSING");
        if (nodesByName.get(target?.node)?.type === "n8n-nodes-base.manualTrigger") issues.push("CONNECTION_TARGET_IS_TRIGGER");
      }
    }
  }

  return {
    status: issues.length === 0 ? "PASS" : "FAILED",
    realPlatformValidation: "REQUIRES_REAL_PLATFORM_VALIDATION",
    issues: [...new Set(issues)],
  };
}
