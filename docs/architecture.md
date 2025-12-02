# Next.js Architecture — Bus Me Home

## Tech Stack

- Next.js 15 App Router (Node runtime) with React Server Components.
- TypeScript, Tailwind CSS (utility-first, fast iterations).
- React Query for client-side revalidation, Zustand for lightweight persisted settings.
- MapLibre GL (optional stretch) rendered client-side.

## Directory Layout

```
/app
  /layout.tsx            // global shell, theme, font
  /page.tsx              // landing/home arrivals
  /routes/[rt]/page.tsx  // route explorer view
  /api/bustime/[...path]/route.ts // proxy to BusTime host
  /api/geocode/route.ts  // proxy to OpenStreetMap Nominatim
/components
  HomeSetupCard.tsx
  ArrivalsCard.tsx
  StopLookup.tsx
  RouteSearchModal.tsx
  AlertsBanner.tsx
/lib
  bustime.ts             // fetch helper + endpoint wrappers
  preferences.ts         // localStorage helpers
/types
  bustime.ts             // shared interfaces (see docs)
/hooks
  useHomeStop.ts         // persists chosen stop(s)
```

## Data Fetching

- **Server Components**: Landing page renders shell + static copy; client-side picks up hydrated data.
- **Client Components**: React Query hits `/api/bustime/getpredictions?stpid=...` every 15s for live countdowns and `/getservicebulletins` every ~60s.
- **Proxy Route Handlers**:
  - `/app/api/bustime/[...path]/route.ts` forwards requests to Madison host, injecting API key from env and returning JSON.
  - `/app/api/geocode/route.ts` proxies to OpenStreetMap’s Nominatim API with a configurable user agent so we can do address lookups without exposing cross-origin calls.

## State Management

- `useHomeStop` hook stores selected stop(s) + preferred route/direction in `localStorage` via Zustand persist middleware.
- Context provider exposes rider settings to cards/modals.

## UI Composition

- Landing uses stacked sections:
  1. AlertsBanner (renders service bulletins).
  2. HomeSetupCard (location permissions + saved stop summary).
  3. StopLookup (route/direction selectors + searchable list of stops).
  4. ArrivalsCard (live predictions, CTA to map/search).
- `/routes/[rt]` server component fetches `getdirections` + `getstops` and streams stop list; child client component hooks map + React Query predictions for the selected stop.

## Performance & Accessibility

- Lazy-load RouteSearchModal and Map components to reduce initial JS.
- Use semantic landmarks (header/main) and ARIA live region for countdown updates.
- Add skeleton placeholders during revalidation.
