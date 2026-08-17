import { describe, expect, it, vi } from "vitest";

import {
  ensureOwnerProjectFixture,
  type LiveDbProjectClient,
  type LiveDbProjectRow,
} from "./owner-project-fixture";
import { hasStagingUnsafeValue } from "./staging-evidence";
import { LIVE_DB_TEST_PREFIX } from "./types";

const projectId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";
const otherUserId = "99999999-9999-4999-8999-999999999999";
const title = `${LIVE_DB_TEST_PREFIX}staging-run-1`;

const input = { projectId, userId, title };

type Behaviour = {
  /** Rows keyed by id; reads consult this, inserts add to it. */
  rows?: Map<string, LiveDbProjectRow>;
  readError?: unknown;
  /** Applied to the read that happens after the insert. */
  readbackError?: unknown;
  readbackRow?: LiveDbProjectRow | null;
  insertError?: unknown;
  readThrows?: boolean;
  insertThrows?: boolean;
};

const clientWith = (behaviour: Behaviour = {}) => {
  const rows = behaviour.rows ?? new Map<string, LiveDbProjectRow>();
  const calls: string[] = [];
  let reads = 0;

  const client: LiveDbProjectClient = {
    from(table) {
      return {
        select(columns) {
          return {
            eq(column, value) {
              return {
                async maybeSingle() {
                  reads += 1;
                  calls.push(`select:${table}:${columns}:${column}=${value}`);
                  if (behaviour.readThrows) throw new Error("connection reset");
                  const isReadback = reads > 1;
                  if (isReadback && behaviour.readbackError) {
                    return { data: null, error: behaviour.readbackError };
                  }
                  if (!isReadback && behaviour.readError) {
                    return { data: null, error: behaviour.readError };
                  }
                  if (isReadback && "readbackRow" in behaviour) {
                    return { data: behaviour.readbackRow ?? null, error: null };
                  }
                  return { data: rows.get(value) ?? null, error: null };
                },
              };
            },
          };
        },
        async insert(values) {
          calls.push(`insert:${table}:${Object.keys(values).sort().join(",")}`);
          if (behaviour.insertThrows) throw new Error("connection reset");
          if (behaviour.insertError) return { error: behaviour.insertError };
          rows.set(String(values.id), {
            id: String(values.id),
            user_id: String(values.user_id),
          });
          return { error: null };
        },
      };
    },
  };
  return { client, calls, rows };
};

