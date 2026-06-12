-- Fix: signups fail with "Database error saving new user".
-- handle_new_user() is SECURITY DEFINER but has no search_path pinned, so when
-- Supabase Auth (supabase_auth_admin) fires the trigger, "profiles" does not
-- resolve and the entire auth.users insert rolls back.
create or replace function handle_new_user()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );
  return new;
end;
$$;
