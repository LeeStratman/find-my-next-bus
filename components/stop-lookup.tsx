"use client";

import { useHomeStop } from "@/hooks/use-home-stop";
import { getDirections, getRoutes, getStopsForRoute } from "@/lib/bustime";
import type { Stop } from "@/types/bustime";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";

type GeocodeResult = {
  id: string;
  displayName: string;
  lat: number;
  lon: number;
  nearest?: {
    stop: Stop;
    distanceMeters: number;
  };
};

export default function StopLookup() {
  const { setHomeStop } = useHomeStop();
  const [routeId, setRouteId] = useState<string>("");
  const [directionId, setDirectionId] = useState<string>("");
  const [filter, setFilter] = useState("");
  const [addressQuery, setAddressQuery] = useState("");
  const [geocodeMatches, setGeocodeMatches] = useState<GeocodeResult[]>([]);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const routesQuery = useQuery({
    queryKey: ["routes"],
    queryFn: () => getRoutes(),
    staleTime: 12 * 60 * 60 * 1000,
  });

  const directionsQuery = useQuery({
    queryKey: ["directions", routeId],
    enabled: Boolean(routeId),
    queryFn: () => getDirections(routeId),
    staleTime: 60 * 60 * 1000,
  });

  const stopsQuery = useQuery({
    queryKey: ["stops", routeId, directionId],
    enabled: Boolean(routeId && directionId),
    queryFn: () => getStopsForRoute(routeId, directionId),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    placeholderData: (previous) => previous,
  });

  const hasSelection = Boolean(routeId && directionId);

  const filteredStops = useMemo(() => {
    const stops = hasSelection ? stopsQuery.data ?? [] : [];
    if (!filter.trim()) return stops;
    const term = filter.toLowerCase();
    return stops.filter(
      (stop) =>
        stop.stpnm.toLowerCase().includes(term) ||
        stop.stpid.toLowerCase().includes(term)
    );
  }, [stopsQuery.data, hasSelection, filter]);

  const handleUseStop = (stop: Stop) => {
    setHomeStop({
      stpid: stop.stpid,
      stpnm: stop.stpnm,
      lat: stop.lat,
      lon: stop.lon,
    });
  };

  const handleAddressLookup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!addressQuery.trim()) return;
    if (!hasSelection) {
      setGeocodeError("Select a route and direction first.");
      return;
    }
    setIsGeocoding(true);
    setGeocodeError(null);
    try {
      const response = await fetch(
        `/api/geocode?q=${encodeURIComponent(addressQuery)}`
      );
      if (!response.ok) {
        throw new Error("Lookup failed");
      }
      const rawResults = (await response.json()) as Array<{
        display_name: string;
        lat: string;
        lon: string;
      }>;
      const stops = hasSelection ? stopsQuery.data ?? [] : [];
      const matches = rawResults.map((result, index) => {
        const lat = Number(result.lat);
        const lon = Number(result.lon);
        return {
          id: `${lat}-${lon}-${index}`,
          displayName: result.display_name,
          lat,
          lon,
          nearest: stops.length ? findNearestStop(stops, lat, lon) : undefined,
        };
      });
      setGeocodeMatches(matches);
      if (!stops.length) {
        setGeocodeError(
          "We need stop data for this route/direction before we can suggest the closest stop."
        );
      }
    } catch (error) {
      setGeocodeError(
        (error as Error).message || "We couldn’t search that address."
      );
      setGeocodeMatches([]);
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 text-white shadow-lg backdrop-blur">
      <header className="mb-4 flex flex-col gap-1">
        <p className="text-sm uppercase tracking-wide text-white/60">
          Need a stop ID?
        </p>
        <h2 className="text-2xl font-semibold">Browse Madison stops</h2>
        <p className="text-sm text-white/70">
          Pick a route, a direction, then tap the stop that matches your street
          corner.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Route"
          value={routeId}
          onChange={(event) => {
            setRouteId(event.target.value);
            setDirectionId("");
            setFilter("");
            setGeocodeMatches([]);
            setGeocodeError(null);
          }}
          placeholder={
            routesQuery.isLoading ? "Loading routes…" : "Select route"
          }
          disabled={routesQuery.isLoading}
          options={(routesQuery.data ?? []).map((route) => ({
            label: `${route.rt} • ${route.rtnm}`,
            value: route.rt,
          }))}
        />

        <SelectField
          label="Direction"
          value={directionId}
          onChange={(event) => {
            setDirectionId(event.target.value);
            setFilter("");
            setGeocodeMatches([]);
            setGeocodeError(null);
          }}
          placeholder={
            !routeId
              ? "Pick a route first"
              : directionsQuery.isLoading
              ? "Loading directions…"
              : "Select direction"
          }
          disabled={!routeId || directionsQuery.isLoading}
          options={(directionsQuery.data ?? []).map((dir) => ({
            label: dir.name,
            value: dir.id,
          }))}
        />
      </div>

      <div className="mt-4">
        <label className="sr-only" htmlFor="stop-search-input">
          Search stops
        </label>
        <input
          id="stop-search-input"
          type="text"
          placeholder="Search stop name or ID"
          className="w-full rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white outline-none transition focus:border-white"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          disabled={stopsQuery.isFetching || !hasSelection}
        />
      </div>

      <form
        onSubmit={handleAddressLookup}
        className="mt-4 flex flex-col gap-3 sm:flex-row"
      >
        <label className="sr-only" htmlFor="address-search-input">
          Search by address
        </label>
        <input
          id="address-search-input"
          type="text"
          placeholder="123 Main St, Madison"
          className="flex-1 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white outline-none transition focus:border-white disabled:opacity-60"
          value={addressQuery}
          onChange={(event) => setAddressQuery(event.target.value)}
          disabled={!hasSelection}
        />
        <button
          type="submit"
          className="rounded-full border border-white/40 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white transition hover:border-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!hasSelection || isGeocoding}
        >
          {isGeocoding ? "Searching…" : "Find nearest stop"}
        </button>
      </form>

      {geocodeError && (
        <p className="mt-2 text-sm text-rose-200">{geocodeError}</p>
      )}

      <div className="mt-4 max-h-64 overflow-y-auto rounded-2xl border border-white/10 bg-white/5">
        {renderStopsList({
          isLoading: stopsQuery.isLoading,
          isError: stopsQuery.isError,
          stops: filteredStops,
          error: stopsQuery.error,
          onSelect: handleUseStop,
          requiresSelection: !hasSelection,
        })}
      </div>

      {geocodeMatches.length > 0 && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5">
          <ul className="divide-y divide-white/10">
            {geocodeMatches.map((match) => (
              <li key={match.id} className="px-4 py-3 text-sm text-white">
                <p className="font-semibold">{match.displayName}</p>
                {match.nearest ? (
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-3 text-xs text-white/70">
                    <p>
                      Nearest stop:{" "}
                      <span className="font-semibold text-white">
                        {match.nearest.stop.stpnm}
                      </span>{" "}
                      ({match.nearest.stop.stpid}) •{" "}
                      {formatDistance(match.nearest.distanceMeters)}
                    </p>
                    <button
                      type="button"
                      className="rounded-full border border-white/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white transition hover:border-white"
                      onClick={() => handleUseStop(match.nearest!.stop)}
                    >
                      Use this stop
                    </button>
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-white/70">
                    Select a route and direction to find nearby stops.
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function SelectField({
  label,
  value,
  onChange,
  placeholder,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  placeholder: string;
  options: Array<{ label: string; value: string }>;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-white/80">
      {label}
      <div className="relative">
        <select
          className="w-full appearance-none rounded-full border border-white/20 bg-white/10 px-4 py-2 pr-10 text-white outline-none transition focus:border-white disabled:opacity-60"
          value={value}
          onChange={onChange}
          disabled={disabled}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-slate-900 text-white"
            >
              {option.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/70">
          ▾
        </span>
      </div>
    </label>
  );
}

function renderStopsList({
  isLoading,
  isError,
  stops,
  error,
  onSelect,
  requiresSelection,
}: {
  isLoading: boolean;
  isError: boolean;
  stops: Stop[];
  error: unknown;
  onSelect: (stop: Stop) => void;
  requiresSelection: boolean;
}) {
  if (requiresSelection) {
    return (
      <div className="px-4 py-3 text-sm text-white/70">
        Choose a route and direction to load stops for that trip.
      </div>
    );
  }

  if (isLoading) {
    return (
      <ul className="divide-y divide-white/5">
        {Array.from({ length: 4 }).map((_, index) => (
          <li key={index} className="animate-pulse px-4 py-3 text-white/50">
            Loading stops…
          </li>
        ))}
      </ul>
    );
  }

  if (isError) {
    return (
      <div className="px-4 py-3 text-sm text-rose-200">
        {(error as Error)?.message ?? "Unable to load stops."}
      </div>
    );
  }

  if (!stops.length) {
    return (
      <div className="px-4 py-3 text-sm text-white/70">
        No stops match that filter.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-white/5">
      {stops.map((stop) => (
        <li
          key={stop.stpid}
          className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
        >
          <div>
            <p className="font-semibold text-white">{stop.stpnm}</p>
            <p className="text-xs text-white/60">Stop #{stop.stpid}</p>
          </div>
          <button
            type="button"
            className="rounded-full border border-white/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:border-white"
            onClick={() => onSelect(stop)}
          >
            Use stop
          </button>
        </li>
      ))}
    </ul>
  );
}

function findNearestStop(stops: Stop[], lat: number, lon: number) {
  if (!stops.length) return undefined;
  let bestDistance = Infinity;
  let bestStop: Stop | null = null;
  for (const stop of stops) {
    const distance = haversine(lat, lon, stop.lat, stop.lon);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestStop = stop;
    }
  }
  if (!bestStop) return undefined;
  return { stop: bestStop, distanceMeters: bestDistance };
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371e3; // meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(meters: number) {
  const miles = meters * 0.000621371;
  if (miles >= 1) {
    return `${miles.toFixed(1)} mi`;
  }
  return `${Math.round(meters)} m`;
}
