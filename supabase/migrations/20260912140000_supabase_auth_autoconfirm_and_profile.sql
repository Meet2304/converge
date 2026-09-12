-- Applied on project cxhfmsnkcketqdlcqdic (converge).
-- Auto-confirm emails so organizer signup works without SMTP.
-- Mirror auth.users into public.users (auth0_sub stores the Supabase user id).

create or replace function public.auth_users_autoconfirm()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email_confirmed_at is null then
    new.email_confirmed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists auth_users_autoconfirm on auth.users;
create trigger auth_users_autoconfirm
  before insert on auth.users
  for each row
  execute function public.auth_users_autoconfirm();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display text;
begin
  display := nullif(
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    ''
  );

  insert into public.users (auth0_sub, email, display_name, updated_at)
  values (new.id::text, new.email, display, now())
  on conflict (auth0_sub) do update
    set email = excluded.email,
        display_name = coalesce(excluded.display_name, public.users.display_name),
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user();

revoke all on function public.auth_users_autoconfirm() from public, anon, authenticated;
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
