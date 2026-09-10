# Workout Tracker

A mobile-first PWA for logging gym sessions: splits, templates, supersets,
dropsets, rest timers, body weight, and per-exercise strength progression.

Next.js (App Router) + Supabase (Postgres, Auth, RLS) + Tailwind.

## Setup

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

Then in the Supabase SQL editor, run in order:

1. `supabase_schema.sql` — tables, RLS policies, and the new-user trigger.
2. `exercises_v2.sql` — ~870 exercises seeded from
   [free-exercise-db](https://github.com/yuhonas/free-exercise-db).

```bash
npm install && npm run dev
```

## Layout

| Path | What lives there |
| --- | --- |
| `src/app/` | Routes. `actions.ts` files hold the server actions for that section. |
| `src/components/workout/` | The workout editor: shared types, the `useWorkoutExercises` hook, and the two screens (active and edit) built on it. |
| `src/components/ui/` | shadcn primitives. |
| `src/lib/supabase/` | Browser, server, and proxy clients. `requireUser()` / `requireUserAction()` resolve the signed-in user. |

Access control is enforced by Postgres RLS, not by the app — every table has
policies keyed on `auth.uid()`. `src/proxy.ts` redirects anonymous requests to
`/login` before any page renders.
