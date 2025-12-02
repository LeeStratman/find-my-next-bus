# BusTime Madison API Summary

Host: `https://metromap.cityofmadison.com/bustime/api/v3`

All requests use HTTP GET with `key=<API_KEY>` and can add `format=json`. Daily quota per key: 10k requests. Prefer JSON responses for easier integration.

## Core Endpoints

1. `gettime`

   - Purpose: sync client clock with BusTime.
   - Params: `key`, optional `unixTime=true`.
   - Use: call on server boot to validate connectivity; lightweight heartbeat.

2. `getroutes`

   - Purpose: list available Madison Metro routes.
   - Params: `key`, optional `rtpidatafeed`.
   - Use: populate route dropdowns, caching daily unless detours require refresh.

3. `getdirections`

   - Purpose: list valid direction IDs per route.
   - Params: `key`, `rt`, optional `rtpidatafeed`.
   - Use: drive UI direction toggles; responses stable, cache with route data.

4. `getstops`

   - Purpose: list stops for a route + direction or fetch specific stops.
   - Params: `key`, `rt` + `dir` _or_ up to 10 `stpid` values, optional `rtpidatafeed`.
   - Use: build stop pickers; must refresh if detours reported for route/direction.

5. `getpatterns`

   - Purpose: geometry (waypoints/stops) for route patterns, including detour variants.
   - Params: `key`, `rt` _or_ up to 10 `pid`, optional `rtpidatafeed`.
   - Use: map overlays; only fetch when route view is opened to limit quota.

6. `getvehicles`

   - Purpose: live bus positions.
   - Params: `key`, `rt` _or_ comma-separated `vid`. Not all feeds support this call.
   - Use: optional; pair with route map to show approaching bus icons.

7. `getpredictions`

   - Purpose: arrival predictions for stops or vehicles.
   - Params: `key`, up to 10 `stpid` or `vid`, optional `rt`, `top`, `tmres`, `unixTime`, `rtpidatafeed`.
   - Use: primary UX data, refresh every 15–30 seconds.

8. `getservicebulletins`
   - Purpose: service alerts scoped to route/direction/stop.
   - Params: `key` plus either `rt` (+ optional `rtdir`, `stpid`) or `stpid` list, optional `rtpidatafeed`.
   - Use: show user alerts about detours or closures affecting their “home” stop.

## Shared Data Shapes

```ts
// docs-only reference types
export interface BusTimeResponse<T> {
  "bustime-response": {
    error?: { msg: string; rtpidatafeed?: string }[];
    [key: string]: unknown;
  } & T;
}

export interface Route {
  rt: string;
  rtnm: string;
  rtclr: string;
  rtdd: string;
  rtpidatafeed?: string;
}

export interface Direction {
  id: string; // e.g., FLEX_0_1
  name: string; // localized label
}

export interface Stop {
  stpid: string;
  stpnm: string;
  lat: number;
  lon: number;
  gtfsseq?: number;
  dtradd?: string[];
  dtrrem?: string[];
  ada?: boolean;
}

export interface Prediction {
  tmstmp: string;
  typ: "A" | "D";
  stpid: string;
  stpnm: string;
  vid: string;
  dstp: number;
  rt: string;
  rtdd: string;
  rtdir: string;
  des: string;
  prdtm: string;
  dly: boolean;
  dyn?: number;
  tablockid: string;
  tatripid: string;
  origtatripno: string;
  prdctdn?: string;
  zone?: string;
  psgld?: "FULL" | "HALF_EMPTY" | "EMPTY" | "N/A";
  gtfsseq?: number;
  stst?: number;
  stsd?: string;
  flagstop?: -1 | 0 | 1 | 2;
}
```

## Fetch Utility Notes (`lib/bustime.ts`)

- Wrap `fetch` with typed helper:
  ```ts
  async function fetchBusTime<T>(
    path: string,
    params: Record<string, string>
  ): Promise<T>;
  ```
  - Always append `key`, optional `format=json`, `rtpidatafeed`.
  - Throw enriched errors when `error` array present; include `msg` + HTTP status.
- Rate limit: throttle bursts (e.g., p-limit or simple in-memory queue) to keep total requests under 10k/day and ≤5/sec.
- Retry network/transient 5xx with exponential backoff, max 2 retries.
- Add `Cache-Control` hints for server components (e.g., `next: { revalidate: 15 }` for predictions).

## Error & Rate-Limit Handling

- Detect `<error>` payloads such as `Invalid API access key supplied` (see Madison endpoint test) and surface user-friendly message (e.g., “Transit data unavailable. Check API key.”).
- Monitor `No service scheduled` vs genuine empty predictions; show different UI states.
- Log request counts per endpoint to prepare for future scaling beyond default quota.

## Madison-Specific Considerations

- Single agency feed simplifies `rtpidatafeed`, but keep parameter ready for future multi-feed expansion.
- Public endpoint uses HTTPS; no CORS preflight issues when proxied via Next.js Route Handler. Avoid calling BusTime directly from client to keep API key secret.
- Vehicle call may be disabled depending on feed configuration; feature flag real-time bus pins until confirmed.
