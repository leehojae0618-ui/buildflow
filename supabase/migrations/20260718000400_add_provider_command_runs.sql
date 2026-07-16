create table public.provider_command_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  autonomous_session_id uuid references public.autonomous_build_sessions(id) on delete cascade,
  execution_id uuid references public.build_executions(id) on delete set null,
  command_id text not null,
  provider text not null check (provider in ('github', 'supabase', 'vercel')),
  command_kind text not null,
  approval_scope text not null,
  payload_checksum text not null,
  status text not null default 'PENDING' check (status in ('PENDING', 'RUNNING', 'WAITING_FOR_USER', 'SUCCEEDED', 'FAILED')),
  attempt_number integer not null default 0 check (attempt_number >= 0 and attempt_number <= 25),
  safe_result jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (project_id, command_id)
);

create index provider_command_runs_project_idx
  on public.provider_command_runs(project_id, created_at);

create trigger provider_command_runs_updated_at
before update on public.provider_command_runs
for each row execute function public.set_updated_at();

alter table public.provider_command_runs enable row level security;

create policy "Users can manage owned provider command runs"
on public.provider_command_runs
for all
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.projects p
    where p.id = project_id
      and p.user_id = (select auth.uid())
  )
)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.projects p
    where p.id = project_id
      and p.user_id = (select auth.uid())
  )
);
