import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ENDPOINTS = new Set([
  "gettime",
  "getroutes",
  "getdirections",
  "getstops",
  "getpatterns",
  "getvehicles",
  "getpredictions",
  "getservicebulletins",
]);

const DEFAULT_BASE = "https://metromap.cityofmadison.com/bustime/api/v3";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ segments?: string[] }> }
) {
  const params = await context.params;
  const segments = params.segments ?? [];
  const endpoint = segments[0];

  if (!endpoint || !ALLOWED_ENDPOINTS.has(endpoint)) {
    return NextResponse.json(
      { error: "Unsupported BusTime endpoint" },
      { status: 400 }
    );
  }

  const apiKey = process.env.BUSTIME_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "BusTime API key is missing from server configuration." },
      { status: 500 }
    );
  }

  const baseUrl = process.env.BUSTIME_API_BASE ?? DEFAULT_BASE;
  const upstream = new URL(`${baseUrl}/${endpoint}`);

  request.nextUrl.searchParams.forEach((value, key) => {
    if (key === "key") return;
    upstream.searchParams.set(key, value);
  });

  upstream.searchParams.set("key", apiKey);
  if (!upstream.searchParams.has("format")) {
    upstream.searchParams.set("format", "json");
  }
  if (process.env.BUSTIME_FEED && !upstream.searchParams.has("rtpidatafeed")) {
    upstream.searchParams.set("rtpidatafeed", process.env.BUSTIME_FEED);
  }

  console.log(upstream.toString());

  const response = await fetch(upstream.toString());

  const text = await response.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  console.log(data);
  return NextResponse.json(data, {
    status: response.status,
  });
}
