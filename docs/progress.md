# Progress

_Updated: 2026-09-12_

## Now

The load fixes are committed. Two of them only take effect outside the code: the
Seoul region applies on the next Vercel deploy, and `migration_performance.sql`
has to be run by hand in the Supabase SQL editor.

## Next

1. After the push deploys, run `migration_performance.sql`. It replaces policies
   by name, so first save the output of
   `select * from pg_policies where schemaname = 'public'` to compare against
   afterwards. Then open the app signed in and check:
   - Tapping any tab or link shows a grey skeleton straight away.
   - The dashboard loads quickly, and the hall of fame shows real numbers rather
     than zeroes.
   - In a workout, the PR line and last session's numbers appear on each card,
     Add Set adds a row instantly, and Finish doesn't hang.
   - Add Exercise returns results, and typing narrows them.
2. Set edits send one write per keystroke, and those writes can land out of
   order, so fast typing can leave an earlier value saved. It's a correctness
   bug, left out of the speed work.
3. The hall of fame editor loads all 873 exercises into the browser when its
   dialog opens, which `standards.md` says to avoid.
4. There is no service worker. next-pwa doesn't run under Turbopack, so the app
   has never had one. Worth deciding whether offline use matters.
5. Bundle size is still unmeasured. recharts and dnd-kit may or may not be in the
   initial payload.

## Done

- Speed: functions moved beside the database in Seoul, sessions verified locally
  instead of over the network, workout history taken off the server action
  queue, a loading skeleton on every route, instant Add Set, and indexes plus
  faster RLS policies in a migration
- Workout screens: the 840 KB exercise fetch on every load replaced with a
  server-side search in the Add Exercise dialog, thumbnails capped at 50 and
  lazy-loaded, and four sequential round trips cut to one
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
