alter table public.project_workflows
  drop constraint if exists project_workflows_status_check;

alter table public.project_workflows
  add constraint project_workflows_status_check
  check (status in ('selected', 'in_progress', 'setup', 'ready', 'completed', 'archived'));

alter table public.project_workflow_steps
  add column is_completed boolean not null default false,
  add column completed_at timestamptz,
  add column updated_at timestamptz not null default timezone('utc', now());

create trigger project_workflow_steps_set_updated_at
before update on public.project_workflow_steps
for each row execute function public.set_updated_at();
