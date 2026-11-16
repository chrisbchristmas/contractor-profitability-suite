-- 07: crew logins, field clock-in, receipts, online invoice payment, progress billing/retainage,
-- price list, weekly digest, sample job. Idempotent.

-- ── Crew logins ───────────────────────────────────────────────────────────────
create table if not exists public.crew_member (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  owner_id uuid not null,          -- owner's auth.users id
  owner_email text,
  user_id uuid not null unique,    -- crew member's auth.users id
  name text not null,
  email text not null,
  labor_rate numeric,
  active boolean default true
);
alter table public.crew_member enable row level security;
drop policy if exists crew_member_owner_read on public.crew_member;
create policy crew_member_owner_read on public.crew_member for select using (owner_id = auth.uid() or user_id = auth.uid());
-- writes only via the crewMember edge function (service role)

create or replace function public.crew_owner() returns uuid language sql stable security definer set search_path=public as $$
  select owner_id from public.crew_member where user_id = auth.uid() and active
$$;
create or replace function public.crew_job_ok(p_job uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.job where id = p_job and created_by_id = public.crew_owner())
$$;
-- Crew see job names only, never contract/margin figures.
create or replace function public.crew_jobs() returns table(id uuid, job_name text, client_name text)
language sql stable security definer set search_path=public as $$
  select j.id, j.job_name, j.client_name from public.job j
  where j.created_by_id = public.crew_owner() and coalesce(j.status,'active') not in ('completed','closed','cancelled')
  order by j.job_name
$$;
revoke all on function public.crew_jobs() from public, anon;
grant execute on function public.crew_jobs() to authenticated;

-- Rows a crew member creates belong to their owner, so they land in the owner's views (and crew can't read them back).
create or replace function public.set_row_owner() returns trigger language plpgsql security definer set search_path=public as $$
declare cm public.crew_member;
begin
  if auth.uid() is not null then
    select * into cm from public.crew_member where user_id = auth.uid() and active;
    if found then
      new.created_by_id := cm.owner_id;
      new.created_by := cm.owner_email;
    else
      new.created_by_id := auth.uid();
      new.created_by := coalesce(auth.jwt()->>'email', new.created_by);
    end if;
  end if;
  return new;
end $$;

alter table public.time_entry add column if not exists clock_in_at timestamptz;
alter table public.time_entry add column if not exists clock_out_at timestamptz;
alter table public.time_entry add column if not exists clock_in_lat double precision;
alter table public.time_entry add column if not exists clock_in_lng double precision;
alter table public.time_entry add column if not exists crew_user_id uuid;

-- Crew can't set their own name/rate.
create or replace function public.crew_time_entry() returns trigger language plpgsql security definer set search_path=public as $$
declare cm public.crew_member;
begin
  select * into cm from public.crew_member where user_id = auth.uid() and active;
  if found then
    new.crew_user_id := auth.uid();
    new.worker_name := cm.name;
    new.labor_rate := cm.labor_rate;
  end if;
  return new;
end $$;
drop trigger if exists time_entry_crew on public.time_entry;
create trigger time_entry_crew before insert on public.time_entry for each row execute function public.crew_time_entry();

drop policy if exists time_entry_crew_create on public.time_entry;
create policy time_entry_crew_create on public.time_entry for insert with check (public.current_user_role() = 'crew' and public.crew_job_ok(job_id));
drop policy if exists job_attachment_crew_create on public.job_attachment;
create policy job_attachment_crew_create on public.job_attachment for insert with check (public.current_user_role() = 'crew' and public.crew_job_ok(job_id));
drop policy if exists job_expense_crew_create on public.job_expense;
create policy job_expense_crew_create on public.job_expense for insert with check (public.current_user_role() = 'crew' and public.crew_job_ok(job_id));

-- ── Receipts ─────────────────────────────────────────────────────────────────
alter table public.job_expense add column if not exists receipt_url text;
alter table public.job_expense add column if not exists vendor text;

