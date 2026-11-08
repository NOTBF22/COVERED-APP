# TYB — Thank You, Baby

A private, gift-first platform for adults. Women create photo-led profiles and
can list gifts, bills or expenses they'd like covered. Men browse discreetly
and send gifts through TYB.

**TYB is the payment intermediary.** The giver pays TYB; TYB records the
payment and deducts a clearly disclosed platform fee; TYB pays the rest to the
receiver's verified payout account. Neither side ever sees the other's legal,
bank, bill-account or payment details. A gift lets a man *ask* to connect — it
never guarantees a reply, a chat or anything else.

Built with Expo (React Native + TypeScript), Expo Router and Supabase.
Live preview: https://notbf22.github.io/TYB/

## Run it

```bash
npm install
npx expo start        # press i (iOS sim), a (Android) or w (web)
npm run test:db       # check the database enforces the product rules
```

With no `.env` the app runs in **preview mode** on sample profiles. Every gift
in preview is a test record — no real money moves.

To connect a backend: create a Supabase project, run
`supabase/migrations/0001_init.sql` in its SQL editor, then copy
`.env.example` to `.env` and paste in the project URL and anon key.

## Project layout

```
src/
  app/                 screens (Expo Router — every file is a route)
    (auth)/welcome     landing + "send gifts" / "receive gifts"
    (tabs)/discover    givers: one profile at a time — Pass / Send a gift / Save
    (tabs)/requests    receivers: their gift, bill and expense requests
    (tabs)/gifts       gift history with separate payment and payout statuses
    (tabs)/profile     account, what others see vs what only TYB knows
  components/          Text, Button, Screen, ProfileCard, RequestRow, GiftRow…
  theme/               colours, fonts, spacing — change the look here
  types/domain.ts      data model (matches the SQL schema)
  data/mock.ts         fictional sample data for preview mode
  lib/                 Supabase client, formatting
  providers/           auth/session state
supabase/
  migrations/          database schema + privacy and safety rules
  tests/               automated acceptance checks (run on every push)
```

## Roadmap

| Step | What | Status |
| --- | --- | --- |
| 1 | Foundation — app shell, navigation, design system, website | ✅ Done |
| 2 | Product rules — new data model, privacy, payments/payouts/ledger, connections and chat rules, acceptance tests; welcome and roles; sample data | ✅ Done |
| 3 | Receiver profile setup and gift/bill/expense requests; giver private-account setup; verification flow | Next |
| 4 | Checkout (amount + TYB fee = total), mock payment provider layer, confirmation, gift & payout history | |
| 5 | Connection request inbox, chat after acceptance, optional giver profile reveal | |
| 6 | Privacy settings, block/report, account deletion, support | |
| 7 | Real payment & verification providers, real sign-in, App Store | |

## Rules the database enforces (see `supabase/tests`)

- Everyone is 18+ and verified before they can browse, appear or gift.
- Givers have no public profile; an optional one is shown only when he chooses, inside an open chat.
- Receivers see a giver's display name only after he has gifted her.
- Legal names, birthdates, contact details, bill evidence and payout accounts are never readable by the other user.
- Payments, payouts and the ledger are written only by TYB's server; the ledger is append-only.
- A gift covers a request in full (he may add more); a request can be gifted once.
- Givers see amount, fee and total; receivers see only their amount and payout status.
- "Paid" (payment succeeded) and "Paid out" (reached her account) are separate.
- No message or connection request before a paid gift; one waiting request at a time; a new gift allows a new request.
- Chat opens only when she accepts. She keeps every gift whether or not she replies.
- Blocking closes chats, cancels pending requests and removes reveals.
- Staff can read private details only with a stated reason, and every access is logged.
- The platform fee, payout timing, refund window and request expiry are settings, not hard-coded. The fee starts unset.

## Before real money moves

- A payment provider must approve the business model and flow (mainstream providers often restrict gifting/companionship platforms).
- Ask an Australian lawyer/accountant whether TYB needs AUSTRAC registration as a remittance provider, and about GST on the fee and obligations in other countries.
- Payments stay in test/mock mode until then.
