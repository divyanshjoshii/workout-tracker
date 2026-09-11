<div align="center">

<img src="src/app/icon.png" width="88" alt="Workout Tracker logo">

# Workout Tracker

A mobile-first PWA for logging gym sessions: splits, templates, supersets,
dropsets, rest timers, body weight, and per-exercise strength progression.

![Next.js](https://img.shields.io/badge/Next.js-16.2-22C55E?style=flat-square&logo=nextdotjs&logoColor=white&labelColor=0B0F14)
![React](https://img.shields.io/badge/React-19.2-22C55E?style=flat-square&logo=react&logoColor=white&labelColor=0B0F14)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20RLS-22C55E?style=flat-square&logo=supabase&logoColor=white&labelColor=0B0F14)
![TypeScript](https://img.shields.io/badge/TypeScript-5-22C55E?style=flat-square&logo=typescript&logoColor=white&labelColor=0B0F14)
![Tailwind](https://img.shields.io/badge/Tailwind-4-22C55E?style=flat-square&logo=tailwindcss&logoColor=white&labelColor=0B0F14)
![Vercel](https://img.shields.io/badge/Vercel-deployed-22C55E?style=flat-square&logo=vercel&logoColor=white&labelColor=0B0F14)
![PWA](https://img.shields.io/badge/PWA-installable-22C55E?style=flat-square&logo=pwa&logoColor=white&labelColor=0B0F14)

</div>

## What it does

| | |
|---|---|
| **Splits** | A weekly rotation. The dashboard works out which day comes next from what you did last. |
| **Templates** | Saved workouts. Link one to a split day and start straight from it. |
| **Supersets and dropsets** | Pair exercises or chain drop sets inside a session. |
| **Rest timer** | A custom timer between sets. |
| **Body weight** | Log it daily and watch the trend. |
| **Strength progression** | Per-exercise charts, with PRs calculated from estimated one-rep max. |
| **Hall of fame** | Pin up to three lifts to the dashboard with your heaviest set. |
| **CSV export** | Every session and set, out as a spreadsheet. |

## How it fits together

Next.js App Router on Vercel, with Supabase for auth and Postgres.

<!-- Diagram colours come from src/app/globals.css and the app icon. Keep them in sync. -->

```mermaid
%%{init: {"theme": "base", "themeVariables": {"background": "#0B0F14", "primaryColor": "#151A21", "primaryTextColor": "#F8FAFC", "primaryBorderColor": "#22C55E", "lineColor": "#22C55E", "secondaryColor": "#1E293B", "tertiaryColor": "#0B0F14", "textColor": "#F8FAFC", "edgeLabelBackground": "#0B0F14", "clusterBkg": "#0B0F14", "clusterBorder": "#1E293B", "titleColor": "#F8FAFC"}}}%%
flowchart LR
    subgraph device ["Your phone"]
        PWA["Installed PWA"]
    end
    subgraph vercel ["Vercel"]
        Proxy["proxy.ts<br/>sends signed out users to /login"]
        Pages["Server components<br/>dashboard, workouts, progress"]
        Actions["Server actions<br/>save sets, splits, templates"]
    end
    subgraph supa ["Supabase"]
        Auth["Auth<br/>session"]
        DB[("Postgres<br/>RLS on every table")]
    end

    PWA -->|every request| Proxy
    Proxy -->|signed in| Pages
    Proxy -->|form submit| Actions
    Pages -.->|requireUser| Auth
    Pages -->|reads, in parallel| DB
    Actions -->|writes| DB

    classDef phone fill:#0E1E2C,stroke:#38BDF8,color:#F8FAFC
    classDef server fill:#10241A,stroke:#22C55E,color:#F8FAFC
    classDef auth fill:#2A1020,stroke:#EC4899,color:#F8FAFC
    classDef db fill:#1C162E,stroke:#8B5CF6,color:#F8FAFC
    class PWA phone
    class Proxy,Pages,Actions server
    class Auth auth
    class DB db
    style device fill:#0B0F14,stroke:#38BDF8,color:#38BDF8
    style vercel fill:#0B0F14,stroke:#22C55E,color:#22C55E
    style supa fill:#0B0F14,stroke:#8B5CF6,color:#8B5CF6
```

> [!NOTE]
> Access control lives in Postgres, not in the app. Every table has RLS policies
> keyed on `auth.uid()`. The Supabase anon key is public by design, which is why
> those policies are the part that actually protects the data.

The data model, the dashboard load path and the workout lifecycle each have a
diagram in [`docs/architecture.md`](docs/architecture.md).

## Setup

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

> [!IMPORTANT]
> Run the SQL files in the Supabase SQL editor in this order. The seed depends on
> the tables existing.
>
> 1. `supabase_schema.sql` creates the tables, RLS policies and the new-user trigger.
> 2. `exercises_v2.sql` seeds about 870 exercises from
>    [free-exercise-db](https://github.com/yuhonas/free-exercise-db).

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
| `src/proxy.ts` | Redirects anonymous requests to `/login` before any page renders. |

## Docs

| File | Covers |
|---|---|
| [`overview.md`](docs/overview.md) | What this is for, and what a normal session looks like |
| [`architecture.md`](docs/architecture.md) | Stack, data model, load path, workout lifecycle, and past decisions |
| [`standards.md`](docs/standards.md) | How code and prose are written here |
| [`progress.md`](docs/progress.md) | Where things stand right now |
| [`changes.md`](docs/changes.md) | Why things changed, in order |
