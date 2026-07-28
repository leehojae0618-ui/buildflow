import "server-only";
import { createSupabaseAdminClient } from "../../lib/supabase/admin";
import type { Database } from "../../types/database";
import { validateRuntimeApprovalBinding } from "./validator";
import type { RuntimeApprovalRepository, RuntimeApprovalRepositoryResult } from "./repository";
import type {
  ConsumeRuntimeApprovalInput,
  CreateRuntimeApprovalInput,
  DecideRuntimeApprovalInput,
  RuntimeApprovalFailure,
  RuntimeApprovalRequest,
} from "./types";

type ApprovalRow = Database["public"]["Tables"]["runtime_approval_requests"]["Row"];

const failed = (code: RuntimeApprovalFailure["code"]): RuntimeApprovalRepositoryResult<never> => ({
  status: "FAILED",
  failures: [{ code }],
});

function safeRpcFailure(error: unknown, fallback: RuntimeApprovalFailure["code"]) {
  const message = error && typeof error === "object" && "message" in error && typeof error.message === "string"
    ? error.message
    : "";
  const allowed: RuntimeApprovalFailure["code"][] = [
    "RUNTIME_APPROVAL_INVALID",
    "RUNTIME_APPROVAL_NOT_FOUND",
    "RUNTIME_APPROVAL_NOT_AUTHORIZED",
    "RUNTIME_APPROVAL_SCOPE_MISMATCH",
    "RUNTIME_APPROVAL_BINDING_MISMATCH",
    "RUNTIME_APPROVAL_EXPIRED",
    "RUNTIME_APPROVAL_REVOKED",
    "RUNTIME_APPROVAL_CONSUMED",
    "RUNTIME_APPROVAL_NOT_APPROVED",
  ];
  return allowed.find((code) => message.includes(code)) ?? fallback;
}

function mapRow(row: ApprovalRow): RuntimeApprovalRequest {
  return {
    approvalId: row.id,
    projectId: row.project_id,
    userId: row.requester_user_id,
    scope: "CORE_RUNTIME_PROVIDER_EXECUTION",
    status: row.status as RuntimeApprovalRequest["status"],
    runtimeExecutionRequestId: row.runtime_execution_request_id,
    runtimeExecutionRequestChecksum: row.runtime_execution_request_checksum,
    runtimePlanId: row.runtime_plan_id,
    runtimePlanChecksum: row.runtime_plan_checksum,
    provider: "openai",
    model: row.model,
    safeInputChecksum: row.safe_input_checksum,
    bindingChecksum: row.binding_checksum,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    ...(row.approved_at ? { approvedAt: row.approved_at } : {}),
    ...(row.rejected_at ? { rejectedAt: row.rejected_at } : {}),
    ...(row.revoked_at ? { revokedAt: row.revoked_at } : {}),
    ...(row.consumed_at ? { consumedAt: row.consumed_at } : {}),
    ...(row.approved_by_user_id ? { approvedByUserId: row.approved_by_user_id } : {}),
    ...(row.rejected_by_user_id ? { rejectedByUserId: row.rejected_by_user_id } : {}),
    ...(row.revoked_by_user_id ? { revokedByUserId: row.revoked_by_user_id } : {}),
  };
}

function terminalFailure(status: RuntimeApprovalRequest["status"]): RuntimeApprovalFailure["code"] | null {
  if (status === "EXPIRED") return "RUNTIME_APPROVAL_EXPIRED";
  if (status === "REVOKED") return "RUNTIME_APPROVAL_REVOKED";
  if (status === "CONSUMED") return "RUNTIME_APPROVAL_CONSUMED";
  if (status === "REJECTED") return "RUNTIME_APPROVAL_NOT_APPROVED";
  return null;
}

export class SupabaseRuntimeApprovalRepository implements RuntimeApprovalRepository {
  constructor(private readonly client = createSupabaseAdminClient()) {}

  private async read(id: string, projectId: string, userId: string): Promise<RuntimeApprovalRequest | null | undefined> {
    try {
      const { data, error } = await this.client
        .from("runtime_approval_requests")
        .select("*")
        .eq("id", id)
        .eq("project_id", projectId)
        .eq("requester_user_id", userId)
        .maybeSingle();
      return error || !data ? null : mapRow(data);
    } catch {
      return undefined;
    }
  }

