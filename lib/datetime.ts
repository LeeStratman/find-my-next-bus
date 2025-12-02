import type { Prediction } from "@/types/bustime";

export function parseBusTimeDate(value: string) {
  if (!value) return null;
  const [datePart, timePart] = value.split(" ");
  if (!datePart || !timePart) return null;
  const year = Number(datePart.slice(0, 4));
  const month = Number(datePart.slice(4, 6)) - 1;
  const day = Number(datePart.slice(6, 8));
  const [hours, minutes, seconds = "0"] = timePart.split(":");
  const date = new Date(
    year,
    month,
    day,
    Number(hours),
    Number(minutes),
    Number(seconds)
  );
  return isNaN(date.getTime()) ? null : date;
}

export function formatCountdown(target: Date | null) {
  if (!target) return "—";
  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) return "Due";
  const totalMinutes = Math.floor(diffMs / 60000);
  if (totalMinutes <= 1) {
    const seconds = Math.floor(diffMs / 1000);
    return `${seconds}s`;
  }
  return `${totalMinutes} min`;
}

export function formatPredictionCountdown(prediction?: Prediction) {
  if (!prediction) return "No arrivals";

  const raw = prediction.prdctdn?.trim();
  if (raw) {
    if (raw.toUpperCase() === "DUE") {
      return "DUE";
    }
    if (/^\d+$/.test(raw)) {
      return `${raw} min`;
    }
    return raw;
  }

  const eta = prediction.prdtm ? parseBusTimeDate(prediction.prdtm) : null;
  return formatCountdown(eta);
}
