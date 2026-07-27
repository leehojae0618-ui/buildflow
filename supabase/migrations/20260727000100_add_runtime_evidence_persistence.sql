create table public.runtime_evidence_records (
  runtime_evidence_id text primary key,
  integrity_checksum text not null unique,
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  runtime_execution_id text not null,
  runtime_execution_request_id text,
  runtime_execution_start_id text,
  runtime_plan_id text not null,
  runtime_step_id text not null,
  runtime_step_attempt_id text not null,
  package_id text,
  package_version text,
  evidence_report_id text,
  approval_request_id text,
  format_version text not null,
  event_type text not null check (event_type in ('RUNTIME_STARTED','PLAN_ACCEPTED','PROVIDER_INVOCATION_STARTED','PROVIDER_INVOCATION_COMPLETED','PROVIDER_INVOCATION_FAILED','STEP_COMPLETED','STEP_FAILED','EVIDENCE_APPENDED','RUNTIME_COMPLETED','RUNTIME_FAILED')),
  status text not null check (status in ('SUCCEEDED','FAILED','TIMED_OUT','CANCELLED','BLOCKED')),
  provider text not null,
  model text not null,
  safe_input_checksum text not null,
  safe_output_checksum text,
  provider_request_reference text,
  usage jsonb,
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  safe_error_code text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  check (octet_length(runtime_evidence_id) <= 256),
  check (octet_length(integrity_checksum) <= 256),
  check (octet_length(runtime_execution_id) <= 256),
  check (octet_length(runtime_plan_id) <= 256),
  check (octet_length(runtime_step_id) <= 256),
  check (octet_length(runtime_step_attempt_id) <= 256)
);

create index runtime_evidence_records_project_execution_idx on public.runtime_evidence_records(project_id, runtime_execution_id, occurred_at, runtime_evidence_id);
create index runtime_evidence_records_project_reference_idx on public.runtime_evidence_records(project_id, runtime_evidence_id);

alter table public.runtime_evidence_records enable row level security;

create policy "Users can view owned runtime evidence" on public.runtime_evidence_records for select to authenticated using (
  (select auth.uid()) = user_id and exists (
    select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid())
  )
);

create or replace function public.reject_runtime_evidence_mutation() returns trigger language plpgsql as $$
begin
  raise exception 'runtime evidence records are append-only';
end;
$$;

create trigger runtime_evidence_records_reject_update before update on public.runtime_evidence_records for each row execute function public.reject_runtime_evidence_mutation();
create trigger runtime_evidence_records_reject_delete before delete on public.runtime_evidence_records for each row execute function public.reject_runtime_evidence_mutation();
