# Standards

## Conventions

- Minimal. No speculative abstraction, no flexibility built for a user who does
  not exist yet. A ponytail audit already cut around a thousand lines from this
  codebase, so keep it that way.
- Prefer the faster option where there is a genuine choice, and say what a change
  costs when it is not obvious.
- Formatting is ESLint's job via `eslint.config.mjs`. No formatting rules here.

## Avoid

- Adding a dependency to solve something small
- Loading heavy libraries in the initial bundle when they can load lazily
- Pulling the full exercise list client-side

## Testing

There is no test framework and no `test` script. This is a gap rather than a
decision, so nothing is blocked on tests today. Say so plainly rather than
pretending coverage exists.

## Commits and branches

Lowercase, conventional prefixes, specific about what changed. Matching what is
already in the log:

```
fix: use E1RM for PR calculations and charting
chore: remove redundant set type dropdown and rename superset link button
```

Push needs asking first.

## Prose

Applies to human-facing text only: README, commit messages, PR descriptions,
docs. Rules files and config stay terse and are exempt.

- Voice: plain and direct. Say what changed and why. No marketing tone.
- Avoid: words like seamless, powerful, robust, leverage.

Invoke the `humanizer` skill when drafting or reviewing any of the above.

## Security

Repository is **public**.

- Secrets live in `.env.local`, which is gitignored. Never read or write it.
- Row Level Security is the security boundary, not the anon key. The anon key is
  public by design.
- The `.sql` files define that boundary. Changing them changes who can read what.
- New dependencies need approval before being added.

Run `/security-review` before a commit or pull request.

## What gets committed

Handoffs in `docs/handoffs/` are gitignored. The repository is public and
handoffs hold raw session state.

Every other file in `docs/` is committed.
