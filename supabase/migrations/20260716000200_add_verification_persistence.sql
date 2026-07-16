create table public.verification_runs (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade, execution_id uuid references public.build_executions(id) on delete set null, user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'NOT_RUN' check (status in ('NOT_RUN','WAITING_FOR_CREDENTIAL','RUNNING','VERIFIED','WARNING','FAILED','EXPIRED','UNAVAILABLE')),
  final_status text not null default 'BLOCKED' check (final_status in ('READY','READY_WITH_WARNINGS','BLOCKED','FAILED')), result jsonb not null default '{}'::jsonb, credential_snapshot_version text, created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);
create table public.verification_targets (
  id uuid primary key default gen_random_uuid(), verification_run_id uuid not null references public.verification_runs(id) on delete cascade, provider text not null, required boolean not null default true, verification_stage text not null, status text not null default 'NOT_RUN', last_attempt_at timestamptz, expires_at timestamptz, safe_error_code text, verified_capabilities jsonb not null default '[]'::jsonb, latency_ms integer, unique (verification_run_id, provider, verification_stage)
);
create table public.verification_attempts (
  id uuid primary key default gen_random_uuid(), verification_target_id uuid not null references public.verification_targets(id) on delete cascade, attempt_number integer not null check (attempt_number > 0), status text not null, safe_evidence jsonb not null default '{}'::jsonb, started_at timestamptz not null default timezone('utc', now()), completed_at timestamptz, unique (verification_target_id, attempt_number)
);
create table public.verification_errors (
  id uuid primary key default gen_random_uuid(), verification_attempt_id uuid not null references public.verification_attempts(id) on delete cascade,
  safe_error_code text not null, message text not null, retryable boolean not null default false, created_at timestamptz not null default timezone('utc', now())
);
create index verification_runs_project_idx on public.verification_runs(project_id, updated_at desc);
create index verification_targets_run_idx on public.verification_targets(verification_run_id, status);
create index verification_attempts_target_idx on public.verification_attempts(verification_target_id, attempt_number desc);
create index verification_errors_attempt_idx on public.verification_errors(verification_attempt_id);
create unique index verification_runs_one_active_per_project on public.verification_runs(project_id) where status in ('RUNNING','WAITING_FOR_CREDENTIAL');
create trigger verification_runs_updated_at before update on public.verification_runs for each row execute function public.set_updated_at();
alter table public.verification_runs enable row level security; alter table public.verification_targets enable row level security; alter table public.verification_attempts enable row level security; alter table public.verification_errors enable row level security;
create policy "Users can manage their verification runs" on public.verification_runs for all to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid()))) with check ((select auth.uid()) = user_id and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid())));
create policy "Users can manage their verification targets" on public.verification_targets for all to authenticated using (exists (select 1 from public.verification_runs r where r.id = verification_run_id and r.user_id = (select auth.uid()))) with check (exists (select 1 from public.verification_runs r where r.id = verification_run_id and r.user_id = (select auth.uid())));
create policy "Users can manage their verification attempts" on public.verification_attempts for all to authenticated using (exists (select 1 from public.verification_targets t join public.verification_runs r on r.id = t.verification_run_id where t.id = verification_target_id and r.user_id = (select auth.uid()))) with check (exists (select 1 from public.verification_targets t join public.verification_runs r on r.id = t.verification_run_id where t.id = verification_target_id and r.user_id = (select auth.uid())));
create policy "Users can manage their verification errors" on public.verification_errors for all to authenticated using (exists (select 1 from public.verification_attempts a join public.verification_targets t on t.id = a.verification_target_id join public.verification_runs r on r.id = t.verification_run_id where a.id = verification_attempt_id and r.user_id = (select auth.uid()))) with check (exists (select 1 from public.verification_attempts a join public.verification_targets t on t.id = a.verification_target_id join public.verification_runs r on r.id = t.verification_run_id where a.id = verification_attempt_id and r.user_id = (select auth.uid())));
