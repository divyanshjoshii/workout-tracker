# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

One person, the owner, logging their own gym sessions on their phone. The app
is installed to the home screen as a PWA and opened between sets, standing in a
gym, often one-handed and in a hurry. No second user is planned.

## Product Purpose

Log a workout while it happens and see strength progress over time. A session
starts from the split day the dashboard suggests (or a template, or freestyle),
sets are logged with supersets, dropsets and a rest timer, and finishing feeds
progress charts and a three-exercise hall of fame. Success is a first screen
that appears at once and logging that never gets in the way of the set.

## Positioning

A personal tracker made for one person's taste. It is not trying to look like
a gym app: its identity is cute and soft where the category is dark, loud and
aggressive.

## Operating Context

- Opened on a phone in a gym, under bright indoor light, and sometimes at night.
- Used in short bursts: tap a set done, type a weight, wait out the rest timer.
- Installed PWA with a service worker that serves the home screen from the
  phone's saved copy.

## Capabilities and Constraints

- Screens: login, dashboard, workout picker and active workout, edit a past
  workout, exercise library and exercise detail with charts, progress, splits,
  settings. A bottom nav links Home, Workout, Exercises, Progress and Settings.
- Next.js 16 App Router on Vercel, Supabase auth and Postgres with RLS,
  Tailwind v4 with shadcn components on Base UI, recharts, dnd-kit.
- Load performance is the standing priority. New dependencies need the owner's
  approval first.
- Signed-in screens can only be checked when the owner signs in themselves.

## Brand Commitments

Set by the owner on 2026-09-13:

- A cute, kawaii look in the spirit of Hello Kitty and phone home-screen widget
  themes: soft rounded tiles, pastel colours, little illustrations.
- Pink is the centre of the palette.
- An original kitty mascot. Sanrio's Hello Kitty itself is not used, because it
  is a trademarked character and the repository is public.
- Cute details on functional pieces, such as a kitty sitting on the clock.
- Motion on press and hover, with slide animations.
- A clear type hierarchy: headings, subheadings and body text look different.
- A light theme and a night theme that follows the phone's setting.
- Nothing that reads as generic AI-generated minimal UI.

## Evidence on Hand

- Real training data lives in Supabase and is only visible when signed in.
- The exercise library (873 exercises with images) is seeded from
  `exercises_v2.sql`.
- App icons: `src/app/icon.png`, `src/app/apple-icon.png`.
- No mascot art, illustrations or brand fonts exist yet.

## Product Principles

1. Logging a set comes first. Decoration never slows a tap or hides a number.
2. Fast on a phone. Anything decorative has to be cheap to load.
3. Made for one person's delight, not for a market.
4. Honest numbers: weights, reps and PRs are always exact and easy to read.
