import type { PlanTier } from "@/lib/admin/config";
import type { PersistedWorkspace } from "@/lib/serialize";

export const USERS_KEY = "smartprofit-users";
export const SESSION_KEY = "smartprofit-session";
export const SESSION_USER_KEY = "smartprofit-user";
export const LEGACY_WORKSPACE_KEY = "smartprofit-workspace-v2";
export const LEGACY_ANALYSIS_KEY = "smartprofit-analysis-v1";
export const EVENTS_KEY = "smartprofit-platform-events";
export const MIGRATION_KEY = "smartprofit-workspace-migrated-email";
export const WORKSPACE_PREFIX = "smartprofit-workspace-v2:";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function workspaceKey(email: string) {
  return `${WORKSPACE_PREFIX}${normalizeEmail(email)}`;
}

export function fileSafeEmail(email: string) {
  return normalizeEmail(email).replace(/[^a-z0-9._-]+/gi, "_");
}

export const PLAN_PRICE_USD: Record<PlanTier, number> = {
  free: 0,
  pro: 49,
  business: 99,
};

export function countRealFiles(workspace: PersistedWorkspace | null | undefined) {
  return (workspace?.files ?? []).filter((file) => !file.isDemo).length;
}

export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function readAllLocalWorkspaces(): Array<{ email: string; workspace: PersistedWorkspace }> {
  if (typeof window === "undefined") return [];
  const rows: Array<{ email: string; workspace: PersistedWorkspace }> = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key?.startsWith(WORKSPACE_PREFIX)) continue;
    const email = key.slice(WORKSPACE_PREFIX.length);
    try {
      const workspace = JSON.parse(localStorage.getItem(key) ?? "") as PersistedWorkspace;
      if (workspace?.files) rows.push({ email, workspace });
    } catch {
      // skip broken slot
    }
  }
  return rows;
}
