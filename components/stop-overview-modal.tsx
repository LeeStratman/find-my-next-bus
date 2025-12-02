"use client";

import { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { StopWithMeta } from "@/components/nearest-stops";
import type { Prediction } from "@/types/bustime";
import { formatCountdown, parseBusTimeDate } from "@/lib/datetime";
import { formatDistance } from "@/lib/geo";

type StopOverviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  stops: StopWithMeta[];
  predictions: Record<string, Prediction[]>;
};

export default function StopOverviewModal({
  isOpen,
  onClose,
  stops,
  predictions,
}: StopOverviewModalProps) {
  const [filter, setFilter] = useState("");

  const orderedStops = useMemo(() => {
    const copy = [...stops];
    copy.sort((a, b) => {
      const seqA = a.gtfsseq ?? Number.POSITIVE_INFINITY;
      const seqB = b.gtfsseq ?? Number.POSITIVE_INFINITY;
      if (seqA !== seqB) return seqA - seqB;
      return a.stpnm.localeCompare(b.stpnm);
    });
    return copy;
  }, [stops]);

  const filteredStops = useMemo(() => {
    if (!filter.trim()) return orderedStops;
    const term = filter.toLowerCase();
    return orderedStops.filter((stop) =>
      stop.stpnm.toLowerCase().includes(term),
    );
  }, [orderedStops, filter]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
        <Dialog.Content className="fixed inset-x-0 top-1/2 z-50 mx-auto h-[85vh] w-full max-w-4xl -translate-y-1/2 rounded-3xl border border-white/20 bg-slate-900/95 p-6 text-white shadow-2xl data-[state=open]:animate-slide-up data-[state=closed]:animate-slide-down focus:outline-none">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">
                Route overview
              </p>
              <Dialog.Title className="text-2xl font-semibold">
                All stops in sequence
              </Dialog.Title>
              <Dialog.Description className="text-sm text-white/70">
                Ordered by GTFS stop sequence where available. Search to quickly
                find a stop.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-full border border-white/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:border-white"
              >
                Close
              </button>
            </Dialog.Close>
          </div>
          <div className="mb-3 flex items-center">
            <input
              type="text"
              placeholder="Search stop name"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="w-full rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-white"
            />
          </div>
          <div className="h-[calc(100%-9rem)] overflow-y-auto rounded-2xl border border-white/15 bg-white/5">
            <table className="w-full text-left text-sm text-white/80">
              <thead className="sticky top-0 bg-slate-900/80 text-xs uppercase tracking-wide text-white/70">
                <tr>
                  <th className="px-4 py-3">Seq</th>
                  <th className="py-3">Stop</th>
                  <th className="py-3">Distance</th>
                  <th className="py-3">Next arrival</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredStops.map((stop) => {
                  const next = predictions[stop.stpid]?.[0];
                  const countdown = next
                    ? next.prdctdn
                      ? `${next.prdctdn} min`
                      : formatCountdown(parseBusTimeDate(next.prdtm))
                    : "No arrivals";
                  return (
                    <tr key={stop.stpid} className="hover:bg-white/5">
                      <td className="px-4 py-3 font-mono text-xs text-white/60">
                        {stop.gtfsseq ?? "—"}
                      </td>
                      <td className="py-3">
                        <div className="font-semibold text-white">
                          {stop.stpnm}
                        </div>
                        <div className="text-xs text-white/50">
                          Stop #{stop.stpid}
                        </div>
                      </td>
                      <td className="py-3 text-xs text-white/70">
                        {stop.distanceMeters !== undefined
                          ? formatDistance(stop.distanceMeters)
                          : "—"}
                      </td>
                      <td className="py-3 text-xs text-white/80">
                        {countdown}
                      </td>
                    </tr>
                  );
                })}
                {filteredStops.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-sm text-white/70"
                    >
                      No stops match “{filter}”.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

