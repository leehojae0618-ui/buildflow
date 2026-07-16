import { z } from "zod";

export const provisioningCredentialProviders = [
  "github",
  "supabase",
  "vercel",
  "openai",
] as const;

export type ProvisioningCredentialProvider =
  (typeof provisioningCredentialProviders)[number];

const token = z.string().trim().min(8).max(8192);

const schemas = {
  github: z.object({
    token,
    owner: z.string().trim().max(100).optional().default(""),
  }),
  supabase: z.object({
    accessToken: token,
    projectRef: z.string().trim().regex(/^[a-z0-9]{8,40}$/),
    projectUrl: z.string().trim().url(),
    anonKey: token,
    serverKey: token,
  }),
  vercel: z.object({
    token,
    teamId: z.string().trim().max(100).optional().default(""),
  }),
  openai: z.object({
    apiKey: token,
  }),
} satisfies Record<ProvisioningCredentialProvider, z.ZodType>;

export function parseProviderCredential(
  provider: ProvisioningCredentialProvider,
  values: Record<string, FormDataEntryValue | string | undefined>,
) {
  const input = Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, String(value ?? "")]),
  );
  if (provider === "github") {
    const parsed = schemas.github.safeParse(input);
    if (!parsed.success) {
      return { ok: false as const, error: "CREDENTIAL_FORMAT_INVALID" };
    }
    return {
      ok: true as const,
      encryptedPayload: JSON.stringify(parsed.data),
      safeMetadata: { owner: parsed.data.owner || null },
    };
  }
  if (provider === "supabase") {
    const parsed = schemas.supabase.safeParse(input);
    if (!parsed.success) {
      return { ok: false as const, error: "CREDENTIAL_FORMAT_INVALID" };
    }
    return {
      ok: true as const,
      encryptedPayload: JSON.stringify(parsed.data),
      safeMetadata: {
        projectRef: parsed.data.projectRef,
        projectUrl: parsed.data.projectUrl,
      },
    };
  }
  if (provider === "vercel") {
    const parsed = schemas.vercel.safeParse(input);
    if (!parsed.success) {
      return { ok: false as const, error: "CREDENTIAL_FORMAT_INVALID" };
    }
    return {
      ok: true as const,
      encryptedPayload: JSON.stringify(parsed.data),
      safeMetadata: { teamId: parsed.data.teamId || null },
    };
  }
  const parsed = schemas.openai.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "CREDENTIAL_FORMAT_INVALID" };
  }

  return {
    ok: true as const,
    encryptedPayload: JSON.stringify(parsed.data),
    safeMetadata: {},
  };
}

export function isProvisioningCredentialProvider(
  value: string,
): value is ProvisioningCredentialProvider {
  return provisioningCredentialProviders.includes(
    value as ProvisioningCredentialProvider,
  );
}
