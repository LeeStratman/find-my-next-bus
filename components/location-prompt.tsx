"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouteState } from "@/hooks/use-route-state";
import { haversineDistance } from "@/lib/geo";

function formatAccuracyMetersToImperial(meters?: number) {
  if (meters === undefined || meters === null || Number.isNaN(meters)) {
    return "unknown accuracy";
  }
  const feet = meters * 3.28084;
  if (feet >= 528) {
    const miles = feet / 5280;
    return `±${miles.toFixed(1)} mi`;
  }
  return `±${Math.round(feet)} ft`;
}

export default function LocationPrompt() {
  const { location, setLocation } = useRouteState();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastLocationRef = useRef<{ lat: number; lon: number } | null>(null);

  const formattedAccuracy = useMemo(
    () => formatAccuracyMetersToImperial(location?.accuracy),
    [location?.accuracy],
  );

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation isn’t supported in this browser.");
      return;
    }
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    setStatus("loading");
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const next = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        const movedEnough =
          !lastLocationRef.current ||
          haversineDistance(lastLocationRef.current, next) >= 15.24; // ~50ft
        if (movedEnough) {
          setLocation(next);
          lastLocationRef.current = next;
        }
        setStatus("idle");
        setError(null);
      },
      (err) => {
        setStatus("error");
        if (err.code === err.PERMISSION_DENIED) {
          setError(
            "Location was blocked. In Brave/Chrome, allow location for this site (padlock → Site settings) or disable Shields, then try again.",
          );
        } else {
          setError(err.message || "Couldn’t access your location.");
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30_000,
        timeout: 10_000,
      },
    );
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  return (
    <section className="w-full rounded-none border-0 bg-transparent p-0 text-white sm:rounded-3xl sm:border sm:border-white/10 sm:bg-slate-900/50 sm:p-6 sm:shadow-lg sm:backdrop-blur">
      <h3 className="text-xl font-semibold">Share your location</h3>
      <p className="mt-1 text-sm text-white/70">
        We’ll use it only to calculate which stops are closest. Nothing is sent
        to a server.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={requestLocation}
          className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:opacity-70"
          disabled={status === "loading"}
        >
          {location ? "Refresh location" : "Use current location"}
        </button>
        {location && (
          <p className="text-sm text-white/70">
            Using your location ({formattedAccuracy})
          </p>
        )}
      </div>
      {status === "loading" && (
        <p className="mt-2 text-sm text-white/70">Locating…</p>
      )}
      {error && <p className="mt-2 text-sm text-rose-200">{error}</p>}
    </section>
  );
}

