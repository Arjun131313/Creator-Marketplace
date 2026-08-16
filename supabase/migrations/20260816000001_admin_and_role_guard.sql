-- Admin access, and closing a privilege-escalation hole on profiles.role
--
-- Disputes freeze money and currently have no resolution path outside of
-- hand-editing rows in Supabase Studio. This adds a real admin surface.
--
-- Admin membership deliberately does NOT live in profiles.role: the existing
-- "users_update_own_profile" policy lets a user update any column of their own
-- row, so a role-based admin check would let anyone make themselves an admin.
-- Membership lives in its own table with no write policy at all, so it can only
-- be granted with the service role or from the SQL editor.

create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  note       text,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- Readable only by the admin themselves, so the UI can ask "am I an admin?".
-- No insert/update/delete policy exists, so authenticated users can never write
-- to this table regardless of what they send.
drop policy if exists admins_read_own_membership on public.admin_users;
create policy admins_read_own_membership on public.admin_users
  for select using (auth.uid() = user_id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

grant execute on function public.is_admin() to authenticated;

-- Admins can see and resolve every dispute, and see the payments behind them.
drop policy if exists admins_view_all_disputes on public.disputes;
create policy admins_view_all_disputes on public.disputes
  for select using (public.is_admin());

drop policy if exists admins_update_disputes on public.disputes;
create policy admins_update_disputes on public.disputes
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists admins_view_all_payments on public.payments;
create policy admins_view_all_payments on public.payments
  for select using (public.is_admin());

drop policy if exists admins_view_all_jobs on public.jobs;
create policy admins_view_all_jobs on public.jobs
  for select using (public.is_admin());

drop policy if exists admins_view_all_profiles on public.profiles;
create policy admins_view_all_profiles on public.profiles
  for select using (public.is_admin());

-- Extend the billing guard to cover role.
--
-- Signup and the login repair path both upsert a role onto the profile, so a
-- first write (null -> 'brand'/'creator') has to keep working. What's blocked is
-- CHANGING an established role, which is what would let a creator become a brand
-- — or, once any role-based check exists, something worse.
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

    if old.role is not null and new.role is distinct from old.role then
      new.role := old.role;
    end if;
  end if;
  return new;
end;
$$;
