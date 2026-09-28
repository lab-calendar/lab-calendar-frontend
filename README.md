# lab-calendar-frontend

Frontend web application for Lab Calendar

## Tech Stack

- React 19 + TypeScript
- Vite
- axios, react-router-dom

## Getting Started

```bash
npm install
cp .env.example .env
npm run dev
```

Dev server runs at http://localhost:5173 and expects the backend at
`VITE_API_BASE_URL` (default `http://localhost:8080`).

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

Domains are `auth`, `categories`, `events`, `projects` and `members`.

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
