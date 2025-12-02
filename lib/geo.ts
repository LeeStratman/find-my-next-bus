export type Coordinates = {
  lat: number;
  lon: number;
};

const EARTH_RADIUS_METERS = 6371e3;

export function haversineDistance(a: Coordinates, b: Coordinates) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_METERS * c;
}

export function formatDistance(meters: number | null | undefined) {
  if (meters === undefined || meters === null || Number.isNaN(meters)) {
    return "";
  }
  const feet = meters * 3.28084;
  if (feet >= 528) {
    const miles = feet / 5280;
    return `${miles.toFixed(1)} mi`;
  }
  return `${Math.round(feet)} ft`;
}

