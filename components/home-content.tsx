"use client";

import { useEffect, useMemo, useState } from "react";
import RouteDirectionSelector from "@/components/route-direction-selector";
import LocationPrompt from "@/components/location-prompt";
import NearestStops, { StopWithMeta } from "@/components/nearest-stops";
import StopMap from "@/components/stop-map";
import StopOverviewModal from "@/components/stop-overview-modal";
import StopMapModal from "@/components/stop-map-modal";
import { useRouteState } from "@/hooks/use-route-state";
import { haversineDistance } from "@/lib/geo";
import { useRouteStops } from "@/hooks/use-route-stops";
import { useStopPredictions } from "@/hooks/use-stop-predictions";

export default function HomeContent() {
  const { routeId, directionId, location } = useRouteState();
  const [selection, setSelection] = useState<{
    routeId?: string;
    directionId?: string;
    stopId?: string;
  }>({});
  const stopsQuery = useRouteStops();
  const hasSelection = Boolean(routeId && directionId);
  const [isOverviewOpen, setOverviewOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMapModalOpen, setMapModalOpen] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const stopsWithMeta = useMemo<StopWithMeta[]>(() => {
    if (!stopsQuery.data) return [];
    return stopsQuery.data.map((stop) => ({
      ...stop,
      distanceMeters: location
        ? haversineDistance(location, { lat: stop.lat, lon: stop.lon })
        : undefined,
    }));
  }, [stopsQuery.data, location]);

  const sortedStopsByDistance = useMemo<StopWithMeta[]>(() => {
    const copy = [...stopsWithMeta];
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
  }, [stopsWithMeta]);

  const handleSelectStop = (stopId?: string) => {
    if (!routeId || !directionId) return;
    setSelection({
      routeId,
      directionId,
      stopId,
    });
    if (isMobile && stopId) {
      setMapModalOpen(true);
    }
  };

  const nearestStopIds = useMemo(() => {
    const limit = location ? 20 : 12;
    return sortedStopsByDistance.slice(0, limit).map((stop) => stop.stpid);
  }, [sortedStopsByDistance, location]);

  const predictionMap = useStopPredictions(
    hasSelection ? nearestStopIds : [],
    hasSelection,
  );

  const stopsWithArrivals = useMemo(() => {
    if (!hasSelection) return [];
    return sortedStopsByDistance.filter(
      (stop) => (predictionMap[stop.stpid]?.length ?? 0) > 0,
    );
  }, [sortedStopsByDistance, predictionMap, hasSelection]);

  const selectedStopId =
    selection.routeId === routeId &&
    selection.directionId === directionId &&
    selection.stopId &&
    stopsWithArrivals.some((stop) => stop.stpid === selection.stopId)
      ? selection.stopId
      : undefined;

  useEffect(() => {
    if (!selectedStopId) {
      setMapModalOpen(false);
    }
  }, [selectedStopId]);

  useEffect(() => {
    if (!isMobile) {
      setMapModalOpen(false);
    }
  }, [isMobile]);

  const selectedStop = useMemo(
    () => stopsWithMeta.find((stop) => stop.stpid === selectedStopId),
    [stopsWithMeta, selectedStopId],
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <header className="space-y-2 text-white">
          <p className="text-sm uppercase tracking-[0.3em] text-white/60">
            Madison Metro
          </p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Find the right stop — fast
          </h1>
          <p className="max-w-3xl text-base text-white/80">
            Pick the route you’re boarding, share your location, and we’ll show
            which stops are closest along with live arrivals and walking
            directions.
          </p>
        </header>

        <RouteDirectionSelector />
        <LocationPrompt />

        <NearestStops
          stops={stopsWithArrivals}
          location={location}
          predictions={predictionMap}
          isLoading={stopsQuery.isLoading}
          isError={stopsQuery.isError}
          error={stopsQuery.error}
          hasSelection={hasSelection}
          selectedStopId={selectedStopId}
          onSelectStop={handleSelectStop}
          onOpenOverview={() => setOverviewOpen(true)}
        />

        <div className="hidden sm:block">
          <StopMap
            stops={stopsWithArrivals}
            predictions={predictionMap}
            userLocation={location}
            selectedStopId={selectedStopId}
            onSelectStop={handleSelectStop}
            hasSelection={hasSelection}
          />
        </div>

        <StopOverviewModal
          isOpen={isOverviewOpen}
          onClose={() => setOverviewOpen(false)}
          stops={stopsWithMeta}
          predictions={predictionMap}
        />

        <StopMapModal
          stop={selectedStop}
          predictions={selectedStopId ? predictionMap[selectedStopId] : []}
          isOpen={Boolean(isMobile && isMapModalOpen && selectedStop)}
          onClose={() => setMapModalOpen(false)}
          userLocation={location}
        />
      </main>
    </div>
  );
}

