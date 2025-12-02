import type {
  BusTimeEnvelope,
  Prediction,
  ServiceBulletin,
  Route,
  Direction,
  Stop,
  Pattern,
} from "@/types/bustime";

const PROXY_BASE = process.env.NEXT_PUBLIC_BUSTIME_PROXY_BASE ?? "/api/bustime";

type Endpoint =
  | "gettime"
  | "getroutes"
  | "getdirections"
  | "getstops"
  | "getpatterns"
  | "getvehicles"
  | "getpredictions"
  | "getservicebulletins";

type Params = Record<string, string | number | boolean | undefined>;

function buildSearchParams(params: Params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  return search;
}

async function request<T>(
  endpoint: Endpoint,
  params: Params = {},
  init: RequestInit = {}
) {
  const search = buildSearchParams(params);
  const url = `${PROXY_BASE}/${endpoint}?${search.toString()}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    // default to no-store; callers can override via init.cache or init.next
    cache: init.cache ?? "no-store",
  });

  if (!response.ok) {
    throw new Error(`BusTime request failed (${response.status})`);
  }

  const json = (await response.json()) as BusTimeEnvelope<T>;
  const payload = json["bustime-response"];
  if (payload?.error?.length) {
    const message = payload.error.map((err) => err.msg).join(", ");
    throw new Error(message || "BusTime returned an error");
  }
  return payload as T;
}

export async function getStopById(stpid: string) {
  if (!stpid) throw new Error("Stop id is required");
  const payload = await request<{ stop?: Stop[] }>("getstops", { stpid });
  const stop = payload.stop?.[0];
  if (!stop) {
    throw new Error("Stop not found");
  }
  return {
    ...stop,
    lat: Number(stop.lat),
    lon: Number(stop.lon),
  };
}

export async function getPredictions(stpid: string) {
  if (!stpid) return [];
  const payload = await request<{ prd?: Prediction[] }>("getpredictions", {
    stpid,
    tmres: "s",
    top: 3,
  });
  return payload.prd ?? [];
}

export async function getServiceBulletins(stpid: string) {
  if (!stpid) return [];
  const payload = await request<{ sb?: ServiceBulletin[] }>(
    "getservicebulletins",
    { stpid }
  );
  return payload.sb ?? [];
}

export async function getRoutes() {
  const payload = await request<{
    route?: Route[];
    routes?: Route[];
  }>("getroutes");
  return payload.routes ?? payload.route ?? [];
}

export async function getDirections(routeId: string) {
  if (!routeId) return [];
  const payload = await request<{
    dir?: Direction[];
    directions?: Direction[];
  }>("getdirections", { rt: routeId });
  return payload.directions ?? payload.dir ?? [];
}

export async function getStopsForRoute(routeId: string, directionId: string) {
  if (!routeId || !directionId) return [];
  const payload = await request<{ stop?: Stop[]; stops?: Stop[] }>("getstops", {
    rt: routeId,
    dir: directionId,
  });
  let stops = payload.stop ?? payload.stops ?? [];
  let missingSequence = stops.some(
    (stop) => stop.gtfsseq === undefined || stop.gtfsseq === null
  );

  if (missingSequence) {
    const patternsPayload = await request<{ ptr?: Pattern[] }>("getpatterns", {
      rt: routeId,
    });
    const pattern = patternsPayload.ptr?.find(
      (pattern) => pattern.rtdir === directionId
    );
    if (pattern) {
      const sequenceMap = new Map<string, number>();
      pattern.pt
        ?.filter((pt) => pt.typ === "S" && pt.stpid)
        .forEach((pt, index) => {
          if (pt.stpid) sequenceMap.set(pt.stpid, index + 1);
        });
      stops = stops.map((stop) => ({
        ...stop,
        gtfsseq: stop.gtfsseq ?? sequenceMap.get(stop.stpid ?? "") ?? undefined,
      }));
      missingSequence = false;
    }
  }

  const normalised = stops.map((stop) => ({
    ...stop,
    lat: Number(stop.lat),
    lon: Number(stop.lon),
    gtfsseq:
      stop.gtfsseq !== undefined && stop.gtfsseq !== null
        ? Number(stop.gtfsseq)
        : undefined,
  }));
  normalised.sort((a, b) => {
    const seqA = a.gtfsseq ?? Number.POSITIVE_INFINITY;
    const seqB = b.gtfsseq ?? Number.POSITIVE_INFINITY;
    if (seqA !== seqB) return seqA - seqB;
    return a.stpnm.localeCompare(b.stpnm, undefined, { sensitivity: "base" });
  });
  return normalised;
}
