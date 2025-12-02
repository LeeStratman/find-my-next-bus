"use client";

import { useEffect, useRef } from "react";
import maplibregl, { Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { StopWithMeta } from "@/components/nearest-stops";
import type { Prediction } from "@/types/bustime";
import { formatCountdown, parseBusTimeDate } from "@/lib/datetime";
import { getMapStyleUrl } from "@/lib/map-style";

type StopMapModalProps = {
  stop?: StopWithMeta;
  predictions?: Prediction[];
  isOpen: boolean;
  onClose: () => void;
};

export default function StopMapModal({
  stop,
  predictions = [],
  isOpen,
  onClose,
}: StopMapModalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!isOpen || !stop || !containerRef.current) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      return;
    }
    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style: getMapStyleUrl(),
      center: [stop.lon, stop.lat],
      zoom: 16,
    });
    const nextPrediction = predictions[0];
    const countdown = nextPrediction
      ? nextPrediction.prdctdn
        ? `${nextPrediction.prdctdn} min`
        : formatCountdown(parseBusTimeDate(nextPrediction.prdtm))
      : "No arrivals";
    new maplibregl.Marker({ color: "#f97316" })
      .setLngLat([stop.lon, stop.lat])
      .setPopup(
        new Popup({ closeButton: false, offset: 12 }).setHTML(
          `<strong>${stop.stpnm}</strong><br/>Next bus: ${countdown}`,
        ),
      )
      .addTo(mapRef.current);
  }, [isOpen, stop, predictions]);

  if (!isOpen || !stop) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl rounded-3xl border border-white/20 bg-slate-900/90 p-6 text-white shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-wide text-white/60">
              Stop details
            </p>
            <h4 className="text-2xl font-semibold">{stop.stpnm}</h4>
            <p className="text-sm text-white/70">Stop #{stop.stpid}</p>
          </div>
          <button
            type="button"
            className="rounded-full border border-white/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:border-white"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div
          ref={containerRef}
          className="mt-4 h-[360px] w-full rounded-2xl"
          aria-label={`${stop.stpnm} map`}
        />
      </div>
    </div>
  );
}

