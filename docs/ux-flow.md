# UX Flow — Bus Me Home

## Personas & Goals

- Daily rider who wants the fastest route home with minimal taps.
- Occasional rider visiting Madison who needs simple instructions.

## Primary Journey (Happy Path)

1. **Landing / Permission**
   - Prompt for location access.
   - If granted, compute nearest “home candidate” stop; otherwise show manual search input.
2. **Home Setup**
   - Show modal listing recent/nearby stops, allow saving one or multiple as “Home”.
   - Store selection locally; offer inline edit.
3. **Stop Lookup**
   - Provide route + direction dropdowns sourced from BusTime.
   - Filterable list of stops; tapping one populates the home stop immediately.
   - Optional address search powered by OpenStreetMap; we geocode and highlight the nearest stop within the selected route/direction.
4. **Live Arrivals Card**
   - After home is set, show card with:
     - Next 2–3 arrivals (`getpredictions`) including route badge, destination, countdown.
     - Delay badge if `dly=true` or `dyn` indicates disruption.
   - CTA buttons: “Show Map”, “Change Stop”.
4. **Route Explorer Modal**
   - Activated from CTA or header search.
   - Typeahead powered by cached `getroutes`.
   - On pick, fetch `getdirections` → `getstops` to list stops; select to view predictions.
6. **Map Overlay (Stretch)**
   - Display selected route pattern (`getpatterns`) + live vehicle pins (if feed supports `getvehicles`).
7. **Alerts Surface**
   - When `getservicebulletins` returns items affecting home stop/route, show inline banner linking to details sheet.

## Key States

- **No Location Permission**: show manual search first, include “Use current location” CTA.
- **No Home Saved**: highlight setup card with icon and simple copy (“Pick where you get off near home”).
- **No Upcoming Service**: display friendly empty state referencing `No service scheduled`.
- **API Error**: toast/banner with retry action and contact instruction.

## Interaction Notes

- Favor bottom-sheet patterns for modals on mobile, keyboard-friendly layout on desktop.
- Use optimistic UI when switching home stop — update card immediately while background fetch confirms.
- Respect rate limits: throttle map polling to ≥30s; arrivals use 15s React Query polling.
