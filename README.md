# TYB — Thank You, Baby

A Hinge-style app where supporters browse verified profiles and cover real
bills for the people behind them. Payments go **directly to the biller**
(landlord, energy company, childcare) — never to the person — with TYB
acting as the middleman.

Built with Expo (React Native + TypeScript), Expo Router and Supabase.

## Run it

```bash
npm install
npx expo start        # press i (iOS sim), a (Android) or w (web)
```

On your iPhone, install **Expo Go** and scan the QR code. With no `.env` the
app runs in **preview mode** on sample profiles, so you can click through
everything before the backend exists.

To connect a backend: create a Supabase project, run
`supabase/migrations/0001_init.sql` in its SQL editor, then copy
`.env.example` to `.env` and paste in the project URL and anon key.

## Project layout

```
src/
  app/                 screens (Expo Router — every file is a route)
    (auth)/welcome     landing + role choice
    (tabs)/discover    supporter deck: one profile at a time, Pass / Cover
    (tabs)/bills       recipient's bills
    (tabs)/activity    contribution history
    (tabs)/profile     account
  components/          Text, Button, Screen, ProfileCard, BillRow, Photo…
  theme/               colours, fonts, spacing — change the look here
  types/domain.ts      data model (matches the SQL schema)
  data/mock.ts         fictional sample data for preview mode
  lib/                 Supabase client, formatting
  providers/           auth/session state
supabase/migrations/   database schema + security rules
```

## Roadmap

| Step | What | Status |
| --- | --- | --- |
| 1 | **Foundation** — app shell, navigation, design system, data model, DB schema with row-level security | ✅ Done |
| 2 | **Accounts & profiles** — Supabase Auth (email + Sign in with Apple), 18+ date of birth, onboarding, photo upload, prompts | Next |
| 3 | **Bills & verification** — recipients add bills with an uploaded invoice; review queue; ID/selfie verification for recipients | |
| 4 | **Payments** — Stripe checkout for supporters; Edge Function writes contributions; payout to biller (BPAY/bank); receipts | |
| 5 | **Trust & safety** — report/block, admin dashboard, rate limits, fraud checks | |
| 6 | **Polish & launch** — swipe gestures/animations, push notifications, App Store build via EAS, privacy policy & terms | |

## Built-in rules (enforced by the database, not just the app)

- Accounts must be 18+.
- Bills only appear to supporters after review.
- Biller payout details are never readable by the app.
- Only the server can record payments or mark bills funded/paid.
- Anyone can be reported or blocked.

## Before real money moves

Get advice from an Australian lawyer/accountant on: holding and passing on
other people's money (AFSL / AUSTRAC obligations), whether "charity" framing
triggers ACNC or state fundraising rules, GST on the platform fee, and Apple's
App Store rules for payments and dating-adjacent apps.
