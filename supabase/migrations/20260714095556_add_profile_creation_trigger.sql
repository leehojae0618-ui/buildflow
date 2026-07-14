create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(split_part(new.email, '@', 1), ''),
      null
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

comment on function public.handle_new_user() is 'Creates a minimal BuildFlow profile when an auth user is created.';

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
