import type { PackageRuntimeEvidenceReference } from "../agents/package-evidence-bundle";
import type { RuntimeExecutionRequest } from "../agents/runtime-execution-request";
import type { RuntimePlan, RuntimeTransientProviderInput } from "../agents/runtime-plan";
import type { RuntimeExecutionResultStatus } from "../agents/runtime-execution-result";

export type ExecuteApprovedProductRuntimeInput = {
  projectId: string;
  approvalRequestId: string;
  runtimeExecutionRequest: RuntimeExecutionRequest;
  runtimePlan: RuntimePlan;
  transientProviderInput: RuntimeTransientProviderInput;
};

export type ProductRuntimeErrorCode =
  | "UNAUTHENTICATED"
  | "PROJECT_ACCESS_DENIED"
  | "INVALID_RUNTIME_REQUEST"
  | "INVALID_RUNTIME_PLAN"
  | "RUNTIME_BINDING_MISMATCH"
  | "APPROVAL_NOT_USABLE"
  | "RUNTIME_EXECUTION_FAILED"
  | "EVIDENCE_PERSISTENCE_FAILED";

export type SafeProductRuntimeResult = {
  executionId?: string;
  status: RuntimeExecutionResultStatus | "FINALIZATION_FAILED";
  runtimeExecutionRequestId: string;
  runtimeExecutionRequestChecksum: string;
  runtimePlanId: string;
  runtimePlanChecksum: string;
  runtimeExecutionResultId?: string;
  runtimeExecutionResultChecksum?: string;
  safeErrorCode?: string;
};

export type ProductRuntimePackageEvidenceProjection = {
  approvalRequestId: string;
  runtimeEvidenceReferences: readonly PackageRuntimeEvidenceReference[];
};

export type ExecuteApprovedProductRuntimeResult =
  | {
      status: "SUCCEEDED" | "FAILED";
      runtimeResult: SafeProductRuntimeResult;
      packageEvidence: ProductRuntimePackageEvidenceProjection;
      failures: [];
    }
  | {
      status: "REJECTED";
      errorCode: ProductRuntimeErrorCode;
      userMessage: string;
      failures: readonly ProductRuntimeErrorCode[];
    };
