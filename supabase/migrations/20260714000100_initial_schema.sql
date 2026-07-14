create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  ai_experience text check (ai_experience in ('beginner', 'intermediate', 'advanced')),
  can_develop boolean,
  primary_use_case text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 200),
  goal text,
  goal_description text,
  goal_constraints jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'active', 'completed', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.tools (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null,
  description text not null default '',
  pricing_model text,
  has_api boolean not null default false,
  has_oauth boolean not null default false,
  difficulty text,
  execution_support text,
  last_verified date,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.workflow_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  category text not null,
  goal_summary text not null default '',
  required_tools jsonb not null default '[]'::jsonb,
  alternatives jsonb not null default '[]'::jsonb,
  cost_model jsonb not null default '{}'::jsonb,
  difficulty text,
  estimated_setup_minutes integer check (estimated_setup_minutes is null or estimated_setup_minutes >= 0),
  execution_support_level text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.workflow_template_steps (
  id uuid primary key default gen_random_uuid(),
  workflow_template_id uuid not null references public.workflow_templates(id) on delete cascade,
  step_order integer not null check (step_order > 0),
  title text not null,
  description text not null default '',
  tool_id uuid references public.tools(id) on delete set null,
  is_required boolean not null default true,
  unique (workflow_template_id, step_order)
);

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  input_snapshot jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  explanation text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.recommendation_candidates (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid not null references public.recommendations(id) on delete cascade,
  workflow_template_id uuid not null references public.workflow_templates(id) on delete restrict,
  rank integer not null check (rank between 1 and 3),
  score numeric(6, 3),
  reason text,
  snapshot jsonb not null default '{}'::jsonb,
  unique (recommendation_id, rank),
  unique (recommendation_id, workflow_template_id)
);

create table public.project_workflows (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  workflow_template_id uuid references public.workflow_templates(id) on delete set null,
  recommendation_id uuid references public.recommendations(id) on delete set null,
  status text not null default 'selected' check (status in ('selected', 'setup', 'ready', 'completed', 'archived')),
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.project_workflow_steps (
  id uuid primary key default gen_random_uuid(),
  project_workflow_id uuid not null references public.project_workflows(id) on delete cascade,
  step_order integer not null check (step_order > 0),
  title text not null,
  description text not null default '',
  status text not null default 'pending' check (status in ('pending', 'ready', 'completed', 'skipped')),
  snapshot jsonb not null default '{}'::jsonb,
  unique (project_workflow_id, step_order)
);

create table public.usage_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index projects_user_id_updated_at_idx on public.projects(user_id, updated_at desc);
create index recommendations_project_id_created_at_idx on public.recommendations(project_id, created_at desc);
create index recommendation_candidates_recommendation_id_idx on public.recommendation_candidates(recommendation_id);
create index project_workflows_project_id_idx on public.project_workflows(project_id);
create index project_workflow_steps_workflow_id_idx on public.project_workflow_steps(project_workflow_id);
create index usage_records_user_id_created_at_idx on public.usage_records(user_id, created_at desc);
create index workflow_template_steps_template_id_idx on public.workflow_template_steps(workflow_template_id);

do $$
declare table_name text;
begin
  foreach table_name in array array['profiles', 'projects', 'tools', 'workflow_templates', 'workflow_template_steps', 'recommendations', 'recommendation_candidates', 'project_workflows', 'project_workflow_steps', 'usage_records'] loop
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end;
$$;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.tools enable row level security;
alter table public.workflow_templates enable row level security;
alter table public.workflow_template_steps enable row level security;
alter table public.recommendations enable row level security;
alter table public.recommendation_candidates enable row level security;
alter table public.project_workflows enable row level security;
alter table public.project_workflow_steps enable row level security;
alter table public.usage_records enable row level security;

create policy "Users can view their profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "Users can insert their profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "Users can update their profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "Users can manage their projects" on public.projects for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Public can view active tools" on public.tools for select to anon, authenticated using (is_active);
create policy "Public can view active templates" on public.workflow_templates for select to anon, authenticated using (is_active);
create policy "Public can view template steps" on public.workflow_template_steps for select to anon, authenticated using (exists (select 1 from public.workflow_templates t where t.id = workflow_template_id and t.is_active));

create policy "Users can manage their recommendations" on public.recommendations for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid())));
create policy "Users can view candidates for their recommendations" on public.recommendation_candidates for select to authenticated using (exists (select 1 from public.recommendations r where r.id = recommendation_id and r.user_id = (select auth.uid())));
create policy "Users can insert recommendation candidates" on public.recommendation_candidates for insert to authenticated with check (exists (select 1 from public.recommendations r where r.id = recommendation_id and r.user_id = (select auth.uid())));
create policy "Users can update recommendation candidates" on public.recommendation_candidates for update to authenticated using (exists (select 1 from public.recommendations r where r.id = recommendation_id and r.user_id = (select auth.uid()))) with check (exists (select 1 from public.recommendations r where r.id = recommendation_id and r.user_id = (select auth.uid())));
create policy "Users can delete recommendation candidates" on public.recommendation_candidates for delete to authenticated using (exists (select 1 from public.recommendations r where r.id = recommendation_id and r.user_id = (select auth.uid())));

create policy "Users can manage their project workflows" on public.project_workflows for all to authenticated using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid()))) with check (exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid())));
create policy "Users can manage their workflow steps" on public.project_workflow_steps for all to authenticated using (exists (select 1 from public.project_workflows w join public.projects p on p.id = w.project_id where w.id = project_workflow_id and p.user_id = (select auth.uid()))) with check (exists (select 1 from public.project_workflows w join public.projects p on p.id = w.project_id where w.id = project_workflow_id and p.user_id = (select auth.uid())));
create policy "Users can view their usage" on public.usage_records for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert their usage" on public.usage_records for insert to authenticated with check ((select auth.uid()) = user_id);
