"use client";

import { useQueries } from "@tanstack/react-query";
import { getPredictions } from "@/lib/bustime";
import type { Prediction } from "@/types/bustime";

const MAX_STOP_BATCH = 10;

export function useStopPredictions(stopIds: string[], enabled = true) {
  const distinctIds = Array.from(new Set(stopIds)).filter(Boolean);
  const batches: string[][] = [];
  for (let i = 0; i < distinctIds.length; i += MAX_STOP_BATCH) {
    batches.push(distinctIds.slice(i, i + MAX_STOP_BATCH));
  }

  const queries = useQueries({
    queries: batches.map((batch) => ({
      queryKey: ["predictions", ...batch],
      queryFn: async () => {
        const results = await Promise.all(batch.map((stpid) => getPredictions(stpid)));
        return batch.reduce<Record<string, Prediction[]>>((acc, id, index) => {
          acc[id] = results[index] ?? [];
          return acc;
        }, {});
      },
      enabled: enabled && batch.length > 0,
      refetchInterval: 15_000,
    })),
  });

  return queries.reduce<Record<string, Prediction[]>>((acc, query) => {
    if (query.data) {
      Object.assign(acc, query.data);
    }
    return acc;
  }, {});
}

