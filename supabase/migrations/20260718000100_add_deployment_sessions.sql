create table public.deployment_sessions (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade,
  state text not null default 'PREPARING' check (state in ('PREPARING','BUILDING','DEPLOYING','WAITING_FOR_PROVIDER','WAITING_FOR_USER','VERIFYING','RECOVERING','READY','READY_WITH_WARNINGS','BLOCKED','FAILED','CANCELLED')),
  current_stage text not null default 'PREPARING', completed_stages jsonb not null default '[]'::jsonb, estimate jsonb not null default '{}'::jsonb, completion_report jsonb not null default '{}'::jsonb, retry_count integer not null default 0, automatic_recovery_count integer not null default 0, created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);
create index deployment_sessions_project_idx on public.deployment_sessions(project_id, updated_at desc);
create trigger deployment_sessions_updated_at before update on public.deployment_sessions for each row execute function public.set_updated_at();
alter table public.deployment_sessions enable row level security;
create policy "Users can manage owned deployment sessions" on public.deployment_sessions for all to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid()))) with check ((select auth.uid()) = user_id and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid())));
