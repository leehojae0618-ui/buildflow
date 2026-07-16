import { randomUUID } from "node:crypto";
import type {
  CommandResult,
  ProviderAdapter,
  ProvisioningCommand,
} from "./types";
import { isSafeProvisioningSql, validateProvisioningCommand } from "./commands";

const safe = (result: CommandResult): CommandResult => ({
  ok: result.ok,
  status: result.status,
  safeCode: result.safeCode,
  resourceId: result.resourceId,
  url: result.url,
  retryable: result.retryable,
});

function prepared(command: ProvisioningCommand): CommandResult {
  const errors = validateProvisioningCommand(command);
  return errors.length
    ? { ok: false, status: "FAILED", safeCode: errors[0], retryable: false }
    : { ok: true, status: "PREPARED", retryable: false };
}

function providerFailure(response: Response, provider: string): CommandResult {
  const rateLimited =
    response.status === 429 ||
    (response.status === 403 &&
      response.headers.get("x-ratelimit-remaining") === "0");
  return {
    ok: false,
    status:
      !rateLimited && (response.status === 401 || response.status === 403)
        ? "WAITING_FOR_USER"
        : "FAILED",
    safeCode: rateLimited
      ? `${provider}_RATE_LIMITED`
      : response.status === 401
        ? `${provider}_AUTHENTICATION_FAILED`
        : response.status === 403
          ? `${provider}_PERMISSION_DENIED`
          : response.status >= 500
            ? `${provider}_TEMPORARY_FAILURE`
            : `${provider}_REQUEST_FAILED`,
    retryable: rateLimited || response.status >= 500,
  };
}

async function json<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function impact(command: ProvisioningCommand) {
  return {
    costCents: command.estimatedCostCents,
    publicChange: command.kind === "DEPLOY",
    permissionChange:
      command.kind.includes("VARIABLE") || command.kind.includes("SET_"),
    reversible: command.reversible,
  };
}

