create or replace function public.persist_verification_run_for_owner(
  p_user_id uuid,
  p_project_id uuid,
  p_execution_id uuid,
  p_status text,
  p_final_status text,
  p_result jsonb,
  p_credential_snapshot_version text,
  p_targets jsonb,
  p_attempts jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_run_id uuid;
  v_target jsonb;
  v_target_id uuid;
  v_attempt jsonb;
  v_attempt_id uuid;
  v_attempt_number integer;
  v_safe_error_code text;
begin
  if auth.role() <> 'service_role' then
    raise exception 'NOT_AUTHORIZED';
  end if;

  if not exists (
    select 1
    from public.projects p
    where p.id = p_project_id
      and p.user_id = p_user_id
  ) then
    raise exception 'NOT_AUTHORIZED';
  end if;

  if p_execution_id is not null and not exists (
    select 1
    from public.build_executions e
    where e.id = p_execution_id
      and e.project_id = p_project_id
      and e.user_id = p_user_id
  ) then
    raise exception 'EXECUTION_NOT_OWNED';
  end if;

  insert into public.verification_runs (
    project_id,
    execution_id,
    user_id,
    status,
    final_status,
    result,
    credential_snapshot_version
  )
  values (
    p_project_id,
    p_execution_id,
    p_user_id,
    p_status,
    p_final_status,
    coalesce(p_result, '{}'::jsonb),
    p_credential_snapshot_version
  )
  returning id into v_run_id;

  for v_target in
    select value from jsonb_array_elements(coalesce(p_targets, '[]'::jsonb))
  loop
    insert into public.verification_targets (
      verification_run_id,
      provider,
      required,
      verification_stage,
      status,
      expires_at,
      verified_capabilities,
      safe_error_code
    )
    values (
      v_run_id,
      v_target->>'provider',
      coalesce((v_target->>'required')::boolean, true),
      v_target->>'stage',
      v_target->>'status',
      nullif(v_target->>'expiresAt', '')::timestamptz,
      '[]'::jsonb,
      null
    )
    returning id into v_target_id;

    v_attempt_number := 0;
    for v_attempt in
      select value
      from jsonb_array_elements(coalesce(p_attempts, '[]'::jsonb))
      where value->>'targetId' = v_target->>'id'
      order by value->>'startedAt'
    loop
      v_attempt_number := v_attempt_number + 1;
      insert into public.verification_attempts (
        verification_target_id,
        attempt_number,
        status,
        safe_evidence,
        started_at,
        completed_at
      )
      values (
        v_target_id,
        v_attempt_number,
        v_attempt->>'status',
        coalesce(v_attempt->'evidence', '{}'::jsonb),
        (v_attempt->>'startedAt')::timestamptz,
        nullif(v_attempt->>'finishedAt', '')::timestamptz
      )
      returning id into v_attempt_id;

      v_safe_error_code := v_attempt->'evidence'->>'safeErrorCode';
      if v_safe_error_code is not null and v_safe_error_code <> '' then
        insert into public.verification_errors (
          verification_attempt_id,
          safe_error_code,
          message,
          retryable
        )
        values (
          v_attempt_id,
          v_safe_error_code,
          'Provider verification did not complete.',
          false
        );
      end if;
    end loop;
  end loop;

  return v_run_id;
end;
$$;

revoke all on function public.persist_verification_run_for_owner(
  uuid,
  uuid,
  uuid,
  text,
  text,
  jsonb,
  text,
  jsonb,
  jsonb
) from public, anon, authenticated;

grant execute on function public.persist_verification_run_for_owner(
  uuid,
  uuid,
  uuid,
  text,
  text,
  jsonb,
  text,
  jsonb,
  jsonb
) to service_role;
