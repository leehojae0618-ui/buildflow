create table public.runtime_approval_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  requester_user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null check (scope = 'CORE_RUNTIME_PROVIDER_EXECUTION'),
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED', 'REVOKED', 'EXPIRED', 'CONSUMED')),
  runtime_execution_request_id text not null,
  runtime_execution_request_checksum text not null check (runtime_execution_request_checksum ~ '^[a-f0-9]{64}$'),
  runtime_plan_id text not null,
  runtime_plan_checksum text not null check (runtime_plan_checksum ~ '^[a-f0-9]{64}$'),
  provider text not null check (provider = 'openai'),
  model text not null check (length(model) > 0 and octet_length(model) <= 256),
  safe_input_checksum text not null check (safe_input_checksum ~ '^[a-f0-9]{64}$'),
  binding_checksum text not null unique check (binding_checksum ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null default (timezone('utc', now()) + interval '15 minutes'),
  approved_at timestamptz,
  approved_by_user_id uuid references auth.users(id) on delete set null,
  rejected_at timestamptz,
  rejected_by_user_id uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  revoked_by_user_id uuid references auth.users(id) on delete set null,
  consumed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  check (expires_at > created_at)
);

create index runtime_approval_requests_owner_status_idx
  on public.runtime_approval_requests(project_id, requester_user_id, status, expires_at);

create table public.runtime_approval_events (
  id uuid primary key default gen_random_uuid(),
  approval_id uuid not null references public.runtime_approval_requests(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('CREATED', 'APPROVED', 'REJECTED', 'REVOKED', 'EXPIRED', 'CONSUMED')),
  safe_metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now())
);

create index runtime_approval_events_approval_idx
  on public.runtime_approval_events(approval_id, occurred_at, id);

alter table public.runtime_approval_requests enable row level security;
alter table public.runtime_approval_events enable row level security;

create policy "Users can view owned runtime approvals"
on public.runtime_approval_requests for select to authenticated
using (
  requester_user_id = (select auth.uid())
  and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid()))
);

create policy "Users can view owned runtime approval events"
on public.runtime_approval_events for select to authenticated
using (
  user_id = (select auth.uid())
  and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid()))
);

create or replace function public.reject_runtime_approval_request_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.project_id is distinct from new.project_id
    or old.requester_user_id is distinct from new.requester_user_id
    or old.scope is distinct from new.scope
    or old.runtime_execution_request_id is distinct from new.runtime_execution_request_id
    or old.runtime_execution_request_checksum is distinct from new.runtime_execution_request_checksum
    or old.runtime_plan_id is distinct from new.runtime_plan_id
    or old.runtime_plan_checksum is distinct from new.runtime_plan_checksum
    or old.provider is distinct from new.provider
    or old.model is distinct from new.model
    or old.safe_input_checksum is distinct from new.safe_input_checksum
    or old.binding_checksum is distinct from new.binding_checksum
    or old.expires_at is distinct from new.expires_at
    or old.created_at is distinct from new.created_at then
    raise exception 'RUNTIME_APPROVAL_IMMUTABLE_BINDING';
  end if;

  if old.status = 'PENDING' and new.status not in ('APPROVED', 'REJECTED', 'REVOKED', 'EXPIRED') then
    raise exception 'RUNTIME_APPROVAL_INVALID_TRANSITION';
  elsif old.status = 'APPROVED' and new.status not in ('REVOKED', 'EXPIRED', 'CONSUMED') then
    raise exception 'RUNTIME_APPROVAL_INVALID_TRANSITION';
  elsif old.status <> new.status then
    raise exception 'RUNTIME_APPROVAL_INVALID_TRANSITION';
  end if;
  return new;
end;
$$;

create or replace function public.reject_runtime_approval_event_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'runtime approval events are append-only';
end;
$$;

create trigger runtime_approval_requests_protect_binding
before update on public.runtime_approval_requests
for each row execute function public.reject_runtime_approval_request_mutation();

create trigger runtime_approval_events_reject_update
before update on public.runtime_approval_events
for each row execute function public.reject_runtime_approval_event_mutation();

