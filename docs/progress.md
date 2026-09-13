# Progress

_Updated: 2026-09-13_

## Now

The whole app has a new look: pink gingham, puffy widget tiles, rounded
Japanese display type and an original kitty mascot who watches the pointer.
Every screen was redone, but only the login page could be checked here. The
signed-in screens have only been built and type-checked, not seen.

## Next

1. On the phone, go through every tab: Home, Workout (start one, log a set, rest
   timer, finish), Exercises and an exercise's detail, Progress, Splits and a
   new split, Settings. Note anything that looks off.
2. The new app icon only shows once the app is removed from the home screen and
   added again.
3. Also on the phone: in a workout, add a set, type its weight and reps quickly,
   then reload. Both values and the set should still be there.
4. Find out whether `migration_performance.sql` has run. The eight indexes it
   creates show up in `pg_indexes` if it has. Save
   `select * from pg_policies where schemaname = 'public'` before running it.
5. The hall of fame editor loads all 873 exercises into the browser when its
   dialog opens, which `standards.md` says to avoid.
6. The heaviest pages are exercise detail (365 KB gzipped) and Progress
   (324 KB), both because recharts loads with them. Loading the charts on demand
   would be the next cut.

## Done

- Redesign: strawberry-milk palette with a berry night theme, Mochiy Pop One and
  Zen Maru Gothic, a kitty mascot in four poses who follows the pointer and
  relaxes when it's over her, a sliding dock, spring presses and slide-in hover
  fills, and new app icons
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