describe("ensureOwnerProjectFixture", () => {
  it("creates the row, reads it back and verifies ownership when it is missing", async () => {
    const { client, calls, rows } = clientWith();

    expect(await ensureOwnerProjectFixture(client, input)).toEqual({ status: "CREATED" });
    expect(rows.get(projectId)).toEqual({ id: projectId, user_id: userId });
    // select, insert, then a separate readback.
    expect(calls).toEqual([
      `select:projects:id,user_id:id=${projectId}`,
      "insert:projects:id,title,user_id",
      `select:projects:id,user_id:id=${projectId}`,
    ]);
  });

  it("inserts only the three fields the schema actually requires", async () => {
    const inserted: Record<string, unknown>[] = [];
    const client: LiveDbProjectClient = {
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
        insert: async (values) => {
          inserted.push(values);
          return { error: null };
        },
      }),
    };
    // The readback finds nothing here, so this blocks — the assertion is about
    // what was written, not the verdict.
    await ensureOwnerProjectFixture(client, input);
    expect(inserted).toEqual([{ id: projectId, user_id: userId, title }]);
  });

  it("reuses an existing row owned by the expected user without writing", async () => {
    const rows = new Map([[projectId, { id: projectId, user_id: userId }]]);
    const { client, calls } = clientWith({ rows });

    expect(await ensureOwnerProjectFixture(client, input)).toEqual({ status: "REUSED" });
    expect(calls.some((call) => call.startsWith("insert:"))).toBe(false);
  });

  it("is idempotent across repeated runs", async () => {
    const rows = new Map<string, LiveDbProjectRow>();
    const first = clientWith({ rows });
    expect(await ensureOwnerProjectFixture(first.client, input)).toEqual({ status: "CREATED" });

    const second = clientWith({ rows });
    expect(await ensureOwnerProjectFixture(second.client, input)).toEqual({ status: "REUSED" });
    expect(second.calls.some((call) => call.startsWith("insert:"))).toBe(false);
    expect(rows.size).toBe(1);
  });

  it("blocks on a row owned by someone else and never rewrites its owner", async () => {
    const rows = new Map([[projectId, { id: projectId, user_id: otherUserId }]]);
    const { client, calls } = clientWith({ rows });

    expect(await ensureOwnerProjectFixture(client, input)).toEqual({
      status: "BLOCKED",
      safeErrorCode: "LIVE_DB_PROJECT_FIXTURE_OWNER_MISMATCH",
    });
    // The row is left exactly as it was found.
    expect(rows.get(projectId)).toEqual({ id: projectId, user_id: otherUserId });
    expect(calls.some((call) => call.startsWith("insert:"))).toBe(false);
  });

  it("blocks when the initial read fails, rather than assuming the row is absent", async () => {
    const { client, calls } = clientWith({ readError: { code: "08006", message: "connection failure" } });

    expect(await ensureOwnerProjectFixture(client, input)).toMatchObject({
      safeErrorCode: "LIVE_DB_PROJECT_FIXTURE_SETUP_FAILED",
    });
    // An unreadable table must not lead to an insert attempt.
    expect(calls.some((call) => call.startsWith("insert:"))).toBe(false);
  });

  it("blocks when the insert fails, which is also how a missing auth user surfaces", async () => {
    // projects.user_id references auth.users, so an absent owner account is a
    // foreign-key error here — blocked, never worked around.
    const { client } = clientWith({
      insertError: { code: "23503", message: 'violates foreign key constraint "projects_user_id_fkey"' },
    });

    expect(await ensureOwnerProjectFixture(client, input)).toMatchObject({
      safeErrorCode: "LIVE_DB_PROJECT_FIXTURE_SETUP_FAILED",
    });
  });

  it("blocks when the readback errors or returns nothing", async () => {
    expect(
      await ensureOwnerProjectFixture(
        clientWith({ readbackError: { code: "08006", message: "connection failure" } }).client,
        input,
      ),
    ).toMatchObject({ safeErrorCode: "LIVE_DB_PROJECT_FIXTURE_READBACK_FAILED" });

    expect(
      await ensureOwnerProjectFixture(clientWith({ readbackRow: null }).client, input),
    ).toMatchObject({ safeErrorCode: "LIVE_DB_PROJECT_FIXTURE_READBACK_FAILED" });
  });

  it("blocks when the readback shows a different id or owner than requested", async () => {
    expect(
      await ensureOwnerProjectFixture(
        clientWith({ readbackRow: { id: otherUserId, user_id: userId } }).client,
        input,
      ),
    ).toMatchObject({ safeErrorCode: "LIVE_DB_PROJECT_FIXTURE_READBACK_FAILED" });

    expect(
      await ensureOwnerProjectFixture(
        clientWith({ readbackRow: { id: projectId, user_id: otherUserId } }).client,
        input,
      ),
    ).toMatchObject({ safeErrorCode: "LIVE_DB_PROJECT_FIXTURE_OWNER_MISMATCH" });
  });

  it("survives a throwing client on either call", async () => {
    expect(
      await ensureOwnerProjectFixture(clientWith({ readThrows: true }).client, input),
    ).toMatchObject({ safeErrorCode: "LIVE_DB_PROJECT_FIXTURE_SETUP_FAILED" });
    expect(
      await ensureOwnerProjectFixture(clientWith({ insertThrows: true }).client, input),
    ).toMatchObject({ safeErrorCode: "LIVE_DB_PROJECT_FIXTURE_SETUP_FAILED" });
  });

  it("fails closed without a client", async () => {
    expect(await ensureOwnerProjectFixture(undefined, input)).toMatchObject({
      safeErrorCode: "LIVE_DB_CLIENT_NOT_EXPLICITLY_INJECTED",
    });
  });

  it("rejects fixture input the schema or the cleanup contract would not accept", async () => {
    const { client, calls } = clientWith();
    const invalid = [
      { ...input, projectId: "not-a-uuid" },
      { ...input, userId: "not-a-uuid" },
      { ...input, title: "   " },
      // projects.title is checked to be at most 200 characters.
      { ...input, title: `${LIVE_DB_TEST_PREFIX}${"x".repeat(200)}` },
      // Without the prefix, ST-D cleanup could not account for the row.
      { ...input, title: "untracked-project" },
    ];
    for (const candidate of invalid) {
      expect(await ensureOwnerProjectFixture(client, candidate)).toMatchObject({
        safeErrorCode: "LIVE_DB_PROJECT_FIXTURE_INPUT_INVALID",
      });
    }
    // Nothing reached the database.
    expect(calls).toEqual([]);
  });

  it("returns no database message, only safe codes", async () => {
    const leaky = {
      code: "23503",
      message: "postgresql://postgres:pw@db.stagingabc.supabase.co:5432/postgres",
    };
    const result = await ensureOwnerProjectFixture(clientWith({ insertError: leaky }).client, input);
    expect(hasStagingUnsafeValue(result)).toBe(false);
  });

  it("issues no network call of its own", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    await ensureOwnerProjectFixture(clientWith().client, input);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