-- ── Online payment + progress billing / retainage ────────────────────────────
alter table public.invoice add column if not exists pay_token uuid default gen_random_uuid();
update public.invoice set pay_token = gen_random_uuid() where pay_token is null;
alter table public.invoice add column if not exists billing_type text default 'change_orders'; -- change_orders | progress
alter table public.invoice add column if not exists percent_complete numeric;
alter table public.invoice add column if not exists previously_billed numeric;
alter table public.invoice add column if not exists retainage_percent numeric;
alter table public.invoice add column if not exists retainage_amount numeric;
alter table public.invoice add column if not exists stripe_session_id text;

alter table public.customer add column if not exists stripe_connect_account_id text;
alter table public.customer add column if not exists connect_charges_enabled boolean default false;
alter table public.customer add column if not exists co_deposit_percent numeric default 0;
alter table public.customer add column if not exists weekly_digest boolean default true;
alter table public.change_order add column if not exists deposit_amount numeric;
alter table public.change_order add column if not exists deposit_paid_at timestamptz;
alter table public.change_order add column if not exists deposit_session_id text;
alter table public.customer add column if not exists sample_seeded boolean default false;

create or replace function public.protect_customer_cols() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is not null and coalesce(public.current_user_role(),'')<>'admin' then
    new.subscription_status:=old.subscription_status; new.subscription_plan:=old.subscription_plan;
    new.trial_ends_at:=old.trial_ends_at; new.stripe_customer_id:=old.stripe_customer_id;
    new.password_hash:=old.password_hash; new.session_token:=old.session_token; new.email:=old.email;
    new.stripe_connect_account_id:=old.stripe_connect_account_id; new.connect_charges_enabled:=old.connect_charges_enabled;
  end if; return new;
end $$;

-- ── Estimate → job link ──────────────────────────────────────────────────────
alter table public.estimate add column if not exists converted_job_id uuid;

-- ── Material price list ──────────────────────────────────────────────────────
create table if not exists public.material_item (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  updated_date timestamptz default now(),
  created_by_id uuid,
  created_by text,
  name text not null,
  unit text default 'ea',
  unit_cost numeric not null default 0
);
alter table public.material_item enable row level security;
drop trigger if exists material_item_set_owner on public.material_item;
create trigger material_item_set_owner before insert on public.material_item for each row execute function public.set_row_owner();
drop policy if exists material_item_read on public.material_item;
create policy material_item_read on public.material_item for select using (created_by_id = auth.uid());
drop policy if exists material_item_create on public.material_item;
create policy material_item_create on public.material_item for insert with check (public.current_user_role() in ('owner','pm','admin'));
drop policy if exists material_item_update on public.material_item;
create policy material_item_update on public.material_item for update using (created_by_id = auth.uid());
drop policy if exists material_item_delete on public.material_item;
create policy material_item_delete on public.material_item for delete using (created_by_id = auth.uid());
grant select, insert, update, delete on public.material_item to authenticated;
grant select on public.crew_member to authenticated;

-- ── Audit fixes (Nov 15 2026) ───────────────────────────────────────────────
-- A) crewMember edge fn sets app_user.role='crew', but the 01 check constraint only allowed owner/pm/admin,
--    so every "add crew member" failed (upsert error -> user deleted -> 500).
alter table public.app_user drop constraint if exists app_user_role_check;
alter table public.app_user add constraint app_user_role_check
  check (role is null or role in ('owner','pm','admin','crew'));

-- B) job/notification/proposal reads key on user_id, which the insert trigger only filled when NULL,
--    so a client could insert rows straight into another tenant's list. Always stamp the caller.
create or replace function public.set_row_owner_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is not null and coalesce(public.current_user_role(),'')<>'admin' then new.user_id := auth.uid(); end if;
  return new;
end $$;

-- C) app_user.trial_ends_at was client-writable (self-extend trial). Protect it like the other billing cols.
create or replace function public.protect_app_user_cols() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is not null and coalesce(public.current_user_role(),'')<>'admin' then
    new.role:=old.role; new.subscription_status:=old.subscription_status;
    new.subscription_plan:=old.subscription_plan; new.stripe_customer_id:=old.stripe_customer_id;
    new.trial_ends_at:=old.trial_ends_at;
  end if; return new;
end $$;
