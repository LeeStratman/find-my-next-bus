"use client";

import { getDirections, getRoutes } from "@/lib/bustime";
import { useRouteState } from "@/hooks/use-route-state";
import { useQuery } from "@tanstack/react-query";

export default function RouteDirectionSelector() {
  const { routeId, directionId, setRouteId, setDirectionId } = useRouteState();

  const routesQuery = useQuery({
    queryKey: ["routes"],
    queryFn: () => getRoutes(),
    staleTime: 1000 * 60 * 10,
  });

  const directionsQuery = useQuery({
    queryKey: ["directions", routeId],
    queryFn: () => getDirections(routeId ?? ""),
    enabled: Boolean(routeId),
    staleTime: 1000 * 60 * 5,
  });

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-lg backdrop-blur">
      <h2 className="text-2xl font-semibold">Choose your trip</h2>
      <p className="mt-1 text-sm text-white/70">
        Pick the route and direction you’re interested in. We’ll handle finding
        the nearest stop.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Selector
          label="Route"
          placeholder={
            routesQuery.isLoading ? "Loading routes…" : "Select a route"
          }
          value={routeId ?? ""}
          disabled={routesQuery.isLoading}
          onChange={(event) => setRouteId(event.target.value)}
          options={(routesQuery.data ?? []).map((route) => ({
            label: `${route.rt} • ${route.rtnm}`,
            value: route.rt,
          }))}
        />
        <Selector
          label="Direction"
          placeholder={
            !routeId
              ? "Select a route first"
              : directionsQuery.isLoading
                ? "Loading directions…"
                : "Select direction"
          }
          value={directionId ?? ""}
          disabled={!routeId || directionsQuery.isLoading}
          onChange={(event) => setDirectionId(event.target.value)}
          options={(directionsQuery.data ?? []).map((direction) => ({
            label: direction.name,
            value: direction.id,
          }))}
        />
      </div>
    </section>
  );
}

type SelectorProps = {
  label: string;
  placeholder: string;
  value: string;
  disabled?: boolean;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ label: string; value: string }>;
};

function Selector({
  label,
  placeholder,
  value,
  disabled,
  onChange,
  options,
}: SelectorProps) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-white/80">
      {label}
      <div className="relative">
        <select
          className="w-full appearance-none rounded-full border border-white/20 bg-white/10 px-4 py-2 pr-10 text-white outline-none transition focus:border-white disabled:opacity-50"
          value={value}
          onChange={onChange}
          disabled={disabled}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-slate-900 text-white"
            >
              {option.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/70">
          ▾
        </span>
      </div>
    </label>
  );
}

