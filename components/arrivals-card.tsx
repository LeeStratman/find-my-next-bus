"use client";

import { useHomeStop } from "@/hooks/use-home-stop";
import { getPredictions } from "@/lib/bustime";
import { formatPredictionCountdown, parseBusTimeDate } from "@/lib/datetime";
import type { Prediction } from "@/types/bustime";
import { useQuery } from "@tanstack/react-query";

export default function ArrivalsCard() {
  const { homeStop } = useHomeStop();
  const query = useQuery({
    enabled: Boolean(homeStop?.stpid),
    queryKey: ["predictions", homeStop?.stpid],
    queryFn: async () => {
      if (!homeStop?.stpid) return [];
      return getPredictions(homeStop.stpid);
    },
    refetchInterval: 15_000,
  });

  if (!homeStop) {
    return (
      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 text-white shadow-lg backdrop-blur">
        <h2 className="text-xl font-semibold">Live arrivals</h2>
        <p className="mt-2 text-sm text-white/70">
          Pick a home stop to start seeing buses headed your way.
        </p>
      </section>
    );
  }

  const renderContent = () => {
    if (query.isLoading) {
      return (
        <ul className="mt-6 space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <li
              key={index}
              className="animate-pulse rounded-xl bg-white/5 p-4 text-white/50"
            >
              Fetching arrivals…
            </li>
          ))}
        </ul>
      );
    }

    if (query.isError) {
      return (
        <p className="mt-4 text-sm text-rose-200">
          {(query.error as Error).message ||
            "We couldn’t load arrivals right now."}
        </p>
      );
    }

    const predictions = query.data ?? [];
    if (predictions.length === 0) {
      return (
        <p className="mt-4 text-sm text-white/70">
          No scheduled arrivals for this stop right now.
        </p>
      );
    }

    return (
      <ul className="mt-4 space-y-3">
        {predictions.map((prediction) => (
          <ArrivalRow key={`${prediction.vid}-${prediction.prdtm}`} {...prediction} />
        ))}
      </ul>
    );
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 text-white shadow-lg backdrop-blur">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-wide text-white/60">
            Next buses
          </p>
          <h2 className="text-2xl font-semibold">{homeStop.stpnm}</h2>
          <p className="text-sm text-white/60">Stop #{homeStop.stpid}</p>
        </div>
        <button
          type="button"
          className="rounded-full border border-white/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:border-white hover:text-white"
          onClick={() => query.refetch()}
          disabled={query.isFetching}
        >
          Refresh
        </button>
      </div>
      {renderContent()}
    </section>
  );
}

function ArrivalRow(prediction: Prediction) {
  const etaDate = parseBusTimeDate(prediction.prdtm);
  const countdown = formatPredictionCountdown(prediction);
  const isDelayed = prediction.dly || prediction.dyn === 1;

  return (
    <li className="rounded-xl bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">
            Route {prediction.rt} • {prediction.des}
          </p>
          <p className="text-xs text-white/70">
            Vehicle {prediction.vid} • {prediction.rtdir}
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-semibold text-white">{countdown}</p>
          {etaDate && (
            <p className="text-xs uppercase text-white/60">
              ETA {etaDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
            </p>
          )}
        </div>
      </div>
      {isDelayed && (
        <p className="mt-2 text-xs font-semibold uppercase text-amber-300">
          Delay reported
        </p>
      )}
    </li>
  );
}

