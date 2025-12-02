import { NextRequest, NextResponse } from "next/server";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query || !query.trim()) {
    return NextResponse.json(
      { error: "Missing address query" },
      { status: 400 },
    );
  }

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "5");
  url.searchParams.set("q", query);

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        process.env.NOMINATIM_USER_AGENT ??
        "BusMeHome/0.1 (+https://example.com)",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Geocoding lookup failed" },
      { status: response.status },
    );
  }

  const results = await response.json();
  return NextResponse.json(results, {
    headers: {
      "cache-control": "no-store",
    },
  });
}

