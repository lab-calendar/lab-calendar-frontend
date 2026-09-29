# lab-calendar-frontend

Frontend web application for Lab Calendar — the lab's shared calendar for
schedules, project deadlines and meeting-card expenses.

For the people who *use* the app (not develop it), see the Korean user guide in
[`docs/user-guide.md`](docs/user-guide.md).

## Screens

| Route | Screen | Notes |
| --- | --- | --- |
| `/` | Month calendar | Category filter and event form in the sidebar |
| `/projects` | Projects | Deadlines; the server derives the preparation bars |
| `/members` | Members | Name list used for attendees and owners |
| `/card-expenses` | Card ledger import | Editor tier only — upload, preview, apply |
| `/login` | Password | Two shared passwords pick the tier (editor / viewer) |

The viewer tier never receives card expense data — the server leaves it out of
the response, and the screens above hide the entry points accordingly.

## Tech Stack

- React 19 + TypeScript, Vite
- react-router-dom (routes are code-split per screen)
- TanStack Query over axios adapters — components never touch HTTP
- FullCalendar (dayGrid + interaction) for the month view
- MSW for the mock API, shared by the browser and the test suite

## Getting Started

```bash
npm install
cp .env.example .env
npm run dev
```

Dev server runs at http://localhost:5173. Requests to `/api` are proxied to the
backend, so the browser sees a single origin and the session cookie behaves the
same as in production, where nginx does the same job.

### Environment variables

All are optional — an empty `.env` works when the backend runs on
`localhost:8080`.

| Variable | Default | When to set it |
| --- | --- | --- |
| `VITE_API_BASE_URL` | empty (same origin) | Only to call a backend on another host. That server's `lab-calendar.web.allowed-origins` must then list this frontend |
| `VITE_API_PROXY_TARGET` | `http://localhost:8080` | Backend listening somewhere other than 8080 |
| `VITE_ENABLE_MSW` | empty | `true` runs the mock API in the browser. `npm run dev:mock` sets it via `.env.mock`; dev builds only |

## Mock API server

`npm run dev:mock` starts the dev server with a mock backend (MSW) running in
the browser, so you can open every screen without the backend or a database.
Requests go through the real axios adapters and query hooks — only the network
boundary is replaced.

```bash
npm run dev:mock
```

Sign in with `editor` or `viewer` as the password. These are development-only
values that pick a tier; the real passwords live in the backend's environment.
Use `viewer` to check the read-only screens (card expenses hidden, edit buttons
gone). The session survives a reload and is cleared by logging out.

The seed data is generated relative to today, so deadlines, D-Day badges and the
upcoming-deadline widget always have something to show.

To exercise the loading and error states, which you would otherwise never see:

| How | What it does |
| --- | --- |
| `?mockDelay=1500` | delay every response by 1500 ms |
| `?mockFail=events,projects` | fail those domains with a server error |
| `mockApi.delay(1500)` | same, from the browser console |
| `mockApi.fail('events')` | same, from the browser console |
| `mockApi.reset()` | clear delays and failures |

Domains are `auth`, `categories`, `events`, `projects`, `members` and
`cardImports`.

The card ledger import has three outcomes worth seeing, and the mock does not
parse the uploaded file — parsing is the server's job (POI), and faking it here
would test a fake parser instead of the screen. Pick the outcome instead:

| How | What you get |
| --- | --- |
| `?mockCardImport=blocked` | one month blocked by a row error, one month ready |
| `?mockCardImport=empty` | no readable month sheets — apply stays disabled |
| `mockApi.cardImport('blocked')` | same, from the browser console |

Applying twice with the same preview, or applying after a second preview, comes
back as `PREVIEW_STALE` — the screen then drops the preview and asks for the
file again.

The mock is enabled by `VITE_ENABLE_MSW=true`, which `dev:mock` supplies through
`.env.mock`. It is also gated on `import.meta.env.DEV`, so a production build
ignores the flag and leaves the mock code and its data out of the bundle
entirely; the Docker build additionally deletes the leftover worker script from
`dist/`.

## Scripts

- `npm run dev` - start dev server
- `npm run dev:mock` - start dev server with the mock API server
- `npm run build` - type-check and build for production
- `npm run preview` - preview the production build
- `npm run lint` - lint with oxlint
- `npm test` - run the test suite once
- `npm run test:watch` - run tests in watch mode

## Testing

Tests run on Vitest with Testing Library in a jsdom environment. Test files
live next to the code they cover as `*.test.ts(x)`, and shared helpers are in
`src/test/`.

Use `renderWithRouter` from `src/test/renderWithRouter.tsx` for components that
need router context; it accepts a `route` option so you can set up query
parameters:

```tsx
renderWithRouter(<CategoryFilter />, { route: '/?categories=lab' })
```

Tests that go through the API can run against the same mock server instead of
stubbing the adapters, which keeps request shapes, status codes and error
normalisation under test. Call `setUpMockApi` from `src/test/mockApi.ts` at the
top level of the file:

```ts
setUpMockApi({ today: '2026-09-27', tier: 'EDITOR' })
```

Both options are optional. `today` fixes the date that D-Day and deadline values
are derived from (default `MOCK_TODAY`), and `tier` starts each test signed in at
that tier (default signed out). The database and the delay/failure scenarios are
reset before every test.

CI runs lint, tests and the type-checked build on every pull request and on
pushes to `develop`. The same three steps gate the `main` deploy.
