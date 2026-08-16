# RECIPE-MANUAL-RUN-001 Contract

New Server Action boundary: `src/features/live-ai-news/actions.ts`. This is
the first UI-reachable trigger for the composite AI-news Recipe (C1 News
fetch -> C2 Groq summary -> C3 guarded Slack write), so its security
boundary is recorded explicitly.

```ts
export async function prepareAiNewsDigestRun(): Promise<AiNewsDigestPreview>;
export async function requestApprovedAiNewsDigestRun(): Promise<AiNewsDigestRunResult>;
```

## Security Boundary

- **No client-controlled inputs.** Neither function takes a parameter from
  the browser. The destination (`targetConfigurationReference`) is always
  `environment.approvedSlackChannelId`, read server-side — the same
  destination-lock invariant `runApprovedSlackDigestWrite` already enforces
  one layer down, just applied before any News/Groq call happens instead of
  only at the final Slack-write step.
- **Gate re-checked at this boundary, not just delegated.** Both functions
  call `readLiveRecipeEnvironment()` and check
  `liveConnectEnabled` -> `liveSlackWriteEnabled` -> `approvedSlackChannelId`
  + `GROQ_API_KEY` present, in that order, and return a typed error
  (`LIVE_DISABLED` | `WRITE_DISABLED` | `CONFIGURATION_MISSING`) before
  constructing any adapter. This is deliberately redundant with the check
  already inside `runApprovedSlackDigestWrite` — that inner check alone
  would still let C1 (RSS fetch) and C2 (Groq call) run first, since it
  only guards the final Slack write.
- **Idempotency.** `requestApprovedAiNewsDigestRun` generates its own
  `slack-digest-ui-run-<uuid>` request id per call (never client-supplied),
  so the existing `InMemorySlackWriteIdempotency` guard in
  `runApprovedSlackDigestWrite` still applies unmodified.
- **No changes to anything it wraps.** `runNewsToGroqToSlackGate`,
  `runApprovedSlackDigestWrite`, `live-recipe-service.ts`,
  `pipedream-real-adapter.ts`, and `pipedream-port.ts` are all unmodified.
  This Sprint only adds a stricter-than-necessary caller in front of them.

## Compatibility

Additive only. No existing exported function signature changed.
