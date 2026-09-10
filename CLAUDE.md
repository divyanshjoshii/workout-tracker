@AGENTS.md

# Workout Tracker

Mobile-first PWA for logging gym sessions. Solo user.
Deployed on Vercel, data in Supabase.

## Ask me first

- `git push`
- Installing a new dependency

## Never

- Delete a file
- Read or write `.env.local`

## Always

- Row Level Security is the security boundary. The Supabase anon key is
  public by design, so RLS is the only thing protecting the data. Never
  disable or weaken it.
- Changing `supabase_schema.sql`, `exercises_v2.sql` or any migration
  changes who can read what. Treat them as security-sensitive.
- Load performance is the current priority. Prefer the faster option
  where there is a choice, and say what a change costs.

## Project notes

| File | Read it when |
|---|---|
| `docs/overview.md` | you need to know what this is for |
| `docs/architecture.md` | before structural or dependency changes |
| `docs/standards.md` | before writing or reviewing code |
| `docs/progress.md` | starting a work session |
| `docs/changes.md` | you need the history behind a decision |

## Sessions

- At session start, read `docs/progress.md` and the newest handoff.
- Handoffs go in `docs/handoffs/`, named `YYYY-MM-DD-HHMM-topic.md`.
  Gitignored.
- When a task completes, update `docs/progress.md` and append to
  `docs/changes.md`.

## Writing

Human-facing prose follows `docs/standards.md`. Rules and config stay terse.
