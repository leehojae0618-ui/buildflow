# PRODUCT-RUNTIME-VERTICAL-SLICE-001 Task

## Status and Authority

```text
TASK ID: PRODUCT-RUNTIME-VERTICAL-SLICE-001
STATUS: SCOPE FROZEN / IMPLEMENTATION NOT APPROVED
ACTIVE IMPLEMENTATION SPRINT: NONE
IMPLEMENTATION AUTHORITY: NONE
COMMIT AUTHORITY: NONE
PUSH AUTHORITY: NONE
DEPLOY AUTHORITY: NONE
DB / RUNTIME / PROVIDER / MCP / EXTERNAL AUTHORITY: NONE
```

## Objective

Add the minimum BF0 product connection to the already committed Runtime Bridge
without making BF0 Build Plan guidance executable directly and without changing
Core contracts.

## Required Future Units

### 1. Eligibility and Artifact Projection

Create a pure `bf0-runtime-projection` module. It accepts a BF0 Draft only
when source is `직접 입력` and the design has no external source, destination,
connection requirement, or side effect. It creates deterministic validated
Blueprint/Agent/package/request/plan inputs using the existing builders in the
Plan. Unsupported input produces a safe ineligible result, never a Runtime
request.

### 2. Controlled Product Runtime Composition

Create `controlled-product-runtime.ts` as a product-owned composition layer.
It creates the ephemeral, explicit-approval-only in-memory implementation of
the existing approval repository, deterministic ProviderAdapter, and in-memory
Evidence repository, then injects them into `executeApprovedProductRuntime()`.
It must not import test fixtures or live Provider, Supabase, or DB adapters.

### 3. BF0 Server Action and UI

Add a server-only controlled-runtime action in the existing BF0 actions module
and add the smallest BF0 UI state needed to show eligibility, controlled
execution summary, separate explicit Runtime approval CTA, loading/failure,
and safe result references. BF0 approval preference remains informational.

### 4. Focused Tests

Test eligibility rejection, valid artifact construction through builders,
approval-required/no-auto-run, deterministic Provider no-network behavior,
safe failures, safe Evidence references, and UI truth copy.

## Exact Future Source Scope

```text
src/features/product-experience/bf0-runtime-projection.ts
src/features/product-experience/bf0-runtime-projection.test.ts
src/features/product-experience/actions.ts
src/features/product-experience/components/bf0-product-experience.tsx
src/features/product-runtime/controlled-product-runtime.ts
src/features/product-runtime/controlled-product-runtime.test.ts
```

## Explicit Exclusions

- `src/features/product-experience/draft-persistence.ts` and its test.
- Runtime, Provider, Evidence, Approval, Agent, Package, and Supabase Core
  contract source files.
- All migrations, SQL, RPC, RLS, environment, dependency, package, and
  lockfile changes.
- OpenAI SDK/API, network, external service, MCP, n8n, Make, OAuth, DB, and
  file-persistence invocation.
- Visual Closed Beta Slice and unrelated project pages.
- Commit, Push, Merge, Release, and Deploy.

## Stop Conditions

Stop and request a Scope Amendment when safe projection cannot be built through
the listed existing builders/validators, Core contract changes are needed, a
live credential/Provider/DB dependency is needed, an external BF0 flow becomes
eligible, the file scope must grow, or a truthful safe result cannot be shown.

## Required Future Validation

Run the validation plan in `PLAN.md`, preserve unrelated dirty work, and do
not claim production readiness or external execution from controlled results.
