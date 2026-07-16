create table public.build_executions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key text not null,
  status text not null default 'PENDING' check (status in ('PENDING','BLOCKED','READY','RUNNING','WAITING_FOR_USER','WAITING_FOR_APPROVAL','SUCCEEDED','FAILED','SKIPPED','CANCELLED')),
  selected_candidate_id text,
  selected_strategy text,
  architecture_snapshot jsonb not null default '{}'::jsonb,
  build_plan_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (project_id, idempotency_key)
);
create table public.execution_tasks (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid not null references public.build_executions(id) on delete cascade,
  task_key text not null,
  title text not null,
  action text not null check (action in ('AUTO','USER_ACTION','EXPERT_REQUIRED')),
  status text not null default 'PENDING' check (status in ('PENDING','BLOCKED','READY','RUNNING','WAITING_FOR_USER','WAITING_FOR_APPROVAL','SUCCEEDED','FAILED','SKIPPED','CANCELLED')),
  dependency_keys jsonb not null default '[]'::jsonb,
  retry_count integer not null default 0 check (retry_count >= 0),
  max_retries integer not null default 2 check (max_retries between 0 and 5),
  artifact_manifest jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (execution_id, task_key)
);
create table public.execution_attempts (
  id uuid primary key default gen_random_uuid(),
  execution_task_id uuid not null references public.execution_tasks(id) on delete cascade,
  attempt_number integer not null check (attempt_number > 0),
  status text not null check (status in ('RUNNING','SUCCEEDED','FAILED','CANCELLED')),
  error_code text,
  error_message text,
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  unique (execution_task_id, attempt_number)
);
create table public.execution_approvals (
  id uuid primary key default gen_random_uuid(),
  execution_task_id uuid not null references public.execution_tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED')),
  description text not null,
  provider text,
  estimated_cost_cents integer not null default 0 check (estimated_cost_cents >= 0),
  impact text not null default '',
  reversible boolean not null default false,
  decided_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);
create table public.execution_events (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid not null references public.build_executions(id) on delete cascade,
  execution_task_id uuid references public.execution_tasks(id) on delete cascade,
  event_type text not null,
  status text,
  safe_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);
create index build_executions_project_idx on public.build_executions(project_id, created_at desc);
create index execution_tasks_execution_idx on public.execution_tasks(execution_id, created_at);
create index execution_attempts_task_idx on public.execution_attempts(execution_task_id, attempt_number);
create index execution_approvals_task_idx on public.execution_approvals(execution_task_id, status);
create index execution_events_execution_idx on public.execution_events(execution_id, created_at);
do $$ declare table_name text; begin foreach table_name in array array['build_executions','execution_tasks'] loop execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name); end loop; end $$;
alter table public.build_executions enable row level security;
alter table public.execution_tasks enable row level security;
alter table public.execution_attempts enable row level security;
alter table public.execution_approvals enable row level security;
alter table public.execution_events enable row level security;
create policy "Users can manage their executions" on public.build_executions for all to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid()))) with check ((select auth.uid()) = user_id and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid())));
create policy "Users can manage their execution tasks" on public.execution_tasks for all to authenticated using (exists (select 1 from public.build_executions e where e.id = execution_id and e.user_id = (select auth.uid()))) with check (exists (select 1 from public.build_executions e where e.id = execution_id and e.user_id = (select auth.uid())));
create policy "Users can manage their execution attempts" on public.execution_attempts for all to authenticated using (exists (select 1 from public.execution_tasks t join public.build_executions e on e.id = t.execution_id where t.id = execution_task_id and e.user_id = (select auth.uid()))) with check (exists (select 1 from public.execution_tasks t join public.build_executions e on e.id = t.execution_id where t.id = execution_task_id and e.user_id = (select auth.uid())));
create policy "Users can manage their execution approvals" on public.execution_approvals for all to authenticated using (exists (select 1 from public.execution_tasks t join public.build_executions e on e.id = t.execution_id where t.id = execution_task_id and e.user_id = (select auth.uid()))) with check ((select auth.uid()) = user_id and exists (select 1 from public.execution_tasks t join public.build_executions e on e.id = t.execution_id where t.id = execution_task_id and e.user_id = (select auth.uid())));
create policy "Users can view their execution events" on public.execution_events for select to authenticated using (exists (select 1 from public.build_executions e where e.id = execution_id and e.user_id = (select auth.uid())));
