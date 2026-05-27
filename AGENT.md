# World Cup Bracket Agent Notes

## Project Purpose

World Cup Bracket is a clean, private prediction game for friends, family, or office pools. The app helps players fill out a tournament bracket, review their picks, save them locally, and compare against a simple leaderboard.

This is not a gambling app, sportsbook, payment product, or public betting platform. Any optional money pool is handled offline and outside the app.

## Tech Stack

- Next.js with the App Router
- TypeScript
- React
- Tailwind CSS
- ESLint
- `src` directory
- `@/*` import alias
- Local React state for the first version

## App Structure

- `src/app/layout.tsx`: Root layout, metadata, and shared page chrome.
- `src/app/page.tsx`: Home page.
- `src/app/bracket/page.tsx`: Bracket creation route.
- `src/app/leaderboard/page.tsx`: Mock leaderboard route.
- `src/app/rules/page.tsx`: Scoring rules route.
- `src/components/`: Shared UI components.
- `src/data/`: Static placeholder tournament and leaderboard data.
- `src/lib/`: Shared helpers such as scoring constants.
- `src/types/`: Shared TypeScript types.

## Build Approach

Build the first usable version before adding infrastructure. Keep the product easy to explain in a walkthrough:

1. Static routes first.
2. Clear data shapes second.
3. Simple client-side bracket state third.
4. Local save/submit behavior before adding any backend.
5. Keep each page presentable throughout the build.

## Current Product Scope

The first version supports:

- Home page with plain-language positioning and calls to action.
- Bracket page where a player enters their name.
- Group-stage winner and runner-up predictions.
- Knockout-stage winner predictions.
- Review section before saving.
- Local browser save using `localStorage`.
- Mock leaderboard with rank, player, score, champion pick, and status.
- Rules page with the scoring table.

The 2026 World Cup has 48 teams. This first version intentionally uses a simplified 32-team, 8-group model so the bracket is understandable and usable quickly. The data and types are structured so the tournament can be expanded later.

## Coding Conventions

- Prefer small, obvious components.
- Use TypeScript types for shared data structures.
- Keep placeholder data in `src/data`.
- Keep scoring values in `src/lib/scoring.ts`.
- Use readable Tailwind utility classes.
- Use `Link` for internal navigation.
- Avoid clever abstractions until repeated patterns need them.
- Keep copy direct, casual, and non-betting-oriented.

## Deployment Flow

The deployment flow stays simple:

1. Commit locally with git.
2. Push to GitHub using GitHub CLI.
3. Connect the GitHub repo to Vercel from the Vercel website.
4. Deploy from Vercel.
5. Test the live URL.
6. Share the link with friends.

Do not configure Vercel CLI for this phase.

## What Not To Overbuild

Do not add these yet:

- Authentication
- Database
- Payments
- Email
- Admin panels
- Exact score bonuses
- Underdog bonuses
- Public betting language
- Casino styling
- Complex animations
- Full 48-team tournament logic
- Real-time scoring
