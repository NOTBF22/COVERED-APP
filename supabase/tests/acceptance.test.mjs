// Database acceptance tests for TYB's product rules.
// Runs the real migration in an in-memory Postgres (PGlite) set up like
// Supabase, then acts as different users to prove what each can and can't do.
//
//   npm run test:db

import { PGlite } from '@electric-sql/pglite';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { before, describe, test } from 'node:test';

const MIGRATION = new URL('../migrations/0001_init.sql', import.meta.url);

const id = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const G = id(1); // verified giver
const G2 = id(2); // second verified giver
const GU = id(3); // unverified giver
const R = id(11); // verified receiver
const R2 = id(12); // unverified receiver
const STAFF = id(99);

let db;

/** Run SQL as a signed-in user, the way the app would. Returns rows. */
async function as(uid, sql, params = []) {
  await db.exec('begin');
  try {
    await db.exec(`set local role authenticated; select set_config('request.jwt.claim.sub', '${uid}', true);`);
    const res = await db.query(sql, params);
    await db.exec('commit');
    return res.rows;
  } catch (e) {
    await db.exec('rollback');
    throw e;
  }
}
/** Run SQL as TYB's server (service role — bypasses row security). */
const server = async (sql, params = []) => (await db.query(sql, params)).rows;
const denied = (p) => assert.rejects(p);

/** Server creates a gift the way the payments function will. */
async function serverGift({ giver, receiver, request = null, amount, fee = 0, status = 'paid', currency = 'AUD' }) {
  const [g] = await server(
    `insert into gifts (giver_id, receiver_id, request_id, gift_amount_cents, fee_cents, total_cents, currency, status, provider)
     values ($1, $2, $3, $4, $5, $6, $7, 'awaiting_payment', 'mock') returning id`,
    [giver, receiver, request, amount, fee, amount + fee, currency],
  );
  if (status !== 'awaiting_payment') await server(`update gifts set status = $2, paid_at = now() where id = $1`, [g.id, status]);
  return g.id;
}

before(async () => {
  db = new PGlite();
  // Mimic Supabase: auth schema, roles and default grants.
  await db.exec(`
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create role anon; create role authenticated; create role service_role bypassrls;
    grant usage on schema public, auth to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
    alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
  `);
  await db.exec(readFileSync(MIGRATION, 'utf8'));

  for (const u of [G, G2, GU, R, R2, STAFF]) await server(`insert into auth.users values ($1)`, [u]);
  const people = [
    [G, 'giver', 'James'], [G2, 'giver', 'Tom'], [GU, 'giver', 'Unverified'],
    [R, 'receiver', 'Amelia'], [R2, 'receiver', 'Hidden'],
  ];
  for (const [uid, role, name] of people) {
    await as(uid, `insert into profiles (id, role, display_name) values ($1, $2, $3)`, [uid, role, name]);
    await as(uid, `insert into private_details (user_id, legal_name, birthdate, phone) values ($1, $2, '1996-05-01', '0400 000 000')`, [uid, `${name} Legal`]);
  }
  await as(R, `update profiles set city = 'Sydney', country_code = 'AU', bio = 'Nursing grad' where id = $1`, [R]);
  for (const uid of [G, G2, R]) await server(`insert into verifications (user_id, status) values ($1, 'verified')`, [uid]);
  await server(`insert into staff_members values ($1, 'trust_safety')`, [STAFF]);
});

describe('accounts and privacy', () => {
  test('under-18s cannot register', async () => {
    await server(`insert into auth.users values ($1)`, [id(50)]);
    await as(id(50), `insert into profiles (id, role, display_name) values ($1, 'receiver', 'Teen')`, [id(50)]);
    await denied(as(id(50), `insert into private_details (user_id, birthdate) values ($1, current_date - interval '17 years')`, [id(50)]));
  });

  test('only verified givers can browse, and only verified receivers appear', async () => {
    assert.deepEqual((await as(G, `select display_name from profiles where role = 'receiver'`)).map((r) => r.display_name), ['Amelia']);
    assert.equal((await as(GU, `select * from profiles where role = 'receiver'`)).length, 0);
  });

  test('a giver has no public profile: no city, bio or prompts', async () => {
    await denied(as(G, `update profiles set bio = 'hello' where id = $1`, [G]));
    await denied(as(G, `update profiles set city = 'Sydney' where id = $1`, [G]));
  });

  test("the receiver's legal, contact and birth details are never visible to a giver", async () => {
    assert.equal((await as(G, `select * from private_details where user_id = $1`, [R])).length, 0);
    const [{ age }] = await as(G, `select profile_age($1) as age`, [R]);
    assert.ok(age >= 18);
  });

  test("the giver's legal and contact details are never visible to a receiver", async () => {
    assert.equal((await as(R, `select * from private_details where user_id = $1`, [G])).length, 0);
  });

  test('payout account and verification internals are hidden even from their owner', async () => {
    await server(`insert into payout_accounts (receiver_id, provider, provider_account_ref, currency, country_code, status)
                  values ($1, 'mock', 'acct_secret', 'AUD', 'AU', 'verified')`, [R]);
    await denied(as(R, `select provider_account_ref from payout_accounts`));
    assert.equal((await as(R, `select status from payout_accounts`))[0].status, 'verified');
    assert.equal((await as(G, `select receiver_id from payout_accounts`)).length, 0);
  });
});

