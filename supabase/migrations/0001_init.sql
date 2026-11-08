-- TYB (Thank You, Baby) — initial schema
-- Mirrors src/types/domain.ts. Money is integer minor units (cents) with a
-- per-record ISO currency code.
--
-- How money moves (TYB is the intermediary — never user-to-user):
--   1. Giver pays TYB through the payment provider  -> gifts (status: payment)
--   2. TYB records the charge and its fee           -> ledger_entries
--   3. TYB pays the net gift to the receiver's
--      verified payout account                     -> payouts (status: payout)
-- Payment and payout are separate records with separate statuses. The
-- ledger is append-only and is the accounting source of truth; the app only
-- ever reads display views.
--
-- Privacy model:
--   * Public-to-other-users data lives in profiles / profile_photos /
--     gift_requests. Everything else (legal name, birthdate, contact, address,
--     bill account, payout account, payment refs) lives in private tables
--     that the other user can never read.
--   * "Hidden from the other user" != "unknown to TYB": staff can read
--     private tables only through logged functions.
--
-- Enforced here (see supabase/tests/acceptance.test.mjs):
--   * 18+, verified accounts only for browsing, appearing and gifting.
--   * Givers have no public profile; an optional profile is revealed only by
--     a deliberate per-conversation reveal.
--   * No message or connection request before a paid gift; one pending
--     request at a time; chat opens only when the receiver accepts.
--   * Gifts never depend on the receiver replying.
--   * Only the server (service role) creates payments, payouts and ledger rows.

-- ======================================================================
-- Enums
-- ======================================================================
create type public.user_role as enum ('giver', 'receiver');
create type public.verification_status as enum ('unverified', 'pending', 'verified', 'rejected');
create type public.request_kind as enum ('gift', 'bill', 'expense');
create type public.request_status as enum (
  'draft', 'pending_review', 'live', 'fulfilled', 'withdrawn', 'rejected', 'expired'
);
create type public.payment_status as enum (
  'awaiting_payment', 'processing', 'paid', 'failed', 'refunded', 'disputed'
);
create type public.payout_status as enum (
  'pending', 'on_hold', 'in_transit', 'paid_out', 'failed', 'cancelled'
);
create type public.connection_status as enum ('pending', 'accepted', 'declined', 'expired', 'withdrawn');
create type public.ledger_entry_type as enum (
  'charge', 'platform_fee', 'receiver_payable', 'payout', 'payout_reversal',
  'refund', 'dispute_hold', 'dispute_released', 'dispute_lost'
);

-- ======================================================================
-- Platform settings (single row). Nothing is hard-coded: a null fee means
-- "not configured" and checkout must refuse to run.
-- ======================================================================
create table public.platform_settings (
  id                      boolean primary key default true check (id),
  fee_percent_bps         integer check (fee_percent_bps between 0 and 10000), -- 1 bps = 0.01%
  fee_fixed_cents         integer check (fee_fixed_cents >= 0),
  min_gift_cents          integer check (min_gift_cents > 0),
  payout_delay_hours      integer check (payout_delay_hours >= 0),
  refund_window_days      integer check (refund_window_days >= 0),
  connection_expiry_days  integer check (connection_expiry_days > 0),          -- null = never expires
  updated_at              timestamptz not null default now()
);
insert into public.platform_settings (id) values (true);

-- ======================================================================
-- Accounts
-- ======================================================================

-- What other users may see. Givers keep this to a display name only.
create table public.profiles (
  id                     uuid primary key references auth.users (id) on delete cascade,
  role                   public.user_role not null,
  display_name           text not null check (char_length(display_name) between 1 and 40),
  city                   text check (char_length(city) <= 60),
  country_code           char(2),
  bio                    text check (char_length(bio) <= 500),
  prompts                jsonb not null default '[]'::jsonb,
  show_age               boolean not null default true,
  is_active              boolean not null default true,
  deletion_requested_at  timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  -- A giver's public row is a display name, nothing more.
  constraint giver_profile_is_minimal check (
    role = 'receiver' or (city is null and country_code is null and bio is null and prompts = '[]'::jsonb)
  )
);

