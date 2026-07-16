create extension if not exists supabase_vault with schema vault;

create table public.provider_credentials (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('github', 'supabase', 'vercel', 'openai')),
  vault_secret_id uuid not null,
  status text not null default 'PROVIDED' check (status in ('PROVIDED', 'VALID', 'INVALID', 'EXPIRED', 'ERROR')),
  safe_metadata jsonb not null default '{}'::jsonb,
  credential_version integer not null default 1 check (credential_version > 0),
  last_validated_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (project_id, provider)
);

create index provider_credentials_project_idx
  on public.provider_credentials(project_id, provider);

create trigger provider_credentials_updated_at
before update on public.provider_credentials
for each row execute function public.set_updated_at();

alter table public.provider_credentials enable row level security;

create policy "Users can manage owned provider credential references"
on public.provider_credentials
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

create or replace function public.store_provider_credential(
  p_project_id uuid,
  p_provider text,
  p_secret text,
  p_safe_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_reference_id uuid;
  v_secret_id uuid;
  v_secret_name text;
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHORIZED';
  end if;

  if p_provider not in ('github', 'supabase', 'vercel', 'openai') then
    raise exception 'PROVIDER_NOT_ALLOWED';
  end if;

  if length(p_secret) < 8 or octet_length(p_secret) > 32768 then
    raise exception 'CREDENTIAL_PAYLOAD_INVALID';
  end if;

  if not exists (
    select 1
    from public.projects p
    where p.id = p_project_id
      and p.user_id = v_user_id
  ) then
    raise exception 'NOT_AUTHORIZED';
  end if;

  select pc.id, pc.vault_secret_id
  into v_reference_id, v_secret_id
  from public.provider_credentials pc
  where pc.project_id = p_project_id
    and pc.user_id = v_user_id
    and pc.provider = p_provider
  for update;

  v_secret_name := format(
    'buildflow:%s:%s:%s',
    v_user_id,
    p_project_id,
    p_provider
  );

  if v_secret_id is null then
    select vault.create_secret(
      p_secret,
      v_secret_name,
      'BuildFlow encrypted provider credential'
    )
    into v_secret_id;

    insert into public.provider_credentials (
      project_id,
      user_id,
      provider,
      vault_secret_id,
      status,
      safe_metadata
    )
    values (
      p_project_id,
      v_user_id,
      p_provider,
      v_secret_id,
      'PROVIDED',
      coalesce(p_safe_metadata, '{}'::jsonb)
    )
    returning id into v_reference_id;
  else
    perform vault.update_secret(
      v_secret_id,
      p_secret,
      v_secret_name,
      'BuildFlow encrypted provider credential'
    );

    update public.provider_credentials
    set status = 'PROVIDED',
        safe_metadata = coalesce(p_safe_metadata, '{}'::jsonb),
        credential_version = credential_version + 1,
        last_validated_at = null,
        expires_at = null
    where id = v_reference_id;
  end if;

  update public.verification_targets vt
  set status = 'NOT_RUN',
      expires_at = null,
      safe_error_code = 'CREDENTIAL_CHANGED',
      verified_capabilities = '[]'::jsonb
  where vt.provider = p_provider
    and exists (
      select 1
      from public.verification_runs vr
      where vr.id = vt.verification_run_id
        and vr.project_id = p_project_id
        and vr.user_id = v_user_id
    );

  update public.verification_runs
  set status = 'NOT_RUN',
      final_status = 'BLOCKED',
      result = jsonb_build_object(
        'status', 'BLOCKED',
        'verified', 0,
        'warnings', 0,
        'failed', 0,
        'blocked', 1,
        'details', jsonb_build_array(p_provider || ': CREDENTIAL_CHANGED')
      )
  where project_id = p_project_id
    and user_id = v_user_id;

  return v_reference_id;
end;
$$;

revoke all on function public.store_provider_credential(uuid, text, text, jsonb)
from public, anon;
grant execute on function public.store_provider_credential(uuid, text, text, jsonb)
to authenticated;

create or replace function public.resolve_provider_credential(
  p_project_id uuid,
  p_user_id uuid,
  p_provider text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret text;
begin
  if not exists (
    select 1
    from public.projects p
    where p.id = p_project_id
      and p.user_id = p_user_id
  ) then
    raise exception 'NOT_AUTHORIZED';
  end if;

  select ds.decrypted_secret
  into v_secret
  from public.provider_credentials pc
  join vault.decrypted_secrets ds
    on ds.id = pc.vault_secret_id
  where pc.project_id = p_project_id
    and pc.user_id = p_user_id
    and pc.provider = p_provider
    and pc.status in ('PROVIDED', 'VALID');

  return v_secret;
end;
$$;

revoke all on function public.resolve_provider_credential(uuid, uuid, text)
from public, anon, authenticated;
grant execute on function public.resolve_provider_credential(uuid, uuid, text)
to service_role;