function githubHeaders(token: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function githubIdentity(
  fetcher: typeof fetch,
  token: string,
  configuredOwner?: string,
) {
  if (configuredOwner) return configuredOwner;
  const response = await fetcher("https://api.github.com/user", {
    headers: githubHeaders(token),
  });
  if (!response.ok) return null;
  return (await json<{ login?: string }>(response))?.login ?? null;
}

export function createGitHubAdapter(
  fetcher: typeof fetch = fetch,
): ProviderAdapter {
  return {
    async prepareCommand(command) {
      return command;
    },
    async validateCommand(command) {
      return prepared(command);
    },
    estimateImpact: impact,
    async executeCommand(command, credential) {
      const values = await credential.resolve("github");
      const token = values?.token;
      if (!token) {
        return {
          ok: false,
          status: "WAITING_FOR_USER",
          safeCode: "CREDENTIAL_REQUIRED",
          retryable: false,
        };
      }
      const repo = String(command.payload.repo ?? "");
      const owner = await githubIdentity(fetcher, token, values.owner);
      if (!owner || !repo) {
        return {
          ok: false,
          status: "FAILED",
          safeCode: "GITHUB_COMMAND_INVALID",
          retryable: false,
        };
      }
      const repositoryUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;

      if (command.kind === "CREATE_REPOSITORY") {
        const existing = await fetcher(repositoryUrl, {
          headers: githubHeaders(token),
        });
        if (existing.ok) {
          const body = await json<{ id?: number; html_url?: string }>(existing);
          return {
            ok: true,
            status: "SUCCEEDED",
            safeCode: "GITHUB_REPOSITORY_EXISTS",
            resourceId: body?.id ? String(body.id) : undefined,
            url: body?.html_url,
            retryable: false,
          };
        }
        if (existing.status !== 404) return providerFailure(existing, "GITHUB");

        const identity = await fetcher("https://api.github.com/user", {
          headers: githubHeaders(token),
        });
        if (!identity.ok) return providerFailure(identity, "GITHUB");
        const login = (await json<{ login?: string }>(identity))?.login;
        const endpoint =
          login?.toLowerCase() === owner.toLowerCase()
            ? "https://api.github.com/user/repos"
            : `https://api.github.com/orgs/${encodeURIComponent(owner)}/repos`;
        const response = await fetcher(endpoint, {
          method: "POST",
          headers: {
            ...githubHeaders(token),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: repo,
            description: String(command.payload.description ?? ""),
            private: true,
            auto_init: false,
          }),
        });
        if (!response.ok) return providerFailure(response, "GITHUB");
        const body = await json<{ id?: number; html_url?: string }>(response);
        return {
          ok: true,
          status: "SUCCEEDED",
          safeCode: "GITHUB_REPOSITORY_CREATED",
          resourceId: body?.id ? String(body.id) : undefined,
          url: body?.html_url,
          retryable: false,
        };
      }

      if (command.kind === "UPSERT_FILES") {
        const files = Array.isArray(command.payload.files)
          ? command.payload.files
          : [];
        for (const file of files) {
          if (!file || typeof file !== "object" || Array.isArray(file)) {
            return {
              ok: false,
              status: "FAILED",
              safeCode: "GITHUB_FILE_INVALID",
              retryable: false,
            };
          }
          const path = String(file.path ?? "");
          const content = String(file.content ?? "");
          if (!path || content.length > 1_000_000) {
            return {
              ok: false,
              status: "FAILED",
              safeCode: "GITHUB_FILE_INVALID",
              retryable: false,
            };
          }
          const contentUrl = `${repositoryUrl}/contents/${path
            .split("/")
            .map(encodeURIComponent)
            .join("/")}`;
          const current = await fetcher(contentUrl, {
            headers: githubHeaders(token),
          });
          if (!current.ok && current.status !== 404) {
            return providerFailure(current, "GITHUB");
          }
          const sha = current.ok
            ? (await json<{ sha?: string }>(current))?.sha
            : undefined;
          const response = await fetcher(contentUrl, {
            method: "PUT",
            headers: {
              ...githubHeaders(token),
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: `BuildFlow: update ${path}`,
              content: Buffer.from(content).toString("base64"),
              branch: "main",
              ...(sha ? { sha } : {}),
            }),
          });
          if (!response.ok) return providerFailure(response, "GITHUB");
        }
        return {
          ok: true,
          status: "SUCCEEDED",
          safeCode: "GITHUB_FILES_UPSERTED",
          url: String(command.payload.repositoryUrl ?? ""),
          retryable: false,
        };
      }

      return {
        ok: false,
        status: "FAILED",
        safeCode: "GITHUB_COMMAND_NOT_IMPLEMENTED",
        retryable: false,
      };
    },
    async verifyCommand(command, result, credential) {
      if (!result.ok) return result;
      const values = await credential.resolve("github");
      const token = values?.token;
      const repo = String(command.payload.repo ?? "");
      if (!token) {
        return {
          ...result,
          ok: false,
          status: "FAILED",
          safeCode: "GITHUB_VERIFY_CREDENTIAL_REQUIRED",
        };
      }
      const owner = await githubIdentity(fetcher, token, values.owner);
      if (!owner) {
        return {
          ...result,
          ok: false,
          status: "FAILED",
          safeCode: "GITHUB_VERIFY_FAILED",
        };
      }
      if (command.kind === "UPSERT_FILES") {
        const files = Array.isArray(command.payload.files)
          ? command.payload.files
          : [];
        for (const file of files) {
          if (!file || typeof file !== "object" || Array.isArray(file)) {
            return {
              ...result,
              ok: false,
              status: "FAILED",
              safeCode: "GITHUB_FILE_VERIFY_FAILED",
            };
          }
          const path = String(file.path ?? "");
          const response = await fetcher(
            `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path
              .split("/")
              .map(encodeURIComponent)
              .join("/")}`,
            { headers: githubHeaders(token) },
          );
          if (!response.ok) return providerFailure(response, "GITHUB");
        }
        return result;
      }
      const response = await fetcher(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
        { headers: githubHeaders(token) },
      );
      return response.ok ? result : providerFailure(response, "GITHUB");
    },
    async rollbackCommand(_command, result) {
      return result.ok
        ? {
            ok: true,
            status: "SUCCEEDED",
            safeCode: "ROLLBACK_REQUIRES_EXPLICIT_APPROVAL",
            retryable: false,
          }
        : result;
    },
    sanitizeResult: safe,
  };
}

function supabaseHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

export function createSupabaseAdapter(
  fetcher: typeof fetch = fetch,
): ProviderAdapter {
  return {
    async prepareCommand(command) {
      return command;
    },
    async validateCommand(command) {
      return prepared(command);
    },
    estimateImpact: impact,
    async executeCommand(command, credential) {
      const values = await credential.resolve("supabase");
      const accessToken = values?.accessToken;
      const projectRef = values?.projectRef;
      if (!accessToken || !projectRef) {
        return {
          ok: false,
          status: "WAITING_FOR_USER",
          safeCode: "CREDENTIAL_REQUIRED",
          retryable: false,
        };
      }
      if (command.kind === "VALIDATE_PROJECT") {
        const response = await fetcher(
          `https://api.supabase.com/v1/projects/${encodeURIComponent(projectRef)}`,
          { headers: supabaseHeaders(accessToken) },
        );
        if (!response.ok) return providerFailure(response, "SUPABASE");
        return {
          ok: true,
          status: "SUCCEEDED",
          safeCode: "SUPABASE_PROJECT_VALID",
          resourceId: projectRef,
          url: values.projectUrl,
          retryable: false,
        };
      }
      if (command.kind === "CONFIGURE_AUTH") {
        if (
          command.payload.allowEmailSignup !== true ||
          command.payload.mailerAutoconfirm !== true
        ) {
          return {
            ok: false,
            status: "FAILED",
            safeCode: "SUPABASE_AUTH_CONFIG_INVALID",
            retryable: false,
          };
        }
        const response = await fetcher(
          `https://api.supabase.com/v1/projects/${encodeURIComponent(projectRef)}/config/auth`,
          {
            method: "PATCH",
            headers: supabaseHeaders(accessToken),
            body: JSON.stringify({
              disable_signup: false,
              mailer_autoconfirm: true,
            }),
          },
        );
        if (!response.ok) return providerFailure(response, "SUPABASE");
        return {
          ok: true,
          status: "SUCCEEDED",
          safeCode: "SUPABASE_AUTH_CONFIGURED",
          resourceId: projectRef,
          retryable: false,
        };
      }
      if (command.kind === "APPLY_SQL_SCHEMA") {
        const sql = String(command.payload.sql ?? "");
        if (!isSafeProvisioningSql(sql)) {
          return {
            ok: false,
            status: "FAILED",
            safeCode: "UNSAFE_SQL_BLOCKED",
            retryable: false,
          };
        }
        const response = await fetcher(
          `https://api.supabase.com/v1/projects/${encodeURIComponent(projectRef)}/database/query`,
          {
            method: "POST",
            headers: supabaseHeaders(accessToken),
            body: JSON.stringify({ query: sql, read_only: false }),
          },
        );
        if (!response.ok) return providerFailure(response, "SUPABASE");
        return {
          ok: true,
          status: "SUCCEEDED",
          safeCode: "SUPABASE_SCHEMA_APPLIED",
          resourceId: projectRef,
          retryable: false,
        };
      }
      return {
        ok: false,
        status: "FAILED",
        safeCode: "SUPABASE_COMMAND_NOT_IMPLEMENTED",
        retryable: false,
      };
    },
    async verifyCommand(command, result, credential) {
      if (!result.ok || command.kind !== "APPLY_SQL_SCHEMA") return result;
      const values = await credential.resolve("supabase");
      if (!values?.accessToken || !values.projectRef) return result;
      const expectedTables = Array.isArray(command.payload.expectedTables)
        ? command.payload.expectedTables.map(String)
        : ["buildflow_inquiries"];
      if (
        expectedTables.length === 0 ||
        expectedTables.some(
          (table) => !/^buildflow_[a-z0-9_]{1,60}$/.test(table),
        )
      ) {
        return {
          ...result,
          ok: false,
          status: "FAILED",
          safeCode: "SUPABASE_SCHEMA_VERIFY_INPUT_INVALID",
          retryable: false,
        };
      }
      const response = await fetcher(
        `https://api.supabase.com/v1/projects/${encodeURIComponent(values.projectRef)}/database/query`,
        {
          method: "POST",
          headers: supabaseHeaders(values.accessToken),
          body: JSON.stringify({
            query: `select ${expectedTables
              .map(
                (table) =>
                  `to_regclass('public.${table}') is not null as ${table}`,
              )
              .join(", ")}`,
            read_only: true,
          }),
        },
      );
      if (!response.ok) return providerFailure(response, "SUPABASE");
      const body = await json<unknown>(response);
      const serialized = JSON.stringify(body);
      return expectedTables.every((table) =>
        serialized.includes(`"${table}":true`),
      )
        ? result
        : {
            ...result,
            ok: false,
            status: "FAILED",
            safeCode: "SUPABASE_SCHEMA_VERIFY_FAILED",
            retryable: false,
          };
    },
    async rollbackCommand(_command, result) {
      return result.ok
        ? {
            ok: true,
            status: "SUCCEEDED",
            safeCode: "ROLLBACK_REQUIRES_EXPLICIT_APPROVAL",
            retryable: false,
          }
        : result;
    },
    sanitizeResult: safe,
  };
}

