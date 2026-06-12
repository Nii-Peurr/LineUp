create extension if not exists "pgcrypto";

create type public.app_role as enum ('customer', 'business_owner', 'staff', 'admin');
create type public.plan_id as enum ('starter', 'professional', 'enterprise');
create type public.plan_status as enum ('trialing', 'active', 'past_due', 'canceled');
create type public.queue_status as enum ('open', 'paused', 'closed');
create type public.queue_entry_status as enum ('waiting', 'serving', 'served', 'skipped', 'missed', 'left');
create type public.fast_pass_mode as enum ('disabled', 'limited', 'unlimited');
create type public.notification_channel as enum ('push', 'sms', 'email');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text,
  role public.app_role not null default 'customer',
  avatar_url text,
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  name text not null,
  category text not null,
  plan public.plan_id not null default 'starter',
  plan_status public.plan_status not null default 'trialing',
  stripe_customer_id text,
  fast_pass_mode public.fast_pass_mode not null default 'disabled',
  fast_pass_price_cents integer not null default 0 check (fast_pass_price_cents >= 0),
  monthly_customer_limit integer check (monthly_customer_limit is null or monthly_customer_limit > 0),
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_memberships (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null default 'staff',
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  address text not null,
  timezone text not null default 'America/New_York',
  phone text,
  business_hours jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.staff_members (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  display_name text not null,
  title text not null default 'Staff',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.queues (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  name text not null,
  status public.queue_status not null default 'open',
  average_service_minutes integer not null default 15 check (average_service_minutes > 0),
  active_staff integer not null default 1 check (active_staff > 0),
  current_demand text not null default 'normal' check (current_demand in ('light', 'normal', 'heavy')),
  sms_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.queue_entries (
  id uuid primary key default gen_random_uuid(),
  queue_id uuid not null references public.queues(id) on delete cascade,
  customer_id uuid references public.profiles(id) on delete set null,
  customer_name text not null,
  customer_phone text,
  customer_email text,
  status public.queue_entry_status not null default 'waiting',
  position integer not null default 1 check (position >= 0),
  party_size integer not null default 1 check (party_size > 0),
  fast_pass boolean not null default false,
  quoted_wait_minutes integer not null default 0 check (quoted_wait_minutes >= 0),
  notification_channels public.notification_channel[] not null default array['push','email']::public.notification_channel[],
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.favorite_businesses (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, business_id)
);

create table public.notification_events (
  id uuid primary key default gen_random_uuid(),
  queue_entry_id uuid references public.queue_entries(id) on delete cascade,
  channel public.notification_channel not null,
  event_name text not null,
  status text not null default 'pending',
  payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  queue_entry_id uuid references public.queue_entries(id) on delete set null,
  stripe_session_id text unique,
  type text not null check (type in ('subscription', 'fast_pass', 'upgrade')),
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'usd',
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  stripe_subscription_id text unique,
  plan public.plan_id not null,
  status public.plan_status not null,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  location_id uuid references public.locations(id) on delete cascade,
  title text not null,
  body text not null,
  severity text not null check (severity in ('info', 'success', 'warning')),
  created_at timestamptz not null default now()
);

create index queue_entries_active_idx on public.queue_entries(queue_id, status, position);
create index queues_location_idx on public.queues(location_id);
create index locations_business_idx on public.locations(business_id);
create index memberships_user_idx on public.business_memberships(user_id);
create index payments_business_idx on public.payments(business_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.business_memberships enable row level security;
alter table public.locations enable row level security;
alter table public.staff_members enable row level security;
alter table public.queues enable row level security;
alter table public.queue_entries enable row level security;
alter table public.favorite_businesses enable row level security;
alter table public.notification_events enable row level security;
alter table public.payments enable row level security;
alter table public.subscriptions enable row level security;
alter table public.ai_insights enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and suspended_at is null
  );
$$;

create or replace function public.is_business_member(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_memberships
    where business_id = target_business_id and user_id = auth.uid()
  )
  or exists (
    select 1 from public.businesses
    where id = target_business_id and owner_id = auth.uid()
  )
  or public.is_admin();
$$;

create policy "profiles_read_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "businesses_read_public_active"
  on public.businesses for select
  using (suspended_at is null or public.is_business_member(id));

create policy "businesses_manage_members"
  on public.businesses for all
  using (public.is_business_member(id))
  with check (public.is_business_member(id));

create policy "memberships_read_members"
  on public.business_memberships for select
  using (public.is_business_member(business_id));

create policy "memberships_manage_admin_owner"
  on public.business_memberships for all
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "locations_read_public"
  on public.locations for select
  using (true);

create policy "locations_manage_members"
  on public.locations for all
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "staff_read_public"
  on public.staff_members for select
  using (true);

create policy "staff_manage_members"
  on public.staff_members for all
  using (
    exists (
      select 1
      from public.locations l
      where l.id = location_id and public.is_business_member(l.business_id)
    )
  );

create policy "queues_read_public"
  on public.queues for select
  using (true);

create policy "queues_manage_members"
  on public.queues for all
  using (
    exists (
      select 1
      from public.locations l
      where l.id = location_id and public.is_business_member(l.business_id)
    )
  );

create policy "entries_read_customer_or_business"
  on public.queue_entries for select
  using (
    customer_id = auth.uid()
    or exists (
      select 1
      from public.queues q
      join public.locations l on l.id = q.location_id
      where q.id = queue_id and public.is_business_member(l.business_id)
    )
    or public.is_admin()
  );

create policy "entries_insert_customer"
  on public.queue_entries for insert
  with check (customer_id = auth.uid() or customer_id is null);

create policy "entries_update_customer_or_business"
  on public.queue_entries for update
  using (
    customer_id = auth.uid()
    or exists (
      select 1
      from public.queues q
      join public.locations l on l.id = q.location_id
      where q.id = queue_id and public.is_business_member(l.business_id)
    )
  );

create policy "favorites_own"
  on public.favorite_businesses for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "notification_events_business_or_admin"
  on public.notification_events for select
  using (
    public.is_admin()
    or exists (
      select 1
      from public.queue_entries e
      join public.queues q on q.id = e.queue_id
      join public.locations l on l.id = q.location_id
      where e.id = queue_entry_id and public.is_business_member(l.business_id)
    )
  );

create policy "payments_business_or_admin"
  on public.payments for select
  using (public.is_business_member(business_id));

create policy "subscriptions_business_or_admin"
  on public.subscriptions for select
  using (public.is_business_member(business_id));

create policy "insights_business_or_admin"
  on public.ai_insights for select
  using (public.is_business_member(business_id));
