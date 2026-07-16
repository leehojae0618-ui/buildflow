create table if not exists public.verification_errors (
  id uuid primary key default gen_random_uuid(),
  verification_attempt_id uuid not null
    references public.verification_attempts(id) on delete cascade,
  safe_error_code text not null,
  message text not null,
  retryable boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists verification_errors_attempt_idx
on public.verification_errors(verification_attempt_id);

alter table public.verification_errors enable row level security;

drop policy if exists "Users can manage owned autonomous sessions"
on public.autonomous_build_sessions;

create policy "Users can view owned autonomous sessions"
on public.autonomous_build_sessions
for select
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.projects p
    where p.id = project_id
      and p.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can manage owned deployment sessions"
on public.deployment_sessions;

create policy "Users can view owned deployment sessions"
on public.deployment_sessions
for select
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.projects p
    where p.id = project_id
      and p.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can manage owned provider command runs"
on public.provider_command_runs;

create policy "Users can view owned provider command runs"
on public.provider_command_runs
for select
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.projects p
    where p.id = project_id
      and p.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can manage owned provider credential references"
on public.provider_credentials;

create policy "Users can view owned provider credential references"
on public.provider_credentials
for select
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.projects p
    where p.id = project_id
      and p.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can manage their verification runs"
on public.verification_runs;
drop policy if exists "Users can manage their verification targets"
on public.verification_targets;
drop policy if exists "Users can manage their verification attempts"
on public.verification_attempts;
drop policy if exists "Users can manage their verification errors"
on public.verification_errors;

create policy "Users can view their verification runs"
on public.verification_runs
for select
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.projects p
    where p.id = project_id
      and p.user_id = (select auth.uid())
  )
);

create policy "Users can view their verification targets"
on public.verification_targets
for select
to authenticated
using (
  exists (
    select 1
    from public.verification_runs r
    where r.id = verification_run_id
      and r.user_id = (select auth.uid())
  )
);

create policy "Users can view their verification attempts"
on public.verification_attempts
for select
to authenticated
using (
  exists (
    select 1
    from public.verification_targets t
    join public.verification_runs r
      on r.id = t.verification_run_id
    where t.id = verification_target_id
      and r.user_id = (select auth.uid())
  )
);

create policy "Users can view their verification errors"
on public.verification_errors
for select
to authenticated
using (
  exists (
    select 1
    from public.verification_attempts a
    join public.verification_targets t
      on t.id = a.verification_target_id
    join public.verification_runs r
      on r.id = t.verification_run_id
    where a.id = verification_attempt_id
      and r.user_id = (select auth.uid())
  )
);
