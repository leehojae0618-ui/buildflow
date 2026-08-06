import { buildExternalBuilderTransportRequest, runMockClient } from "../client/runner";
import type { DryRunPreview, ExternalBuilderClientConfig, ExternalBuilderClientResult, ExternalBuilderOperation, ExternalBuilderRequestContext, ExternalBuilderTransport } from "../client/types";
import type { MakeScenarioPreview } from "./compiler";

type MakeClientInput = {
  config: ExternalBuilderClientConfig;
  operation: ExternalBuilderOperation;
  context: ExternalBuilderRequestContext;
  artifact?: MakeScenarioPreview;
  transport?: ExternalBuilderTransport;
  now?: string;
};

function makeOperationRequest(input: MakeClientInput) {
  if (input.config.platform !== "MAKE") throw new Error("MAKE_PLATFORM_REQUIRED");
  const path: Readonly<Record<ExternalBuilderOperation, string>> = {
    CREATE: "/scenarios",
    GET: "/scenarios",
    ACTIVATE: "/scenarios/activation",
    DEACTIVATE: "/scenarios/deactivation",
    EXECUTE: "/scenarios/executions",
    GET_EXECUTION: "/scenario-executions",
    GET_EXECUTION_LOGS: "/scenario-execution-logs",
  };
  const method: "GET" | "POST" = input.operation === "GET" || input.operation === "GET_EXECUTION" || input.operation === "GET_EXECUTION_LOGS" ? "GET" : "POST";
  return {
    ...input,
    method,
    path: path[input.operation],
    ...(input.artifact === undefined ? {} : { body: { previewFormat: input.artifact.format, scenario: input.artifact } }),
    warnings: ["MAKE_ENDPOINT_AND_SCHEMA_REQUIRE_REAL_PLATFORM_VALIDATION"],
  };
}

export function createMakeDryRun(input: MakeClientInput): DryRunPreview {
  const prepared = makeOperationRequest({ ...input, config: { ...input.config, dryRun: true }, context: { ...input.context, dryRun: true } });
  const request = buildExternalBuilderTransportRequest(prepared);
  return {
    platform: "MAKE",
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

export function runMakeClient(input: MakeClientInput): Promise<DryRunPreview | ExternalBuilderClientResult> {
  return runMockClient(makeOperationRequest(input));
}
