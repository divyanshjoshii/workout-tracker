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
- Moved every repository diagram to Mermaid so GitHub draws it, with colours
  taken from `src/app/globals.css` and the app icon. Each diagram paints its own
  dark surfaces so it reads in both GitHub themes. The archify HTML is no longer
  linked, because GitHub shows an HTML file as source rather than a picture.
- Rebuilt the README around the logo, stack badges, a feature table, the
  architecture diagram, and callouts for RLS and the SQL setup order.
- Deleted `dashboard-load-path.html` and its source JSON, with an explicit yes.
  The Mermaid sequence diagram in `architecture.md` covers the same ground.

- Moved exercise search on the two workout screens to the server. Both
  `workout/[id]/page.tsx` and its edit page fetched every column of all 873
  exercises on each load to feed the Add Exercise dialog. That came to about
  840 KB of JSON per page, 560 KB of it instructions text the dialog never
  shows. `ExercisePicker` now asks Supabase itself once opened, filtered by name
  and target muscle, 50 rows at a time, about 11 KB per search.
- The same dialog rendered every match with eagerly loaded thumbnails, so opening
  it on an empty search started around 870 image downloads. It now shows 50, and
  the images load lazily. Kept a plain `img` rather than `next/image`, since the
  thumbnails are on GitHub's servers and optimising them would count against the
  Vercel image quota.
- Those two pages also made four Supabase round trips in sequence. The split
  day's target muscles now come back joined to the session, and the workout's
  exercises load alongside it, so each page makes one round.
- Found that the hall of fame editor from the dashboard fix loads all 873
  exercises into the browser when opened, which `standards.md` says to avoid.
  Left for now and listed in `progress.md`.

## 2026-09-12

- Measured before changing anything and found four separate costs. Vercel ran
  the functions in Washington D.C., its default for new projects, while the
  database is in Seoul. The proxy and then each page asked Supabase Auth over
  the network who the user was. The workout screen loaded each card's history
  through a server action, and Next runs those one at a time. No route had a
  loading state, so a tap froze the old screen until the new one finished.
- Moved the functions to Seoul (`icn1`) in `vercel.json`, beside the database.
  The database region came from matching its address against AWS's published IP
  ranges (`ap-northeast-2`). Each sequential query had been crossing the Pacific.
- Switched the proxy and `requireUser()` from `getUser()` to `getClaims()`. The
  project signs sessions with an ES256 key, so the server now checks the
  signature against a key auth-js caches across requests, with no call to
  Supabase Auth. RLS still verifies the token on every query. In exchange, a
  session revoked on Supabase's side is still accepted until its access token
  expires, at most an hour.
- Moved each exercise card's history lookup from a server action to a browser
  query. The actions had queued behind each other and in front of every other
  button on the screen.
- Added a root `loading.tsx`, so a tapped link shows a skeleton immediately.
- Add Set shows the new row before the insert finishes, using an id made in the
  browser. Edits and deletes to that set wait for the insert, so they can't
  reach the database first.
- The active workout banner stopped looking up the user before its query, since
  RLS already limits the query to their own sessions. It also skips the query on
  the login page and uses `.maybeSingle()`, because `.single()` answered "no
  workout in progress" with a 406 on every navigation.
- Excluded the web app manifest from the proxy, as Next's docs advise for
  metadata files.
- Added `migration_performance.sql`: indexes on the columns policies and queries
  filter on, and every policy recreated with `(select auth.uid())`. A script
  confirmed that undoing the wrap and removing the indexes gives back the
  committed schema exactly. Mirrored both into `supabase_schema.sql`.
- Updated the load path diagram in `architecture.md` and the README flowchart,
  which both showed `requireUser()` calling Supabase Auth on each request.
- Found the app has never had a service worker. `@ducanh2912/next-pwa` is a
  webpack plugin and the project has built with Turbopack since its first
  commit, so no `sw.js` is produced. The app installs from its manifest but has
  no offline cache. Left alone.
- Decided against caching dynamic pages in the client router (`staleTimes`).
  Workout edits go from the browser to Supabase without telling Next, so a
  cached page would show stale sets after going away and coming back.
