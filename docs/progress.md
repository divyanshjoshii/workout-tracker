# Progress

_Updated: 2026-09-13_

## Now

Set edits save the value you typed last. Fast typing used to send one write per
key, and those could land in any order. Adding a set and editing it straight
away could also make it vanish from the screen, or bring back one you had just
deleted. It takes effect on the next deploy.

## Next

1. After the deploy, on the phone: in a workout, add a set, type its weight and
   reps quickly, then reload. Both values and the set should still be there.
   Delete a set right after adding it, reload, and it should stay gone.
2. Find out whether `migration_performance.sql` has run. The eight indexes it
   creates show up in `pg_indexes` if it has. Save
   `select * from pg_policies where schemaname = 'public'` before running it.
3. The hall of fame editor loads all 873 exercises into the browser when its
   dialog opens, which `standards.md` says to avoid.
4. The heaviest pages are now exercise detail (362 KB gzipped) and Progress
   (321 KB), both because recharts loads with them. Loading the charts on demand
   would be the next cut.

## Done

- Set edits: writes to a set go out one at a time, keys typed while one is on
  its way are merged into the next, and a new set's insert is sent once, not
  again on every keystroke
- Removed `@ducanh2912/next-pwa`, which nothing imported
- Speed, second round: a service worker serving the home screen from the phone,
  full prefetch for the main tabs, the Supabase library off Home's startup, and
  the Exercises and Progress payloads cut. Confirmed on the phone: the home
  screen appears at once from the second open.
- Speed: functions moved beside the database in Seoul, sessions verified locally
  instead of over the network, workout history taken off the server action
  queue, a loading skeleton on every route, instant Add Set, and indexes plus
  faster RLS policies in a migration. Confirmed on the phone: 20 to 30 seconds
  down to about two.
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
