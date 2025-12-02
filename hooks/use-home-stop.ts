"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface HomeStop {
  stpid: string;
  stpnm: string;
  lat: number;
  lon: number;
}

interface HomeStopState {
  homeStop?: HomeStop;
  setHomeStop: (stop: HomeStop) => void;
  clearHomeStop: () => void;
}

export const useHomeStop = create<HomeStopState>()(
  persist(
    (set) => ({
      homeStop: undefined,
      setHomeStop: (stop) => set({ homeStop: stop }),
      clearHomeStop: () => set({ homeStop: undefined }),
    }),
    {
      name: "bus-me-home-stop",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

