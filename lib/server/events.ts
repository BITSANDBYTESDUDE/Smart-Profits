import { promises as fs } from "fs";
import path from "path";
import type { TrackEvent } from "@/lib/admin/config";

const FILE = path.join(process.cwd(), "data", "events.json");
const MAX = 2000;

async function ensureFile() {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  try {
    await fs.access(FILE);
  } catch {
    await fs.writeFile(FILE, "[]", "utf8");
  }
}

export async function readEvents(): Promise<TrackEvent[]> {
  await ensureFile();
  try {
    const parsed = JSON.parse(await fs.readFile(FILE, "utf8")) as TrackEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function appendEvent(event: TrackEvent) {
  const current = await readEvents();
  current.unshift(event);
  await fs.writeFile(FILE, JSON.stringify(current.slice(0, MAX), null, 2), "utf8");
  return event;
}

export async function mergeEvents(incoming: TrackEvent[]) {
  const current = await readEvents();
  const seen = new Set(current.map((item) => `${item.at}|${item.type}|${item.label ?? ""}|${item.email ?? ""}`));
  for (const event of incoming) {
    const key = `${event.at}|${event.type}|${event.label ?? ""}|${event.email ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    current.push(event);
  }
  current.sort((a, b) => b.at - a.at);
  await fs.writeFile(FILE, JSON.stringify(current.slice(0, MAX), null, 2), "utf8");
  return current.slice(0, MAX);
}
