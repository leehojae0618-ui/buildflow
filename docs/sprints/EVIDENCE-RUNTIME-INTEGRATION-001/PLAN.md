# EVIDENCE-RUNTIME-INTEGRATION-001 Plan

1. Preserve the `RuntimeEvidenceSink` compatibility boundary and extend it with
   one canonical repository interface.
2. Provide deterministic in-memory and server-only Supabase adapters.
3. Add the dedicated append-only `runtime_evidence_records` migration and only
   its local type definition.
4. Pass server-trusted project/user association at the Orchestrator boundary,
   never through Agent, Plan, or Provider contracts.
5. Project only checksummed Runtime Evidence references into Package Evidence.
6. Validate focused contracts, full regression, static checks, and safety scans.
