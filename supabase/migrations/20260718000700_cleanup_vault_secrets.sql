create or replace function public.delete_provider_vault_secret()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from vault.secrets
  where id = old.vault_secret_id;
  return old;
end;
$$;

create trigger provider_credentials_delete_vault_secret
after delete on public.provider_credentials
for each row execute function public.delete_provider_vault_secret();
