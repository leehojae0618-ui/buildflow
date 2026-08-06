import { buildExternalBuilderTransportRequest, runMockClient } from "../client/runner";
import type { DryRunPreview, ExternalBuilderClientConfig, ExternalBuilderClientResult, ExternalBuilderOperation, ExternalBuilderRequestContext, ExternalBuilderTransport } from "../client/types";
import type { N8nWorkflowPreview } from "./compiler";

type N8nClientInput = {
  config: ExternalBuilderClientConfig;
  operation: ExternalBuilderOperation;
  context: ExternalBuilderRequestContext;
  artifact?: N8nWorkflowPreview;
  transport?: ExternalBuilderTransport;
  now?: string;
};

function n8nOperationRequest(input: N8nClientInput) {
  if (input.config.platform !== "N8N") throw new Error("N8N_PLATFORM_REQUIRED");
  const path: Readonly<Record<ExternalBuilderOperation, string>> = {
    CREATE: "/workflows",
    GET: "/workflows",
    ACTIVATE: "/workflows/activation",
    DEACTIVATE: "/workflows/deactivation",
    EXECUTE: "/workflows/executions",
    GET_EXECUTION: "/executions",
    GET_EXECUTION_LOGS: "/execution-logs",
  };
  const method: "GET" | "POST" = input.operation === "GET" || input.operation === "GET_EXECUTION" || input.operation === "GET_EXECUTION_LOGS" ? "GET" : "POST";
  return {
    ...input,
    method,
    path: path[input.operation],
    ...(input.artifact === undefined ? {} : { body: { previewFormat: input.artifact.format, workflow: input.artifact } }),
    warnings: ["N8N_ENDPOINT_AND_SCHEMA_REQUIRE_REAL_PLATFORM_VALIDATION", "N8N_BASE_URL_SSRF_POLICY_IS_FOUNDATIONAL_ONLY"],
  };
}

export function createN8nDryRun(input: N8nClientInput): DryRunPreview {
  const prepared = n8nOperationRequest({ ...input, config: { ...input.config, dryRun: true }, context: { ...input.context, dryRun: true } });
  const request = buildExternalBuilderTransportRequest(prepared);
  return {
    platform: "N8N",
    operation: prepared.operation,
    method: request.method,
    sanitizedUrl: request.url,
    headerNames: Object.keys(request.headers).sort(),
    credentialReference: prepared.context.credentialReference,
    ...(request.body === undefined ? {} : { sanitizedBody: request.body }),
    approvalRequired: ["CREATE", "ACTIVATE", "DEACTIVATE", "EXECUTE"].includes(prepared.operation),
    approvalReferencePresent: Boolean(prepared.context.approvalReference),
    networkCallPerformed: false,
    actualExternalAction: false,
    warnings: prepared.warnings,
  };
}

export function runN8nClient(input: N8nClientInput): Promise<DryRunPreview | ExternalBuilderClientResult> {
  return runMockClient(n8nOperationRequest(input));
}
