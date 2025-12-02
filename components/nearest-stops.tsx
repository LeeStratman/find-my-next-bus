"use client";

import { useMemo, useState } from "react";
import { formatCountdown, parseBusTimeDate } from "@/lib/datetime";
import { formatDistance, haversineDistance } from "@/lib/geo";
import { Prediction, Stop } from "@/types/bustime";

export type StopWithMeta = Stop & {
  distanceMeters?: number;
};

type NearestStopsProps = {
  stops: StopWithMeta[];
  location?: { lat: number; lon: number };
  predictions: Record<string, Prediction[]>;
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  hasSelection: boolean;
  onSelectStop?: (stopId: string) => void;
  selectedStopId?: string;
  maxDefault?: number;
};

export default function NearestStops({
  stops,
  location,
  predictions,
  isLoading,
  isError,
  error,
  hasSelection,
  onSelectStop,
  selectedStopId,
  maxDefault = 6,
}: NearestStopsProps) {
  const [showAll, setShowAll] = useState(false);

  const stopsWithDistance: StopWithMeta[] = useMemo(() => {
    if (!location) return stops;
    return stops.map((stop) => ({
      ...stop,
      distanceMeters:
        stop.distanceMeters ??
        haversineDistance(location, { lat: stop.lat, lon: stop.lon }),
    }));
  }, [stops, location]);

  const sortedStops = useMemo(() => {
    const copy = [...stopsWithDistance];
    copy.sort((a, b) => {
      const distA = a.distanceMeters ?? Number.POSITIVE_INFINITY;
      const distB = b.distanceMeters ?? Number.POSITIVE_INFINITY;
      if (distA !== distB) return distA - distB;
      const seqA = a.gtfsseq ?? Number.POSITIVE_INFINITY;
      const seqB = b.gtfsseq ?? Number.POSITIVE_INFINITY;
      if (seqA !== seqB) return seqA - seqB;
      return a.stpnm.localeCompare(b.stpnm);
    });
    return copy;
  }, [stopsWithDistance]);

  const visibleStops = useMemo(() => {
    if (showAll) return sortedStops;
    return sortedStops.slice(0, maxDefault);
  }, [sortedStops, showAll, maxDefault]);

  if (!hasSelection) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-lg backdrop-blur">
        <p className="text-sm text-white/70">
          Choose a route and direction to see nearby stops.
        </p>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-lg backdrop-blur">
        <p className="text-sm text-white/70">Loading stops…</p>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-lg backdrop-blur">
        <p className="text-sm text-rose-200">
          {(error as Error)?.message ?? "We couldn’t load stops for that route."}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 text-white shadow-lg backdrop-blur">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold">Nearest stops</h3>
          <p className="text-sm text-white/70">
            {location
              ? "Sorted by distance from your location."
              : "Enable location to see distance-based ranking."}
          </p>
        </div>
        {sortedStops.length > maxDefault && (
          <button
            type="button"
            className="rounded-full border border-white/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:border-white"
            onClick={() => setShowAll((prev) => !prev)}
          >
            {showAll ? "Show less" : "Show all"}
          </button>
        )}
      </header>

      <div className="mt-4 space-y-4">
        {visibleStops.map((stop) => (
          <StopCard
            key={stop.stpid}
            stop={stop}
            predictions={predictions[stop.stpid] ?? []}
            isActive={selectedStopId === stop.stpid}
            onSelect={() => onSelectStop?.(stop.stpid)}
          />
        ))}
        {!visibleStops.length && (
          <p className="text-sm text-white/70">
            No stops found for this route/direction.
          </p>
        )}
      </div>
    </section>
  );
}

type StopCardProps = {
  stop: StopWithMeta;
  predictions: Prediction[];
  isActive?: boolean;
  onSelect?: () => void;
};

function StopCard({ stop, predictions, isActive, onSelect }: StopCardProps) {
  const nextPrediction = predictions?.[0];
  const hasArrivals = Boolean(nextPrediction);
  const countdown = hasArrivals
    ? nextPrediction.prdctdn
      ? `${nextPrediction.prdctdn} min`
      : formatCountdown(parseBusTimeDate(nextPrediction.prdtm))
    : "No arrivals";

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lon}&travelmode=walking`;

  return (
    <article
      className={`rounded-2xl border px-4 py-3 transition ${
        isActive
          ? "border-white bg-white/20"
          : "border-white/10 bg-white/5 hover:border-white/30"
      }`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter") onSelect?.();
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-white">{stop.stpnm}</p>
          <p className="text-sm text-white/70">Stop #{stop.stpid}</p>
          {stop.distanceMeters !== undefined && (
            <p className="text-xs text-white/60">
              {formatDistance(stop.distanceMeters)} away
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm uppercase tracking-wide text-white/60">
            Next bus
          </p>
          <p className="text-2xl font-semibold text-white">{countdown}</p>
          {hasArrivals && (
            <p className="text-xs text-white/70">
              {nextPrediction.rt} → {nextPrediction.des}
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-white/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:border-white"
          onClick={(event) => event.stopPropagation()}
        >
          Get directions
        </a>
        <span className="text-xs text-white/60">
          {stop.gtfsseq ? `Sequence #${stop.gtfsseq}` : "Sequence unknown"}
        </span>
      </div>
    </article>
  );
}

