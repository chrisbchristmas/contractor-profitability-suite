-- Security fixes (apply after 04). Idempotent.
-- 1) Block self-escalation: non-admins cannot change role/subscription fields on app_user.
create or replace function public.protect_app_user_cols() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is not null and coalesce(public.current_user_role(),'')<>'admin' then
    new.role:=old.role; new.subscription_status:=old.subscription_status;
    new.subscription_plan:=old.subscription_plan; new.stripe_customer_id:=old.stripe_customer_id;
  end if; return new;
end $$;
drop trigger if exists app_user_protect on public.app_user;
create trigger app_user_protect before update on public.app_user for each row execute function public.protect_app_user_cols();

-- 2) New self-inserted app_user rows may only be plain 'owner' / trial (trigger-created row normally exists already).
drop policy if exists "app_user_insert_self" on public.app_user;
create policy "app_user_insert_self" on public.app_user for insert
  with check (id = auth.uid() and coalesce(role,'owner')='owner' and coalesce(subscription_status,'trial')='trial');

-- 3) Customer secrets never readable through PostgREST (edge functions use service role).
revoke select (password_hash, session_token, reset_token, reset_token_expires_at) on public.customer from anon, authenticated;
