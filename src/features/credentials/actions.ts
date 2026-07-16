"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  isProvisioningCredentialProvider,
  parseProviderCredential,
} from "./provider-payload";
import { listProviderCredentialReferences } from "./repository";

export async function getProviderCredentialStatuses(projectId: string) {
  const references = await listProviderCredentialReferences(projectId);
  return references
    ? {
        ok: true as const,
        references: references.map((reference) => ({
          id: reference.id,
          provider: reference.provider,
          status: reference.status,
          safeMetadata: reference.safe_metadata,
          version: reference.credential_version,
          lastValidatedAt: reference.last_validated_at,
          expiresAt: reference.expires_at,
          updatedAt: reference.updated_at,
        })),
      }
    : { ok: false as const, error: "NOT_AUTHORIZED" };
}

export async function storeProviderCredential(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const providerValue = String(formData.get("provider") ?? "");
  if (
    !/^[0-9a-f-]{36}$/i.test(projectId) ||
    !isProvisioningCredentialProvider(providerValue)
  ) {
    return { ok: false as const, error: "CREDENTIAL_REQUEST_INVALID" };
  }

  const parsed = parseProviderCredential(
    providerValue,
    Object.fromEntries(formData.entries()),
  );
  if (!parsed.ok) return parsed;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "NOT_AUTHORIZED" };
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!project) return { ok: false as const, error: "NOT_AUTHORIZED" };

  const { data, error } = await supabase.rpc("store_provider_credential", {
    p_project_id: projectId,
    p_provider: providerValue,
    p_secret: parsed.encryptedPayload,
    p_safe_metadata: parsed.safeMetadata,
  });
  if (error || !data) {
    return { ok: false as const, error: "CREDENTIAL_STORE_FAILED" };
  }

  revalidatePath(`/app/projects/${projectId}`);
  return {
    ok: true as const,
    referenceId: data,
    provider: providerValue,
    status: "PROVIDED" as const,
  };
}
