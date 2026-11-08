-- TYB (Thank You, Baby) — initial schema
-- Mirrors src/types/domain.ts. Money is integer cents.
--
-- Safety principles baked in here:
--   * Users must be 18+ (checked on profiles.birthdate).
--   * Money never goes to a person. Contributions pay a verified biller;
--     only the server (service role, via Edge Functions) can create or
--     update contributions and move bills to funded/paid.
--   * Bills are only visible to supporters once reviewed ('live').
--   * Row Level Security is on for every table.


-- ---------- Enums ----------
create type public.user_role as enum ('supporter', 'recipient');
create type public.bill_category as enum (
  'rent', 'electricity', 'gas', 'water', 'internet', 'phone',
  'groceries', 'transport', 'education', 'medical', 'other'
);
create type public.bill_status as enum (
  'draft', 'pending_review', 'live', 'funded', 'paid', 'rejected', 'expired'
);
create type public.contribution_status as enum ('pending', 'succeeded', 'refunded', 'failed');
create type public.swipe_direction as enum ('pass', 'like');

-- ---------- Profiles ----------
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  role          public.user_role not null,
  display_name  text not null check (char_length(display_name) between 1 and 40),
  birthdate     date not null check (birthdate <= (current_date - interval '18 years')),
  city          text,
  bio           text check (char_length(bio) <= 500),
  prompts       jsonb not null default '[]'::jsonb,
  verified      boolean not null default false,  -- set server-side after ID check
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.profile_photos (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  storage_path  text not null,
  position      smallint not null check (position between 0 and 5),
  created_at    timestamptz not null default now(),
  unique (profile_id, position)
);

-- ---------- Bills ----------
create table public.bills (
  id             uuid primary key default gen_random_uuid(),
  recipient_id   uuid not null references public.profiles (id) on delete cascade,
  category       public.bill_category not null,
  biller_name    text not null,
  -- Payment details for the biller (BPAY biller code / reference or BSB+acct).
  -- Stored for server-side payout only; never selected by the client.
  biller_payment jsonb,
  amount_cents   integer not null check (amount_cents between 500 and 500000),
  covered_cents  integer not null default 0 check (covered_cents >= 0),
  currency       char(3) not null default 'AUD',
  due_date       date not null,
  note           text check (char_length(note) <= 280),
  document_path  text,          -- uploaded bill/invoice for review
  status         public.bill_status not null default 'draft',
  reviewed_at    timestamptz,
  paid_at        timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index bills_live_idx on public.bills (status, due_date) where status = 'live';
create index bills_recipient_idx on public.bills (recipient_id);

-- ---------- Swipes ----------
create table public.swipes (
  supporter_id  uuid not null references public.profiles (id) on delete cascade,
  recipient_id  uuid not null references public.profiles (id) on delete cascade,
  direction     public.swipe_direction not null,
  created_at    timestamptz not null default now(),
  primary key (supporter_id, recipient_id),
  check (supporter_id <> recipient_id)
);

-- ---------- Contributions (server-written only) ----------
create table public.contributions (
  id            uuid primary key default gen_random_uuid(),
  supporter_id  uuid not null references public.profiles (id),
  bill_id       uuid not null references public.bills (id),
  amount_cents  integer not null check (amount_cents >= 500),
  fee_cents     integer not null default 0 check (fee_cents >= 0),
  status        public.contribution_status not null default 'pending',
  payment_ref   text unique,     -- payment provider id (e.g. Stripe PaymentIntent)
  created_at    timestamptz not null default now()
);
create index contributions_bill_idx on public.contributions (bill_id);
create index contributions_supporter_idx on public.contributions (supporter_id);

-- ---------- Trust & safety ----------
create table public.reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null references public.profiles (id) on delete cascade,
  reported_id  uuid not null references public.profiles (id) on delete cascade,
  reason       text not null,
  details      text check (char_length(details) <= 1000),
  created_at   timestamptz not null default now()
);

create table public.blocks (
  blocker_id  uuid not null references public.profiles (id) on delete cascade,
  blocked_id  uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

-- ---------- updated_at trigger ----------
create function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger bills_touch before update on public.bills
  for each row execute function public.touch_updated_at();

-- ---------- Helpers ----------
create function public.my_role() returns public.user_role
  language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

-- ---------- Row Level Security ----------
alter table public.profiles       enable row level security;
alter table public.profile_photos enable row level security;
alter table public.bills          enable row level security;
alter table public.swipes         enable row level security;
alter table public.contributions  enable row level security;
alter table public.reports        enable row level security;
alter table public.blocks         enable row level security;

-- Profiles: you manage your own; signed-in users can see active profiles
-- that haven't blocked them. `verified` is protected by the column grant below.
create policy "read active profiles" on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or (is_active and not exists (
      select 1 from public.blocks b where b.blocker_id = profiles.id and b.blocked_id = auth.uid()
    ))
  );
create policy "insert own profile" on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy "update own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

revoke update on public.profiles from authenticated;
grant update (display_name, city, bio, prompts, is_active) on public.profiles to authenticated;

-- Photos: visible with the profile; owner manages.
create policy "read photos" on public.profile_photos for select to authenticated using (true);
create policy "manage own photos" on public.profile_photos for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- Bills: recipients see all of theirs; everyone else only sees live/funded.
create policy "read bills" on public.bills for select to authenticated
  using (recipient_id = auth.uid() or status in ('live', 'funded'));
create policy "recipient creates bills" on public.bills for insert to authenticated
  with check (
    recipient_id = auth.uid()
    and public.my_role() = 'recipient'
    and status in ('draft', 'pending_review')
    and covered_cents = 0
  );
create policy "recipient edits unreviewed bills" on public.bills for update to authenticated
  using (recipient_id = auth.uid() and status in ('draft', 'pending_review'))
  with check (recipient_id = auth.uid() and status in ('draft', 'pending_review'));
create policy "recipient deletes drafts" on public.bills for delete to authenticated
  using (recipient_id = auth.uid() and status = 'draft');

-- Clients may never read biller payout details or set money/review fields.
revoke select, update on public.bills from authenticated;
grant select (id, recipient_id, category, biller_name, amount_cents, covered_cents, currency,
              due_date, note, document_path, status, reviewed_at, paid_at, created_at, updated_at)
  on public.bills to authenticated;
grant update (category, biller_name, biller_payment, amount_cents, due_date, note, document_path, status)
  on public.bills to authenticated;

-- Swipes: supporters record and read their own.
create policy "supporter swipes" on public.swipes for insert to authenticated
  with check (supporter_id = auth.uid() and public.my_role() = 'supporter');
create policy "read own swipes" on public.swipes for select to authenticated
  using (supporter_id = auth.uid());

-- Contributions: read-only for the two parties. No insert/update policies —
-- only the payments Edge Function (service role) writes here.
create policy "read own contributions" on public.contributions for select to authenticated
  using (
    supporter_id = auth.uid()
    or exists (select 1 from public.bills b where b.id = bill_id and b.recipient_id = auth.uid())
  );

-- Reports & blocks
create policy "file reports" on public.reports for insert to authenticated
  with check (reporter_id = auth.uid());
create policy "manage own blocks" on public.blocks for all to authenticated
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());
