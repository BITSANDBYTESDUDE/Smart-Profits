import type { TrackEvent, TrackEventType } from "./config";

const KEY = "smartprofit-platform-events";

export function trackPlatform(type: TrackEventType, label?: string) {
  if (typeof window === "undefined") return;
  try {
    const current = readPlatformEvents();
    current.unshift({ type, at: Date.now(), label });
    localStorage.setItem(KEY, JSON.stringify(current.slice(0, 400)));
  } catch {
    // ignore quota
  }
}

export function readPlatformEvents(): TrackEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TrackEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function countEvents(type: TrackEventType, start: Date, end: Date) {
  return readPlatformEvents().filter(
    (event) => event.type === type && event.at >= start.getTime() && event.at <= end.getTime(),
  ).length;
}
