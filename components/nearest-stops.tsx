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
  onOpenOverview?: () => void;
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
  onOpenOverview,
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
    <section className="w-full rounded-none border-0 bg-transparent p-0 text-white sm:rounded-3xl sm:border sm:border-white/10 sm:bg-white/5 sm:p-6 sm:shadow-lg sm:backdrop-blur">
        <p className="text-sm text-white/70">
          Choose a route and direction to see nearby stops.
        </p>
      </section>
    );
  }

  if (isLoading) {
    return (
    <section className="w-full rounded-none border-0 bg-transparent p-0 text-white sm:rounded-3xl sm:border sm:border-white/10 sm:bg-white/5 sm:p-6 sm:shadow-lg sm:backdrop-blur">
        <p className="text-sm text-white/70">Loading stops…</p>
      </section>
    );
  }

  if (isError) {
    return (
    <section className="w-full rounded-none border-0 bg-transparent p-0 text-white sm:rounded-3xl sm:border sm:border-white/10 sm:bg-white/5 sm:p-6 sm:shadow-lg sm:backdrop-blur">
        <p className="text-sm text-rose-200">
          {(error as Error)?.message ?? "We couldn’t load stops for that route."}
        </p>
      </section>
    );
  }

  return (
    <section className="w-full rounded-none border-0 bg-transparent p-0 text-white sm:rounded-3xl sm:border sm:border-white/10 sm:bg-slate-900/60 sm:p-6 sm:shadow-lg sm:backdrop-blur">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold">Nearest stops</h3>
          <p className="text-sm text-white/70">
            Showing only stops with upcoming arrivals.
            {!location && " Enable location to sort by distance."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onOpenOverview && (
            <button
              type="button"
              className="rounded-full border border-white/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:border-white"
              onClick={onOpenOverview}
            >
              View all stops
            </button>
          )}
        {sortedStops.length > maxDefault && (
          <button
            type="button"
            className="rounded-full border border-white/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:border-white"
            onClick={() => setShowAll((prev) => !prev)}
          >
            {showAll ? "Show less" : "Show all"}
          </button>
        )}
        </div>
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
            No upcoming arrivals for this route right now. Try again soon or view
            all stops for schedule info.
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
      className={`w-full rounded-2xl border px-4 py-3 transition ${
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 space-y-1">
          <p className="text-lg font-semibold text-white">{stop.stpnm}</p>
          <p className="text-sm text-white/70">Stop #{stop.stpid}</p>
          {stop.distanceMeters !== undefined && (
            <p className="text-xs text-white/60">
              {formatDistance(stop.distanceMeters)} away
            </p>
          )}
        </div>
        <div className="rounded-2xl bg-white/10 px-4 py-3 text-center sm:min-w-[150px] sm:text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">
            Next bus
          </p>
          <p className="text-3xl font-semibold text-white">{countdown}</p>
          {hasArrivals && (
            <p className="text-xs text-white/70">
              {nextPrediction.rt} → {nextPrediction.des}
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-white/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:border-white"
          onClick={(event) => event.stopPropagation()}
        >
          Get directions
        </a>
        <span className="text-xs text-white/60 text-center sm:text-left">
          {stop.gtfsseq ? `Sequence #${stop.gtfsseq}` : "Sequence unknown"}
        </span>
      </div>
    </article>
  );
}