function vercelUrl(path: string, teamId?: string) {
  const url = new URL(`https://api.vercel.com${path}`);
  if (teamId) url.searchParams.set("teamId", teamId);
  return url.toString();
}

function vercelHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function makeVercelProjectPublic(
  fetcher: typeof fetch,
  projectId: string,
  teamId: string | undefined,
  headers: Record<string, string>,
) {
  return fetcher(
    vercelUrl(`/v9/projects/${encodeURIComponent(projectId)}`, teamId),
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ ssoProtection: null }),
    },
  );
}

function supabaseDataHeaders(key: string, accessToken: string, prefer?: string) {
  return {
    apikey: key,
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

async function deleteSupabaseTestUser(
  fetcher: typeof fetch,
  projectUrl: string,
  serverKey: string,
  userId?: string,
) {
  if (!userId) return;
  await fetcher(
    `${projectUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`,
    {
      method: "DELETE",
      headers: supabaseDataHeaders(serverKey, serverKey),
    },
  );
}

async function verifyGeneralCrud(
  fetcher: typeof fetch,
  serviceUrl: string,
  credential: Parameters<ProviderAdapter["verifyCommand"]>[2],
): Promise<CommandResult> {
  const values = await credential.resolve("supabase");
  const projectUrl = values?.projectUrl?.replace(/\/$/, "");
  const anonKey = values?.anonKey;
  const serverKey = values?.serverKey;
  if (!projectUrl || !anonKey || !serverKey) {
    return {
      ok: false,
      status: "WAITING_FOR_USER",
      safeCode: "DEPENDENCY_CREDENTIAL_REQUIRED",
      retryable: false,
    };
  }
  const verifiedAnonKey = anonKey;
  const verifiedServerKey = serverKey;

  const marker = randomUUID();
  const password = `BuildFlow-${randomUUID()}-aA1!`;
  const signupEmail = `buildflow-signup-${marker}@example.com`;
  const userAEmail = `buildflow-user-a-${marker}@example.com`;
  const userBEmail = `buildflow-user-b-${marker}@example.com`;
  let signupUserId: string | undefined;
  let userAId: string | undefined;
  let userBId: string | undefined;
  let todoId: string | undefined;

  try {
    const [home, adminPage] = await Promise.all([
      fetcher(serviceUrl, { redirect: "follow" }),
      fetcher(`${serviceUrl}/admin`, { redirect: "follow" }),
    ]);
    if (!home.ok || !adminPage.ok) {
      return {
        ok: false,
        status: "FAILED",
        safeCode: "DEPLOYMENT_CRUD_UI_CHECK_FAILED",
        retryable: home.status >= 500 || adminPage.status >= 500,
      };
    }

    const signup = await fetcher(`${projectUrl}/auth/v1/signup`, {
      method: "POST",
      headers: supabaseDataHeaders(anonKey, anonKey),
      body: JSON.stringify({ email: signupEmail, password }),
    });
    if (!signup.ok) {
      return {
        ok: false,
        status: "FAILED",
        safeCode:
          signup.status === 429
            ? "SUPABASE_AUTH_RATE_LIMITED"
            : "SUPABASE_SIGNUP_TEST_FAILED",
        retryable: signup.status === 429 || signup.status >= 500,
      };
    }
    const signupBody = await json<{
      id?: string;
      user?: { id?: string };
    }>(signup);
    signupUserId = signupBody?.user?.id ?? signupBody?.id;
    if (!signupUserId) {
      return {
        ok: false,
        status: "FAILED",
        safeCode: "SUPABASE_SIGNUP_EVIDENCE_MISSING",
        retryable: false,
      };
    }

    async function createConfirmedUser(email: string) {
      const response = await fetcher(`${projectUrl}/auth/v1/admin/users`, {
        method: "POST",
        headers: supabaseDataHeaders(verifiedServerKey, verifiedServerKey),
        body: JSON.stringify({ email, password, email_confirm: true }),
      });
      if (!response.ok) return null;
      const body = await json<{ id?: string; user?: { id?: string } }>(
        response,
      );
      return body?.user?.id ?? body?.id ?? null;
    }
    userAId = (await createConfirmedUser(userAEmail)) ?? undefined;
    userBId = (await createConfirmedUser(userBEmail)) ?? undefined;
    if (!userAId || !userBId) {
      return {
        ok: false,
        status: "FAILED",
        safeCode: "SUPABASE_TEST_USER_CREATE_FAILED",
        retryable: false,
      };
    }

    async function signIn(email: string) {
      const response = await fetcher(
        `${projectUrl}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: supabaseDataHeaders(verifiedAnonKey, verifiedAnonKey),
          body: JSON.stringify({ email, password }),
        },
      );
      if (!response.ok) return null;
      return (await json<{ access_token?: string }>(response))?.access_token;
    }
    const tokenA = await signIn(userAEmail);
    const tokenB = await signIn(userBEmail);
    if (!tokenA || !tokenB) {
      return {
        ok: false,
        status: "FAILED",
        safeCode: "SUPABASE_LOGIN_TEST_FAILED",
        retryable: false,
      };
    }

    const todoTitle = `BuildFlow verification ${marker}`;
    const insert = await fetcher(`${projectUrl}/rest/v1/buildflow_todos`, {
      method: "POST",
      headers: supabaseDataHeaders(
        anonKey,
        tokenA,
        "return=representation",
      ),
      body: JSON.stringify({
        user_id: userAId,
        title: todoTitle,
        description: "Created by BuildFlow verification",
        status: "pending",
      }),
    });
    if (!insert.ok) {
      return {
        ok: false,
        status: "FAILED",
        safeCode: "CRUD_CREATE_TEST_FAILED",
        retryable: insert.status >= 500,
      };
    }
    const inserted = await json<Array<{ id?: string }>>(insert);
    todoId = inserted?.[0]?.id;
    if (!todoId) {
      return {
        ok: false,
        status: "FAILED",
        safeCode: "CRUD_CREATE_EVIDENCE_MISSING",
        retryable: false,
      };
    }

    const crossUser = await fetcher(
      `${projectUrl}/rest/v1/buildflow_todos?id=eq.${encodeURIComponent(todoId)}&select=id`,
      { headers: supabaseDataHeaders(anonKey, tokenB) },
    );
    const crossUserRows = crossUser.ok
      ? await json<Array<{ id?: string }>>(crossUser)
      : null;
    if (!crossUser.ok || (crossUserRows?.length ?? 0) !== 0) {
      return {
        ok: false,
        status: "FAILED",
        safeCode: "CRUD_CROSS_USER_RLS_FAILED",
        retryable: false,
      };
    }

    const search = new URL(`${projectUrl}/rest/v1/buildflow_todos`);
    search.searchParams.set("select", "id,title,status");
    search.searchParams.set("title", `ilike.*${marker}*`);
    search.searchParams.set("status", "eq.pending");
    const searched = await fetcher(search, {
      headers: supabaseDataHeaders(anonKey, tokenA),
    });
    const searchedRows = searched.ok
      ? await json<Array<{ id?: string }>>(searched)
      : null;
    if (!searched.ok || !searchedRows?.some((row) => row.id === todoId)) {
      return {
        ok: false,
        status: "FAILED",
        safeCode: "CRUD_SEARCH_FILTER_TEST_FAILED",
        retryable: searched.status >= 500,
      };
    }

    const updatedTitle = `${todoTitle} updated`;
    const update = await fetcher(
      `${projectUrl}/rest/v1/buildflow_todos?id=eq.${encodeURIComponent(todoId)}`,
      {
        method: "PATCH",
        headers: supabaseDataHeaders(
          anonKey,
          tokenA,
          "return=representation",
        ),
        body: JSON.stringify({
          title: updatedTitle,
          status: "completed",
        }),
      },
    );
    const updated = update.ok
      ? await json<Array<{ title?: string; status?: string }>>(update)
      : null;
    if (
      !update.ok ||
      updated?.[0]?.title !== updatedTitle ||
      updated?.[0]?.status !== "completed"
    ) {
      return {
        ok: false,
        status: "FAILED",
        safeCode: "CRUD_UPDATE_STATUS_TEST_FAILED",
        retryable: update.status >= 500,
      };
    }

    const addAdmin = await fetcher(
      `${projectUrl}/rest/v1/buildflow_admins`,
      {
        method: "POST",
        headers: supabaseDataHeaders(
          serverKey,
          serverKey,
          "resolution=merge-duplicates",
        ),
        body: JSON.stringify({ user_id: userBId }),
      },
    );
    if (!addAdmin.ok) {
      return {
        ok: false,
        status: "FAILED",
        safeCode: "CRUD_ADMIN_SETUP_FAILED",
        retryable: addAdmin.status >= 500,
      };
    }
    const adminRead = await fetcher(
      `${projectUrl}/rest/v1/buildflow_todos?id=eq.${encodeURIComponent(todoId)}&select=id,user_id`,
      { headers: supabaseDataHeaders(anonKey, tokenB) },
    );
    const adminRows = adminRead.ok
      ? await json<Array<{ id?: string; user_id?: string }>>(adminRead)
      : null;
    if (
      !adminRead.ok ||
      !adminRows?.some(
        (row) => row.id === todoId && row.user_id === userAId,
      )
    ) {
      return {
        ok: false,
        status: "FAILED",
        safeCode: "CRUD_ADMIN_READ_TEST_FAILED",
        retryable: adminRead.status >= 500,
      };
    }

    const remove = await fetcher(
      `${projectUrl}/rest/v1/buildflow_todos?id=eq.${encodeURIComponent(todoId)}`,
      {
        method: "DELETE",
        headers: supabaseDataHeaders(
          anonKey,
          tokenA,
          "return=representation",
        ),
      },
    );
    if (!remove.ok) {
      return {
        ok: false,
        status: "FAILED",
        safeCode: "CRUD_DELETE_TEST_FAILED",
        retryable: remove.status >= 500,
      };
    }
    todoId = undefined;
    return {
      ok: true,
      status: "SUCCEEDED",
      safeCode: "VERCEL_CRUD_FUNCTIONAL_TEST_PASSED",
      retryable: false,
      url: serviceUrl,
    };
  } catch {
    return {
      ok: false,
      status: "FAILED",
      safeCode: "DEPLOYMENT_CRUD_FUNCTIONAL_TEST_FAILED",
      retryable: true,
    };
  } finally {
    if (todoId) {
      await fetcher(
        `${projectUrl}/rest/v1/buildflow_todos?id=eq.${encodeURIComponent(todoId)}`,
        {
          method: "DELETE",
          headers: supabaseDataHeaders(serverKey, serverKey),
        },
      );
    }
    if (userBId) {
      await fetcher(
        `${projectUrl}/rest/v1/buildflow_admins?user_id=eq.${encodeURIComponent(userBId)}`,
        {
          method: "DELETE",
          headers: supabaseDataHeaders(serverKey, serverKey),
        },
      );
    }
    await Promise.all([
      deleteSupabaseTestUser(fetcher, projectUrl, serverKey, signupUserId),
      deleteSupabaseTestUser(fetcher, projectUrl, serverKey, userAId),
      deleteSupabaseTestUser(fetcher, projectUrl, serverKey, userBId),
    ]);
  }
}

export function createVercelAdapter(
  fetcher: typeof fetch = fetch,
): ProviderAdapter {
  return {
    async prepareCommand(command) {
      return command;
    },
    async validateCommand(command) {
      return prepared(command);
    },
    estimateImpact: impact,
    async executeCommand(command, credential) {
      const values = await credential.resolve("vercel");
      if (!values?.token) {
        return {
          ok: false,
          status: "WAITING_FOR_USER",
          safeCode: "CREDENTIAL_REQUIRED",
          retryable: false,
        };
      }
      const projectName = String(command.payload.projectName ?? "");
      const repository = String(command.payload.repository ?? "");
      const headers = vercelHeaders(values.token);

      if (command.kind === "CREATE_PROJECT") {
        const existing = await fetcher(
          vercelUrl(
            `/v9/projects/${encodeURIComponent(projectName)}`,
            values.teamId,
          ),
          { headers },
        );
        if (existing.ok) {
          const body = await json<{ id?: string }>(existing);
          const protection = await makeVercelProjectPublic(
            fetcher,
            body?.id ?? projectName,
            values.teamId,
            headers,
          );
          if (!protection.ok) return providerFailure(protection, "VERCEL");
          return {
            ok: true,
            status: "SUCCEEDED",
            safeCode: "VERCEL_PROJECT_EXISTS",
            resourceId: body?.id,
            retryable: false,
          };
        }
        if (existing.status !== 404) return providerFailure(existing, "VERCEL");

        const supabase = await credential.resolve("supabase");
        const blueprintId = String(
          command.payload.blueprintId ?? "ai-inquiry-v1",
        );
        const needsOpenAI = blueprintId === "ai-inquiry-v1";
        const openai = needsOpenAI
          ? await credential.resolve("openai")
          : null;
        if (
          !supabase?.projectUrl ||
          !supabase.anonKey ||
          !supabase.serverKey ||
          (needsOpenAI && !openai?.apiKey)
        ) {
          return {
            ok: false,
            status: "WAITING_FOR_USER",
            safeCode: "DEPENDENCY_CREDENTIAL_REQUIRED",
            retryable: false,
          };
        }
        const response = await fetcher(
          vercelUrl("/v11/projects", values.teamId),
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              name: projectName,
              framework: "nextjs",
              gitRepository: { type: "github", repo: repository },
              environmentVariables: [
                {
                  key: "NEXT_PUBLIC_SUPABASE_URL",
                  value: supabase.projectUrl,
                  type: "plain",
                  target: ["production", "preview"],
                },
                {
                  key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
                  value: supabase.anonKey,
                  type: "sensitive",
                  target: ["production", "preview"],
                },
                {
                  key: "SUPABASE_SECRET_KEY",
                  value: supabase.serverKey,
                  type: "sensitive",
                  target: ["production", "preview"],
                },
                ...(needsOpenAI
                  ? [
                      {
                        key: "OPENAI_API_KEY",
                        value: openai?.apiKey ?? "",
                        type: "sensitive",
                        target: ["production", "preview"],
                      },
                      {
                        key: "OPENAI_MODEL",
                        value: "gpt-5-mini",
                        type: "plain",
                        target: ["production", "preview"],
                      },
                    ]
                  : []),
              ],
            }),
          },
        );
        if (!response.ok) return providerFailure(response, "VERCEL");
        const body = await json<{ id?: string }>(response);
        const protection = await makeVercelProjectPublic(
          fetcher,
          body?.id ?? projectName,
          values.teamId,
          headers,
        );
        if (!protection.ok) return providerFailure(protection, "VERCEL");
        return {
          ok: true,
          status: "SUCCEEDED",
          safeCode: "VERCEL_PROJECT_CREATED",
          resourceId: body?.id,
          retryable: false,
        };
      }

      if (command.kind === "DEPLOY") {
        const repoId = String(command.payload.repoId ?? "");
        const response = await fetcher(
          vercelUrl("/v13/deployments", values.teamId),
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              name: projectName,
              project: projectName,
              target: "production",
              gitSource: { type: "github", repoId, ref: "main" },
            }),
          },
        );
        if (!response.ok) return providerFailure(response, "VERCEL");
        const body = await json<{ id?: string; url?: string }>(response);
        return {
          ok: true,
          status: "SUCCEEDED",
          safeCode: "VERCEL_DEPLOYMENT_CREATED",
          resourceId: body?.id,
          url: body?.url ? `https://${body.url}` : undefined,
          retryable: false,
        };
      }

      if (command.kind === "CHECK_DEPLOYMENT_STATUS") {
        const deploymentId = String(command.payload.deploymentId ?? "");
        const response = await fetcher(
          vercelUrl(
            `/v13/deployments/${encodeURIComponent(deploymentId)}`,
            values.teamId,
          ),
          { headers },
        );
        if (!response.ok) return providerFailure(response, "VERCEL");
        const body = await json<{
          readyState?: string;
          status?: string;
          url?: string;
        }>(response);
        const state = body?.readyState ?? body?.status;
        if (state === "READY") {
          return {
            ok: true,
            status: "SUCCEEDED",
            safeCode: "VERCEL_DEPLOYMENT_READY",
            resourceId: deploymentId,
            url: body?.url ? `https://${body.url}` : undefined,
            retryable: false,
          };
        }
        if (state === "ERROR" || state === "CANCELED") {
          return {
            ok: false,
            status: "FAILED",
            safeCode: "VERCEL_DEPLOYMENT_FAILED",
            retryable: false,
          };
        }
        return {
          ok: false,
          status: "FAILED",
          safeCode: "VERCEL_DEPLOYMENT_PENDING",
          resourceId: deploymentId,
          url: body?.url ? `https://${body.url}` : undefined,
          retryable: true,
        };
      }

      return {
        ok: false,
        status: "FAILED",
        safeCode: "VERCEL_COMMAND_NOT_IMPLEMENTED",
        retryable: false,
      };
    },
    async verifyCommand(command, result, credential) {
      if (!result.ok || !result.url) return result;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);
      try {
        const response = await fetcher(`${result.url}/api/health`, {
          signal: controller.signal,
          redirect: "follow",
        });
        if (!response.ok) {
          return {
            ...result,
            ok: false,
            status: "FAILED",
            safeCode: "DEPLOYMENT_HEALTH_CHECK_FAILED",
            retryable: response.status >= 500,
          };
        }
        if (command.payload.verificationProfile === "GENERAL_CRUD") {
          const verified = await verifyGeneralCrud(
            fetcher,
            result.url,
            credential,
          );
          return verified.ok
            ? { ...result, safeCode: verified.safeCode }
            : { ...result, ...verified, url: result.url };
        }
        const functional = await fetcher(`${result.url}/api/inquiries`, {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message:
              "BuildFlow 자동 검증입니다. 서비스가 준비되었다는 짧은 확인 문장을 작성해 주세요.",
          }),
        });
        return functional.ok
          ? { ...result, safeCode: "VERCEL_FUNCTIONAL_TEST_PASSED" }
          : {
              ...result,
              ok: false,
              status: "FAILED",
              safeCode: "DEPLOYMENT_FUNCTIONAL_TEST_FAILED",
              retryable: functional.status >= 500,
            };
      } catch {
        return {
          ...result,
          ok: false,
          status: "FAILED",
          safeCode: "DEPLOYMENT_HEALTH_CHECK_TIMEOUT",
          retryable: true,
        };
      } finally {
        clearTimeout(timeout);
      }
    },
    async rollbackCommand(_command, result) {
      return result.ok
        ? {
            ok: true,
            status: "SUCCEEDED",
            safeCode: "ROLLBACK_REQUIRES_EXPLICIT_APPROVAL",
            retryable: false,
          }
        : result;
    },
    sanitizeResult: safe,
  };
}

export const githubAdapter = createGitHubAdapter();
export const supabaseAdapter = createSupabaseAdapter();
export const vercelAdapter = createVercelAdapter();
export const providerAdapters = {
  github: githubAdapter,
  supabase: supabaseAdapter,
  vercel: vercelAdapter,
};
