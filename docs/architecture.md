# Architecture

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js, App Router | Server components and Vercel deployment |
| Data and auth | Supabase (Postgres, RLS) | Managed Postgres with auth attached |
| Styling | Tailwind and shadcn | Component primitives without a heavy UI library |
| Charts | recharts | Strength progression graphs |
| Drag and drop | dnd-kit | Template arrangement |
| Offline | `@ducanh2912/next-pwa` | Installable on a phone |

## Shape

| Path | What lives there |
|---|---|
| `src/app/` | Routes, server actions, page-level clients |
| `src/components/` | Shared and feature components |
| `src/lib/` | Supabase clients and helpers |
| `src/types/` | Shared types |
| `*.sql` | Schema, RLS policies, and the exercise seed |

## Platform constraints

**Vercel.** Serverless, so there is no persistent filesystem and nothing can be
cached on disk between requests. The build has to pass or nothing ships.

**Supabase.** The anon key is `NEXT_PUBLIC_` and therefore visible to anyone who
opens the site. Row Level Security is what actually protects the data, which
makes the policies in `supabase_schema.sql` part of the security boundary rather
than just schema.

## Decisions

### 2026-09-11: keep the stack, find the real cause of the slow load

**Chose:** Diagnose the 20 second load before changing any of the stack.

**Because:** Next.js and Supabase both serve fast apps routinely. A load time
that bad points at something specific in this codebase, and swapping the stack
would cost weeks while probably carrying the same bug across.

**Rejected:** Replacing the framework or the database. No evidence yet that
either is the problem.

### 2026-09-11: what the slow load turned out to be

Reading `src/app/page.tsx` settled it. The dashboard is a server component that
made **nine sequential round trips** to Supabase before rendering anything, with
no `Promise.all` in the file. Every route is `ƒ` dynamic, so this ran on every
single load with nothing cached.

Two queries were independently expensive. One pulled all roughly 870 exercises
on every render to feed an editor dialog that shows 50 at a time and may never
be opened. The other joined `exercises` to `workout_exercises` to `workout_sets`
with no limit, pulling every set ever recorded and sorting in JavaScript to find
one maximum. That second one gets worse the longer the training history is.

**Fixed by:** collapsing the independent queries into `Promise.all`, which took
nine round trips down to three. The exercise list now loads when the dialog
opens. Each hall of fame entry asks for its single heaviest set with `order` and
`limit(1)`.

The bundle-size theory was never tested and remains open. It was not needed to
explain the delay.

## Load path

`dashboard-load-path.html` in this directory is an interactive sequence diagram
of the three rounds, showing which queries run together and which have to wait.
Open it in a browser. `dashboard-load-path.json` is its source, so the diagram
can be regenerated when the load path changes.
