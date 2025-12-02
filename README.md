# Bus Me Home

Next.js app that pairs the Madison Metro BusTime API with a “just get me home” workflow: pick your usual stop once, then see live arrivals + alerts every time you open the app.

## Features

- Save one or more “home” stops locally (persisted via Zustand) without creating an account.
- Browse routes/directions to look up stop IDs without leaving the app.
- React Query-powered live arrivals with automatic refresh every 15 seconds.
- Service bulletin banner scoped to the saved stop.
- API proxy that hides the BusTime key and normalizes JSON responses.

## Stack

- Next.js App Router (v16) + TypeScript
- Tailwind CSS v4 (via `@tailwindcss/postcss`)
- React Query (`@tanstack/react-query`)
- Zustand for lightweight persisted state

## Environment

Create a `.env.local` file based on `env.example`:

```bash
cp env.example .env.local
```

Then edit the values (at minimum `BUSTIME_API_KEY`). You can optionally set `NOMINATIM_USER_AGENT` to identify your app when calling the free OpenStreetMap geocoder.

Only server-side code reads the API key via the proxy route; never expose it via `NEXT_PUBLIC_` variables.

## Development

Install dependencies (pnpm is preferred):

```bash
pnpm install
```

Run the app:

```bash
pnpm dev
```

This starts the dev server on [http://localhost:3000](http://localhost:3000). The landing page contains the full experience (home setup, arrivals, alerts).

## Scripts

| Script      | Description                                  |
| ----------- | -------------------------------------------- |
| `pnpm dev`  | Start the Next.js dev server                 |
| `pnpm lint` | Run ESLint against the project               |
| `pnpm build`| Create a production build                    |
| `pnpm start`| Serve the production build                   |

## Testing Roadmap

- Mock BusTime responses with MSW for unit/integration tests (`lib/bustime`, proxy route).
- Add Playwright smoke tests for the home-stop workflow once the UI stabilizes.
