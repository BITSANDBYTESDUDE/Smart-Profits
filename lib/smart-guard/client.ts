import type { GuardVerdict, SensitiveAction } from "./types";

export class GuardBlockedError extends Error {
  verdict: GuardVerdict;
  constructor(verdict: GuardVerdict) {
    super(verdict.summary);
    this.name = "GuardBlockedError";
    this.verdict = verdict;
  }
}

export function readDeviceCoords(): Promise<{ lat: number; lng: number } | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve(null), 4000);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        window.clearTimeout(timer);
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        window.clearTimeout(timer);
        resolve(null);
      },
      { enableHighAccuracy: false, timeout: 3500, maximumAge: 60_000 },
    );
  });
}

export function identityFromSession(): { email: string; phone: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("smartprofit-user");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { email?: string; phone?: string };
    if (!parsed.email) return null;
    return { email: parsed.email, phone: parsed.phone || "" };
  } catch {
    return null;
  }
}

export async function evaluateGuard(input: {
  action: SensitiveAction;
  email?: string;
  phone?: string;
  fileBytes?: number;
  fileName?: string;
}): Promise<GuardVerdict> {
  const session = identityFromSession();
  const email = (input.email || session?.email || "").trim().toLowerCase();
  const coords = await readDeviceCoords();
  const response = await fetch("/api/smart-guard/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: input.action,
      email,
      phone: input.phone || session?.phone,
      coords,
      fileBytes: input.fileBytes,
      fileName: input.fileName,
    }),
  });
  const data = (await response.json()) as { verdict?: GuardVerdict; error?: string };
  if (!data.verdict) {
    throw new Error(data.error || "Smart Guard is unavailable.");
  }
  publishVerdict(data.verdict);
  return data.verdict;
}

function publishVerdict(verdict: GuardVerdict) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("smart-guard-verdict", { detail: verdict }));
}

export async function sendStepUpCode(email?: string, phone?: string) {
  const session = identityFromSession();
  const response = await fetch("/api/smart-guard/step-up/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: (email || session?.email || "").trim().toLowerCase(),
      phone: phone || session?.phone,
    }),
  });
  const data = (await response.json()) as {
    ok?: boolean;
    error?: string;
    maskedPhone?: string;
    expiresInSec?: number;
    retryAfterSec?: number;
    demoCode?: string;
    channel?: "network";
  };
  if (!response.ok && response.status !== 429) {
    throw new Error(data.error || "Could not send the network code.");
  }
  return {
    ok: Boolean(data.ok),
    error: data.error,
    maskedPhone: data.maskedPhone || "",
    expiresInSec: data.expiresInSec ?? 300,
    retryAfterSec: data.retryAfterSec ?? 30,
    demoCode: data.demoCode,
    channel: data.channel ?? "network",
  };
}

export async function confirmGuardStepUp(
  action: SensitiveAction,
  code: string,
  email?: string,
  phone?: string,
) {
  const session = identityFromSession();
  const coords = await readDeviceCoords();
  const response = await fetch("/api/smart-guard/step-up/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action,
      code,
      email: (email || session?.email || "").trim().toLowerCase(),
      phone: phone || session?.phone,
      coords,
    }),
  });
  const data = (await response.json()) as { verdict?: GuardVerdict; error?: string };
  if (!response.ok || !data.verdict) {
    throw new Error(data.error || "Number Verification failed.");
  }
  publishVerdict(data.verdict);
  return data.verdict;
}
