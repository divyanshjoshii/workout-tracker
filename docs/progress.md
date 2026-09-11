# Progress

_Updated: 2026-09-11_

## Now

The dashboard load fix is pushed and deploying. It has not been checked against
real data yet.

## Next

1. Open the deployed dashboard. Confirm it feels faster, and confirm the hall of
   fame still shows real numbers rather than zeroes. That query was rewritten and
   has never run against actual rows.
2. `workout/[id]/page.tsx` and `workout/[id]/edit/page.tsx` both still fetch all
   roughly 870 exercises server side to feed `ExercisePicker`. Same pattern as the
   dashboard had, two more routes.
3. Bundle size is still unmeasured. recharts and dnd-kit may or may not be in the
   initial payload. This was never needed to explain the 20 seconds.

## Done

- README and docs rebuilt around themed Mermaid diagrams: architecture, data
  model, load path, workout lifecycle and a normal session, all in the app's
  own colours, plus stack badges and callouts
- Dashboard load: nine sequential Supabase round trips cut to three, the 870 row
  exercise fetch moved behind the editor dialog, and the unbounded set join
  replaced with one row per hall of fame entry
- Ponytail audit, roughly 1000 lines cut
- Logout, CSV export and the duplicate-account login trap fixed
- E1RM used for PR calculations and charting
- Explicit superset linking, template drag-and-drop, custom rest timer

## Blocked

Nothing.
