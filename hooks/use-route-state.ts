"use client";

import { create } from "zustand";

type GeoLocation = {
  lat: number;
  lon: number;
  accuracy?: number;
};

type RouteState = {
  routeId?: string;
  directionId?: string;
  location?: GeoLocation;
  setRouteId: (routeId: string) => void;
  setDirectionId: (directionId: string) => void;
  clearSelection: () => void;
  setLocation: (location?: GeoLocation) => void;
};

export const useRouteState = create<RouteState>((set) => ({
  routeId: undefined,
  directionId: undefined,
  location: undefined,
  setRouteId: (routeId) =>
    set({
      routeId,
      directionId: undefined,
    }),
  setDirectionId: (directionId) => set({ directionId }),
  clearSelection: () =>
    set({
      routeId: undefined,
      directionId: undefined,
    }),
  setLocation: (location) => set({ location }),
}));

