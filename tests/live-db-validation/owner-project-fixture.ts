import { LIVE_DB_TEST_PREFIX, type LiveDbSafeErrorCode } from "./types";

/** Only the two columns this boundary reads. No project content is ever fetched. */
export type LiveDbProjectRow = { id: string; user_id: string };

type SingleRowOutcome = PromiseLike<{ data: LiveDbProjectRow | null; error: unknown }>;

/**
 * The structural subset of a Supabase client this fixture drives.
 *
 * Declared narrowly rather than reusing `LiveDbSchemaClient`, whose `select` is
 * shaped for head-counts. The *runtime* client is the same one
 * `runStagingValidation` already built from the guarded environment — this only
 * describes the two calls made through it, so no second client factory exists.
 */
export type LiveDbProjectClient = {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string): { maybeSingle(): SingleRowOutcome };
    };
    insert(values: Record<string, unknown>): PromiseLike<{ error: unknown }>;
  };
};

export type OwnerProjectFixtureInput = {
  /** `LIVE_DB_OWNER_PROJECT_ID` — the exact row APR's binding will name. */
  projectId: string;
  /** `LIVE_DB_OWNER_USER_ID` — must already exist in `auth.users`. */
  userId: string;
  /** Carries the validation prefix so ST-D cleanup can find the row. */
  title: string;
};

export type OwnerProjectFixtureResult =
  | { status: "CREATED" }
  | { status: "REUSED" }
  | { status: "BLOCKED"; safeErrorCode: LiveDbSafeErrorCode };

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * `projects.title` is `not null check (char_length(trim(title)) between 1 and 200)`,
 * so a blank or oversized title is a constraint violation this can catch locally
 * rather than discovering it as an insert error against the database.
 */
function invalidInput(input: OwnerProjectFixtureInput): boolean {
  const title = input.title.trim();
  return (
    !uuid.test(input.projectId) ||
    !uuid.test(input.userId) ||
    title.length < 1 ||
    title.length > 200 ||
    !title.startsWith(LIVE_DB_TEST_PREFIX)
  );
}

const blocked = (safeErrorCode: LiveDbSafeErrorCode): OwnerProjectFixtureResult => ({
  status: "BLOCKED",
  safeErrorCode,
});

async function readOwnerProject(
  client: LiveDbProjectClient,
  projectId: string,
): Promise<{ status: "READ"; row: LiveDbProjectRow | null } | { status: "ERRORED" }> {
  try {
    const { data, error } = await client
      .from("projects")
      .select("id,user_id")
      .eq("id", projectId)
      .maybeSingle();
    return error ? { status: "ERRORED" } : { status: "READ", row: data };
  } catch {
    return { status: "ERRORED" };
  }
}

/**
 * Guarantees the owner project row APR-01 needs, after the migration created the
 * table it lives in.
 *
 * `create_runtime_approval_request` refuses unless a `public.projects` row
 * exists whose `user_id` equals the requester, so without this every approval
 * case fails with `RUNTIME_APPROVAL_NOT_AUTHORIZED`. The row could not simply be
 * a user precondition: `public.projects` is created by the migration this run
 * applies, so on a clean disposable staging project the table does not exist
 * until ST-B is already underway.
 *
 * Three outcomes, and only three:
 *
 * - the row is absent  → insert it, read it back, verify the ownership
 * - the row is present and owned by the expected user → reuse it untouched
 * - the row is present and owned by anyone else → block
 *
 * An existing row is never updated. Re-pointing someone else's project at the
 * validation user would be a write outside this sprint's data, and the whole
 * point of checking ownership is that it is not ours to change.
 *
 * Every failure — a read error, an insert error, a missing or mismatched
 * readback — blocks. `projects.user_id` references `auth.users`, so a missing
 * owner account surfaces here as an insert error and blocks rather than being
 * worked around; creating auth users is not this boundary's authority.
 *
 * No database message is returned: the result carries safe codes only.
 */
export async function ensureOwnerProjectFixture(
  client: LiveDbProjectClient | undefined,
  input: OwnerProjectFixtureInput,
): Promise<OwnerProjectFixtureResult> {
  if (!client) return blocked("LIVE_DB_CLIENT_NOT_EXPLICITLY_INJECTED");
  if (invalidInput(input)) return blocked("LIVE_DB_PROJECT_FIXTURE_INPUT_INVALID");

  const existing = await readOwnerProject(client, input.projectId);
  if (existing.status === "ERRORED") return blocked("LIVE_DB_PROJECT_FIXTURE_SETUP_FAILED");
  if (existing.row) {
    return existing.row.user_id === input.userId
      ? { status: "REUSED" }
      : blocked("LIVE_DB_PROJECT_FIXTURE_OWNER_MISMATCH");
  }

  try {
    const { error } = await client.from("projects").insert({
      id: input.projectId,
      user_id: input.userId,
      title: input.title.trim(),
    });
    if (error) return blocked("LIVE_DB_PROJECT_FIXTURE_SETUP_FAILED");
  } catch {
    return blocked("LIVE_DB_PROJECT_FIXTURE_SETUP_FAILED");
  }

  // Read back separately rather than trusting the insert's own representation:
  // the row APR will be authorised against is the one the database now holds.
  const readback = await readOwnerProject(client, input.projectId);
  if (readback.status === "ERRORED") return blocked("LIVE_DB_PROJECT_FIXTURE_READBACK_FAILED");
  if (!readback.row || readback.row.id !== input.projectId) {
    return blocked("LIVE_DB_PROJECT_FIXTURE_READBACK_FAILED");
  }
  if (readback.row.user_id !== input.userId) {
    return blocked("LIVE_DB_PROJECT_FIXTURE_OWNER_MISMATCH");
  }
  return { status: "CREATED" };
}