describe('requests', () => {
  let requestId;
  test('receivers submit requests for review; they cannot self-publish or self-verify', async () => {
    await denied(as(R, `insert into gift_requests (receiver_id, kind, title, amount_cents, currency, status) values ($1, 'bill', 'Rent', 64000, 'AUD', 'live')`, [R]));
    await denied(as(R, `insert into gift_requests (receiver_id, kind, title, amount_cents, currency, status, verified_by_tyb) values ($1, 'bill', 'Rent', 64000, 'AUD', 'pending_review', true)`, [R]));
    [{ id: requestId }] = await as(R, `insert into gift_requests (receiver_id, kind, title, amount_cents, currency, status) values ($1, 'bill', 'Rent', 64000, 'AUD', 'pending_review') returning id`, [R]);
    await as(R, `insert into request_private_details (request_id, biller_name, bill_total_cents, account_reference) values ($1, 'Ray White', 128000, 'REF-123')`, [requestId]);
    assert.equal((await as(G, `select * from gift_requests`)).length, 0, 'unreviewed request hidden');
  });

  test('givers see the live request but never the bill company, total or account', async () => {
    await server(`update gift_requests set status = 'live', verified_by_tyb = true where id = $1`, [requestId]);
    const rows = await as(G, `select title, amount_cents, verified_by_tyb from gift_requests`);
    assert.deepEqual(rows, [{ title: 'Rent', amount_cents: 64000, verified_by_tyb: true }]);
    assert.equal((await as(G, `select * from request_private_details`)).length, 0);
  });

  test('no partial gifts: a gift must be at least the requested amount; more is allowed', async () => {
    await assert.rejects(serverGift({ giver: G, receiver: R, request: requestId, amount: 30000 }));
    const giftId = await serverGift({ giver: G, receiver: R, request: requestId, amount: 70000, status: 'paid' });
    assert.equal((await server(`select status from gift_requests where id = $1`, [requestId]))[0].status, 'fulfilled');
    await assert.rejects(serverGift({ giver: G2, receiver: R, request: requestId, amount: 64000 }), 'one gift per request');
    assert.ok(giftId);
  });
});

describe('payments, payouts and ledger', () => {
  test('clients cannot create payments, payouts or ledger entries, or read the raw tables', async () => {
    await denied(as(G, `insert into gifts (giver_id, receiver_id, gift_amount_cents, fee_cents, total_cents, currency, provider) values ($1, $2, 100, 0, 100, 'AUD', 'mock')`, [G, R]));
    assert.equal((await as(G, `select * from gifts`)).length, 0);
    assert.equal((await as(R, `select * from payouts`)).length, 0);
    assert.equal((await as(G, `select * from ledger_entries`)).length, 0);
    await denied(as(G, `insert into ledger_entries (entry_type, account, amount_cents, currency) values ('charge', 'giver', 1, 'AUD')`));
  });

  test('the fee is not invented: settings start unconfigured', async () => {
    const [s] = await as(G, `select fee_percent_bps, fee_fixed_cents from platform_settings`);
    assert.deepEqual(s, { fee_percent_bps: null, fee_fixed_cents: null });
    await denied(as(G, `update platform_settings set fee_percent_bps = 0`));
  });

  test('the giver sees amount, fee and total; the receiver sees only her amount', async () => {
    const giftId = await serverGift({ giver: G2, receiver: R, amount: 5000, fee: 500 });
    const [sent] = await as(G2, `select gift_amount_cents, fee_cents, total_cents from my_gifts_sent where id = $1`, [giftId]);
    assert.deepEqual(sent, { gift_amount_cents: 5000, fee_cents: 500, total_cents: 5500 });
    const [got] = await as(R, `select * from my_gifts_received where id = $1`, [giftId]);
    assert.equal(got.gift_amount_cents, 5000);
    assert.ok(!('fee_cents' in got) && !('total_cents' in got) && !('provider_payment_ref' in got));
  });

  test('payment and payout are separate: paid is not paid out', async () => {
    const giftId = await serverGift({ giver: G2, receiver: R, amount: 2000 });
    await server(`insert into payouts (gift_id, receiver_id, amount_cents, currency, provider) values ($1, $2, 2000, 'AUD', 'mock')`, [giftId, R]);
    const [row] = await as(R, `select payment_status, payout_status, paid_out_at from my_gifts_received where id = $1`, [giftId]);
    assert.deepEqual(row, { payment_status: 'paid', payout_status: 'pending', paid_out_at: null });
    const [g] = await as(G2, `select payout_status from my_gifts_sent where id = $1`, [giftId]);
    assert.equal(g.payout_status, 'pending');
  });

  test('a receiver does not see a gift until its payment succeeds', async () => {
    const giftId = await serverGift({ giver: G2, receiver: R, amount: 1500, status: 'processing' });
    assert.equal((await as(R, `select * from my_gifts_received where id = $1`, [giftId])).length, 0);
  });

  test('the ledger is append-only, even for the server', async () => {
    await server(`insert into ledger_entries (entry_type, account, amount_cents, currency) values ('charge', 'giver', -5500, 'AUD')`);
    await assert.rejects(server(`update ledger_entries set amount_cents = 0`));
    await assert.rejects(server(`delete from ledger_entries`));
  });
});

