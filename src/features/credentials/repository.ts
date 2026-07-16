import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProvisioningCredentialProvider } from "./provider-payload";

async function ownedProject(projectId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();
  return project ? { supabase, user } : null;
}

export async function listProviderCredentialReferences(projectId: string) {
  const access = await ownedProject(projectId);
  if (!access) return null;
  const { data, error } = await access.supabase
    .from("provider_credentials")
    .select(
      "id,provider,status,safe_metadata,credential_version,last_validated_at,expires_at,updated_at",
    )
    .eq("project_id", projectId)
    .eq("user_id", access.user.id)
    .order("provider");
  if (error) return null;
  return data;
}

export async function resolveProviderCredential(
  projectId: string,
  userId: string,
  provider: ProvisioningCredentialProvider,
) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("resolve_provider_credential", {
    p_project_id: projectId,
    p_user_id: userId,
    p_provider: provider,
  });
  if (error || typeof data !== "string" || !data) return null;
  try {
    return JSON.parse(data) as Record<string, string>;
  } catch {
    return null;
  }
}

export async function cloneProviderCredentialsForWorker(
  sourceProjectId: string,
  targetProjectId: string,
  userId: string,
  providers: ProvisioningCredentialProvider[],
) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc(
    "clone_provider_credentials_for_worker",
    {
      p_source_project_id: sourceProjectId,
      p_target_project_id: targetProjectId,
      p_user_id: userId,
      p_providers: providers,
    },
  );
  return error || data !== providers.length
    ? { ok: false as const, error: "CREDENTIAL_CLONE_FAILED" }
    : { ok: true as const, count: data };
}
