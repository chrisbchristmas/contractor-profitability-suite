-- 08: stop non-admins from creating jobs/proposals owned by another user.
-- set_row_owner_user only filled user_id when null, so a client (or a CSV import row
-- carrying a user_id column) could plant records in someone else's account.
-- notification keeps the lenient trigger: notifying another user is legitimate.
create or replace function public.force_row_owner_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and coalesce(public.current_user_role(), '') <> 'admin' then
    new.user_id := auth.uid();
  elsif auth.uid() is not null and new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end $$;

drop trigger if exists "job_set_user" on public."job";
create trigger "job_set_user" before insert on public."job"
  for each row execute function public.force_row_owner_user();

drop trigger if exists "proposal_set_user" on public."proposal";
create trigger "proposal_set_user" before insert on public."proposal"
  for each row execute function public.force_row_owner_user();
