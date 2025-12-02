const DEFAULT_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export function getMapStyleUrl() {
  if (process.env.NEXT_PUBLIC_MAP_STYLE_URL) {
    return process.env.NEXT_PUBLIC_MAP_STYLE_URL;
  }
  if (process.env.NEXT_PUBLIC_MAPTILER_KEY) {
    return `https://api.maptiler.com/maps/streets/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`;
  }
  return DEFAULT_STYLE;
}

