delete from vault.secrets as secret
where secret.name like 'buildflow:%'
  and not exists (
    select 1
    from public.provider_credentials as credential
    where credential.vault_secret_id = secret.id
  );
