import { describe, expect, it, vi } from "vitest";
import {
  commandFromPlan,
  isSafeProvisioningSql,
  validateProvisioningCommand,
} from "./commands";
import {
  createGitHubAdapter,
  createSupabaseAdapter,
  createVercelAdapter,
  githubAdapter,
  providerAdapters,
} from "./adapters";

describe("secure provider provisioning contract", () => {
  it("creates only private repositories from approved scope", async () => {
    const command = commandFromPlan(
      "p",
      "github",
      "CREATE_REPOSITORY",
      { repo: "demo", private: true },
      "scope-v1",
    );
    expect(validateProvisioningCommand(command)).toEqual([]);
    expect((await githubAdapter.validateCommand(command)).status).toBe(
      "PREPARED",
    );
    expect(
      validateProvisioningCommand({
        ...command,
        payload: { repo: "demo", private: false },
      }),
    ).toContain("PUBLIC_REPOSITORY_NOT_APPROVED");
  });

  it("rejects secret fields and pauses without credential", async () => {
    const command = {
      id: "x",
      provider: "vercel" as const,
      kind: "DEPLOY" as const,
      projectId: "p",
      payload: { token: "never" },
      approvalScope: "scope",
      estimatedCostCents: 0,
      reversible: true,
    };
    expect(validateProvisioningCommand(command)).toContain(
      "COMMAND_SECRET_FIELD",
    );
    const safeCommand = {
      ...command,
      payload: { projectName: "preview", repoId: "1" },
    };
    const result = await providerAdapters.vercel.executeCommand(safeCommand, {
      referenceId: "credential-ref-vercel",
      resolve: async () => null,
    });
    expect(result.status).toBe("WAITING_FOR_USER");
  });

  it("creates a GitHub repository with private visibility", async () => {
    const fetcher = vi.fn(
      async (input: string | URL | Request, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith("/repos/acme/demo") && !init?.method) {
          return new Response(null, { status: 404 });
        }
        if (url.endsWith("/user")) return Response.json({ login: "acme" });
        if (url.endsWith("/user/repos")) {
          expect(JSON.parse(String(init?.body))).toMatchObject({
            private: true,
          });
          return Response.json(
            { id: 7, html_url: "https://github.com/acme/demo" },
            { status: 201 },
          );
        }
        return new Response(null, { status: 500 });
      },
    );
    const adapter = createGitHubAdapter(fetcher as typeof fetch);
    const result = await adapter.executeCommand(
      commandFromPlan(
        "p",
        "github",
        "CREATE_REPOSITORY",
        { repo: "demo", private: true },
        "scope-v1",
      ),
      {
        referenceId: "r",
        resolve: async () => ({ token: "test-token", owner: "acme" }),
      },
    );
    expect(result).toMatchObject({
      ok: true,
      resourceId: "7",
      safeCode: "GITHUB_REPOSITORY_CREATED",
    });
  });

  it("blocks dangerous SQL before a Supabase request", async () => {
    const fetcher = vi.fn();
    const adapter = createSupabaseAdapter(fetcher as typeof fetch);
    const result = await adapter.executeCommand(
      {
        id: "sql",
        provider: "supabase",
        kind: "APPLY_SQL_SCHEMA",
        projectId: "p",
        payload: { sql: "drop table users" },
        approvalScope: "scope",
        estimatedCostCents: 0,
        reversible: true,
      },
      {
        referenceId: "r",
        resolve: async () => ({
          accessToken: "test-token",
          projectRef: "abcdefgh",
        }),
      },
    );
    expect(result.safeCode).toBe("UNSAFE_SQL_BLOCKED");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("allows only the Blueprint grant contract and blocks RLS weakening", () => {
    expect(
      isSafeProvisioningSql(
        "grant select on table public.buildflow_admins to authenticated; grant select, insert, update, delete on table public.buildflow_todos to authenticated;",
      ),
    ).toBe(true);
    expect(
      isSafeProvisioningSql(
        "grant select on table public.customer_secrets to authenticated;",
      ),
    ).toBe(false);
    expect(
      isSafeProvisioningSql(
        "alter table public.buildflow_todos disable row level security;",
      ),
    ).toBe(false);
  });

  it("configures disposable email signup through the official Supabase boundary", async () => {
    const fetcher = vi.fn(
      async (_input: string | URL | Request, init?: RequestInit) => {
        expect(init?.method).toBe("PATCH");
        expect(JSON.parse(String(init?.body))).toEqual({
          disable_signup: false,
          mailer_autoconfirm: true,
        });
        return Response.json({
          disable_signup: false,
          mailer_autoconfirm: true,
        });
      },
    );
    const result = await createSupabaseAdapter(
      fetcher as typeof fetch,
    ).executeCommand(
      commandFromPlan(
        "p",
        "supabase",
        "CONFIGURE_AUTH",
        { allowEmailSignup: true, mailerAutoconfirm: true },
        "scope-v1",
      ),
      {
        referenceId: "r",
        resolve: async () => ({
          accessToken: "test-token",
          projectRef: "abcdefgh",
        }),
      },
    );
    expect(result).toMatchObject({
      ok: true,
      safeCode: "SUPABASE_AUTH_CONFIGURED",
    });
  });

  it("disables Vercel Authentication for an approved public deployment", async () => {
    const fetcher = vi.fn(
      async (input: string | URL | Request, init?: RequestInit) => {
        const url = String(input);
        if (url.includes("/v9/projects/demo") && !init?.method) {
          return new Response(null, { status: 404 });
        }
        if (url.includes("/v11/projects") && init?.method === "POST") {
          return Response.json({ id: "project-1" }, { status: 201 });
        }
        if (url.includes("/v9/projects/project-1") && init?.method === "PATCH") {
          expect(JSON.parse(String(init.body))).toEqual({
            ssoProtection: null,
          });
          return Response.json({ id: "project-1", ssoProtection: null });
        }
        return new Response(null, { status: 500 });
      },
    );
    const adapter = createVercelAdapter(fetcher as typeof fetch);
    const result = await adapter.executeCommand(
      commandFromPlan(
        "p",
        "vercel",
        "CREATE_PROJECT",
        { projectName: "demo", repository: "acme/demo" },
        "scope-v1",
      ),
      {
        referenceId: "r",
        resolve: async (provider): Promise<Record<string, string>> => {
          if (provider === "vercel") return { token: "vercel-token" };
          if (provider === "supabase") {
            return {
              projectUrl: "https://example.supabase.co",
              anonKey: "anon-key",
              serverKey: "server-key",
            };
          }
          return { apiKey: "openai-key" };
        },
      },
    );
    expect(result).toMatchObject({
      ok: true,
      resourceId: "project-1",
      safeCode: "VERCEL_PROJECT_CREATED",
    });
  });

  it("creates a CRUD deployment without requiring or exposing OpenAI", async () => {
    const fetcher = vi.fn(
      async (input: string | URL | Request, init?: RequestInit) => {
        const url = String(input);
        if (url.includes("/v9/projects/crud-demo") && !init?.method) {
          return new Response(null, { status: 404 });
        }
        if (url.includes("/v11/projects") && init?.method === "POST") {
          const body = JSON.parse(String(init.body)) as {
            environmentVariables: Array<{ key: string }>;
          };
          expect(body.environmentVariables.map((item) => item.key)).toEqual([
            "NEXT_PUBLIC_SUPABASE_URL",
            "NEXT_PUBLIC_SUPABASE_ANON_KEY",
            "SUPABASE_SECRET_KEY",
          ]);
          return Response.json({ id: "crud-project" }, { status: 201 });
        }
        if (
          url.includes("/v9/projects/crud-project") &&
          init?.method === "PATCH"
        ) {
          return Response.json({ id: "crud-project", ssoProtection: null });
        }
        return new Response(null, { status: 500 });
      },
    );
    const resolve = vi.fn(
      async (
        provider?: "github" | "supabase" | "vercel" | "openai",
      ): Promise<Record<string, string> | null> => {
        if (provider === "vercel") return { token: "vercel-token" };
        if (provider === "supabase") {
          return {
            projectUrl: "https://example.supabase.co",
            anonKey: "anon-key",
            serverKey: "server-key",
          };
        }
        return null;
      },
    );
    const result = await createVercelAdapter(
      fetcher as typeof fetch,
    ).executeCommand(
      commandFromPlan(
        "p",
        "vercel",
        "CREATE_PROJECT",
        {
          projectName: "crud-demo",
          repository: "acme/crud-demo",
          blueprintId: "general-crud-v1",
        },
        "scope-v1",
      ),
      { referenceId: "r", resolve },
    );
    expect(result.ok).toBe(true);
    expect(resolve).not.toHaveBeenCalledWith("openai");
  });

  it("verifies signup, login, CRUD, search, status, admin read, and cross-user RLS", async () => {
    let createdUsers = 0;
    let adminEnabled = false;
    const fetcher = vi.fn(
      async (input: string | URL | Request, init?: RequestInit) => {
        const url = String(input);
        const authorization = new Headers(init?.headers).get("Authorization");
        if (url.endsWith("/api/health")) {
          return Response.json({ status: "ready" });
        }
        if (
          url === "https://service.example" ||
          url === "https://service.example/admin"
        ) {
          return new Response("<html>ready</html>", { status: 200 });
        }
        if (url.endsWith("/auth/v1/signup")) {
          return Response.json({ user: { id: "signup-user" } });
        }
        if (
          url.endsWith("/auth/v1/admin/users") &&
          init?.method === "POST"
        ) {
          createdUsers += 1;
          return Response.json({
            id: createdUsers === 1 ? "user-a" : "user-b",
          });
        }
        if (url.includes("/auth/v1/token?grant_type=password")) {
          const email = String(JSON.parse(String(init?.body)).email);
          return Response.json({
            access_token: email.includes("user-a") ? "token-a" : "token-b",
          });
        }
        if (
          url.endsWith("/rest/v1/buildflow_todos") &&
          init?.method === "POST"
        ) {
          return Response.json([{ id: "todo-1" }], { status: 201 });
        }
        if (
          url.includes("/rest/v1/buildflow_todos") &&
          url.includes("title=ilike")
        ) {
          return Response.json([
            { id: "todo-1", title: "verification", status: "pending" },
          ]);
        }
        if (
          url.includes("/rest/v1/buildflow_todos?id=eq.todo-1") &&
          init?.method === "PATCH"
        ) {
          const body = JSON.parse(String(init.body)) as {
            title: string;
            status: string;
          };
          return Response.json([
            {
              title: body.title,
              status: body.status,
            },
          ]);
        }
        if (
          url.endsWith("/rest/v1/buildflow_admins") &&
          init?.method === "POST"
        ) {
          adminEnabled = true;
          return new Response(null, { status: 201 });
        }
        if (
          url.includes("/rest/v1/buildflow_todos?id=eq.todo-1") &&
          !init?.method
        ) {
          return authorization === "Bearer token-b" && !adminEnabled
            ? Response.json([])
            : Response.json([{ id: "todo-1", user_id: "user-a" }]);
        }
        if (
          (url.includes("/rest/v1/buildflow_todos") ||
            url.includes("/rest/v1/buildflow_admins") ||
            url.includes("/auth/v1/admin/users/")) &&
          init?.method === "DELETE"
        ) {
          return new Response(null, { status: 204 });
        }
        return new Response(null, { status: 500 });
      },
    );
    const result = await createVercelAdapter(
      fetcher as typeof fetch,
    ).verifyCommand(
      commandFromPlan(
        "p",
        "vercel",
        "CHECK_DEPLOYMENT_STATUS",
        {
          deploymentId: "d",
          projectName: "crud-demo",
          verificationProfile: "GENERAL_CRUD",
        },
        "scope-v1",
      ),
      {
        ok: true,
        status: "SUCCEEDED",
        url: "https://service.example",
        retryable: false,
      },
      {
        referenceId: "r",
        resolve: async () => ({
          projectUrl: "https://db.example",
          anonKey: "anon-key",
          serverKey: "server-key",
        }),
      },
    );
    expect(result).toMatchObject({
      ok: true,
      safeCode: "VERCEL_CRUD_FUNCTIONAL_TEST_PASSED",
    });
  });

  it("sanitizes result without response bodies or secrets", () => {
    const result = githubAdapter.sanitizeResult({
      ok: false,
      status: "FAILED",
      safeCode: "X",
      retryable: false,
      resourceId: "r",
    });
    expect(JSON.stringify(result)).not.toContain("token");
  });
});
