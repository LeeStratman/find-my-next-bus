# Platform, Ops, and Deployment Plan

## Environment Configuration

- `BUSTIME_API_KEY`: 25-char key from Madison BusTime portal.
- `BUSTIME_FEED` (optional): keep blank for default feed, but allow override for future agencies.
- `NEXT_PUBLIC_APP_BASE_URL`: needed for absolute links in metadata.
- Create `.env.local.example` documenting keys without secrets; instruct devs to copy to `.env.local`.
- On Vercel: add keys under Project Settings → Environment Variables for Production/Preview/Development.

## API Proxy & Security

- Route Handler `/api/bustime/[...path]` injects key server-side and validates allowed endpoints to prevent abuse.
- Set `cache: 'no-store'` for POST-like actions; otherwise configure `revalidate` headers per endpoint (predictions 15s, routes/stops 12h).
- Implement basic request counter (e.g., Upstash Redis) to ensure <10k daily quota; log to Vercel Analytics.

## Testing Strategy

- **Unit**: jest tests for `lib/bustime` covering success, BusTime error payloads (`Invalid API access key supplied`), retries, and parameter encoding.
- **Integration**: MSW handlers mocking Madison endpoints with recorded JSON from `/docs/bustime-summary.md`.
- **E2E**: Playwright smoke test verifying:
  - Home setup flow (mock geolocation).
  - Arrivals card countdown updates.
  - Alert banner renders when mocked bulletin exists.

## Deployment Workflow

1. Repo hosted on GitHub; enable Vercel Git integration.
2. Branch workflow:
   - Feature branches → PR → automatic Preview Deployment.
   - Merge to `main` triggers Production deploy.
3. Add `vercel.json` if custom headers needed (e.g., `Cache-Control` for static assets).
4. Post-deploy checklist:
   - Verify `/api/bustime` responses using Vercel logs.
   - Confirm location permission prompt on real devices.
   - Monitor request volume; adjust revalidation intervals if approaching quota.

## Monitoring & Alerts

- Enable Vercel Web Analytics and Logging ingestion.
- Optional: hook `getpredictions` failures into Slack via Vercel cron job hitting health endpoint.
- Track error rates (BusTime `<error>` payloads) to decide when to surface maintenance banner.
