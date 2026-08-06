import type { DryRunPreview, ExternalBuilderOperation, ExternalBuilderRequestContext, ExternalBuilderTransportRequest } from "./types";

const approvalOperations = new Set<ExternalBuilderOperation>(["CREATE", "ACTIVATE", "DEACTIVATE", "EXECUTE"]);

export function operationRequiresApproval(operation: ExternalBuilderOperation): boolean {
  return approvalOperations.has(operation);
}

export function createDryRunPreview(
  platform: DryRunPreview["platform"],
  operation: ExternalBuilderOperation,
  request: ExternalBuilderTransportRequest,
  context: ExternalBuilderRequestContext,
  warnings: readonly string[],
): DryRunPreview {
  return {
    platform,
    operation,
    method: request.method,
    sanitizedUrl: request.url,
    headerNames: Object.keys(request.headers).sort(),
    credentialReference: context.credentialReference,
    ...(request.body === undefined ? {} : { sanitizedBody: request.body }),
    approvalRequired: operationRequiresApproval(operation),
    approvalReferencePresent: Boolean(context.approvalReference),
    networkCallPerformed: false,
    actualExternalAction: false,
    warnings,
  };
}
