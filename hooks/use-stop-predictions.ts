"use client";

import { useQueries } from "@tanstack/react-query";
import { getPredictions } from "@/lib/bustime";
import type { Prediction } from "@/types/bustime";

export function useStopPredictions(stopIds: string[], enabled = true) {
  const distinctIds = Array.from(new Set(stopIds)).filter(Boolean);
  const queries = useQueries({
    queries: distinctIds.map((stpid) => ({
      queryKey: ["predictions", stpid],
      queryFn: () => getPredictions(stpid),
      enabled,
      refetchInterval: 15_000,
    })),
  });

  return distinctIds.reduce<Record<string, Prediction[]>>((acc, stpid, index) => {
    acc[stpid] = queries[index].data ?? [];
    return acc;
  }, {});
}

