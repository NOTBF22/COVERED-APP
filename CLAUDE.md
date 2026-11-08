@AGENTS.md

## TYB (Thank You, Baby) — project notes

- Naming: "Thank You, Baby" is the full name, shown on the welcome screen;
  "TYB" is used everywhere else (app icon, tabs, emails, docs). The repo folder is still COVERED-APP.

- Owner is non-technical: explain changes in plain language, keep the README roadmap current.
- Work proceeds in numbered steps (see README "Roadmap"). Mark a step done there when finished.
- `src/types/domain.ts` and `supabase/migrations/` must stay in sync. Add new migrations as
  `NNNN_name.sql`; never edit an applied one.
- Money is integer cents, AUD. Payments always go to the biller, never the recipient.
  Only server code (Edge Functions with the service role) writes `contributions` or moves
  bills to `funded`/`paid`.
- Preview mode (no `.env`) must keep working on `src/data/mock.ts`.
- Design tokens live in `src/theme`; use `<Text variant>` rather than ad-hoc fonts.
- `npx expo install` needs `EXPO_OFFLINE=1` in sandboxed environments without access to api.expo.dev.
- Before finishing: `npx tsc --noEmit` and `npx expo export --platform web` must pass.
