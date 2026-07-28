# Product Runtime Bridge Contract

`executeApprovedProductRuntime()` is server-only. Its caller supplies only
`projectId`, `approvalRequestId`, Core Runtime request/plan objects, and safe
transient input. User identity and ownership are derived on the server.

```text
auth + ownership
→ Core validation
→ approval consume RPC
→ execution-authority projection
→ Core Runtime
→ Runtime Evidence repository
→ safe result / reference-only evidence
```

The approval RPC is the atomic boundary. Provider work is deliberately outside
that transaction; a provider failure never restores a consumed approval.

The preflight approval projection carries only safe request/package/evidence
bindings and the consumed approval identifier. It is an execution-authority
projection, not a database row and not a new Core contract.

The bridge response excludes prompts, model output, SDK payloads, credentials,
and database errors. Package evidence contains Runtime Evidence references only.
