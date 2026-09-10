# Change register

## 2026-09-11

- Set up groundwork notes. Kept the existing `@AGENTS.md` import at the top of
  `CLAUDE.md` rather than replacing the file, because `AGENTS.md` carries a
  tool-managed block that would regenerate over anything written into it.
- Recorded load performance as the current priority, ahead of any new feature.
- Decided against changing the stack before the slow load is diagnosed. Reasons
  in `architecture.md`.
- Handoffs gitignored. The repository is public.

- Diagnosed the 20 second dashboard load. The cause was nine sequential Supabase
  round trips in `src/app/page.tsx`, plus an 870 row exercise fetch on every
  render and an unbounded three table join for hall of fame records. Fixed all
  three. Details and the reasoning are in `architecture.md`.
- Decided against the bundle size theory for now. It was never needed to explain
  the delay and remains unmeasured.
- Added `dashboard-load-path.html` as an interactive sequence diagram of the
  three query rounds, with its source JSON beside it so it can be regenerated.