create trigger runtime_approval_events_reject_delete
before delete on public.runtime_approval_events
for each row execute function public.reject_runtime_approval_event_mutation();

create or replace function public.create_runtime_approval_request(
  p_project_id uuid,
  p_user_id uuid,
  p_scope text,
  p_runtime_execution_request_id text,
  p_runtime_execution_request_checksum text,
  p_runtime_plan_id text,
  p_runtime_plan_checksum text,
  p_provider text,
  p_model text,
  p_safe_input_checksum text,
  p_binding_checksum text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_approval_id uuid;
begin
  if auth.role() <> 'service_role' then raise exception 'RUNTIME_APPROVAL_NOT_AUTHORIZED'; end if;
  if not exists (select 1 from public.projects p where p.id = p_project_id and p.user_id = p_user_id) then
    raise exception 'RUNTIME_APPROVAL_NOT_AUTHORIZED';
  end if;
  if p_scope <> 'CORE_RUNTIME_PROVIDER_EXECUTION'
    or p_provider <> 'openai'
    or nullif(trim(p_runtime_execution_request_id), '') is null
    or nullif(trim(p_runtime_plan_id), '') is null
    or nullif(trim(p_model), '') is null
    or p_runtime_execution_request_checksum !~ '^[a-f0-9]{64}$'
    or p_runtime_plan_checksum !~ '^[a-f0-9]{64}$'
    or p_safe_input_checksum !~ '^[a-f0-9]{64}$'
    or p_binding_checksum !~ '^[a-f0-9]{64}$' then
    raise exception 'RUNTIME_APPROVAL_INVALID';
  end if;

  insert into public.runtime_approval_requests (
    project_id, requester_user_id, scope, runtime_execution_request_id,
    runtime_execution_request_checksum, runtime_plan_id, runtime_plan_checksum,
    provider, model, safe_input_checksum, binding_checksum
  ) values (
    p_project_id, p_user_id, p_scope, p_runtime_execution_request_id,
    p_runtime_execution_request_checksum, p_runtime_plan_id, p_runtime_plan_checksum,
    p_provider, p_model, p_safe_input_checksum, p_binding_checksum
  ) returning id into v_approval_id;

  insert into public.runtime_approval_events (approval_id, project_id, user_id, event_type, safe_metadata)
  values (v_approval_id, p_project_id, p_user_id, 'CREATED', jsonb_build_object('scope', p_scope));
  return v_approval_id;
end;
$$;

create or replace function public.decide_runtime_approval_request(
  p_approval_id uuid,
  p_project_id uuid,
  p_user_id uuid,
  p_decision text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.runtime_approval_requests%rowtype;
  v_now timestamptz := timezone('utc', now());
begin
  if auth.role() <> 'service_role' then raise exception 'RUNTIME_APPROVAL_NOT_AUTHORIZED'; end if;
  select * into v_request from public.runtime_approval_requests
    where id = p_approval_id and project_id = p_project_id and requester_user_id = p_user_id
    for update;
  if not found then raise exception 'RUNTIME_APPROVAL_NOT_FOUND'; end if;
  if v_request.status in ('CONSUMED', 'REJECTED', 'REVOKED', 'EXPIRED') then
    raise exception 'RUNTIME_APPROVAL_NOT_APPROVED';
  end if;
  if v_request.expires_at <= v_now then
    update public.runtime_approval_requests set status = 'EXPIRED' where id = v_request.id;
    insert into public.runtime_approval_events (approval_id, project_id, user_id, event_type)
      values (v_request.id, p_project_id, p_user_id, 'EXPIRED');
    return v_request.id;
  end if;
  if p_decision = 'APPROVE' and v_request.status = 'PENDING' then
    update public.runtime_approval_requests set status = 'APPROVED', approved_at = v_now, approved_by_user_id = p_user_id where id = v_request.id;
    insert into public.runtime_approval_events (approval_id, project_id, user_id, event_type)
      values (v_request.id, p_project_id, p_user_id, 'APPROVED');
  elsif p_decision = 'REJECT' and v_request.status = 'PENDING' then
    update public.runtime_approval_requests set status = 'REJECTED', rejected_at = v_now, rejected_by_user_id = p_user_id where id = v_request.id;
    insert into public.runtime_approval_events (approval_id, project_id, user_id, event_type)
      values (v_request.id, p_project_id, p_user_id, 'REJECTED');
  elsif p_decision = 'REVOKE' and v_request.status in ('PENDING', 'APPROVED') then
    update public.runtime_approval_requests set status = 'REVOKED', revoked_at = v_now, revoked_by_user_id = p_user_id where id = v_request.id;
    insert into public.runtime_approval_events (approval_id, project_id, user_id, event_type)
      values (v_request.id, p_project_id, p_user_id, 'REVOKED');
  else
    raise exception 'RUNTIME_APPROVAL_INVALID_TRANSITION';
  end if;
  return v_request.id;
end;
$$;

create or replace function public.consume_runtime_approval_request(
  p_approval_id uuid,
  p_project_id uuid,
  p_user_id uuid,
  p_scope text,
  p_runtime_execution_request_id text,
  p_runtime_execution_request_checksum text,
  p_runtime_plan_id text,
  p_runtime_plan_checksum text,
  p_provider text,
  p_model text,
  p_safe_input_checksum text,
  p_binding_checksum text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.runtime_approval_requests%rowtype;
  v_now timestamptz := timezone('utc', now());
begin
  if auth.role() <> 'service_role' then raise exception 'RUNTIME_APPROVAL_NOT_AUTHORIZED'; end if;
  select * into v_request from public.runtime_approval_requests
    where id = p_approval_id and project_id = p_project_id and requester_user_id = p_user_id
    for update;
  if not found then raise exception 'RUNTIME_APPROVAL_NOT_FOUND'; end if;
  if v_request.status = 'CONSUMED' then raise exception 'RUNTIME_APPROVAL_CONSUMED'; end if;
  if v_request.status = 'REVOKED' then raise exception 'RUNTIME_APPROVAL_REVOKED'; end if;
  if v_request.expires_at <= v_now then
    if v_request.status in ('PENDING', 'APPROVED') then
      update public.runtime_approval_requests set status = 'EXPIRED' where id = v_request.id;
      insert into public.runtime_approval_events (approval_id, project_id, user_id, event_type)
        values (v_request.id, p_project_id, p_user_id, 'EXPIRED');
    end if;
    return v_request.id;
  end if;
  if v_request.status <> 'APPROVED' then raise exception 'RUNTIME_APPROVAL_NOT_APPROVED'; end if;
  if v_request.scope <> p_scope
    or v_request.runtime_execution_request_id <> p_runtime_execution_request_id
    or v_request.runtime_execution_request_checksum <> p_runtime_execution_request_checksum
    or v_request.runtime_plan_id <> p_runtime_plan_id
    or v_request.runtime_plan_checksum <> p_runtime_plan_checksum
    or v_request.provider <> p_provider
    or v_request.model <> p_model
    or v_request.safe_input_checksum <> p_safe_input_checksum
    or v_request.binding_checksum <> p_binding_checksum then
    raise exception 'RUNTIME_APPROVAL_BINDING_MISMATCH';
  end if;
  update public.runtime_approval_requests set status = 'CONSUMED', consumed_at = v_now where id = v_request.id;
  insert into public.runtime_approval_events (approval_id, project_id, user_id, event_type)
    values (v_request.id, p_project_id, p_user_id, 'CONSUMED');
  return v_request.id;
end;
$$;

revoke all on function public.create_runtime_approval_request(uuid, uuid, text, text, text, text, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.decide_runtime_approval_request(uuid, uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.consume_runtime_approval_request(uuid, uuid, uuid, text, text, text, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.create_runtime_approval_request(uuid, uuid, text, text, text, text, text, text, text, text, text) to service_role;
grant execute on function public.decide_runtime_approval_request(uuid, uuid, uuid, text) to service_role;
grant execute on function public.consume_runtime_approval_request(uuid, uuid, uuid, text, text, text, text, text, text, text, text, text) to service_role;
