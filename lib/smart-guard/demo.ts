import { promises as fs } from "fs";
import path from "path";
import { DEFAULT_NAC_DEMO, type NacDemoFlags } from "./types";

const FILE = path.join(process.cwd(), "data", "nac-demo.json");

type DemoMap = Record<string, NacDemoFlags>;

async function readAll(): Promise<DemoMap> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as DemoMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeAll(map: DemoMap) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(map, null, 2), "utf8");
}

export async function readDemoFlags(email: string): Promise<NacDemoFlags> {
  const map = await readAll();
  return { ...DEFAULT_NAC_DEMO, ...map[email.trim().toLowerCase()] };
}

export async function writeDemoFlags(email: string, flags: Partial<NacDemoFlags>) {
  const key = email.trim().toLowerCase();
  const map = await readAll();
  map[key] = { ...DEFAULT_NAC_DEMO, ...map[key], ...flags };
  await writeAll(map);
  return map[key];
}

const nvSessions = new Map<string, number>();
const stepUpSessions = new Map<string, number>();
const NV_TTL_MS = 30 * 60 * 1000;

export function markNumberVerified(email: string) {
  nvSessions.set(email.trim().toLowerCase(), Date.now() + NV_TTL_MS);
}

export function sessionNumberVerified(email: string) {
  const until = nvSessions.get(email.trim().toLowerCase());
  if (!until) return false;
  if (until < Date.now()) {
    nvSessions.delete(email.trim().toLowerCase());
    return false;
  }
  return true;
}

export function markStepUpVerified(email: string) {
  const key = email.trim().toLowerCase();
  const until = Date.now() + NV_TTL_MS;
  stepUpSessions.set(key, until);
  nvSessions.set(key, until);
}

export function sessionStepUpVerified(email: string) {
  const until = stepUpSessions.get(email.trim().toLowerCase());
  if (!until) return false;
  if (until < Date.now()) {
    stepUpSessions.delete(email.trim().toLowerCase());
    return false;
  }
  return true;
}
