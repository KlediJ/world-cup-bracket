# World Cup Bracket Agent Notes

## Project Purpose

World Cup Bracket is a clean, private prediction game for friends, family, or office pools. The app helps players make World Cup picks, submit an entry, view submitted brackets, and compare against a simple leaderboard.

This is not a gambling app, sportsbook, payment product, or public betting platform. Any optional money pool is handled offline and outside the app.

## Tech Stack

- Next.js with the App Router
- TypeScript
- React
- Tailwind CSS
- ESLint
- Neon Postgres with Drizzle ORM
- `src` directory
- `@/*` import alias
- Client-side React state for prediction flows
- Server actions for submissions and admin actions

## App Structure

- `src/app/layout.tsx`: Root layout, metadata, and shared page chrome.
- `src/app/page.tsx`: Home page.
- `src/app/predict/page.tsx`: Primary public predictor route.
- `src/app/predict/play/page.tsx`: Alternate predictor entry route using the same predictor.
- `src/app/bracket/page.tsx`: Parked classic bracket route.
- `src/app/leaderboard/page.tsx`: Database-backed leaderboard route.
- `src/app/submission/[id]/page.tsx`: Read-only submitted bracket view.
- `src/app/admin/page.tsx`: Admin submission manager.
- `src/app/*/actions.ts`: Server actions for submissions and admin changes.
- `src/components/`: Shared UI components and the main predictor/bracket views.
- `src/data/`: Static tournament, team, home, and widget data.
- `src/db/`: Neon/Drizzle client, schema, queries, and SQL migrations.
- `src/lib/`: Shared helpers such as scoring constants and score calculation.
- `src/types/`: Shared TypeScript types.

## Current Product Scope

The current version supports:

- Home page with hero art, countdown, and call to action.
- Swipe-style match predictor as the main public entry flow.
- Group-stage match picks that generate calculated group tables.
- Knockout-stage winner picks built from the predicted group tables.
- Review and submit flow for predictor entries.
- Local draft persistence for the predictor flow, so refreshes do not wipe an in-progress entry.
- Optional player email, with duplicate prevention when an email is provided.
- Optional server-side submission deadline via `PREDICTION_DEADLINE`.
- Neon-backed persistence for players, pools, brackets, and predictor payloads.
- Leaderboard with rank, player, points, entry type, champion pick, status, and submission links.
- Read-only submission pages that render predictor and classic bracket data.
- Submission pages include copy/share controls.
- Admin page for reviewing, searching, opening, and deleting submissions.
- Rules page that displays scoring values from `src/lib/scoring.ts`.

The classic bracket builder still exists in `src/components/BracketBuilder.tsx` and the classic submit action still exists, but `/bracket` is intentionally parked. Do not route users back to the classic bracket unless the product direction changes.

## Current Limitations

- Submitted entries currently start with `points = 0`; real scoring is not wired into submission or admin workflows yet.
- `src/lib/scoring.ts` contains scoring helpers, but there is no completed results-entry/scoring pipeline.
- Admin authentication is a simple password cookie flow using `ADMIN_PASSWORD`.
- Optional-email submissions are allowed; anonymous entries receive generated `@local.invalid` emails and are not deduplicated by person.
- Tournament data is static in `src/data`; verify externally before treating teams, groups, match dates, or venues as final.
- The knockout path is a simplified UX model and may need refinement against official advancement/bracket rules.

## Coding Conventions

- Prefer small, obvious components.
- Use TypeScript types for shared data structures.
- Keep tournament data in `src/data`.
- Keep scoring values and score calculation in `src/lib/scoring.ts`.
- Keep database shape in `src/db/schema.ts` and migrations in `src/db/migrations`.
- Use readable Tailwind utility classes.
- Use `Link` for internal navigation.
- Avoid clever abstractions until repeated patterns need them.
- Keep copy direct, casual, and non-betting-oriented.
- Preserve the predictor as the primary user flow unless asked otherwise.

## Database And Migrations

- `DATABASE_URL` is required for database-backed routes and server actions.
- `ADMIN_PASSWORD` is required for admin login.
- `PREDICTION_DEADLINE` is optional and closes predictor submissions after the configured date/time.
- Local setup uses `.env.local`; `.env.example` shows the expected variable.
- Run migrations with `npm run db:migrate`.
- Migrations are plain SQL files in `src/db/migrations` and are applied in sorted filename order.
- Queries should tolerate missing `DATABASE_URL` where the current code already does so, especially leaderboard-style reads.

## Deployment Flow

The deployment flow stays simple:

1. Commit locally with git.
2. Push to GitHub using GitHub CLI.
3. Connect the GitHub repo to Vercel from the Vercel website.
4. Configure `DATABASE_URL` in Vercel.
5. Run or apply database migrations for the Neon database.
6. Deploy from Vercel.
7. Test the live URL, submission flow, leaderboard, submission detail pages, and admin page.
8. Share the link with friends.

Do not configure Vercel CLI for this phase unless explicitly requested.

Do not describe local browser storage as product behavior. Current persistence is Neon-backed.

## What Not To Overbuild

Do not add these unless explicitly requested:

- Public authentication/accounts
- Payments
- Email sending
- Underdog bonuses
- Public betting language
- Casino styling
- Complex animations
- Real-time scoring
- Full results management workflow
- Broad tournament-rule rewrites without verifying the official current rules