  async get(approvalId: string, projectId: string, userId: string) {
    const value = await this.read(approvalId, projectId, userId);
    if (value === undefined) return failed("RUNTIME_APPROVAL_PERSISTENCE_FAILED");
    return value ? { status: "OK" as const, value, failures: [] as [] } : failed("RUNTIME_APPROVAL_NOT_FOUND");
  }

  async create(input: CreateRuntimeApprovalInput) {
    if (!validateRuntimeApprovalBinding(input.binding)) {
      return failed("RUNTIME_APPROVAL_INVALID");
    }
    let data: string | null;
    let error: unknown;
    try {
      ({ data, error } = await this.client.rpc("create_runtime_approval_request", {
        p_project_id: input.binding.projectId,
        p_user_id: input.binding.userId,
        p_scope: input.binding.scope,
        p_runtime_execution_request_id: input.binding.runtimeExecutionRequestId,
        p_runtime_execution_request_checksum: input.binding.runtimeExecutionRequestChecksum,
        p_runtime_plan_id: input.binding.runtimePlanId,
        p_runtime_plan_checksum: input.binding.runtimePlanChecksum,
        p_provider: input.binding.provider,
        p_model: input.binding.model,
        p_safe_input_checksum: input.binding.safeInputChecksum,
        p_binding_checksum: input.binding.bindingChecksum,
      }));
    } catch {
      return failed("RUNTIME_APPROVAL_PERSISTENCE_FAILED");
    }
    if (error || !data) return failed(safeRpcFailure(error, "RUNTIME_APPROVAL_PERSISTENCE_FAILED"));
    const value = await this.read(data, input.binding.projectId, input.binding.userId);
    return value ? { status: "OK" as const, value, failures: [] as [] } : failed("RUNTIME_APPROVAL_PERSISTENCE_FAILED");
  }

  async decide(input: DecideRuntimeApprovalInput) {
    let data: string | null;
    let error: unknown;
    try {
      ({ data, error } = await this.client.rpc("decide_runtime_approval_request", {
        p_approval_id: input.approvalId,
        p_project_id: input.projectId,
        p_user_id: input.userId,
        p_decision: input.decision,
      }));
    } catch {
      return failed("RUNTIME_APPROVAL_PERSISTENCE_FAILED");
    }
    if (error || !data) return failed(safeRpcFailure(error, "RUNTIME_APPROVAL_NOT_APPROVED"));
    const value = await this.read(input.approvalId, input.projectId, input.userId);
    if (!value) return failed("RUNTIME_APPROVAL_PERSISTENCE_FAILED");
    // Rejection and revocation are successfully persisted decisions. Expiry is
    // the only terminal state that may occur instead of the requested decision.
    return value.status === "EXPIRED"
      ? failed("RUNTIME_APPROVAL_EXPIRED")
      : { status: "OK" as const, value, failures: [] as [] };
  }

  async consume(input: ConsumeRuntimeApprovalInput) {
    if (!validateRuntimeApprovalBinding(input.binding)) return failed("RUNTIME_APPROVAL_INVALID");
    let data: string | null;
    let error: unknown;
    try {
      ({ data, error } = await this.client.rpc("consume_runtime_approval_request", {
        p_approval_id: input.approvalId,
        p_project_id: input.binding.projectId,
        p_user_id: input.binding.userId,
        p_scope: input.binding.scope,
        p_runtime_execution_request_id: input.binding.runtimeExecutionRequestId,
        p_runtime_execution_request_checksum: input.binding.runtimeExecutionRequestChecksum,
        p_runtime_plan_id: input.binding.runtimePlanId,
        p_runtime_plan_checksum: input.binding.runtimePlanChecksum,
        p_provider: input.binding.provider,
        p_model: input.binding.model,
        p_safe_input_checksum: input.binding.safeInputChecksum,
        p_binding_checksum: input.binding.bindingChecksum,
      }));
    } catch {
      return failed("RUNTIME_APPROVAL_PERSISTENCE_FAILED");
    }
    if (error || !data) return failed(safeRpcFailure(error, "RUNTIME_APPROVAL_NOT_APPROVED"));
    const value = await this.read(input.approvalId, input.binding.projectId, input.binding.userId);
    if (!value) return failed("RUNTIME_APPROVAL_PERSISTENCE_FAILED");
    return value.status === "CONSUMED"
      ? { status: "OK" as const, value, failures: [] as [] }
      : failed(terminalFailure(value.status) ?? "RUNTIME_APPROVAL_NOT_APPROVED");
  }
}
