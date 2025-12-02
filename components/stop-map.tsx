"use client";

import { useEffect, useRef } from "react";
import maplibregl, { Marker, Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { StopWithMeta } from "./nearest-stops";
import type { Prediction } from "@/types/bustime";
import { formatPredictionCountdown } from "@/lib/datetime";
import { getMapStyleUrl } from "@/lib/map-style";

type StopMapProps = {
  stops: StopWithMeta[];
  predictions: Record<string, Prediction[]>;
  userLocation?: { lat: number; lon: number };
  selectedStopId?: string;
  onSelectStop?: (stopId: string) => void;
  hasSelection: boolean;
};

export default function StopMap({
  stops,
  predictions,
  userLocation,
  selectedStopId,
  onSelectStop,
  hasSelection,
}: StopMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const userMarkerRef = useRef<Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;
    const center: [number, number] = userLocation
      ? [userLocation.lon, userLocation.lat]
      : stops.length
      ? [stops[0].lon, stops[0].lat]
      : [-89.4, 43.07]; // Madison fallback
    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style: getMapStyleUrl(),
      center,
      zoom: userLocation || stops.length ? 13 : 11,
    });
  }, [userLocation, stops]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
    if (userLocation) {
      userMarkerRef.current = new maplibregl.Marker({
        color: "#22d3ee",
      })
        .setLngLat([userLocation.lon, userLocation.lat])
        .setPopup(new Popup().setText("You are here"))
        .addTo(mapRef.current);
    }
  }, [userLocation]);
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;
    mapRef.current.flyTo({
      center: [userLocation.lon, userLocation.lat],
      zoom: 14,
      essential: false,
    });
  }, [userLocation]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (Array.isArray(markersRef.current)) {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    }
    markersRef.current = stops.map((stop) => {
      const nextPrediction = predictions[stop.stpid]?.[0];
      const countdown = formatPredictionCountdown(nextPrediction);
      const marker = new maplibregl.Marker({
        color: stop.stpid === selectedStopId ? "#f97316" : "#22c55e",
      })
        .setLngLat([stop.lon, stop.lat])
        .setPopup(
          new Popup({ closeButton: false, offset: 12 }).setHTML(
            `<strong>${stop.stpnm}</strong><br/>Next bus: ${countdown}`
          )
        )
        .addTo(mapRef.current!);
      marker.getElement().addEventListener("click", () => {
        onSelectStop?.(stop.stpid);
      });
      return marker;
    });
    return () => {
      if (Array.isArray(markersRef.current)) {
        markersRef.current.forEach((marker) => {
          if (marker && typeof marker.remove === "function") {
            marker.remove();
          }
        });
        markersRef.current = [];
      } else {
        markersRef.current = [];
      }
    };
  }, [stops, predictions, selectedStopId, onSelectStop]);

  useEffect(() => {
    if (!mapRef.current || !selectedStopId) return;
    const selectedStop = stops.find((stop) => stop.stpid === selectedStopId);
    if (selectedStop) {
      mapRef.current.flyTo({
        center: [selectedStop.lon, selectedStop.lat],
        zoom: 15,
        essential: true,
      });
    }
  }, [selectedStopId, stops]);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-4 text-white shadow-lg backdrop-blur">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">Map view</h3>
        <div className="flex items-center gap-3 text-xs text-white/70">
          <LegendDot color="#22d3ee" label="You" />
          <LegendDot color="#22c55e" label="Stop" />
          <LegendDot color="#f97316" label="Selected stop" />
        </div>
      </div>
      {!hasSelection && (
        <p className="text-sm text-white/70">
          Pick a route and direction to see stops on the map.
        </p>
      )}
      {hasSelection && stops.length === 0 && (
        <p className="text-sm text-white/70">
          No upcoming arrivals to display on the map right now.
        </p>
      )}
      <div
        ref={containerRef}
        className="h-[400px] w-full rounded-2xl"
        aria-label="Stops map"
      />
    </section>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span>{label}</span>
    </span>
  );
}
