<div align="center">

<img src="src/app/icon.png" width="88" alt="Workout Tracker logo">

# Workout Tracker

A mobile-first PWA for logging gym sessions: splits, templates, supersets,
dropsets, rest timers, body weight, and per-exercise strength progression.

![Next.js](https://img.shields.io/badge/Next.js-16.2-FF9EC4?style=flat-square&logo=nextdotjs&logoColor=white&labelColor=43222F)
![React](https://img.shields.io/badge/React-19.2-FF9EC4?style=flat-square&logo=react&logoColor=white&labelColor=43222F)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20RLS-FF9EC4?style=flat-square&logo=supabase&logoColor=white&labelColor=43222F)
![TypeScript](https://img.shields.io/badge/TypeScript-5-FF9EC4?style=flat-square&logo=typescript&logoColor=white&labelColor=43222F)
![Tailwind](https://img.shields.io/badge/Tailwind-4-FF9EC4?style=flat-square&logo=tailwindcss&logoColor=white&labelColor=43222F)
![Vercel](https://img.shields.io/badge/Vercel-deployed-FF9EC4?style=flat-square&logo=vercel&logoColor=white&labelColor=43222F)
![PWA](https://img.shields.io/badge/PWA-installable-FF9EC4?style=flat-square&logo=pwa&logoColor=white&labelColor=43222F)

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
%%{init: {"theme":"base","themeVariables":{"background":"#FFFFFF","primaryColor":"#FFFFFF","primaryTextColor":"#43222F","primaryBorderColor":"#FF9EC4","lineColor":"#FF9EC4","secondaryColor":"#FFF3F8","tertiaryColor":"#FFFFFF","textColor":"#43222F","edgeLabelBackground":"#FFFFFF","clusterBkg":"#FFFFFF","clusterBorder":"#D9D3D5","titleColor":"#43222F","rowOdd":"#FFFFFF","rowEven":"#F4F2F3","attributeBackgroundColorOdd":"#FFFFFF","attributeBackgroundColorEven":"#F4F2F3","actorBkg":"#FFFFFF","actorBorder":"#FF9EC4","actorTextColor":"#43222F","actorLineColor":"#AA9CA1","signalColor":"#FF9EC4","signalTextColor":"#43222F","labelBoxBkgColor":"#FFFFFF","labelBoxBorderColor":"#FF9EC4","labelTextColor":"#43222F","loopTextColor":"#43222F","noteBkgColor":"#FFF0F6","noteTextColor":"#43222F","noteBorderColor":"#FF9EC4","activationBkgColor":"#FF9EC4","activationBorderColor":"#FF9EC4"}}}%%
%% palette 24b50cd8
flowchart LR
    subgraph device ["Your phone"]
        PWA["Installed PWA"]
        SW["Service worker"]
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

    PWA -->|every request| SW
    SW -->|saved home screen| PWA
    SW -->|everything else| Proxy
    Proxy -->|signed in| Pages
    Proxy -->|form submit| Actions
    Pages -.->|signing key, cached| Auth
    Pages -->|reads, in parallel| DB
    Actions -->|writes| DB

    classDef phone fill:#E5EFF8,stroke:#5B9BD5,color:#43222F
    classDef server fill:#FFEFF6,stroke:#FF9EC4,color:#43222F
    classDef auth fill:#FBE4ED,stroke:#E8588F,color:#43222F
    classDef db fill:#FAF1DE,stroke:#E0A92E,color:#43222F
    class PWA,SW phone
    class Proxy,Pages,Actions server
    class Auth auth
    class DB db
    style device fill:#FFFFFF,stroke:#5B9BD5,color:#43222F
    style vercel fill:#FFFFFF,stroke:#FF9EC4,color:#43222F
    style supa fill:#FFFFFF,stroke:#E0A92E,color:#43222F
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
| `public/sw.js` | Service worker. Keeps the build files on the phone and serves the last home screen while a fresh one loads. |

## Docs

| File | Covers |
|---|---|
| [`overview.md`](docs/overview.md) | What this is for, and what a normal session looks like |
| [`architecture.md`](docs/architecture.md) | Stack, data model, load path, workout lifecycle, and past decisions |
| [`standards.md`](docs/standards.md) | How code and prose are written here |
| [`progress.md`](docs/progress.md) | Where things stand right now |
| [`changes.md`](docs/changes.md) | Why things changed, in order |
