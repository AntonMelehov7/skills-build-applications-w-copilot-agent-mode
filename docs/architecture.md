# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Keep route-specific rendering and interaction in React components, and use the shared API client for relative `/api` requests. Components own loading, empty, and accessible error states; they do not calculate business results.
- Logic tier decision: Implement API behavior in the backend service layer and keep routes responsible for HTTP status codes and response envelopes. Validate request data at the service boundary and return deliberate 4xx responses for invalid or missing resources.
- Data tier decision: Use Mongoose models as the persistence and field-validation boundary. Keep seed data repeatable and non-destructive: update or create the exercise fixtures without removing unrelated records.
- Activity tracking approach: Accept only `userId`, `teamId`, `type`, and `minutes`; validate both IDs and confirm their records exist before creating an activity. Derive points and the occurrence date on the server, then return the persisted record.
- Team management approach: Require a non-empty name, preserve the submitted name and mascot, and persist the supplied member references. Return the created or listed team through the existing API response shape.
- Leaderboard approach: Aggregate persisted activity points by team, sort totals descending, and assign ranks starting at 1. Return each team's name and total, including the documented response shape.
- Workout suggestions approach: Find the requested user by email and use their goal and recent activities to rank available workouts. Include a short reason for the leading suggestion; return a deliberate 4xx response when the user does not exist.

## Test plan

- Data tier: `npm run test:data --prefix octofit-tracker/backend` checks required model fields, defaults, references, and repeatable/non-destructive seeding. Failures point to persistence validation or seed behavior.
- API: `npm run test:api --prefix octofit-tracker/backend` checks endpoint status codes, input/reference validation, stored activity values, team responses, leaderboard totals/ranks, and user-specific workout recommendations. Failures point to route/service contract or business-logic behavior.
- Presentation: `npm test --prefix octofit-tracker/frontend` checks API wiring, route rendering, accessible loading/empty/error states, and workout request parameters. Failures point to client/component behavior or expected UI states.
- Backend build: `npm run build --prefix octofit-tracker/backend` checks TypeScript types across backend code. Failures indicate compilation or type errors, not test-contract failures.
- Frontend build: `npm run build --prefix octofit-tracker/frontend` checks frontend TypeScript and the Vite production build. Failures indicate compilation or bundling errors.

Baseline test run before implementation: data tests had 4 failures (required-field validation) and 1 pass (seeding); API tests had 4 failures (unimplemented validation, empty leaderboard, and missing workout reason); frontend tests had 15 failures (rendering, request wiring, and loading/empty/error states). Build commands have not yet been run.
