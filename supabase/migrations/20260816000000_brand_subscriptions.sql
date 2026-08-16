-- Brand subscriptions
--
-- /pricing sells monthly plans (Starter/Basic/Pro/Enterprise) that gate how many
-- creators a brand can hire per billing month. This adds the state those plans
-- need, plus a guard so a brand can't award itself a plan by updating its own
-- profile row.

alter table public.profiles
  add column if not exists stripe_customer_id     text,
  add column if not exists stripe_subscription_id text,
  add column if not exists plan                   text,
  add column if not exists plan_status            text,
  add column if not exists plan_period_start      timestamptz,
  add column if not exists plan_period_end        timestamptz;

alter table public.profiles
  drop constraint if exists profiles_plan_check;
alter table public.profiles
  add constraint profiles_plan_check
  check (plan is null or plan in ('starter', 'basic', 'pro', 'enterprise', 'founding'));

alter table public.profiles
  drop constraint if exists profiles_plan_status_check;
alter table public.profiles
  add constraint profiles_plan_status_check
  check (
    plan_status is null
    or plan_status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'unpaid')
  );

create unique index if not exists profiles_stripe_customer_id_key
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

-- Billing columns are writable only by the service role (the Stripe webhook) or
-- by a Postgres superuser doing a manual grant. Without this, the existing
-- "users can update their own profile" policy would let any brand set
-- plan = 'pro' from the browser and hire for free.
create or replace function public.guard_profile_billing_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('request.jwt.claim.role', true) is distinct from 'service_role'
     and auth.uid() is not null
  then
    new.stripe_customer_id     := old.stripe_customer_id;
    new.stripe_subscription_id := old.stripe_subscription_id;
    new.plan                   := old.plan;
    new.plan_status            := old.plan_status;
    new.plan_period_start      := old.plan_period_start;
    new.plan_period_end        := old.plan_period_end;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_billing_columns on public.profiles;
create trigger guard_profile_billing_columns
  before update on public.profiles
  for each row
  execute function public.guard_profile_billing_columns();

-- Hires used in the current billing period. A "hire" is a payment row, created
-- when a brand accepts an application or hires a creator directly. Refunded
-- payments don't count against the allowance.
create or replace function public.brand_hires_used(brand uuid, since timestamptz)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.payments
  where brand_id = brand
    and created_at >= since
    and status <> 'refunded';
$$;

grant execute on function public.brand_hires_used(uuid, timestamptz) to authenticated;
