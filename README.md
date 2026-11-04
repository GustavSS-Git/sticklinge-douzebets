# Sticklinge DouzeBets 🎤

A Eurovision prediction game I made for my friends and family.

**Live:** [douzebets.slanesens.com](https://douzebets.slanesens.com) (the UI is in Swedish)

<!-- Screenshots: add 2–3 images here, e.g. ![Predictions](docs/predictions.png) -->

## About this project

This was my first "vibe-coded" website, built entirely with [Lovable](https://lovable.dev) and [Supabase](https://supabase.com). It shipped with more security issues than I could count. Still, it taught me a lot about how tools like Lovable can turn an idea into something visual and usable in almost no time, and about what they leave for you to check yourself.

> I have built more advanced projects since this one. This repo is kept as an honest record of where I started.

## How the game works

Before the Eurovision final, every player:

1. **Predicts the top 5** countries and **which country finishes last**
2. **Guesses Sweden's final placement** (used as a tiebreaker)
3. **Votes for their 3 personal favourite songs** (just for fun, not scored)

Predictions autosave as drafts and lock automatically at the deadline. After the final, an admin enters the real results, calculates the scores and publishes the scoreboard.

| Rule | Points |
| --- | --- |
| Each predicted top-5 country that actually finished top 5 (any order) | +1 |
| Correct winner | +1 bonus |
| Correct last place | +2 |
| **Tiebreaker:** closest guess of Sweden's placement | n/a |

The maximum score is 8 points.

## Tech stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, React Router
- **Backend:** Supabase
  - **Postgres** with Row Level Security as the main authorisation layer
  - **Auth** with email verification and password reset
  - **Edge Functions** (Deno) for admin actions that need elevated privileges
  - A custom **auth email hook** that renders Swedish emails with React Email
- **Built with:** Lovable (AI app builder), with manual fixes afterwards

## Project structure

```
src/
  pages/            One component per route: Landing, Auth, Predictions, Favourites, Scoreboard, Admin
  components/       App components (layout, country picker, countdown) + shadcn/ui primitives in ui/
  contexts/         AuthContext: session + profile state
  hooks/            Data hooks (countries, settings, lock state)
  integrations/     Supabase client and generated DB types
supabase/
  migrations/       Database schema, RLS policies and DB functions
  functions/
    calculate-scores/   Admin-only: scores all predictions, optionally publishes the scoreboard
    reset-results/      Admin-only: clears scores and unpublishes
    delete-user/        Admin-only: removes a user and their data
    auth-email-hook/    Renders and queues auth emails
    _shared/            Scoring logic, admin check, email templates
```

### Data model

| Table | Purpose |
| --- | --- |
| `profiles` | Nickname and admin flag per user (created by a trigger on signup) |
| `countries` | The finalists for the year |
| `predictions` | Each user's top 5, last place, Sweden guess and calculated points |
| `favourite_votes` | Each user's top 3 favourite songs |
| `actual_results` | The real Eurovision result, entered by the admin |
| `settings` | Deadline, lock switches and whether results are published |

## Security: what went wrong, and what I fixed

Lovable produced a working app quickly, but a later review turned up real problems. All of these are fixed in [`20261104120000_security_hardening.sql`](supabase/migrations/20261104120000_security_hardening.sql) and the edge functions:

| Problem | Fix |
| --- | --- |
| Any user could make themselves admin by updating `is_admin` on their own profile | Column-level grants: users can only update their `nickname` |
| Every logged-in user could read every other user's email address | `email` is no longer readable from `profiles`; admins get it through a `SECURITY DEFINER` function that checks `is_admin()` |
| Anyone with the public anon key could call the score-calculation and reset functions | Shared `requireAdmin()` check in every privileged edge function |
| Users could write their own `calculated_points` | Points are writable only by the server (service role) |
| The prediction deadline was only enforced in the browser | RLS policies check `predictions_open()` / `favourites_open()` on every insert and update |
| Other players' picks and the real results could be read before they were revealed | SELECT policies hide them until the deadline or until results are published |
| Admin rights were granted by a hardcoded email address in the signup trigger | Removed; admin is now assigned manually in the database |

**What I took away:** with Supabase the browser talks directly to the database, so every rule has to live in RLS policies and grants. Hiding a button in the UI protects nothing.

> The `.env` file contains only the Supabase URL and the **anon** key. Both are designed to be public and are shipped to every visitor's browser anyway. Access is controlled by the database policies above.

## Running locally

Requires Node.js 18+.

```sh
npm install
npm run dev     # http://localhost:8080
npm test        # unit tests for the scoring logic
```

To point the app at your own Supabase project, set `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` and `VITE_SUPABASE_PROJECT_ID` in `.env`, then apply the migrations in `supabase/migrations/`.