-- Known to TYB, never shown to another user.
create table public.private_details (
  user_id     uuid primary key references public.profiles (id) on delete cascade,
  legal_name  text,
  birthdate   date not null check (birthdate <= (current_date - interval '18 years')),
  email       text,
  phone       text,
  address     jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Identity / certification result from the verification provider.
create table public.verifications (
  user_id       uuid primary key references public.profiles (id) on delete cascade,
  status        public.verification_status not null default 'unverified',
  provider      text,
  provider_ref  text,
  checked_at    timestamptz
);

-- Receiver payout destination, held by the payment provider. TYB stores only
-- the provider's reference — never raw bank details.
create table public.payout_accounts (
  receiver_id           uuid primary key references public.profiles (id) on delete cascade,
  provider              text not null,
  provider_account_ref  text not null,
  status                text not null default 'pending' check (status in ('pending', 'verified', 'restricted')),
  currency              char(3) not null,
  country_code          char(2) not null,
  updated_at            timestamptz not null default now()
);

-- A giver's optional profile. Shown only through profile_reveals.
create table public.giver_profiles (
  giver_id    uuid primary key references public.profiles (id) on delete cascade,
  bio         text check (char_length(bio) <= 500),
  prompts     jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now()
);

create table public.profile_photos (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles (id) on delete cascade,
  storage_path  text not null,
  position      smallint not null check (position between 0 and 5),
  created_at    timestamptz not null default now(),
  unique (owner_id, position)
);

-- ======================================================================
-- Gift, bill and expense requests
-- ======================================================================
create table public.gift_requests (
  id                 uuid primary key default gen_random_uuid(),
  receiver_id        uuid not null references public.profiles (id) on delete cascade,
  kind               public.request_kind not null,
  title              text not null check (char_length(title) between 1 and 60),
  description        text check (char_length(description) <= 280),
  amount_cents       integer not null check (amount_cents > 0),
  currency           char(3) not null,
  status             public.request_status not null default 'draft',
  verified_by_tyb    boolean not null default false,  -- TYB checked the bill/expense privately
  fulfilled_gift_id  uuid,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index gift_requests_live_idx on public.gift_requests (receiver_id) where status = 'live';

-- Evidence TYB uses to verify a bill. Never shown to givers.
create table public.request_private_details (
  request_id         uuid primary key references public.gift_requests (id) on delete cascade,
  biller_name        text,
  bill_total_cents   integer,
  account_reference  text,
  document_path      text,
  due_date           date
);

-- ======================================================================
-- Payments (gifts), payouts and the ledger — server-written only
-- ======================================================================
create table public.gifts (
  id                     uuid primary key default gen_random_uuid(),
  giver_id               uuid not null references public.profiles (id),
  receiver_id            uuid not null references public.profiles (id),
  request_id             uuid references public.gift_requests (id),  -- null = gift without a request
  gift_amount_cents      integer not null check (gift_amount_cents > 0),  -- goes to the receiver
  fee_cents              integer not null check (fee_cents >= 0),         -- TYB platform fee
  total_cents            integer not null,                                -- charged to the giver
  currency               char(3) not null,
  status                 public.payment_status not null default 'awaiting_payment',
  is_test                boolean not null default true,  -- mock/test-mode payment, not real money
  provider               text not null,
  provider_payment_ref   text unique,
  failure_reason         text,
  paid_at                timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  check (total_cents = gift_amount_cents + fee_cents),
  check (giver_id <> receiver_id)
);
-- A request can be paid by one gift only (no partial gifts).
create unique index gifts_one_per_request on public.gifts (request_id)
  where request_id is not null and status in ('processing', 'paid', 'disputed');

alter table public.gift_requests
  add constraint gift_requests_fulfilled_gift_fk foreign key (fulfilled_gift_id) references public.gifts (id);

create table public.payouts (
  id                   uuid primary key default gen_random_uuid(),
  gift_id              uuid not null unique references public.gifts (id),
  receiver_id          uuid not null references public.profiles (id),
  amount_cents         integer not null check (amount_cents > 0),
  currency             char(3) not null,
  status               public.payout_status not null default 'pending',
  provider             text not null,
  provider_payout_ref  text unique,
  failure_reason       text,
  scheduled_for        timestamptz,
  paid_out_at          timestamptz,  -- set only when the provider confirms
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Append-only accounting record. Signed amounts per account.
create table public.ledger_entries (
  id            bigint generated always as identity primary key,
  gift_id       uuid references public.gifts (id),
  payout_id     uuid references public.payouts (id),
  entry_type    public.ledger_entry_type not null,
  account       text not null check (account in ('giver', 'tyb_fees', 'receiver_payable', 'provider_clearing')),
  amount_cents  bigint not null,
  currency      char(3) not null,
  provider_ref  text,
  note          text,
  created_at    timestamptz not null default now()
);

-- ======================================================================
-- Connections, chat, reveals
-- ======================================================================
create table public.connection_requests (
  id            uuid primary key default gen_random_uuid(),
  giver_id      uuid not null references public.profiles (id) on delete cascade,
  receiver_id   uuid not null references public.profiles (id) on delete cascade,
  gift_id       uuid not null unique references public.gifts (id),  -- one request per paid gift
  note          text check (char_length(note) <= 200),
  status        public.connection_status not null default 'pending',
  created_at    timestamptz not null default now(),
  responded_at  timestamptz,
  expires_at    timestamptz
);
-- Never more than one waiting request from the same giver to the same receiver.
create unique index connection_one_pending on public.connection_requests (giver_id, receiver_id)
  where status = 'pending';

create table public.conversations (
  id          uuid primary key default gen_random_uuid(),
  giver_id    uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  opened_by_request_id uuid references public.connection_requests (id),
  created_at  timestamptz not null default now(),
  closed_at   timestamptz,
  unique (giver_id, receiver_id)
);

create table public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations (id) on delete cascade,
  sender_id        uuid not null references public.profiles (id) on delete cascade,
  body             text not null check (char_length(body) between 1 and 2000),
  created_at       timestamptz not null default now()
);
create index messages_conversation_idx on public.messages (conversation_id, created_at);

-- A giver deliberately shows his optional profile to one receiver.
create table public.profile_reveals (
  giver_id     uuid not null references public.profiles (id) on delete cascade,
  receiver_id  uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (giver_id, receiver_id)
);

-- ======================================================================
-- Safety, saves, staff
-- ======================================================================
create table public.blocks (
  blocker_id  uuid not null references public.profiles (id) on delete cascade,
  blocked_id  uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table public.reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null references public.profiles (id) on delete cascade,
  reported_id  uuid not null references public.profiles (id) on delete cascade,
  reason       text not null,
  details      text check (char_length(details) <= 1000),
  created_at   timestamptz not null default now()
);

create table public.saves (
  giver_id     uuid not null references public.profiles (id) on delete cascade,
  receiver_id  uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (giver_id, receiver_id)
);

create table public.staff_members (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  role     text not null check (role in ('support', 'trust_safety', 'finance', 'admin'))
);

create table public.staff_access_log (
  id              bigint generated always as identity primary key,
  staff_id        uuid not null,
  target_user_id  uuid,
  resource        text not null,
  reason          text not null,
  accessed_at     timestamptz not null default now()
);

-- ======================================================================
-- Triggers
-- ======================================================================
create function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger profiles_touch        before update on public.profiles        for each row execute function public.touch_updated_at();
create trigger private_details_touch before update on public.private_details for each row execute function public.touch_updated_at();
create trigger requests_touch        before update on public.gift_requests   for each row execute function public.touch_updated_at();
create trigger gifts_touch           before update on public.gifts           for each row execute function public.touch_updated_at();
create trigger payouts_touch         before update on public.payouts         for each row execute function public.touch_updated_at();

-- Ledger and access log are append-only.
create function public.forbid_change() returns trigger language plpgsql as $$
begin raise exception '% is append-only', tg_table_name; end $$;
create trigger ledger_append_only before update or delete on public.ledger_entries
  for each row execute function public.forbid_change();
create trigger access_log_append_only before update or delete on public.staff_access_log
  for each row execute function public.forbid_change();

-- A gift towards a request must be for that receiver, in its currency, and
-- at least the requested amount (givers may add more).
create function public.validate_gift() returns trigger language plpgsql as $$
declare r public.gift_requests;
begin
  if new.request_id is not null then
    select * into r from public.gift_requests where id = new.request_id;
    if r.receiver_id <> new.receiver_id then raise exception 'request belongs to another receiver'; end if;
    if r.currency <> new.currency then raise exception 'currency mismatch'; end if;
    if new.gift_amount_cents < r.amount_cents then raise exception 'gift is below the requested amount'; end if;
    if tg_op = 'INSERT' and r.status <> 'live' then raise exception 'request is not open'; end if;
  end if;
  return new;
end $$;
create trigger gifts_validate before insert or update of request_id, gift_amount_cents, currency on public.gifts
  for each row execute function public.validate_gift();

-- Keep the request's status in step with its gift's payment.
create function public.sync_request_on_gift() returns trigger language plpgsql as $$
begin
  if new.request_id is null or new.status = old.status then return new; end if;
  if new.status = 'paid' then
    update public.gift_requests set status = 'fulfilled', fulfilled_gift_id = new.id
     where id = new.request_id and status = 'live';
  elsif new.status = 'refunded' then
    update public.gift_requests set status = 'live', fulfilled_gift_id = null
     where id = new.request_id and fulfilled_gift_id = new.id;
  end if;
  return new;
end $$;
create trigger gifts_sync_request after update of status on public.gifts
  for each row execute function public.sync_request_on_gift();

-- ======================================================================
-- Helper functions (security definer so policies don't recurse)
-- ======================================================================
create function public.my_role() returns public.user_role
  language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

create function public.is_verified(uid uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from verifications v join profiles p on p.id = v.user_id
                 where v.user_id = uid and v.status = 'verified' and p.is_active)
$$;

create function public.is_blocked_between(a uuid, b uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from blocks where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a))
$$;

-- Can `viewer` see this receiver's public profile?
create function public.can_view_receiver(viewer uuid, receiver uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select viewer = receiver
      or (    exists (select 1 from profiles where id = receiver and role = 'receiver')
          and exists (select 1 from profiles where id = viewer and role = 'giver')
          and public.is_verified(receiver)
          and public.is_verified(viewer)
          and not public.is_blocked_between(viewer, receiver))
$$;

-- Has this giver had a paid gift or a connection request with this receiver?
create function public.has_gifted(giver uuid, receiver uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from gifts where giver_id = giver and receiver_id = receiver
                 and status in ('paid', 'refunded', 'disputed'))
$$;

create function public.is_participant(conv uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from conversations where id = conv and auth.uid() in (giver_id, receiver_id))
$$;

-- Age shown on a receiver's profile (birthdate itself is never exposed).
create function public.profile_age(profile_id uuid) returns integer
  language sql stable security definer set search_path = public as $$
  select date_part('year', age(pd.birthdate))::int
    from private_details pd join profiles p on p.id = pd.user_id
   where pd.user_id = profile_id and p.show_age and p.role = 'receiver'
     and public.can_view_receiver(auth.uid(), profile_id)
$$;

-- ======================================================================
-- Row Level Security
-- ======================================================================
alter table public.platform_settings       enable row level security;
alter table public.profiles                enable row level security;
alter table public.private_details         enable row level security;
alter table public.verifications           enable row level security;
alter table public.payout_accounts         enable row level security;
alter table public.giver_profiles          enable row level security;
alter table public.profile_photos          enable row level security;
alter table public.gift_requests           enable row level security;
alter table public.request_private_details enable row level security;
alter table public.gifts                   enable row level security;
alter table public.payouts                 enable row level security;
alter table public.ledger_entries          enable row level security;
alter table public.connection_requests     enable row level security;
alter table public.conversations           enable row level security;
alter table public.messages                enable row level security;
alter table public.profile_reveals         enable row level security;
alter table public.blocks                  enable row level security;
alter table public.reports                 enable row level security;
alter table public.saves                   enable row level security;
alter table public.staff_members           enable row level security;
alter table public.staff_access_log        enable row level security;
-- No client policies at all (server/service role only): gifts, payouts,
-- ledger_entries, staff_members, staff_access_log. Clients read gifts and
-- payouts only through the display views further down.

-- Nothing here is for signed-out visitors.
revoke all on all tables in schema public from anon;

-- Settings: readable (checkout shows the fee), never writable by clients.
create policy "read settings" on public.platform_settings for select to authenticated using (true);
revoke insert, update, delete on public.platform_settings from authenticated;

-- Profiles
create policy "read profiles" on public.profiles for select to authenticated using (
  id = auth.uid()
  or (role = 'receiver' and public.can_view_receiver(auth.uid(), id))
  -- a receiver sees a giver's display name only once he has gifted her
  or (role = 'giver' and is_active and public.has_gifted(id, auth.uid()) and not public.is_blocked_between(id, auth.uid()))
);
create policy "create own profile" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "edit own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated;
grant update (display_name, city, country_code, bio, prompts, show_age) on public.profiles to authenticated;

-- Private details: the owner only. Staff go through staff_read_private_details().
create policy "own private details" on public.private_details for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Verification and payout account: owner can see status; provider writes.
create policy "own verification" on public.verifications for select to authenticated using (user_id = auth.uid());
revoke insert, update, delete on public.verifications from authenticated;
revoke select on public.verifications from authenticated;
grant select (user_id, status, checked_at) on public.verifications to authenticated;

create policy "own payout account" on public.payout_accounts for select to authenticated using (receiver_id = auth.uid());
revoke insert, update, delete on public.payout_accounts from authenticated;
revoke select on public.payout_accounts from authenticated;
grant select (receiver_id, status, currency, country_code, updated_at) on public.payout_accounts to authenticated;

-- Giver optional profile: owner manages; a receiver sees it only after a reveal.
create policy "read giver profile" on public.giver_profiles for select to authenticated using (
  giver_id = auth.uid()
  or (exists (select 1 from public.profile_reveals r where r.giver_id = giver_profiles.giver_id and r.receiver_id = auth.uid())
      and not public.is_blocked_between(giver_id, auth.uid()))
);
create policy "manage own giver profile" on public.giver_profiles for all to authenticated
  using (giver_id = auth.uid()) with check (giver_id = auth.uid() and public.my_role() = 'giver');

-- Photos follow the same visibility as their owner's profile.
create policy "read photos" on public.profile_photos for select to authenticated using (
  owner_id = auth.uid()
  or public.can_view_receiver(auth.uid(), owner_id) and exists (select 1 from public.profiles p where p.id = owner_id and p.role = 'receiver')
  or (exists (select 1 from public.profile_reveals r where r.giver_id = owner_id and r.receiver_id = auth.uid())
      and not public.is_blocked_between(owner_id, auth.uid()))
);
create policy "manage own photos" on public.profile_photos for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Requests: receivers manage theirs; givers see live requests of profiles they can view.
create policy "read requests" on public.gift_requests for select to authenticated using (
  receiver_id = auth.uid()
  or (status = 'live' and public.can_view_receiver(auth.uid(), receiver_id))
);
create policy "create request" on public.gift_requests for insert to authenticated with check (
  receiver_id = auth.uid() and public.my_role() = 'receiver'
  and status in ('draft', 'pending_review') and not verified_by_tyb and fulfilled_gift_id is null
);
create policy "edit own request" on public.gift_requests for update to authenticated
  using (receiver_id = auth.uid() and status in ('draft', 'pending_review', 'live'))
  with check (receiver_id = auth.uid() and status in ('draft', 'pending_review', 'withdrawn'));
create policy "delete draft request" on public.gift_requests for delete to authenticated
  using (receiver_id = auth.uid() and status = 'draft');
revoke update on public.gift_requests from authenticated;
grant update (kind, title, description, amount_cents, currency, status) on public.gift_requests to authenticated;

create policy "own request evidence" on public.request_private_details for all to authenticated
  using (exists (select 1 from public.gift_requests r where r.id = request_id and r.receiver_id = auth.uid()))
  with check (exists (select 1 from public.gift_requests r where r.id = request_id and r.receiver_id = auth.uid()));

-- Connection requests: both parties can read; changes go through functions below.
create policy "read own connection requests" on public.connection_requests for select to authenticated
  using (auth.uid() in (giver_id, receiver_id));
revoke insert, update, delete on public.connection_requests from authenticated;

-- Conversations and messages: participants only; a message needs an open chat with no block.
create policy "read own conversations" on public.conversations for select to authenticated
  using (auth.uid() in (giver_id, receiver_id));
revoke insert, update, delete on public.conversations from authenticated;

create policy "read messages" on public.messages for select to authenticated using (public.is_participant(conversation_id));
create policy "send message" on public.messages for insert to authenticated with check (
  sender_id = auth.uid()
  and exists (select 1 from public.conversations c
              where c.id = conversation_id and c.closed_at is null
                and auth.uid() in (c.giver_id, c.receiver_id)
                and not public.is_blocked_between(c.giver_id, c.receiver_id))
);
revoke update, delete on public.messages from authenticated;

-- Reveals: a giver can show his optional profile only inside an open chat, and can take it back.
create policy "read reveals" on public.profile_reveals for select to authenticated
  using (auth.uid() in (giver_id, receiver_id));
create policy "reveal own profile" on public.profile_reveals for insert to authenticated with check (
  giver_id = auth.uid()
  and exists (select 1 from public.conversations c where c.giver_id = auth.uid()
              and c.receiver_id = profile_reveals.receiver_id and c.closed_at is null)
);
create policy "unreveal own profile" on public.profile_reveals for delete to authenticated using (giver_id = auth.uid());

-- Safety
create policy "manage own blocks" on public.blocks for all to authenticated
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());
create policy "file reports" on public.reports for insert to authenticated with check (reporter_id = auth.uid());
revoke select, update, delete on public.reports from authenticated;
create policy "manage own saves" on public.saves for all to authenticated
  using (giver_id = auth.uid()) with check (giver_id = auth.uid() and public.can_view_receiver(auth.uid(), receiver_id));

-- ======================================================================
-- Display views — the only way the app reads payments and payouts.
-- Each side sees its own perspective and nothing private about the other.
-- ======================================================================

-- Giver: what he sent, what it cost, and where it is — no receiver banking or personal details.
create view public.my_gifts_sent with (security_barrier) as
  select g.id, g.receiver_id, p.display_name as receiver_display_name, g.request_id,
         g.gift_amount_cents, g.fee_cents, g.total_cents, g.currency, g.is_test,
         g.status as payment_status, po.status as payout_status, g.created_at, g.paid_at
    from public.gifts g
    join public.profiles p on p.id = g.receiver_id
    left join public.payouts po on po.gift_id = g.id
   where g.giver_id = auth.uid();

-- Receiver: amount and payout status — no sender payment or legal details, and
-- only gifts that have actually been paid.
create view public.my_gifts_received with (security_barrier) as
  select g.id, g.giver_id, p.display_name as giver_display_name, g.request_id,
         g.gift_amount_cents, g.currency, g.is_test,
         g.status as payment_status, po.status as payout_status,
         po.scheduled_for as payout_scheduled_for, po.paid_out_at, g.paid_at
    from public.gifts g
    join public.profiles p on p.id = g.giver_id
    left join public.payouts po on po.gift_id = g.id
   where g.receiver_id = auth.uid() and g.status in ('paid', 'refunded', 'disputed');

revoke all on public.my_gifts_sent, public.my_gifts_received from anon;
grant select on public.my_gifts_sent, public.my_gifts_received to authenticated;

-- ======================================================================
-- Actions (functions the app calls)
-- ======================================================================

-- Giver asks to connect after a paid gift. Never before; never while another
-- request to her is waiting; never if either has blocked the other.
create function public.send_connection_request(p_gift_id uuid, p_note text default null)
  returns uuid language plpgsql security definer set search_path = public as $$
declare g gifts; s platform_settings; new_id uuid;
begin
  select * into g from gifts where id = p_gift_id;
  if g.id is null or g.giver_id <> auth.uid() then raise exception 'not your gift'; end if;
  if g.status <> 'paid' then raise exception 'gift is not completed'; end if;
  if is_blocked_between(g.giver_id, g.receiver_id) then raise exception 'not available'; end if;
  if exists (select 1 from conversations where giver_id = g.giver_id and receiver_id = g.receiver_id and closed_at is null)
    then raise exception 'chat already open'; end if;
  select * into s from platform_settings;
  insert into connection_requests (giver_id, receiver_id, gift_id, note, expires_at)
  values (g.giver_id, g.receiver_id, g.id, p_note,
          case when s.connection_expiry_days is null then null
               else now() + make_interval(days => s.connection_expiry_days) end)
  returning id into new_id;
  return new_id;
end $$;

-- Receiver accepts (opens chat) or declines. Ignoring = doing nothing.
create function public.respond_to_connection(p_request_id uuid, p_accept boolean)
  returns uuid language plpgsql security definer set search_path = public as $$
declare r connection_requests; conv_id uuid;
begin
  select * into r from connection_requests where id = p_request_id;
  if r.id is null or r.receiver_id <> auth.uid() then raise exception 'not your request'; end if;
  if r.status <> 'pending' or (r.expires_at is not null and r.expires_at < now()) then
    raise exception 'request is no longer open'; end if;
  if not p_accept then
    update connection_requests set status = 'declined', responded_at = now() where id = r.id;
    return null;
  end if;
  update connection_requests set status = 'accepted', responded_at = now() where id = r.id;
  insert into conversations (giver_id, receiver_id, opened_by_request_id)
  values (r.giver_id, r.receiver_id, r.id)
  on conflict (giver_id, receiver_id) do update set closed_at = null, opened_by_request_id = excluded.opened_by_request_id
  returning id into conv_id;
  return conv_id;
end $$;

create function public.withdraw_connection_request(p_request_id uuid)
  returns void language sql security definer set search_path = public as $$
  update connection_requests set status = 'withdrawn', responded_at = now()
   where id = p_request_id and giver_id = auth.uid() and status = 'pending'
$$;

-- Either person can leave a chat.
create function public.close_conversation(p_conversation_id uuid)
  returns void language sql security definer set search_path = public as $$
  update conversations set closed_at = now()
   where id = p_conversation_id and auth.uid() in (giver_id, receiver_id) and closed_at is null
$$;

-- Blocking closes any chat, hides the reveal and stops pending requests.
create function public.apply_block() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update conversations set closed_at = now()
   where closed_at is null and ((giver_id = new.blocker_id and receiver_id = new.blocked_id)
                             or (giver_id = new.blocked_id and receiver_id = new.blocker_id));
  update connection_requests set status = 'declined', responded_at = now()
   where status = 'pending' and ((giver_id = new.blocker_id and receiver_id = new.blocked_id)
                              or (giver_id = new.blocked_id and receiver_id = new.blocker_id));
  delete from profile_reveals
   where (giver_id = new.blocker_id and receiver_id = new.blocked_id)
      or (giver_id = new.blocked_id and receiver_id = new.blocker_id);
  return new;
end $$;
create trigger blocks_apply after insert on public.blocks for each row execute function public.apply_block();

-- Account deletion: hide immediately; the purge job removes personal data
-- later while keeping the financial ledger as the law requires.
create function public.request_account_deletion()
  returns void language plpgsql security definer set search_path = public as $$
begin
  update profiles set is_active = false, deletion_requested_at = now() where id = auth.uid();
  update conversations set closed_at = now() where closed_at is null and auth.uid() in (giver_id, receiver_id);
  update connection_requests set status = 'withdrawn', responded_at = now()
   where status = 'pending' and auth.uid() in (giver_id, receiver_id);
  update gift_requests set status = 'withdrawn' where receiver_id = auth.uid() and status in ('draft', 'pending_review', 'live');
  delete from profile_reveals where giver_id = auth.uid();
end $$;

-- Staff can read private details only with a stated reason, and every read is logged.
create function public.staff_read_private_details(p_user_id uuid, p_reason text)
  returns public.private_details language plpgsql security definer set search_path = public as $$
declare row private_details;
begin
  if not exists (select 1 from staff_members where user_id = auth.uid()) then raise exception 'staff only'; end if;
  if p_reason is null or char_length(trim(p_reason)) < 10 then raise exception 'a reason is required'; end if;
  insert into staff_access_log (staff_id, target_user_id, resource, reason) values (auth.uid(), p_user_id, 'private_details', p_reason);
  select * into row from private_details where user_id = p_user_id;
  return row;
end $$;

-- Only signed-in users may call actions; internal helpers stay internal.
revoke execute on all functions in schema public from public, anon;
grant execute on function
  public.my_role(), public.is_verified(uuid), public.is_blocked_between(uuid, uuid),
  public.can_view_receiver(uuid, uuid), public.has_gifted(uuid, uuid), public.is_participant(uuid),
  public.profile_age(uuid), public.send_connection_request(uuid, text),
  public.respond_to_connection(uuid, boolean), public.withdraw_connection_request(uuid),
  public.close_conversation(uuid), public.request_account_deletion(),
  public.staff_read_private_details(uuid, text)
to authenticated;
