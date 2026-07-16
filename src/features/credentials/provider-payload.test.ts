import { describe, expect, it } from "vitest";
import {
  isProvisioningCredentialProvider,
  parseProviderCredential,
} from "./provider-payload";

describe("provider credential payload", () => {
  it("accepts only the provisioning provider allowlist", () => {
    expect(isProvisioningCredentialProvider("github")).toBe(true);
    expect(isProvisioningCredentialProvider("stripe")).toBe(false);
  });

  it("keeps only non-secret Supabase metadata outside the encrypted payload", () => {
    const result = parseProviderCredential("supabase", {
      accessToken: "test-management-token",
      projectRef: "abcdefgh",
      projectUrl: "https://abcdefgh.supabase.co",
      anonKey: "test-anon-key",
      serverKey: "test-server-key",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.safeMetadata).toEqual({
      projectRef: "abcdefgh",
      projectUrl: "https://abcdefgh.supabase.co",
    });
    expect(JSON.stringify(result.safeMetadata)).not.toContain("test-server-key");
  });

  it("rejects incomplete provider credentials", () => {
    expect(
      parseProviderCredential("github", { token: "" }),
    ).toMatchObject({ ok: false, error: "CREDENTIAL_FORMAT_INVALID" });
  });
});
