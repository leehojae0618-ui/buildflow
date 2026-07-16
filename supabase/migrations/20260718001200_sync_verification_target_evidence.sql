create or replace function public.sync_verification_target_from_attempt()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_checked_at timestamptz := coalesce(new.completed_at, new.started_at);
  v_latency integer;
begin
  if coalesce(new.safe_evidence->>'latencyMs', '') ~ '^[0-9]+$' then
    v_latency := (new.safe_evidence->>'latencyMs')::integer;
  end if;

  update public.verification_targets
  set verified_capabilities = coalesce(
        new.safe_evidence->'capabilities',
        '[]'::jsonb
      ),
      safe_error_code = nullif(
        new.safe_evidence->>'safeErrorCode',
        ''
      ),
      latency_ms = v_latency,
      last_attempt_at = v_checked_at
  where id = new.verification_target_id
    and (
      last_attempt_at is null
      or last_attempt_at <= v_checked_at
    );

  return new;
end;
$$;

drop trigger if exists verification_attempt_sync_target
on public.verification_attempts;

create trigger verification_attempt_sync_target
after insert on public.verification_attempts
for each row execute function public.sync_verification_target_from_attempt();

with latest_attempt as (
  select distinct on (a.verification_target_id)
    a.verification_target_id,
    a.safe_evidence,
    coalesce(a.completed_at, a.started_at) as checked_at
  from public.verification_attempts a
  order by
    a.verification_target_id,
    coalesce(a.completed_at, a.started_at) desc,
    a.attempt_number desc
)
update public.verification_targets target
set verified_capabilities = coalesce(
      latest.safe_evidence->'capabilities',
      '[]'::jsonb
    ),
    safe_error_code = nullif(
      latest.safe_evidence->>'safeErrorCode',
      ''
    ),
    latency_ms = case
      when coalesce(latest.safe_evidence->>'latencyMs', '') ~ '^[0-9]+$'
      then (latest.safe_evidence->>'latencyMs')::integer
      else null
    end,
    last_attempt_at = latest.checked_at
from latest_attempt latest
where target.id = latest.verification_target_id;

revoke all on function public.sync_verification_target_from_attempt()
from public, anon, authenticated;
