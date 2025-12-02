"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouteState } from "./use-route-state";
import { getStopsForRoute } from "@/lib/bustime";

export function useRouteStops() {
  const { routeId, directionId } = useRouteState();
  const query = useQuery({
    queryKey: ["stops-for-route", routeId, directionId],
    queryFn: () => getStopsForRoute(routeId ?? "", directionId ?? ""),
    enabled: Boolean(routeId && directionId),
    staleTime: 1000 * 60 * 5,
  });
  return {
    ...query,
    routeId,
    directionId,
  };
}

