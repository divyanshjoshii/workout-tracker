# Progress

_Updated: 2026-09-12_

## Now

Second speed round done: a service worker so the app opens on the phone's copy of
the home screen, full prefetch for the main tabs, and less JavaScript at startup.
It takes effect on the next deploy. The signed-in home screen path has not been
checked on a phone yet, since only the signed-out paths could be tested locally.

## Next

1. After the deploy, on the phone: open the app, close it, and open it again. The
   first open installs the service worker. From the second, the home screen
   should appear at once and update a moment later. Home, Workout, Progress and
   Settings should open without the grey skeleton; Exercises still shows it
   briefly.
2. If not done yet, run `migration_performance.sql`, saving
   `select * from pg_policies where schemaname = 'public'` first.
3. `@ducanh2912/next-pwa` is no longer imported anywhere and can be uninstalled.
   Removing a dependency waits for an explicit yes.
4. Set edits send one write per keystroke, and those writes can land out of
   order, so fast typing can leave an earlier value saved. It's a correctness
   bug, left out of the speed work.
5. The hall of fame editor loads all 873 exercises into the browser when its
   dialog opens, which `standards.md` says to avoid.
6. The heaviest pages are now exercise detail (362 KB gzipped) and Progress
   (321 KB), both because recharts loads with them. Loading the charts on demand
   would be the next cut.

## Done

- Speed, second round: a service worker serving the home screen from the phone,
  full prefetch for the main tabs, the Supabase library off Home's startup, and
  the Exercises and Progress payloads cut
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
