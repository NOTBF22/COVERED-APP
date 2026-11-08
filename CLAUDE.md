@AGENTS.md

## TYB (Thank You, Baby) — project notes

- Naming: "Thank You, Baby" is the full name, shown on the welcome screen;
  "TYB" is used everywhere else (app icon, tabs, emails, docs). Repo: NOTBF22/TYB; website: https://notbf22.github.io/TYB/

- Owner is non-technical: explain changes in plain language, keep the README roadmap current.
- Work proceeds in numbered steps (see README "Roadmap"). Mark a step done there when finished.
- `src/types/domain.ts` and `supabase/migrations/` must stay in sync. Add new migrations as
  `NNNN_name.sql`; never edit an applied one.
- Product rules: the owner's spec is summarised in README ("What the app is", "Rules the
  database enforces"). Roles are `giver` / `receiver` (sign-up: "send gifts" / "receive gifts").
- Money is integer minor units + ISO currency. Giver pays TYB → TYB records charge and fee in
  the append-only ledger → TYB pays the net amount to the receiver's verified payout account.
  Never user-to-user transfers, no wallets/balances. Only server code (Edge Functions with the
  service role) writes `gifts`, `payouts` and `ledger_entries`; the app reads the
  `my_gifts_sent` / `my_gifts_received` views. Payment status and payout status are separate.
- Never invent fees, payout timing, refund rules or expiry: they live in `platform_settings`
  (null = not configured). Payments are mock/test until a provider approves; label them so.
- Never describe TYB as a charity or gifts as donations. Never imply a gift buys access.
- Every product rule change needs a matching test in `supabase/tests/acceptance.test.mjs`
  (`npm run test:db`; also runs in CI). Select explicit columns — some tables use column grants.
- Preview mode (no `.env`) must keep working on `src/data/mock.ts`.
- Design tokens live in `src/theme`; use `<Text variant>` rather than ad-hoc fonts.
- `npx expo install` needs `EXPO_OFFLINE=1` in sandboxed environments without access to api.expo.dev.
- Before finishing: `npx tsc --noEmit`, `npm run test:db` and `npx expo export --platform web` must pass.
