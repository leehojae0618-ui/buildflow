import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("../../src/features/runtime-approval/runtime-approval-supabase", () => ({
  SupabaseRuntimeApprovalRepository: class SupabaseRuntimeApprovalRepository {
    constructor(readonly client: unknown) {}
  },
}));
vi.mock("../../src/features/agents/runtime-evidence-supabase", () => ({
  SupabaseRuntimeEvidenceRepository: class SupabaseRuntimeEvidenceRepository {
    constructor(readonly client: unknown) {}
  },
}));

import { createExplicitRepositoryInjection, createLiveDbClient } from "./live-db-client";

const fakeClient = {} as never;

describe("LIVE-DB explicit client boundary", () => {
  it("constructs the dedicated client only from explicit values", () => {
    const factory = vi.fn(() => fakeClient);
    const result = createLiveDbClient({
      url: "http://localhost:54321",
      serviceRoleKey: "test-service-role-placeholder",
    }, factory);
    expect(result).toMatchObject({ status: "READY", identity: { supabaseClientMode: "LIVE_DB_EXPLICIT_INJECTION" } });
    expect(factory).toHaveBeenCalledOnce();
    expect(factory).toHaveBeenCalledWith("http://localhost:54321", "test-service-role-placeholder");
  });

  it("does not construct a client when required explicit values are missing", () => {
    const factory = vi.fn(() => fakeClient);
    expect(createLiveDbClient({}, factory)).toEqual({ status: "BLOCKED", safeErrorCode: "LIVE_DB_URL_MISSING" });
    expect(createLiveDbClient({ url: "http://localhost:54321" }, factory)).toEqual({ status: "BLOCKED", safeErrorCode: "LIVE_DB_SERVICE_ROLE_KEY_MISSING" });
    expect(factory).not.toHaveBeenCalled();
  });

  it("requires explicit clients before repository adapters are constructed", () => {
    expect(createExplicitRepositoryInjection(undefined, fakeClient)).toEqual({ status: "BLOCKED", safeErrorCode: "LIVE_DB_CLIENT_NOT_EXPLICITLY_INJECTED" });
    const injection = createExplicitRepositoryInjection(fakeClient, fakeClient);
    expect(injection).toMatchObject({ identity: { appClientFactoryUsed: false, adminClientFactoryUsed: false, serverClientFactoryUsed: false } });
  });
});
