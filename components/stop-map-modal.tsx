"use client";

import { useEffect, useRef } from "react";
import maplibregl, { Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as Dialog from "@radix-ui/react-dialog";
import type { StopWithMeta } from "@/components/nearest-stops";
import type { Prediction } from "@/types/bustime";
import { formatPredictionCountdown } from "@/lib/datetime";
import { getMapStyleUrl } from "@/lib/map-style";

type StopMapModalProps = {
  stop?: StopWithMeta;
  predictions?: Prediction[];
  isOpen: boolean;
  onClose: () => void;
  userLocation?: { lat: number; lon: number };
};

export default function StopMapModal({
  stop,
  predictions = [],
  isOpen,
  onClose,
  userLocation,
}: StopMapModalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    let rafId: number | null = null;

    const cleanupMap = () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
    };

    const initialize = () => {
      if (!isOpen || !stop) {
        cleanupMap();
        return;
      }
      if (!containerRef.current) {
        rafId = requestAnimationFrame(initialize);
        return;
      }

      cleanupMap();
      mapRef.current = new maplibregl.Map({
        container: containerRef.current,
        style: getMapStyleUrl(),
        center: [stop.lon, stop.lat],
        zoom: 16,
      });
      const nextPrediction = predictions[0];
      const countdown = formatPredictionCountdown(nextPrediction);
      new maplibregl.Marker({ color: "#f97316" })
        .setLngLat([stop.lon, stop.lat])
        .setPopup(
          new Popup({ closeButton: false, offset: 12 }).setHTML(
            `<strong>${stop.stpnm}</strong><br/>Next bus: ${countdown}`
          )
        )
        .addTo(mapRef.current);

      if (userLocation) {
        userMarkerRef.current = new maplibregl.Marker({
          color: "#22d3ee",
        })
          .setLngLat([userLocation.lon, userLocation.lat])
          .setPopup(new Popup().setText("You are here"))
          .addTo(mapRef.current);
      }
    };

    initialize();

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      cleanupMap();
    };
  }, [isOpen, stop, predictions, userLocation]);

  const googleMapsUrl = stop
    ? `https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lon}&travelmode=walking`
    : "";
  const nextPrediction = predictions[0];
  const countdown = formatPredictionCountdown(nextPrediction);
  const destinationLabel = nextPrediction
    ? [nextPrediction.rt, nextPrediction.des].filter(Boolean).join(" → ")
    : null;

  return (
    <Dialog.Root
      open={isOpen && Boolean(stop)}
      onOpenChange={(open) => !open && onClose()}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
        <Dialog.Content className="fixed inset-x-0 top-1/2 z-50 mx-auto w-full max-w-3xl -translate-y-1/2 rounded-3xl border border-white/20 bg-slate-900/90 p-6 text-white shadow-2xl focus:outline-none data-[state=open]:animate-slide-up data-[state=closed]:animate-slide-down">
          {stop && (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-wide text-white/60">
                    Stop details
                  </p>
                  <Dialog.Title className="text-2xl font-semibold">
                    {stop.stpnm}
                  </Dialog.Title>
                  <p className="text-sm text-white/70">Stop #{stop.stpid}</p>
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
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                <p className="text-xs uppercase text-white/60">
                  Next bus:{" "}
                  <span className="text-base font-semibold">{countdown}</span>
                </p>
                {destinationLabel && (
                  <p className="text-xs text-white/70">{destinationLabel}</p>
                )}
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:border-white"
                >
                  Get directions
                </a>
              </div>
              <div
                ref={containerRef}
                className="mt-3 h-[360px] w-full rounded-2xl"
                aria-label={`${stop.stpnm} map`}
              />
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
