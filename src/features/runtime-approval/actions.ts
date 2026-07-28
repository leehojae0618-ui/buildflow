"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RuntimeExecutionRequest } from "../agents/runtime-execution-request";
import type { RuntimePlan } from "../agents/runtime-plan";
import { SupabaseRuntimeApprovalRepository } from "./runtime-approval-supabase";
import { buildRuntimeApprovalBinding } from "./validator";

async function owned(projectId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();
  return project ? { user } : null;
}

/** Server-only foundation action. It prepares approval state; it never invokes a provider. */
export async function createRuntimeApprovalRequest(
  projectId: string,
  runtimeExecutionRequest: RuntimeExecutionRequest,
  runtimePlan: RuntimePlan,
) {
  try {
    const access = await owned(projectId);
    if (!access) return { ok: false as const, error: "NOT_AUTHORIZED" };
    const binding = buildRuntimeApprovalBinding({
      projectId,
      userId: access.user.id,
      runtimeExecutionRequest,
      runtimePlan,
    });
    if (binding.status !== "VALID") return { ok: false as const, error: "RUNTIME_APPROVAL_INVALID" };
    const result = await new SupabaseRuntimeApprovalRepository().create({
      binding: binding.value,
    });
    return result.status === "OK"
      ? { ok: true as const, approval: result.value }
      : { ok: false as const, error: result.failures[0]?.code ?? "RUNTIME_APPROVAL_PERSISTENCE_FAILED" };
  } catch {
    return { ok: false as const, error: "RUNTIME_APPROVAL_PERSISTENCE_FAILED" };
  }
}

/** No UI is added in this sprint; this action is the server-only future approval seam. */
export async function decideRuntimeApprovalRequest(
  projectId: string,
  approvalId: string,
  decision: "APPROVE" | "REJECT" | "REVOKE",
) {
  try {
    const access = await owned(projectId);
    if (!access) return { ok: false as const, error: "NOT_AUTHORIZED" };
    const result = await new SupabaseRuntimeApprovalRepository().decide({
      approvalId,
      projectId,
      userId: access.user.id,
      decision,
    });
    return result.status === "OK"
      ? { ok: true as const, approval: result.value }
      : { ok: false as const, error: result.failures[0]?.code ?? "RUNTIME_APPROVAL_PERSISTENCE_FAILED" };
  } catch {
    return { ok: false as const, error: "RUNTIME_APPROVAL_PERSISTENCE_FAILED" };
  }
}
