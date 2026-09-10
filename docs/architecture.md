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

**Candidates to check, in rough order of likelihood:**

1. `exercises_v2.sql` seeds roughly 870 exercises. Any page pulling that list
   client-side without pagination would explain the delay on its own.
2. Supabase queries running one after another instead of in parallel.
3. recharts and dnd-kit are both heavy. If they sit in the initial bundle
   rather than loading lazily, that is a large cost on mobile.
4. Vercel cold starts, which are real but nowhere near 20 seconds.

None of these is confirmed. Each one still needs measuring before anything
gets changed on the strength of it.
