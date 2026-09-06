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

## Scripts

- `npm run dev` - start dev server
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

CI runs lint, tests and the type-checked build on every pull request and on
pushes to `develop`. The same three steps gate the `main` deploy.
