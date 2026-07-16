alter table public.autonomous_build_sessions
  add column consent_granted_at timestamptz,
  add column approval_granted_at timestamptz,
  add column approval_scope_version text;
