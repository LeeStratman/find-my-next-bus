"use client";

import { useHomeStop } from "@/hooks/use-home-stop";
import { getServiceBulletins } from "@/lib/bustime";
import { useQuery } from "@tanstack/react-query";

export default function AlertsBanner() {
  const { homeStop } = useHomeStop();
  const query = useQuery({
    queryKey: ["alerts", homeStop?.stpid],
    enabled: Boolean(homeStop?.stpid),
    queryFn: async () => {
      if (!homeStop?.stpid) return [];
      return getServiceBulletins(homeStop.stpid);
    },
    refetchInterval: 60_000,
    staleTime: 60_000,
  });

  if (!homeStop || query.isLoading || query.isError) {
    return null;
  }

  const bulletins = query.data ?? [];
  if (bulletins.length === 0) {
    return null;
  }

  const primary = bulletins[0];

  return (
    <div className="rounded-xl border border-amber-400/40 bg-amber-100/10 px-4 py-3 text-sm text-amber-100 shadow-lg backdrop-blur">
      <p className="font-semibold uppercase tracking-wide">Service alert</p>
      <p className="mt-1 text-base text-white">
        {primary.sbj || "Service change"}{" "}
        <span className="text-amber-100/80">
          {primary.brf ?? primary.dtl}
        </span>
      </p>
      {bulletins.length > 1 && (
        <p className="mt-1 text-xs text-amber-100/80">
          +{bulletins.length - 1} more alerts for this stop
        </p>
      )}
    </div>
  );
}

