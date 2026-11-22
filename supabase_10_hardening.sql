-- DB-backed rate limiter (the in-memory one resets per edge isolate).
create table if not exists public.rate_hit (
  key text not null,
  hit_at timestamptz not null default now()
);
create index if not exists rate_hit_key_idx on public.rate_hit (key, hit_at);
alter table public.rate_hit enable row level security;

create or replace function public.rate_check(p_key text, p_max int, p_window_secs int)
returns boolean language plpgsql security definer set search_path = public as $$
declare n int;
begin
  delete from public.rate_hit where hit_at < now() - interval '1 day';
  insert into public.rate_hit(key) values (p_key);
  select count(*) into n from public.rate_hit
    where key = p_key and hit_at > now() - make_interval(secs => p_window_secs);
  return n > p_max;
end $$;
revoke all on function public.rate_check(text, int, int) from public, anon, authenticated;
grant execute on function public.rate_check(text, int, int) to service_role;

-- Stripe webhook de-duplication / replay protection.
create table if not exists public.stripe_event (
  id text primary key,
  received_at timestamptz not null default now()
);
alter table public.stripe_event enable row level security;

-- Bound anonymous lead inserts.
alter table public.lead drop constraint if exists lead_size_check;
alter table public.lead add constraint lead_size_check check (
  length(email) <= 254 and length(coalesce(name,'')) <= 200 and length(coalesce(source,'')) <= 100
  and length(coalesce(trade,'')) <= 100
  and pg_column_size(calc_inputs) <= 8000 and pg_column_size(calc_result) <= 8000
) not valid;