describe('connections and chat', () => {
  test('no message and no connection request before a completed gift', async () => {
    const pending = await serverGift({ giver: G, receiver: R, amount: 1000, status: 'awaiting_payment' });
    await denied(as(G, `select send_connection_request($1)`, [pending]));
    await denied(as(G, `insert into conversations (giver_id, receiver_id) values ($1, $2)`, [G, R]));
    assert.equal((await as(G, `select * from conversations`)).length, 0);
  });

  let firstRequest;
  test('after a paid gift he may ask once; not again while it is waiting', async () => {
    const gift1 = await serverGift({ giver: G, receiver: R, amount: 3000 });
    [{ send_connection_request: firstRequest }] = await as(G, `select send_connection_request($1, 'Hi Amelia')`, [gift1]);
    const gift2 = await serverGift({ giver: G, receiver: R, amount: 3000 });
    await denied(as(G, `select send_connection_request($1)`, [gift2]));
    await denied(as(G, `select send_connection_request($1)`, [gift1]), 'same gift twice');
  });

  test('the receiver keeps the gift without replying; declining opens no chat', async () => {
    assert.ok((await as(R, `select * from my_gifts_received where giver_id = $1`, [G])).length > 0);
    await as(R, `select respond_to_connection($1, false)`, [firstRequest]);
    assert.equal((await as(G, `select * from conversations`)).length, 0);
    assert.ok((await as(R, `select * from my_gifts_received where giver_id = $1`, [G])).length > 0, 'gift kept');
  });

  let convId;
  test('a new gift lets him ask again; chat opens only when she accepts', async () => {
    const gift3 = await serverGift({ giver: G, receiver: R, amount: 4000 });
    const [{ send_connection_request: req }] = await as(G, `select send_connection_request($1)`, [gift3]);
    await denied(as(G, `select respond_to_connection($1, true)`, [req]), 'he cannot accept for her');
    [{ respond_to_connection: convId }] = await as(R, `select respond_to_connection($1, true)`, [req]);
    assert.ok(convId);
    await as(G, `insert into messages (conversation_id, sender_id, body) values ($1, $2, 'Hello')`, [convId, G]);
    await as(R, `insert into messages (conversation_id, sender_id, body) values ($1, $2, 'Hi')`, [convId, R]);
    assert.equal((await as(G2, `select * from messages`)).length, 0, 'outsiders see nothing');
  });

  test("his optional profile is shown only when he deliberately reveals it", async () => {
    await as(G, `insert into giver_profiles (giver_id, bio) values ($1, 'Architect, loves sailing')`, [G]);
    assert.equal((await as(R, `select * from giver_profiles`)).length, 0);
    await denied(as(G2, `insert into profile_reveals (giver_id, receiver_id) values ($1, $2)`, [G2, R]), 'no chat, no reveal');
    await as(G, `insert into profile_reveals (giver_id, receiver_id) values ($1, $2)`, [G, R]);
    assert.equal((await as(R, `select bio from giver_profiles`))[0].bio, 'Architect, loves sailing');
    assert.equal((await as(G2, `select * from giver_profiles where giver_id = $1`, [G])).length, 0);
  });

  test('blocking closes the chat, removes the reveal and hides her profile', async () => {
    await as(R, `insert into blocks (blocker_id, blocked_id) values ($1, $2)`, [R, G]);
    await denied(as(G, `insert into messages (conversation_id, sender_id, body) values ($1, $2, 'Still there?')`, [convId, G]));
    assert.equal((await as(R, `select * from giver_profiles`)).length, 0);
    assert.equal((await as(G, `select * from profiles where id = $1`, [R])).length, 0);
  });
});

describe('staff access and deletion', () => {
  test('staff read private details only with a reason, and it is logged', async () => {
    await denied(as(G, `select * from staff_read_private_details($1, 'curious about her')`, [R]));
    await denied(as(STAFF, `select * from staff_read_private_details($1, 'x')`, [R]));
    const [row] = await as(STAFF, `select legal_name from staff_read_private_details($1, 'Payout verification ticket #42')`, [R]);
    assert.equal(row.legal_name, 'Amelia Legal');
    assert.equal((await server(`select count(*)::int as n from staff_access_log`))[0].n, 1);
  });

  test('deleting an account hides it immediately', async () => {
    await as(G2, `select request_account_deletion()`);
    assert.equal((await as(R, `select * from profiles where id = $1`, [G2])).length, 0);
  });
});
