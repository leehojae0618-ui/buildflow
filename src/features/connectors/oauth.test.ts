import { describe, expect, it } from "vitest";
import { acknowledgeConsent, canConfirmConnection, createAccountConnectionSession, updateConnectionStatus } from "./oauth";
import type { Connector } from "./types";

const connector: Connector = { providerId: "google", providerName: "Google", status: "NOT_CONNECTED", required: true, capabilities: [] };
describe("account connection wizard foundation", () => {
  it("creates consent-gated steps without connecting accounts", () => {
    const session = createAccountConnectionSession([connector]);
    expect(session.steps[0]).toMatchObject({ requiresConsent: true, consented: false, status: "NOT_CONNECTED" });
    expect(session.completed).toBe(0);
  });
  it("confirms only an explicitly connected and consented account", () => {
    let session = acknowledgeConsent(createAccountConnectionSession([connector]), "account-google");
    expect(canConfirmConnection(session.steps[0])).toBe(false);
    session = updateConnectionStatus(session, "account-google", "CONNECTED");
    expect(canConfirmConnection(session.steps[0])).toBe(true);
    expect(session.completed).toBe(1);
  });
});
