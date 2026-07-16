import { describe, expect, it } from "vitest";
import { findCredentialDefinition } from "./definitions";
import { getCredentialStatus, validateCredential } from "./validation";

describe("credential manager foundation", () => {
  it("reports missing and invalid required fields without retaining values", () => {
    const definition = findCredentialDefinition("supabase")!;
    expect(validateCredential(definition, {}).status).toBe("MISSING");
    const result = validateCredential(definition, { base_url: "not-a-url", key: "secret" });
    expect(result.status).toBe("INVALID");
    expect(JSON.stringify(result)).not.toContain("secret");
  });
  it("accepts valid format and exposes only status", () => {
    const definition = findCredentialDefinition("openai")!;
    expect(validateCredential(definition, { api_key: "sk-test-key-123" }).status).toBe("PROVIDED");
    expect(getCredentialStatus({ configured: false, status: "VALID" })).toBe("MISSING");
  });
});
