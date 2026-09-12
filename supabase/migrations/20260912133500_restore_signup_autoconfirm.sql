-- Applied on project cxhfmsnkcketqdlcqdic.
-- The hosted project cannot send confirmation email (no SMTP).
-- Auto-confirm so email signup still works. Use Google for OAuth.
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

revoke all on function public.auth_users_autoconfirm() from public, anon, authenticated;
