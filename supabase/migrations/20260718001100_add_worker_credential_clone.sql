create or replace function public.clone_provider_credentials_for_worker(
  p_source_project_id uuid,
  p_target_project_id uuid,
  p_user_id uuid,
  p_providers text[]
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_provider text;
  v_source_secret text;
  v_safe_metadata jsonb;
  v_target_reference_id uuid;
  v_target_secret_id uuid;
  v_secret_name text;
  v_copied integer := 0;
begin
  if auth.role() <> 'service_role' then
    raise exception 'NOT_AUTHORIZED';
  end if;

  if not exists (
    select 1
    from public.projects p
    where p.id = p_source_project_id
      and p.user_id = p_user_id
  ) or not exists (
    select 1
    from public.projects p
    where p.id = p_target_project_id
      and p.user_id = p_user_id
  ) then
    raise exception 'NOT_AUTHORIZED';
  end if;

  foreach v_provider in array p_providers
  loop
    if v_provider not in ('github', 'supabase', 'vercel', 'openai') then
      raise exception 'PROVIDER_NOT_ALLOWED';
    end if;

    select ds.decrypted_secret, pc.safe_metadata
    into v_source_secret, v_safe_metadata
    from public.provider_credentials pc
    join vault.decrypted_secrets ds
      on ds.id = pc.vault_secret_id
    where pc.project_id = p_source_project_id
      and pc.user_id = p_user_id
      and pc.provider = v_provider
      and pc.status in ('PROVIDED', 'VALID');

    if v_source_secret is null then
      raise exception 'SOURCE_CREDENTIAL_NOT_AVAILABLE';
    end if;

    select pc.id, pc.vault_secret_id
    into v_target_reference_id, v_target_secret_id
    from public.provider_credentials pc
    where pc.project_id = p_target_project_id
      and pc.user_id = p_user_id
      and pc.provider = v_provider
    for update;

    v_secret_name := format(
      'buildflow:%s:%s:%s',
      p_user_id,
      p_target_project_id,
      v_provider
    );

    if v_target_secret_id is null then
      select vault.create_secret(
        v_source_secret,
        v_secret_name,
        'BuildFlow cloned encrypted provider credential'
      )
      into v_target_secret_id;

      insert into public.provider_credentials (
        project_id,
        user_id,
        provider,
        vault_secret_id,
        status,
        safe_metadata
      )
      values (
        p_target_project_id,
        p_user_id,
        v_provider,
        v_target_secret_id,
        'PROVIDED',
        coalesce(v_safe_metadata, '{}'::jsonb)
      );
    else
      perform vault.update_secret(
        v_target_secret_id,
        v_source_secret,
        v_secret_name,
        'BuildFlow cloned encrypted provider credential'
      );

      update public.provider_credentials
      set status = 'PROVIDED',
          safe_metadata = coalesce(v_safe_metadata, '{}'::jsonb),
          credential_version = credential_version + 1,
          last_validated_at = null,
          expires_at = null
      where id = v_target_reference_id;
    end if;

    v_copied := v_copied + 1;
  end loop;

  return v_copied;
end;
$$;

revoke all on function public.clone_provider_credentials_for_worker(
  uuid,
  uuid,
  uuid,
  text[]
) from public, anon, authenticated;
grant execute on function public.clone_provider_credentials_for_worker(
  uuid,
  uuid,
  uuid,
  text[]
) to service_role;
